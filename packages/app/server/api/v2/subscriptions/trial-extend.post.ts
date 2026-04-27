/**
 * POST /api/v2/subscriptions/trial-extend
 * Extend a trial by 1 day for completing an onboarding step
 *
 * Auth: JWT (site token from plugin)
 * Request body: { siteId: number, step: string }
 * Response: { success: boolean, new_trial_end: string, days_remaining: number, extensions_used: number }
 */

import { useLogger } from '@create-studio/shared/utils/logger'
import { SubscriptionRepository } from '~~/server/utils/database'
import { ALLOWED_TRIAL_STEPS } from '~~/server/utils/database'
import type { TrialStep } from '~~/server/utils/database'
import { extendTrialEnd } from '~~/server/utils/stripe'
import { sendErrorResponse } from '~~/server/utils/errors'
import { verifyAnyJWT } from '~~/server/utils/auth'

export default defineEventHandler(async (event) => {
  const { debug } = useRuntimeConfig()
  const logger = useLogger('API:TrialExtend', debug)

  try {
    // Verify JWT token (accepts both user and site tokens)
    const tokenPayload = await verifyAnyJWT(event)
    const tokenSiteId = tokenPayload.site_id

    const body = await readBody(event)
    const { siteId, step } = body

    if (!siteId || !step) {
      setResponseStatus(event, 400)
      return { success: false, error: 'siteId and step are required' }
    }

    // Verify the token's site_id matches the requested siteId
    if (tokenSiteId !== siteId) {
      setResponseStatus(event, 403)
      return { success: false, error: 'Token site_id does not match requested siteId' }
    }

    if (!ALLOWED_TRIAL_STEPS.includes(step as TrialStep)) {
      setResponseStatus(event, 400)
      return { success: false, error: `Invalid step. Allowed: ${ALLOWED_TRIAL_STEPS.join(', ')}` }
    }

    const subscriptionRepo = new SubscriptionRepository()
    const subscription = await subscriptionRepo.getBySiteId(siteId)

    if (!subscription) {
      setResponseStatus(event, 404)
      return { success: false, error: 'No subscription found' }
    }

    if (subscription.status !== 'trialing') {
      setResponseStatus(event, 400)
      return { success: false, error: 'No active trial' }
    }

    if (!subscription.trial_end) {
      setResponseStatus(event, 400)
      return { success: false, error: 'Trial end date not set' }
    }

    // Check if step already redeemed
    const extensions = subscription.trial_extensions || {}
    if (extensions[step]) {
      setResponseStatus(event, 409)
      return { success: false, error: 'Step already redeemed' }
    }

    // Calculate new trial end (add 1 day)
    const currentTrialEnd = new Date(subscription.trial_end)
    currentTrialEnd.setDate(currentTrialEnd.getDate() + 1)
    const newTrialEnd = currentTrialEnd.toISOString()
    const newTrialEndUnix = Math.floor(currentTrialEnd.getTime() / 1000)

    // Extend on Stripe
    if (subscription.stripe_subscription_id) {
      await extendTrialEnd(subscription.stripe_subscription_id, newTrialEndUnix)
    }

    // Record locally
    await subscriptionRepo.recordTrialExtension(siteId, step as TrialStep, newTrialEnd)

    // Compute days remaining
    const daysRemaining = Math.max(0, Math.ceil((currentTrialEnd.getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
    const extensionsUsed = Object.keys(extensions).length + 1

    logger.debug('Trial extended for site', siteId, { step, newTrialEnd, daysRemaining })

    // Bust the 24h status cache so the plugin sees the new trial end immediately
    const { purgeSiteStatusCache } = await import('~~/server/utils/site-status-cache')
    await purgeSiteStatusCache(event, siteId)

    return {
      success: true,
      new_trial_end: newTrialEnd,
      days_remaining: daysRemaining,
      extensions_used: extensionsUsed,
    }
  } catch (error: any) {
    logger.error('Trial extension error:', error)
    return sendErrorResponse(event, error)
  }
})
