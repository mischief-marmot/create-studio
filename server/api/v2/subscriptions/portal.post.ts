/**
 * POST /api/v2/subscriptions/portal
 * Create a Stripe Customer Portal session
 *
 * Request body: { siteId: number }
 * Requires authentication (session)
 * Response: { success: boolean, url: string, error?: string }
 */

import { createCustomerPortalSession } from '~~/server/utils/stripe'
import { SiteRepository, SubscriptionRepository } from '~~/server/utils/database'
import { sendErrorResponse } from '~~/server/utils/errors'

const { debug } = useRuntimeConfig()
const logger = useLogger('API:CustomerPortal', debug)

export default defineEventHandler(async (event) => {
  try {
    // Require user session
    const session = await requireUserSession(event)
    const user = session.user

    const body = await readBody(event)
    const { siteId } = body

    if (!siteId) {
      setResponseStatus(event, 400)
      return {
        success: false,
        error: 'siteId is required'
      }
    }

    // Verify user owns this site
    const siteRepo = new SiteRepository()
    const site = await siteRepo.findById(siteId)

    if (!site || site.user_id !== user.id) {
      setResponseStatus(event, 403)
      return {
        success: false,
        error: 'Unauthorized access to this site'
      }
    }

    // Get subscription for this site
    const subscriptionRepo = new SubscriptionRepository()
    const subscription = await subscriptionRepo.getBySiteId(siteId)

    if (!subscription || !subscription.stripe_customer_id) {
      setResponseStatus(event, 404)
      return {
        success: false,
        error: 'No active subscription found for this site'
      }
    }

    const config = useRuntimeConfig()
    const baseUrl = config.public.rootUrl || 'http://localhost:3001'

    // Create Stripe Customer Portal session
    const portalUrl = await createCustomerPortalSession({
      customerId: subscription.stripe_customer_id,
      returnUrl: `${baseUrl}/settings/site`,
    })

    logger.debug('Customer portal session created for site', siteId)

    return {
      success: true,
      url: portalUrl
    }

  } catch (error: any) {
    logger.error('Create portal session error:', error)
    return sendErrorResponse(event, error)
  }
})
