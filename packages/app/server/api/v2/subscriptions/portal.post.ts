/**
 * POST /api/v2/subscriptions/portal
 * Create a Stripe Customer Portal session
 *
 * Request body: { siteId: number }
 * Requires authentication (session)
 * Response: { success: boolean, url: string, error?: string }
 */

import { useLogger } from '@create-studio/shared/utils/logger'
import { createCustomerPortalSession } from '~~/server/utils/stripe'
import { SiteRepository, SubscriptionRepository } from '~~/server/utils/database'
import { sendErrorResponse } from '~~/server/utils/errors'

export default defineEventHandler(async (event) => {
  const { debug } = useRuntimeConfig()
  const logger = useLogger('API:CustomerPortal', debug)

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
        error: 'Can only access portal for canonical sites'
      }
    }

    // Verify user has access via SiteUsers (typically must be owner)
    const userRole = await siteRepo.getUserRole(user.id, siteId)
    if (!userRole || userRole !== 'owner') {
      setResponseStatus(event, 403)
      return {
        success: false,
        error: 'Only site owners can access billing portal'
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
    const baseUrl = config.public.rootUrl
    // Create Stripe Customer Portal session
    const portalUrl = await createCustomerPortalSession({
      customerId: subscription.stripe_customer_id,
      returnUrl: `${baseUrl}/admin/settings`,
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
