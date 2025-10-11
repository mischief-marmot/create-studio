import Stripe from 'stripe'
import { SubscriptionRepository } from './database'

/**
 * Get Stripe client instance
 */
function getStripeClient(): Stripe {
  const config = useRuntimeConfig()
  const apiKey = config.stripeSecretKey || process.env.NUXT_STRIPE_SECRET_KEY

  if (!apiKey) {
    throw new Error('Stripe API key is not configured')
  }

  return new Stripe(apiKey, {
    apiVersion: '2025-09-30.clover'
  })
}

/**
 * Create Stripe Checkout Session for subscription
 */
export async function createCheckoutSession(params: {
  siteId: number
  userId: number
  userEmail: string
  siteName?: string
  priceId: string
  successUrl: string
  cancelUrl: string
}): Promise<string> {
  const stripe = getStripeClient()

  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    customer_email: params.userEmail,
    line_items: [{
      price: params.priceId,
      quantity: 1,
    }],
    success_url: params.successUrl,
    cancel_url: params.cancelUrl,
    allow_promotion_codes: true,
    metadata: {
      site_id: params.siteId.toString(),
      user_id: params.userId.toString(),
    },
    subscription_data: {
      description: params.siteName ? `Create Unlocked - ${params.siteName}` : 'Create Unlocked',
      metadata: {
        site_id: params.siteId.toString(),
        user_id: params.userId.toString(),
        site_name: params.siteName || '',
      },
    },
  })

  return session.url!
}

/**
 * Create Stripe Customer Portal Session
 */
export async function createCustomerPortalSession(params: {
  customerId: string
  returnUrl: string
}): Promise<string> {
  const stripe = getStripeClient()

  const session = await stripe.billingPortal.sessions.create({
    customer: params.customerId,
    return_url: params.returnUrl,
  })

  return session.url
}

/**
 * Handle Stripe webhook events
 */
export async function handleWebhookEvent(event: Stripe.Event): Promise<void> {
  const subscriptionRepo = new SubscriptionRepository()

  switch (event.type) {
    case 'customer.subscription.created':
    case 'customer.subscription.updated': {
      const subscription = event.data.object as Stripe.Subscription
      const siteId = parseInt(subscription.metadata.site_id || '0')

      if (!siteId) {
        throw new Error('No site_id in subscription metadata')
      }

      // Determine tier from price ID
      const priceId = subscription.items.data[0]?.price.id
      const tier = determineTierFromPriceId(priceId)

      const subscriptionData = {
        stripe_customer_id: subscription.customer as string,
        stripe_subscription_id: subscription.id,
        status: subscription.status,
        tier,
        current_period_start: subscription.current_period_start
          ? new Date(subscription.current_period_start * 1000).toISOString()
          : new Date().toISOString(),
        current_period_end: subscription.current_period_end
          ? new Date(subscription.current_period_end * 1000).toISOString()
          : new Date().toISOString(),
        cancel_at_period_end: subscription.cancel_at_period_end || false,
      }

      // Check if subscription exists for this site
      const existing = await subscriptionRepo.getBySiteId(siteId)

      if (existing) {
        await subscriptionRepo.update(siteId, subscriptionData)
      } else {
        await subscriptionRepo.create({
          site_id: siteId,
          ...subscriptionData,
        })
      }

      break
    }

    case 'customer.subscription.deleted': {
      const subscription = event.data.object as Stripe.Subscription
      const siteId = parseInt(subscription.metadata.site_id || '0')

      if (siteId) {
        await subscriptionRepo.update(siteId, {
          status: 'canceled',
          tier: 'free',
        })
      }

      break
    }

    case 'invoice.payment_succeeded': {
      const invoice = event.data.object as Stripe.Invoice
      const subscriptionId = invoice.subscription as string

      if (subscriptionId) {
        const subscription = await subscriptionRepo.getByStripeSubscriptionId(subscriptionId)

        if (subscription) {
          await subscriptionRepo.update(subscription.site_id, {
            status: 'active',
          })
        }
      }

      break
    }

    case 'invoice.payment_failed': {
      const invoice = event.data.object as Stripe.Invoice
      const subscriptionId = invoice.subscription as string

      if (subscriptionId) {
        const subscription = await subscriptionRepo.getByStripeSubscriptionId(subscriptionId)

        if (subscription) {
          await subscriptionRepo.update(subscription.site_id, {
            status: 'past_due',
          })
        }
      }

      break
    }

    default:
      // Unhandled event type
      break
  }
}

/**
 * Determine tier from Stripe price ID
 * All Create Unlocked prices map to 'pro' tier
 */
function determineTierFromPriceId(priceId?: string): string {
  if (!priceId) return 'free'

  // All Create Unlocked subscription prices are 'pro' tier
  // The billing interval (monthly, quarterly, annual, biannual) is handled by Stripe
  return 'pro'
}

/**
 * Verify Stripe webhook signature
 */
export function verifyWebhookSignature(payload: string, signature: string): Stripe.Event {
  const stripe = getStripeClient()
  const config = useRuntimeConfig()
  const webhookSecret = config.stripeWebhookSecret || process.env.NUXT_STRIPE_WEBHOOK_SECRET

  if (!webhookSecret) {
    throw new Error('Stripe webhook secret is not configured')
  }

  return stripe.webhooks.constructEvent(payload, signature, webhookSecret)
}
