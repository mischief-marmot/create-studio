/**
 * GET /api/v2/subscriptions/status/:siteId
 * Get subscription status for a site
 *
 * Requires authentication (session)
 * Response: { success: boolean, subscription: Subscription | null, tier: string }
 */

import { SubscriptionRepository, SiteRepository } from '~~/server/utils/database'
import { sendErrorResponse } from '~~/server/utils/errors'

const { debug } = useRuntimeConfig()
const logger = useLogger('API:SubscriptionStatus', debug)

export default defineEventHandler(async (event) => {
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

    // Verify user owns this site
    const siteRepo = new SiteRepository()
    const site = await siteRepo.findById(siteId)

    if (!site || site.user_id !== userId) {
      setResponseStatus(event, 403)
      return {
        success: false,
        error: 'Forbidden'
      }
    }

    const subscriptionRepo = new SubscriptionRepository()
    const subscription = await subscriptionRepo.getBySiteId(siteId)
    const tier = await subscriptionRepo.getActiveTier(siteId)

    logger.debug('Subscription status checked for site', siteId)

    return {
      success: true,
      subscription,
      tier
    }

  } catch (error: any) {
    logger.error('Get subscription status error:', error)
    return sendErrorResponse(event, error)
  }
})
