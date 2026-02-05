import { eq } from 'drizzle-orm'
import { subscriptions } from "~~/server/utils/db"
import { useAdminOpsDb, auditLogs, getAuditEnvironment } from '~~/server/utils/admin-ops-db'
import Stripe from 'stripe'

/**
 * POST /api/admin/subscriptions/[id]/cancel
 * Cancel subscription - behavior depends on whether Stripe is connected
 *
 * Two paths:
 * 1. Has Stripe subscription: Set cancel_at_period_end via Stripe API
 *    - User retains access until period ends
 *    - Stripe webhooks will finalize cancellation
 * 2. No Stripe subscription: Immediately set to free tier
 *    - Direct database update, takes effect immediately
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
    const hasStripeSubscription = !!currentSubscription.stripe_subscription_id

    // Check if already canceled
    if (currentSubscription.status === 'canceled') {
      throw createError({
        statusCode: 400,
        message: 'Subscription is already canceled',
      })
    }

    // For non-Stripe subscriptions that are already free, nothing to cancel
    if (!hasStripeSubscription && currentSubscription.tier === 'free') {
      throw createError({
        statusCode: 400,
        message: 'Subscription is already on free tier',
      })
    }

    // PATH 1: Has Stripe subscription - cancel via Stripe API
    if (hasStripeSubscription) {
      const config = useRuntimeConfig()
      const stripe = new Stripe(config.stripeSecretKey, {
        apiVersion: '2024-11-20.acacia',
      })

      try {
        // Cancel at period end to allow access until current period expires
        await stripe.subscriptions.update(currentSubscription.stripe_subscription_id!, {
          cancel_at_period_end: true,
        })
      } catch (stripeError: any) {
        console.error('Stripe cancellation error:', stripeError)
        throw createError({
          statusCode: 500,
          message: 'Failed to cancel subscription in Stripe',
        })
      }

      // Update database to reflect pending cancellation
      await db
        .update(subscriptions)
        .set({
          cancel_at_period_end: true,
          updatedAt: new Date().toISOString(),
        })
        .where(eq(subscriptions.id, subscriptionId))
    } else {
      // PATH 2: No Stripe subscription - immediate downgrade to free
      await db
        .update(subscriptions)
        .set({
          tier: 'free',
          status: 'free',
          cancel_at_period_end: false,
          updatedAt: new Date().toISOString(),
        })
        .where(eq(subscriptions.id, subscriptionId))
    }

    // Create audit log entry (don't let audit log failures break the operation)
    try {
      const adminOpsDb = useAdminOpsDb(event)
      await adminOpsDb.insert(auditLogs).values({
        admin_id: session.user.id,
        action: 'subscription_canceled',
        entity_type: 'subscription',
        entity_id: subscriptionId,
        environment: getAuditEnvironment(event),
        changes: JSON.stringify({
          before: {
            status: currentSubscription.status,
            tier: currentSubscription.tier,
            cancel_at_period_end: currentSubscription.cancel_at_period_end,
          },
          after: hasStripeSubscription
            ? {
                cancel_at_period_end: true,
              }
            : {
                status: 'free',
                tier: 'free',
                cancel_at_period_end: false,
              },
          hasStripe: hasStripeSubscription,
        }),
        ip_address: getRequestIP(event) || null,
        user_agent: getHeader(event, 'user-agent') || null,
        createdAt: new Date().toISOString(),
      })
    } catch (auditError) {
      console.warn('Failed to create audit log:', auditError)
    }

    return {
      success: true,
      message: hasStripeSubscription
        ? 'Subscription will be canceled at end of billing period'
        : 'Subscription downgraded to free tier',
      cancel_at_period_end: hasStripeSubscription,
      hasStripe: hasStripeSubscription,
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
