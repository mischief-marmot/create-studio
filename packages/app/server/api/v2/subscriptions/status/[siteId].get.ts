/**
 * GET /api/v2/subscriptions/status/:siteId
 * Get subscription status for a site
 *
 * Requires authentication (session)
 * Response: { success: boolean, subscription: Subscription | null, tier: string }
 */

import { useLogger } from '@create-studio/shared/utils/logger'
import { SubscriptionRepository, SiteRepository } from '~~/server/utils/database'
import { sendErrorResponse } from '~~/server/utils/errors'

export default defineEventHandler(async (event) => {
  const { debug } = useRuntimeConfig()
  const logger = useLogger('API:SubscriptionStatus', debug)

  try {
    // Require user session
    const session = await requireUserSession(event)
    const userId = session.user.id

    const siteId = parseInt(event.context.params!.siteId)

    if (!siteId || isNaN(siteId)) {
      setResponseStatus(event, 400)
      return {
        success: false,
        error: 'Invalid siteId'
      }
    }

    // V2 API: Verify this is a canonical site and user has access
    const siteRepo = new SiteRepository()
    const site = await siteRepo.findById(siteId)

    if (!site) {
      setResponseStatus(event, 404)
      return {
        success: false,
        error: 'Site not found'
      }
    }

    // Must be canonical site
    if (site.canonical_site_id !== null && site.canonical_site_id !== undefined) {
      setResponseStatus(event, 400)
      return {
        success: false,
        error: 'Subscriptions only available for canonical sites'
      }
    }

    // Verify user has access via SiteUsers
    const hasAccess = await siteRepo.userHasAccessToSite(userId, siteId)
    if (!hasAccess) {
      setResponseStatus(event, 403)
      return {
        success: false,
        error: 'Forbidden'
      }
    }

    const subscriptionRepo = new SubscriptionRepository()
    const subscription = await subscriptionRepo.getBySiteId(siteId)
    const tier = await subscriptionRepo.getActiveTier(siteId)
    const activePaidCount = await subscriptionRepo.getActivePaidCountByUser(userId)
    const trialInfo = await subscriptionRepo.getTrialInfo(siteId)
    const eligibility = await subscriptionRepo.isTrialEligible(siteId)

    logger.debug('Subscription status checked for site', siteId)

    return {
      success: true,
      subscription,
      tier,
      activePaidCount,
      is_trialing: trialInfo.isTrialing,
      trial_days_remaining: trialInfo.daysRemaining,
      trial_extensions_used: trialInfo.extensionsUsed,
      trial_eligible: eligibility.eligible,
    }

  } catch (error: any) {
    logger.error('Get subscription status error:', error)
    return sendErrorResponse(event, error)
  }
})
