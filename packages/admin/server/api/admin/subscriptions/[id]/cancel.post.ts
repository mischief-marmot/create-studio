import { eq } from 'drizzle-orm'
import { subscriptions, auditLogs } from "~~/server/utils/db"
import Stripe from 'stripe'

/**
 * POST /api/admin/subscriptions/[id]/cancel
 * Cancel subscription in Stripe and update database status
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

    // Check if already canceled
    if (currentSubscription.status === 'canceled') {
      throw createError({
        statusCode: 400,
        message: 'Subscription is already canceled',
      })
    }

    // Cancel in Stripe if there's a Stripe subscription
    if (currentSubscription.stripe_subscription_id) {
      const config = useRuntimeConfig()
      const stripe = new Stripe(config.stripeSecretKey, {
        apiVersion: '2024-11-20.acacia',
      })

      try {
        // Cancel at period end to allow access until current period expires
        await stripe.subscriptions.update(currentSubscription.stripe_subscription_id, {
          cancel_at_period_end: true,
        })
      } catch (stripeError: any) {
        console.error('Stripe cancellation error:', stripeError)
        throw createError({
          statusCode: 500,
          message: 'Failed to cancel subscription in Stripe',
        })
      }
    }

    // Update subscription in database
    await db
      .update(subscriptions)
      .set({
        cancel_at_period_end: true,
        status: currentSubscription.stripe_subscription_id ? 'canceled' : 'free',
        tier: 'free',
        updatedAt: new Date().toISOString(),
      })
      .where(eq(subscriptions.id, subscriptionId))

    // Create audit log entry
    await db.insert(auditLogs).values({
      admin_id: session.user.id,
      action: 'subscription_canceled',
      entity_type: 'subscription',
      entity_id: subscriptionId,
      changes: JSON.stringify({
        before: {
          status: currentSubscription.status,
          tier: currentSubscription.tier,
          cancel_at_period_end: currentSubscription.cancel_at_period_end,
        },
        after: {
          status: currentSubscription.stripe_subscription_id ? 'canceled' : 'free',
          tier: 'free',
          cancel_at_period_end: true,
        },
      }),
      ip_address: getRequestIP(event) || null,
      user_agent: getHeader(event, 'user-agent') || null,
      createdAt: new Date().toISOString(),
    })

    return {
      success: true,
      message: 'Subscription canceled successfully',
      cancel_at_period_end: true,
    }
  } catch (error) {
    // If it's already a createError, re-throw it
    if (error && typeof error === 'object' && 'statusCode' in error) {
      throw error
    }

    console.error('Error canceling subscription:', error)
    throw createError({
      statusCode: 500,
      message: 'Failed to cancel subscription',
    })
  }
})
