import { eq } from 'drizzle-orm'
import { subscriptions, auditLogs } from "~~/server/utils/db"

/**
 * DELETE /api/admin/subscriptions/[id]
 * Delete a subscription record entirely
 *
 * IMPORTANT: Only allowed for subscriptions WITHOUT Stripe integration.
 * Stripe-connected subscriptions must be canceled via the cancel endpoint
 * to ensure proper billing termination.
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

    // SAFETY CHECK: Do not allow deletion of Stripe-connected subscriptions
    if (currentSubscription.stripe_subscription_id || currentSubscription.stripe_customer_id) {
      throw createError({
        statusCode: 400,
        message: 'Cannot delete subscription with Stripe integration. Use the cancel endpoint instead to properly terminate billing.',
      })
    }

    // Delete the subscription
    await db
      .delete(subscriptions)
      .where(eq(subscriptions.id, subscriptionId))

    // Create audit log entry (don't let audit log failures break the operation)
    try {
      await db.insert(auditLogs).values({
        admin_id: session.user.id,
        action: 'subscription_deleted',
        entity_type: 'subscription',
        entity_id: subscriptionId,
        changes: JSON.stringify({
          deleted: {
            id: currentSubscription.id,
            site_id: currentSubscription.site_id,
            tier: currentSubscription.tier,
            status: currentSubscription.status,
          },
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
      message: 'Subscription deleted successfully',
    }
  } catch (error) {
    // If it's already a createError, re-throw it
    if (error && typeof error === 'object' && 'statusCode' in error) {
      throw error
    }

    console.error('Error deleting subscription:', error)
    throw createError({
      statusCode: 500,
      message: 'Failed to delete subscription',
    })
  }
})
