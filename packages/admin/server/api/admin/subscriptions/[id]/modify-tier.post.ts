import { eq } from 'drizzle-orm'
import { useAdminDb, subscriptions, sites } from "~~/server/utils/admin-db"
import { useAdminOpsDb, auditLogs, getAuditEnvironment } from '~~/server/utils/admin-ops-db'
import { getAdminEnvironment } from '~~/server/utils/admin-env'
import { getAdminStripeClient } from '~~/server/utils/stripe'
import { purgeSiteConfigCache } from '~~/server/utils/purge-site-config-cache'

/**
 * POST /api/admin/subscriptions/[id]/modify-tier
 * Modify subscription tier (upgrade/downgrade/grant free pro)
 *
 * Two paths:
 * 1. No Stripe subscription: Direct database toggle (immediate effect)
 * 2. Has Stripe subscription: Cancel via Stripe API when downgrading to free
 */
export default defineEventHandler(async (event) => {
  // Check admin session
  const session = await getUserSession(event)
  if (!session?.user) {
    throw createError({
      statusCode: 401,
      message: 'Unauthorized',
    })
  }

  const db = useAdminDb(event)
  const subscriptionId = parseInt(event.context.params?.id || '0')

  if (!subscriptionId || isNaN(subscriptionId)) {
    throw createError({
      statusCode: 400,
      message: 'Invalid subscription ID',
    })
  }

  try {
    const body = await readBody(event)
    const { tier } = body

    // Validate tier
    if (!tier || !['free', 'free-plus', 'pro'].includes(tier)) {
      throw createError({
        statusCode: 400,
        message: 'Invalid tier. Must be "free", "free-plus", or "pro"',
      })
    }

    // Get current subscription
    const subscriptionResult = await db
      .select()
      .from(subscriptions)
      .where(eq(subscriptions.id, subscriptionId))
      .limit(1)

    if (subscriptionResult.length === 0) {
      throw createError({
        statusCode: 404,
        message: 'Subscription not found',
      })
    }

    const currentSubscription = subscriptionResult[0]
    const hasStripeSubscription = !!currentSubscription.stripe_subscription_id

    // Look up site URL for cache purge after the tier write
    const siteResult = await db.select({ url: sites.url }).from(sites).where(eq(sites.id, currentSubscription.site_id)).limit(1)
    const siteUrl = siteResult[0]?.url

    // Check if tier is already set
    if (currentSubscription.tier === tier) {
      throw createError({
        statusCode: 400,
        message: `Subscription is already on ${tier} tier`,
      })
    }

    const config = useRuntimeConfig()

    // PATH 1: Has Stripe subscription - need to handle via Stripe
    if (hasStripeSubscription && tier === 'free') {
      // Downgrading to free with a Stripe subscription - cancel it in Stripe
      const stripe = getAdminStripeClient()

      try {
        await stripe.subscriptions.cancel(currentSubscription.stripe_subscription_id!)
      } catch (stripeError: any) {
        console.error('Stripe cancellation error:', stripeError)
        throw createError({
          statusCode: 502,
          message: 'Failed to cancel Stripe subscription. Database was not updated to avoid billing state mismatch.',
        })
      }
    }

    // PATH 2: No Stripe subscription - direct database update
    // Determine new status based on tier and Stripe status
    let newStatus: string
    if (tier === 'free') {
      newStatus = 'free'
    } else if (hasStripeSubscription) {
      // Keep current Stripe status
      newStatus = currentSubscription.status
    } else {
      // No Stripe, upgrading to pro or free-plus - set to active (admin-granted)
      newStatus = 'active'
    }

    // Update subscription in database
    await db
      .update(subscriptions)
      .set({
        tier,
        status: newStatus,
        // Clear cancel_at_period_end if upgrading
        cancel_at_period_end: (tier === 'pro' || tier === 'free-plus') ? false : currentSubscription.cancel_at_period_end,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(subscriptions.id, subscriptionId))

    // Create audit log entry
    try {
      const adminOpsDb = useAdminOpsDb(event)
      await adminOpsDb.insert(auditLogs).values({
        admin_id: session.user.id,
        action: 'subscription_tier_modified',
        entity_type: 'subscription',
        entity_id: subscriptionId,
        environment: getAuditEnvironment(event),
        changes: JSON.stringify({
          before: {
            tier: currentSubscription.tier,
            status: currentSubscription.status,
          },
          after: {
            tier,
            status: newStatus,
          },
        }),
        ip_address: getRequestIP(event) || null,
        user_agent: getHeader(event, 'user-agent') || null,
        createdAt: new Date().toISOString(),
      })
    } catch (auditError) {
      console.warn('Failed to create audit log:', auditError)
    }

    // Purge site-config edge cache — tier always changes in this handler
    await purgeSiteConfigCache(event, [siteUrl], { siteId: currentSubscription.site_id })

    // Notify the WordPress site of the tier change via the main app's webhook dispatcher
    try {
      const adminEnv = getAdminEnvironment(event)
      const rawMainAppUrl = adminEnv === 'preview' ? config.mainAppPreviewUrl : config.mainAppUrl
      const mainAppUrl = rawMainAppUrl?.replace(/\/+$/, '')
      if (mainAppUrl) {
        const response = await fetch(`${mainAppUrl}/api/v2/internal/notify-subscription-change`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Admin-Api-Key': config.mainAppApiKey || '',
          },
          body: JSON.stringify({ siteId: currentSubscription.site_id, tier }),
        })
        if (!response.ok) {
          console.warn(`Webhook notification failed: ${response.status} ${response.statusText}`)
        }
      }
    } catch (webhookError) {
      console.warn('Failed to notify site of tier change:', webhookError)
    }

    return {
      success: true,
      message: hasStripeSubscription && tier === 'free'
        ? `Subscription downgraded to free. Stripe subscription canceled.`
        : `Subscription tier updated to ${tier} successfully`,
      tier,
      status: newStatus,
      hasStripe: hasStripeSubscription,
    }
  } catch (error) {
    // If it's already a createError, re-throw it
    if (error && typeof error === 'object' && 'statusCode' in error) {
      throw error
    }

    console.error('Error modifying subscription tier:', error)
    throw createError({
      statusCode: 500,
      message: 'Failed to modify subscription tier',
    })
  }
})
