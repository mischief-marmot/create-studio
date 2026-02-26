import { eq, like, or, sql, desc, count, and } from 'drizzle-orm'
import { useAdminDb, users, sites, subscriptions } from "~~/server/utils/admin-db"

/**
 * GET /api/admin/subscriptions
 * Returns paginated list of subscriptions with filtering and search
 *
 * Query params:
 * - page: number (default: 1)
 * - limit: number (default: 20)
 * - search: string (search in site name, site URL)
 * - tier: 'free' | 'pro' (filter by tier)
 * - status: 'free' | 'active' | 'canceled' | 'past_due' | 'trialing' | 'unpaid' (filter by status)
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

  try {
    // Get query parameters
    const query = getQuery(event)
    const page = Math.max(1, Number(query.page) || 1)
    const limit = Math.min(100, Math.max(1, Number(query.limit) || 20))
    const search = query.search as string | undefined
    const tierFilter = query.tier as string | undefined
    const statusFilter = query.status as string | undefined
    const offset = (page - 1) * limit

    // Build conditions array
    const conditions: any[] = []

    // Apply search filter (site name or URL)
    if (search) {
      const searchPattern = `%${search}%`
      conditions.push(
        or(
          like(sites.name, searchPattern),
          like(sites.url, searchPattern)
        )
      )
    }

    // Apply tier filter
    if (tierFilter && (tierFilter === 'free' || tierFilter === 'pro')) {
      conditions.push(eq(subscriptions.tier, tierFilter))
    }

    // Apply status filter
    if (statusFilter && ['free', 'active', 'canceled', 'past_due', 'trialing', 'unpaid'].includes(statusFilter)) {
      conditions.push(eq(subscriptions.status, statusFilter))
    }

    // Combine conditions with AND
    const whereClause = conditions.length > 0 ? and(...conditions) : undefined

    // Get total count for pagination
    const countResult = await db
      .select({ count: count() })
      .from(subscriptions)
      .innerJoin(sites, eq(subscriptions.site_id, sites.id))
      .where(whereClause)

    const total = countResult[0]?.count || 0
    const totalPages = Math.ceil(total / limit)

    // Get paginated subscriptions with site and user info
    const subscriptionsList = await db
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
        userId: sites.user_id,
      })
      .from(subscriptions)
      .innerJoin(sites, eq(subscriptions.site_id, sites.id))
      .where(whereClause)
      .orderBy(desc(subscriptions.createdAt))
      .limit(limit)
      .offset(offset)

    // Get user emails for each subscription
    const subscriptionsWithUsers = await Promise.all(
      subscriptionsList.map(async (sub: typeof subscriptionsList[number]) => {
        // Get the user email
        const user = await db
          .select({ email: users.email })
          .from(users)
          .where(eq(users.id, sub.userId))
          .limit(1)

        const userEmail = user[0]?.email || 'Unknown'

        // Build Stripe dashboard links
        const stripeCustomerLink = sub.stripe_customer_id
          ? `https://dashboard.stripe.com/customers/${sub.stripe_customer_id}`
          : null

        const stripeSubscriptionLink = sub.stripe_subscription_id
          ? `https://dashboard.stripe.com/subscriptions/${sub.stripe_subscription_id}`
          : null

        return {
          id: sub.id,
          site_id: sub.site_id,
          siteName: sub.siteName || (sub.siteUrl ? (() => { try { return new URL(sub.siteUrl).hostname } catch { return sub.siteUrl } })() : ''),
          siteUrl: sub.siteUrl || '',
          userEmail,
          tier: sub.tier,
          status: sub.status,
          current_period_start: sub.current_period_start,
          current_period_end: sub.current_period_end,
          cancel_at_period_end: sub.cancel_at_period_end,
          stripe_customer_id: sub.stripe_customer_id,
          stripe_subscription_id: sub.stripe_subscription_id,
          stripeCustomerLink,
          stripeSubscriptionLink,
          createdAt: sub.createdAt,
          updatedAt: sub.updatedAt,
        }
      })
    )

    return {
      data: subscriptionsWithUsers,
      pagination: {
        page,
        limit,
        total,
        totalPages,
      },
    }
  } catch (error) {
    console.error('Error fetching subscriptions:', error)
    throw createError({
      statusCode: 500,
      message: 'Failed to fetch subscriptions',
    })
  }
})
