/**
 * POST /api/v2/subscriptions/create-checkout-session
 * Create a Stripe Checkout session for subscription
 *
 * Request body: { siteId: number, priceId: string }
 * Requires authentication (session)
 * Response: { success: boolean, url: string, error?: string }
 */

import Stripe from 'stripe'
import { useLogger } from '@create-studio/shared/utils/logger'
import {
  createCheckoutSession,
  getMultiSiteCouponId,
  convertTrialToPaid,
  createPaymentUpdatePortalSession,
} from '~~/server/utils/stripe'
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

    const subscriptionRepo = new SubscriptionRepository()
    const [activePaidCount, existingSub] = await Promise.all([
      subscriptionRepo.getActivePaidCountByUser(user.id),
      subscriptionRepo.getBySiteId(siteId),
    ])
    const couponId = getMultiSiteCouponId(activePaidCount, config.stripeMultiSiteCouponId)

    if (trial) {
      const eligibility = subscriptionRepo.isTrialEligibleFromRecord(existingSub)
      if (!eligibility.eligible) {
        setResponseStatus(event, 400)
        return {
          success: false,
          error: eligibility.reason || 'Not eligible for trial',
        }
      }
    }

    // If the site is already on a trial and the user is upgrading to paid,
    // convert the existing Stripe subscription in place rather than creating
    // a second one (prevents duplicate billing).
    if (!trial && existingSub?.status === 'trialing' && existingSub.stripe_subscription_id) {
      try {
        const updated = await convertTrialToPaid({
          stripeSubscriptionId: existingSub.stripe_subscription_id,
          priceId,
          couponId,
        })

        // Optimistically sync local state so the user doesn't briefly see
        // a trial tier after we redirect them to the success page. Stripe's
        // subscription.updated webhook is the authoritative source and will
        // reconcile any field we miss.
        const item = updated.items.data[0]
        const localUpdate: Parameters<typeof subscriptionRepo.update>[1] = {
          status: updated.status,
          tier: 'pro',
          cancel_at_period_end: updated.cancel_at_period_end || false,
          trial_end: null,
        }
        if (item?.current_period_start) {
          localUpdate.current_period_start = new Date(item.current_period_start * 1000).toISOString()
        }
        if (item?.current_period_end) {
          localUpdate.current_period_end = new Date(item.current_period_end * 1000).toISOString()
        }
        await subscriptionRepo.update(siteId, localUpdate)

        logger.debug('Converted trial to paid for site', siteId)

        return {
          success: true,
          url: `${baseUrl}/admin/settings?success=true`,
          converted: true,
        }
      } catch (err: any) {
        // Card/payment-method failures (declined, expired, 3DS required,
        // etc.) all surface as StripeCardError — route the user to the
        // Billing Portal to update payment, then they can retry.
        if (err instanceof Stripe.errors.StripeCardError && existingSub.stripe_customer_id) {
          logger.warn('Trial-to-paid conversion needs payment update for site', siteId)
          const portalUrl = await createPaymentUpdatePortalSession({
            customerId: existingSub.stripe_customer_id,
            subscriptionId: existingSub.stripe_subscription_id,
            returnUrl: `${baseUrl}/admin/settings?payment_updated=true`,
          })
          return {
            success: true,
            url: portalUrl,
            requiresPaymentUpdate: true,
          }
        }

        logger.error('Trial-to-paid conversion failed for site', siteId, err)
        throw err
      }
    }

    // Prefer a customer id we already have on file for this user — first
    // from this site's subscription, then from any other site they own.
    // Only fall back to Stripe's email lookup (which requires metadata
    // ownership check) when we have nothing stored.
    const stripeCustomerId =
      existingSub?.stripe_customer_id
      ?? (await subscriptionRepo.getAnyStripeCustomerIdForUser(user.id))
      ?? undefined

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
      stripeCustomerId,
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
