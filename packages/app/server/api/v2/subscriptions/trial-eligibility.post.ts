/**
 * POST /api/v2/subscriptions/trial-eligibility
 * Check if a site is eligible for a Pro trial
 *
 * Request body: { siteId: number }
 * Requires authentication (session)
 * Response: { success: boolean, eligible: boolean, reason?: string }
 */

import { useLogger } from '@create-studio/shared/utils/logger'
import { SubscriptionRepository, SiteRepository } from '~~/server/utils/database'
import { sendErrorResponse } from '~~/server/utils/errors'

export default defineEventHandler(async (event) => {
  const { debug } = useRuntimeConfig()
  const logger = useLogger('API:TrialEligibility', debug)

  try {
    const session = await requireUserSession(event)
    const userId = session.user.id

    const body = await readBody(event)
    const { siteId } = body

    if (!siteId) {
      setResponseStatus(event, 400)
      return { success: false, error: 'siteId is required' }
    }

    // Verify site exists and user has access
    const siteRepo = new SiteRepository()
    const site = await siteRepo.findById(siteId)

    if (!site) {
      setResponseStatus(event, 404)
      return { success: false, error: 'Site not found' }
    }

    if (site.canonical_site_id !== null && site.canonical_site_id !== undefined) {
      setResponseStatus(event, 400)
      return { success: false, error: 'Trials only available for canonical sites' }
    }

    const hasAccess = await siteRepo.userHasAccessToSite(userId, siteId)
    if (!hasAccess) {
      setResponseStatus(event, 403)
      return { success: false, error: 'Forbidden' }
    }

    const subscriptionRepo = new SubscriptionRepository()
    const result = await subscriptionRepo.isTrialEligible(siteId)

    logger.debug('Trial eligibility checked for site', siteId, result)

    return {
      success: true,
      ...result,
    }
  } catch (error: any) {
    logger.error('Trial eligibility check error:', error)
    return sendErrorResponse(event, error)
  }
})
