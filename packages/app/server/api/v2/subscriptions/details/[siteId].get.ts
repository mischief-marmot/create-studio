/**
 * GET /api/v2/subscriptions/details/:siteId
 * Fetch detailed subscription information from Stripe API
 *
 * Returns:
 * - Subscription details (plan, billing interval, status)
 * - Payment method (card type, last 4 digits)
 * - Recent invoices with download links
 *
 * Requires authentication (session)
 * Verifies user owns the site
 */

import Stripe from 'stripe'
import { useLogger } from '@create-studio/shared/utils/logger'
import { SiteRepository, SubscriptionRepository } from '~~/server/utils/database'
import { sendErrorResponse } from '~~/server/utils/errors'

function getStripeClient(): Stripe {
  const config = useRuntimeConfig()
  const apiKey = config.stripeSecretKey || process.env.NUXT_STRIPE_SECRET_KEY

  if (!apiKey) {
    throw new Error('Stripe API key is not configured')
  }

  return new Stripe(apiKey, {
    apiVersion: '2025-09-30.clover',
    httpClient: Stripe.createFetchHttpClient()
  })
}

export default defineEventHandler(async (event) => {
  const { debug } = useRuntimeConfig()
  const logger = useLogger('API:SubscriptionDetails', debug)

  try {
    // Require user session
    const session = await requireUserSession(event)
    const userId = session.user.id

    const siteId = parseInt(getRouterParam(event, 'siteId') || '0')

    if (!siteId || siteId === 0) {
      setResponseStatus(event, 400)
      return {
        success: false,
        error: 'Invalid site ID'
      }
    }

    // Verify user has access to this site
    const siteRepo = new SiteRepository()
    const hasAccess = await siteRepo.userHasAccessToSite(userId, siteId)
    if (!hasAccess) {
      setResponseStatus(event, 403)
      return {
        success: false,
        error: 'Forbidden'
      }
    }

    // Get subscription from our database
    const subscriptionRepo = new SubscriptionRepository()
    const subscription = await subscriptionRepo.getBySiteId(siteId)

    if (!subscription || !subscription.stripe_subscription_id) {
      // No subscription or not a Stripe subscription
      return {
        success: true,
        hasSubscription: false,
        details: null
      }
    }

    const stripe = getStripeClient()

    // Fetch subscription details from Stripe
    const stripeSubscription = await stripe.subscriptions.retrieve(
      subscription.stripe_subscription_id,
      {
        expand: ['default_payment_method', 'items.data.price.product']
      }
    )

    // Fetch recent invoices
    const invoices = await stripe.invoices.list({
      customer: subscription.stripe_customer_id,
      limit: 10,
      status: 'paid'
    })

    // Extract payment method details
    let paymentMethod = null
    if (stripeSubscription.default_payment_method && typeof stripeSubscription.default_payment_method !== 'string') {
      const pm = stripeSubscription.default_payment_method as Stripe.PaymentMethod
      if (pm.card) {
        paymentMethod = {
          type: 'card',
          brand: pm.card.brand,
          last4: pm.card.last4,
          expMonth: pm.card.exp_month,
          expYear: pm.card.exp_year
        }
      }
    }

    // Extract plan/price details
    const priceItem = stripeSubscription.items.data[0]
    let planDetails = null
    if (priceItem) {
      const price = priceItem.price
      const product = typeof price.product === 'string' ? null : price.product as Stripe.Product

      planDetails = {
        name: product?.name || 'Create Pro',
        interval: price.recurring?.interval || 'month',
        intervalCount: price.recurring?.interval_count || 1,
        amount: price.unit_amount ? price.unit_amount / 100 : 0,
        currency: price.currency
      }
    }

    // Format invoices
    const formattedInvoices = invoices.data.map(inv => ({
      id: inv.id,
      number: inv.number,
      date: inv.created ? new Date(inv.created * 1000).toISOString() : null,
      amount: inv.amount_paid ? inv.amount_paid / 100 : 0,
      currency: inv.currency,
      status: inv.status,
      pdfUrl: inv.invoice_pdf,
      hostedUrl: inv.hosted_invoice_url
    }))

    logger.debug('Fetched subscription details from Stripe', { siteId })

    // Get period dates from subscription item
    const subscriptionItem = stripeSubscription.items.data[0]
    const periodStart = subscriptionItem?.current_period_start
    const periodEnd = subscriptionItem?.current_period_end

    return {
      success: true,
      hasSubscription: true,
      details: {
        status: stripeSubscription.status,
        cancelAtPeriodEnd: stripeSubscription.cancel_at_period_end,
        currentPeriodStart: periodStart
          ? new Date(periodStart * 1000).toISOString()
          : null,
        currentPeriodEnd: periodEnd
          ? new Date(periodEnd * 1000).toISOString()
          : null,
        plan: planDetails,
        paymentMethod,
        invoices: formattedInvoices
      }
    }

  } catch (error: any) {
    logger.error('Subscription details error:', error)
    return sendErrorResponse(event, error)
  }
})
