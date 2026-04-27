import Stripe from 'stripe'
import type { H3Event } from 'h3'
import { SubscriptionRepository, SiteRepository } from './database'

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
    apiVersion: '2026-01-28.clover',
    httpClient: Stripe.createFetchHttpClient()
  })
}

/**
 * Calculate a trial_end Unix timestamp for Stripe.
 * Adds an extra hour buffer so Stripe always displays the full day count
 * (e.g. "14 days free" instead of "13 days free").
 */
function getTrialEndTimestamp(days: number): number {
  return Math.floor(Date.now() / 1000) + (days * 86400) + 3600
}

/**
 * Find or create a Stripe customer owned by the given user.
 *
 * Reuse rule: a pre-existing Stripe customer is only reused if its
 * `metadata.user_id` matches `userId`. This prevents a first-time purchaser
 * from being billed on a stranger's customer record when emails collide
 * (dashboard-imported customers, household-shared inboxes, QA leftovers,
 * etc.). Stripe does NOT enforce email uniqueness, so the email lookup is
 * inherently best-effort; the metadata guard makes it safe.
 *
 * Always sets `metadata.user_id` on newly-created customers so future
 * reuse is deterministic.
 */
export async function findOrCreateCustomerByEmail(params: {
  email: string
  userId: number
  extraMetadata?: Record<string, string>
}): Promise<string> {
  const stripe = getStripeClient()
  const userIdStr = params.userId.toString()

  const existing = await stripe.customers.list({ email: params.email, limit: 10 })
  const owned = existing.data.find((c) => c.metadata?.user_id === userIdStr)
  if (owned) return owned.id

  const created = await stripe.customers.create({
    email: params.email,
    metadata: { user_id: userIdStr, ...(params.extraMetadata ?? {}) },
  })
  return created.id
}

/**
 * Create Stripe Checkout Session for subscription.
 *
 * Reuses an existing Stripe customer if one is found for the user's email so
 * multiple site subscriptions stay under a single customer record.
 */
export async function createCheckoutSession(params: {
  siteId: number
  userId: number
  userEmail: string
  siteName?: string
  priceId: string
  successUrl: string
  cancelUrl: string
  couponId?: string
  trial?: boolean
  stripeCustomerId?: string | null
}): Promise<string> {
  const stripe = getStripeClient()

  const discountConfig = params.couponId
    ? { discounts: [{ coupon: params.couponId }] }
    : { allow_promotion_codes: true as const }

  const subscriptionMetadata: Record<string, string> = {
    site_id: params.siteId.toString(),
    user_id: params.userId.toString(),
    site_name: params.siteName || '',
  }

  const customerId =
    params.stripeCustomerId
    ?? (await findOrCreateCustomerByEmail({ email: params.userEmail, userId: params.userId }))

  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    customer: customerId,
    line_items: [{
      price: params.priceId,
      quantity: 1,
    }],
    success_url: params.successUrl,
    cancel_url: params.cancelUrl,
    ...discountConfig,
    // Always collect payment method — required for both trials and paid subscriptions
    payment_method_collection: 'always',
    metadata: {
      site_id: params.siteId.toString(),
      user_id: params.userId.toString(),
    },
    subscription_data: {
      description: params.siteName ? `Create Pro - ${params.siteName}` : 'Create Pro',
      ...(params.trial ? { trial_end: getTrialEndTimestamp(14) } : {}),
      metadata: subscriptionMetadata,
    },
  })

  return session.url!
}

/**
 * Determine if multi-site coupon should be applied.
 * Returns coupon ID if user has 1+ active paid subscriptions and coupon is configured.
 */
