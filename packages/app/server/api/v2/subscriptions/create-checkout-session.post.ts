/**
 * POST /api/v2/subscriptions/create-checkout-session
 * Create a Stripe Checkout session for subscription
 *
 * Request body: { siteId: number, priceId: string }
 * Requires authentication (session)
 * Response: { success: boolean, url: string, error?: string }
 */

import { useLogger } from '@create-studio/shared/utils/logger'
import { createCheckoutSession, getMultiSiteCouponId } from '~~/server/utils/stripe'
import { SiteRepository, SiteUserRepository, SubscriptionRepository } from '~~/server/utils/database'
import type { TrialStep } from '~~/server/utils/database'
import { sendErrorResponse } from '~~/server/utils/errors'

export default defineEventHandler(async (event) => {
  const { debug } = useRuntimeConfig()
  const logger = useLogger('API:CreateCheckoutSession', debug)

  try {
    // Require user session
    const session = await requireUserSession(event)
    const user = session.user

    const body = await readBody(event)
    const { siteId, priceId, trial } = body

    if (!siteId || !priceId) {
      setResponseStatus(event, 400)
      return {
        success: false,
        error: 'siteId and priceId are required'
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
        error: 'Can only create subscriptions for canonical sites'
      }
    }

    // Verify user has owner or admin role on this site
    const userRole = await siteRepo.getUserRole(user.id, siteId)
    if (!userRole || !['owner', 'admin'].includes(userRole)) {
      setResponseStatus(event, 403)
      return {
        success: false,
        error: 'Only site owners and admins can manage subscriptions'
      }
    }

    // Verify site is connected (not pending)
    const siteUserRepo = new SiteUserRepository()
    const isVerified = await siteUserRepo.isUserVerified(user.id, siteId)
    if (!isVerified) {
      setResponseStatus(event, 403)
      return {
        success: false,
        error: 'Site must be connected before upgrading. Please connect your site first.'
      }
    }

    const config = useRuntimeConfig()
    const baseUrl = config.public.rootUrl || 'http://localhost:3001'

    // Check if user qualifies for multi-site discount
    const subscriptionRepo = new SubscriptionRepository()
    const activePaidCount = await subscriptionRepo.getActivePaidCountByUser(user.id)
    const couponId = getMultiSiteCouponId(activePaidCount, config.stripeMultiSiteCouponId)

    // If trial requested, check eligibility
    if (trial) {
      const eligibility = await subscriptionRepo.isTrialEligible(siteId)
      if (!eligibility.eligible) {
        setResponseStatus(event, 400)
        return {
          success: false,
          error: eligibility.reason || 'Not eligible for trial',
        }
      }
    }

    // Create Stripe Checkout session with selected price
    const checkoutUrl = await createCheckoutSession({
      siteId,
      userId: user.id,
      userEmail: user.email,
      siteName: site.name || site.url,
      priceId,
      successUrl: `${baseUrl}/admin/settings?success=true`,
      cancelUrl: `${baseUrl}/admin/settings?canceled=true`,
      couponId,
      trial: !!trial,
    })

    logger.debug('Checkout session created for site', siteId)

    return {
      success: true,
      url: checkoutUrl
    }

  } catch (error: any) {
    logger.error('Create checkout session error:', error)
    return sendErrorResponse(event, error)
  }
})
