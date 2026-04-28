import { eq } from 'drizzle-orm'
import { useAdminDb, subscriptions, sites } from "~~/server/utils/admin-db"
import { useAdminOpsDb, auditLogs, getAuditEnvironment } from '~~/server/utils/admin-ops-db'
import { getAdminStripeClient } from '~~/server/utils/stripe'
import { getAdminEnvironment } from '~~/server/utils/admin-env'
import { purgeSiteConfigCache } from '~~/server/utils/purge-site-config-cache'

/**
 * POST /api/admin/subscriptions/[id]/link-stripe
 * Link a Stripe subscription to an existing Create Studio subscription record.
 * Fetches live data from Stripe to sync status, period dates, and customer ID.
 */
export default defineEventHandler(async (event) => {
  const session = await getUserSession(event)
  if (!session?.user) {
    throw createError({ statusCode: 401, message: 'Unauthorized' })
  }

  const db = useAdminDb(event)
  const subscriptionId = parseInt(event.context.params?.id || '0')

  if (!subscriptionId || isNaN(subscriptionId)) {
    throw createError({ statusCode: 400, message: 'Invalid subscription ID' })
  }

  const body = await readBody(event)
  const { stripeSubscriptionId } = body

  if (!stripeSubscriptionId || typeof stripeSubscriptionId !== 'string') {
    throw createError({ statusCode: 400, message: 'stripeSubscriptionId is required' })
  }

  // Basic format check
  if (!stripeSubscriptionId.startsWith('sub_')) {
    throw createError({ statusCode: 400, message: 'stripeSubscriptionId must start with "sub_"' })
  }

  // Get the current CS subscription record
  const existing = await db
    .select()
    .from(subscriptions)
    .where(eq(subscriptions.id, subscriptionId))
    .limit(1)

  if (existing.length === 0) {
    throw createError({ statusCode: 404, message: 'Subscription not found' })
  }

  const current = existing[0]

  // Look up site URL for cache purge after the write
  const siteResult = await db.select({ url: sites.url }).from(sites).where(eq(sites.id, current.site_id)).limit(1)
  const siteUrl = siteResult[0]?.url

  // Check if another subscription is already linked to this Stripe ID
  const conflict = await db
    .select({ id: subscriptions.id })
    .from(subscriptions)
    .where(eq(subscriptions.stripe_subscription_id, stripeSubscriptionId))
    .limit(1)

  if (conflict.length > 0 && conflict[0].id !== subscriptionId) {
    throw createError({
      statusCode: 409,
      message: 'This Stripe subscription ID is already linked to another Create Studio subscription',
    })
  }

  // Fetch the Stripe subscription to validate it and pull live data
  const stripe = getAdminStripeClient()

  let stripeSub: Awaited<ReturnType<typeof stripe.subscriptions.retrieve>>
  try {
    stripeSub = await stripe.subscriptions.retrieve(stripeSubscriptionId, {
      expand: ['items.data.price'],
    })
  } catch (err: any) {
    throw createError({
      statusCode: 422,
      message: `Stripe lookup failed: ${err.message}`,
    })
  }

  const stripeCustomerId = typeof stripeSub.customer === 'string'
    ? stripeSub.customer
    : stripeSub.customer.id

  const item = stripeSub.items.data[0]
  const periodStart = item?.current_period_start ?? (stripeSub as any).current_period_start
  const periodEnd = item?.current_period_end ?? (stripeSub as any).current_period_end

  const now = new Date().toISOString()

  const updates = {
    stripe_subscription_id: stripeSubscriptionId,
    stripe_customer_id: stripeCustomerId,
    status: stripeSub.status,
    tier: 'pro', // all CS paid subscriptions are pro
    current_period_start: periodStart ? new Date(periodStart * 1000).toISOString() : current.current_period_start,
    current_period_end: periodEnd ? new Date(periodEnd * 1000).toISOString() : current.current_period_end,
    cancel_at_period_end: stripeSub.cancel_at_period_end,
    updatedAt: now,
  }

  await db
    .update(subscriptions)
    .set(updates)
    .where(eq(subscriptions.id, subscriptionId))

  // Audit log
  try {
    const adminOpsDb = useAdminOpsDb(event)
    await adminOpsDb.insert(auditLogs).values({
      admin_id: session.user.id,
      action: 'subscription_stripe_linked',
      entity_type: 'subscription',
      entity_id: subscriptionId,
      environment: getAuditEnvironment(event),
      changes: JSON.stringify({
        before: {
          stripe_subscription_id: current.stripe_subscription_id,
          stripe_customer_id: current.stripe_customer_id,
          status: current.status,
        },
        after: {
          stripe_subscription_id: stripeSubscriptionId,
          stripe_customer_id: stripeCustomerId,
          status: stripeSub.status,
        },
      }),
      ip_address: getRequestIP(event) || null,
      user_agent: getHeader(event, 'user-agent') || null,
      createdAt: now,
    })
  } catch (auditError) {
    console.warn('Failed to create audit log:', auditError)
  }

  // Purge site-config edge cache — tier becomes 'pro' and status syncs from Stripe
  await purgeSiteConfigCache(event, [siteUrl], { siteId: current.site_id })

  // Notify the WordPress site of any tier/status change
  try {
    const config = useRuntimeConfig()
    const adminEnv = getAdminEnvironment(event)
    const rawMainAppUrl = adminEnv === 'preview' ? config.mainAppPreviewUrl : config.mainAppUrl
    const mainAppUrl = rawMainAppUrl?.replace(/\/+$/, '')
    if (mainAppUrl) {
      await fetch(`${mainAppUrl}/api/v2/internal/notify-subscription-change`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Admin-Api-Key': config.mainAppApiKey || '',
        },
        body: JSON.stringify({ siteId: current.site_id, tier: 'pro' }),
      })
    }
  } catch (webhookError) {
    console.warn('Failed to notify site of subscription link:', webhookError)
  }

  return {
    success: true,
    message: 'Stripe subscription linked and synced successfully',
    stripe_subscription_id: stripeSubscriptionId,
    stripe_customer_id: stripeCustomerId,
    status: stripeSub.status,
    tier: 'pro',
  }
})