export function getMultiSiteCouponId(activePaidCount: number, configuredCouponId: string): string | undefined {
  if (activePaidCount >= 1 && configuredCouponId) {
    return configuredCouponId
  }
  return undefined
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
 * Extend a Stripe subscription's trial end date
 */
export async function extendTrialEnd(stripeSubscriptionId: string, newTrialEnd: number): Promise<void> {
  const stripe = getStripeClient()
  await stripe.subscriptions.update(stripeSubscriptionId, { trial_end: newTrialEnd })
}

/**
 * Convert an existing trialing Stripe subscription to a paid subscription.
 *
 * Ends the trial immediately, swaps the price if different, and triggers an
 * immediate charge to the customer's default payment method. Used when a user
 * on trial clicks "Upgrade" — avoids creating a duplicate subscription.
 *
 * Returns the updated subscription.
 */
export async function convertTrialToPaid(params: {
  stripeSubscriptionId: string
  priceId: string
  couponId?: string
}): Promise<Stripe.Subscription> {
  const stripe = getStripeClient()

  const current = await stripe.subscriptions.retrieve(params.stripeSubscriptionId)
  const currentItem = current.items.data[0]
  if (!currentItem) {
    throw new Error('Subscription has no items')
  }

  const priceChanging = currentItem.price.id !== params.priceId

  const updateParams: Stripe.SubscriptionUpdateParams = {
    trial_end: 'now',
    proration_behavior: 'none',
    payment_behavior: 'error_if_incomplete',
    ...(priceChanging
      ? {
          items: [{ id: currentItem.id, price: params.priceId }],
        }
      : {}),
    ...(params.couponId ? { discounts: [{ coupon: params.couponId }] } : {}),
  }

  return stripe.subscriptions.update(params.stripeSubscriptionId, updateParams)
}

/**
 * Create a Stripe Billing Portal session scoped to updating payment methods
 * for a specific subscription. Used when we can't charge the card on file
 * (e.g. expired card) and need the user to provide a new one before we
 * convert their trial to a paid subscription.
 */
export async function createPaymentUpdatePortalSession(params: {
  customerId: string
  subscriptionId: string
  returnUrl: string
}): Promise<string> {
  const stripe = getStripeClient()

  const session = await stripe.billingPortal.sessions.create({
    customer: params.customerId,
    return_url: params.returnUrl,
    flow_data: {
      type: 'payment_method_update',
      after_completion: {
        type: 'redirect',
        redirect: { return_url: params.returnUrl },
      },
    },
  })

  return session.url
}

/**
 * Handle Stripe webhook events. WordPress site notifications are enqueued to
 * the durable message queue and delivered immediately via waitUntil when
 * possible; the drain worker is the retry safety net.
 */
export async function handleWebhookEvent(event: Stripe.Event, h3Event?: H3Event): Promise<void> {
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
      const subscriptionItem = subscription.items.data[0]
      const priceId = subscriptionItem?.price.id
      const tier = determineTierFromPriceId(priceId)

      // Get period dates from subscription item
      const periodStart = subscriptionItem?.current_period_start
      const periodEnd = subscriptionItem?.current_period_end

      // Check if subscription exists for this site (need this early for trial protection)
      const existing = await subscriptionRepo.getBySiteId(siteId)

      // Protect trialing subscriptions: if our DB says trialing and the trial_end
      // hasn't passed yet, don't let a Stripe webhook overwrite the status to 'active'.
      // This can happen when extendTrialEnd() triggers a subscription.updated event
      // where Stripe reports the status differently than our local state.
      let effectiveStatus = subscription.status
      if (
        existing?.status === 'trialing' &&
        existing.trial_end &&
        new Date(existing.trial_end) > new Date()
      ) {
        effectiveStatus = 'trialing'
      }

      const subscriptionData: Record<string, any> = {
        stripe_customer_id: subscription.customer as string,
        stripe_subscription_id: subscription.id,
        status: effectiveStatus,
        tier,
        current_period_start: periodStart
          ? new Date(periodStart * 1000).toISOString()
          : new Date().toISOString(),
        current_period_end: periodEnd
          ? new Date(periodEnd * 1000).toISOString()
          : new Date().toISOString(),
        cancel_at_period_end: subscription.cancel_at_period_end || false,
      }

      // Handle trial fields
      if (effectiveStatus === 'trialing') {
        // Use Stripe's trial_end if available, otherwise preserve our local value
        if (subscription.trial_end) {
          subscriptionData.trial_end = new Date(subscription.trial_end * 1000).toISOString()
        } else if (existing?.trial_end) {
          subscriptionData.trial_end = existing.trial_end
        }
        subscriptionData.has_trialed = true

        // Store trial cohort from metadata
        const trialCohort = subscription.metadata.trial_cohort
        if (trialCohort) {
          subscriptionData.metadata = { ...(existing?.metadata || {}), trial_cohort: trialCohort }
        }
      }

      if (existing) {
        await subscriptionRepo.update(siteId, subscriptionData)
      } else {
        await subscriptionRepo.create({
          site_id: siteId,
          ...subscriptionData,
        })
      }

      // Compute effective tier and trial info for webhook
      const effectiveTier = effectiveStatus === 'trialing' ? 'trial' : tier
      const isTrialing = effectiveStatus === 'trialing'
      const localTrialEnd = subscriptionData.trial_end || existing?.trial_end
      const trialEnd = localTrialEnd || null
      const trialDaysRemaining = trialEnd
        ? Math.max(0, Math.floor((new Date(trialEnd).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
        : 0

      const siteRepo = new SiteRepository()
      const site = await siteRepo.findById(siteId)
      if (site?.url) {
        const { enqueueSubscriptionChange } = await import('./message-queue')
        await enqueueSubscriptionChange(
          siteId,
          site.url,
          {
            tier: effectiveTier,
            is_trialing: isTrialing,
            trial_days_remaining: trialDaysRemaining,
            trial_end: trialEnd,
          },
          h3Event,
        )
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

        const siteRepo = new SiteRepository()
        const site = await siteRepo.findById(siteId)
        if (site?.url) {
          const { enqueueSubscriptionChange } = await import('./message-queue')
          await enqueueSubscriptionChange(siteId, site.url, { tier: 'free' }, h3Event)
        }
      }

      break
    }

    case 'invoice.payment_succeeded': {
      const invoice = event.data.object as Stripe.Invoice
      // In newer API versions, subscription ID is in parent.subscription_details.subscription
      // It can be a string ID or a Subscription object
      const subRef = invoice.parent?.subscription_details?.subscription
      const subscriptionId = typeof subRef === 'string' ? subRef : subRef?.id

      if (subscriptionId) {
        const subscription = await subscriptionRepo.getByStripeSubscriptionId(subscriptionId)

        // Don't flip trialing → active on $0 invoices from trial extensions
        if (subscription && subscription.status !== 'trialing') {
          await subscriptionRepo.update(subscription.site_id, {
            status: 'active',
          })
          const { purgeSiteStatusCache } = await import('./site-status-cache')
          await purgeSiteStatusCache(h3Event, subscription.site_id)
        }
      }

      break
    }

    case 'invoice.payment_failed': {
      const invoice = event.data.object as Stripe.Invoice
      // In newer API versions, subscription ID is in parent.subscription_details.subscription
      // It can be a string ID or a Subscription object
      const subRef = invoice.parent?.subscription_details?.subscription
      const subscriptionId = typeof subRef === 'string' ? subRef : subRef?.id

      if (subscriptionId) {
        const subscription = await subscriptionRepo.getByStripeSubscriptionId(subscriptionId)

        if (subscription) {
          await subscriptionRepo.update(subscription.site_id, {
            status: 'past_due',
          })
          const { purgeSiteStatusCache } = await import('./site-status-cache')
          await purgeSiteStatusCache(h3Event, subscription.site_id)
        }
      }

      break
    }

    case 'customer.subscription.trial_will_end': {
      // Stripe fires this 3 days before the trial ends.
      // If we have a later local trial_end (from bonus day extensions),
      // sync it to Stripe so the user isn't charged early.
      const subscription = event.data.object as Stripe.Subscription
      const siteId = parseInt(subscription.metadata.site_id || '0')

      if (siteId) {
        const existing = await subscriptionRepo.getBySiteId(siteId)

        if (existing?.trial_end && existing.status === 'trialing') {
          const localTrialEnd = new Date(existing.trial_end)
          const stripeTrialEnd = subscription.trial_end
            ? new Date(subscription.trial_end * 1000)
            : null

          // If our local trial_end is later than Stripe's, sync to Stripe
          if (stripeTrialEnd && localTrialEnd > stripeTrialEnd) {
            const newTrialEndUnix = Math.floor(localTrialEnd.getTime() / 1000)
            await extendTrialEnd(subscription.id, newTrialEndUnix)
          }
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
 * All Create Pro prices map to 'pro' tier
 */
function determineTierFromPriceId(priceId?: string): string {
  if (!priceId) return 'free'

  // All Create Pro subscription prices are 'pro' tier
  // The billing interval (monthly, quarterly, annual, biannual) is handled by Stripe
  return 'pro'
}

/**
 * Verify Stripe webhook signature
 * Uses constructEventAsync for compatibility with Cloudflare Workers (async Web Crypto API)
 */
export async function verifyWebhookSignature(payload: string | Buffer, signature: string): Promise<Stripe.Event> {
  const stripe = getStripeClient()
  const config = useRuntimeConfig()
  const webhookSecret = config.stripeWebhookSecret || process.env.NUXT_STRIPE_WEBHOOK_SECRET

  if (!webhookSecret) {
    throw new Error('Stripe webhook secret is not configured')
  }

  return stripe.webhooks.constructEventAsync(payload, signature, webhookSecret)
}
