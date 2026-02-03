import { eq } from 'drizzle-orm'
import { users, sites, subscriptions, auditLogs } from "~~/server/utils/db"

/**
 * GET /api/admin/subscriptions/[id]
 * Returns detailed information about a specific subscription
 *
 * Includes:
 * - Subscription basic info
 * - Associated site details
 * - User information
 * - Stripe links
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

  // db is auto-imported from hub:db
  const subscriptionId = parseInt(event.context.params?.id || '0')

  if (!subscriptionId || isNaN(subscriptionId)) {
    throw createError({
      statusCode: 400,
      message: 'Invalid subscription ID',
    })
  }

  try {
    // Get subscription details with site and user info
    const subscriptionResult = await db
      .select({
        id: subscriptions.id,
        site_id: subscriptions.site_id,
        tier: subscriptions.tier,
        status: subscriptions.status,
        current_period_start: subscriptions.current_period_start,
        current_period_end: subscriptions.current_period_end,
        cancel_at_period_end: subscriptions.cancel_at_period_end,
        stripe_customer_id: subscriptions.stripe_customer_id,
        stripe_subscription_id: subscriptions.stripe_subscription_id,
        createdAt: subscriptions.createdAt,
        updatedAt: subscriptions.updatedAt,
        siteName: sites.name,
        siteUrl: sites.url,
        siteId: sites.id,
        userId: sites.user_id,
      })
      .from(subscriptions)
      .innerJoin(sites, eq(subscriptions.site_id, sites.id))
      .where(eq(subscriptions.id, subscriptionId))
      .limit(1)

    if (subscriptionResult.length === 0) {
      throw createError({
        statusCode: 404,
        message: 'Subscription not found',
      })
    }

    const subscription = subscriptionResult[0]

    // Get user details
    const userResult = await db
      .select({
        id: users.id,
        email: users.email,
        firstname: users.firstname,
        lastname: users.lastname,
      })
      .from(users)
      .where(eq(users.id, subscription.userId))
      .limit(1)

    const user = userResult[0] || null

    // Build Stripe dashboard links
    const stripeCustomerLink = subscription.stripe_customer_id
      ? `https://dashboard.stripe.com/customers/${subscription.stripe_customer_id}`
      : null

    const stripeSubscriptionLink = subscription.stripe_subscription_id
      ? `https://dashboard.stripe.com/subscriptions/${subscription.stripe_subscription_id}`
      : null

    return {
      id: subscription.id,
      site_id: subscription.site_id,
      site: {
        id: subscription.siteId,
        name: subscription.siteName || 'Unnamed Site',
        url: subscription.siteUrl || '',
      },
      user: user ? {
        id: user.id,
        email: user.email,
        firstname: user.firstname,
        lastname: user.lastname,
        displayName: user.firstname && user.lastname
          ? `${user.firstname} ${user.lastname}`
          : user.firstname || user.lastname || user.email,
      } : null,
      tier: subscription.tier,
      status: subscription.status,
      current_period_start: subscription.current_period_start,
      current_period_end: subscription.current_period_end,
      cancel_at_period_end: subscription.cancel_at_period_end,
      stripe_customer_id: subscription.stripe_customer_id,
      stripe_subscription_id: subscription.stripe_subscription_id,
      stripeCustomerLink,
      stripeSubscriptionLink,
      createdAt: subscription.createdAt,
      updatedAt: subscription.updatedAt,
    }
  } catch (error) {
    // If it's already a createError, re-throw it
    if (error && typeof error === 'object' && 'statusCode' in error) {
      throw error
    }

    console.error('Error fetching subscription details:', error)
    throw createError({
      statusCode: 500,
      message: 'Failed to fetch subscription details',
    })
  }
})
