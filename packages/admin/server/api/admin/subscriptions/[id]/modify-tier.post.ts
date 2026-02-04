import { eq } from 'drizzle-orm'
import { subscriptions, sites, auditLogs } from "~~/server/utils/db"
import Stripe from 'stripe'

/**
 * POST /api/admin/subscriptions/[id]/modify-tier
 * Modify subscription tier (upgrade/downgrade/grant free pro)
 * Updates both database and Stripe subscription
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
    if (!tier || !['free', 'pro'].includes(tier)) {
      throw createError({
        statusCode: 400,
        message: 'Invalid tier. Must be "free" or "pro"',
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

    // Check if tier is already set
    if (currentSubscription.tier === tier) {
      throw createError({
        statusCode: 400,
        message: `Subscription is already on ${tier} tier`,
      })
    }

    // Update Stripe subscription if applicable
    if (currentSubscription.stripe_subscription_id && tier === 'free') {
      // If downgrading to free and there's a Stripe subscription, cancel it
      const config = useRuntimeConfig()
      const stripe = new Stripe(config.stripeSecretKey, {
        apiVersion: '2024-11-20.acacia',
      })

      try {
        await stripe.subscriptions.cancel(currentSubscription.stripe_subscription_id)
      } catch (stripeError: any) {
        console.error('Stripe cancellation error:', stripeError)
        // Continue with database update even if Stripe fails
      }
    }

    // Determine new status based on tier
    const newStatus = tier === 'free' ? 'free' : currentSubscription.status

    // Update subscription in database
    await db
      .update(subscriptions)
      .set({
        tier,
        status: newStatus,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(subscriptions.id, subscriptionId))

    // Create audit log entry
    await db.insert(auditLogs).values({
      admin_id: session.user.id,
      action: 'subscription_tier_modified',
      entity_type: 'subscription',
      entity_id: subscriptionId,
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

    return {
      success: true,
      message: `Subscription tier updated to ${tier} successfully`,
      tier,
      status: newStatus,
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
