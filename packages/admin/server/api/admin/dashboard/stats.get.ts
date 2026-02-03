import { eq, and, gte, sql, isNotNull, count } from 'drizzle-orm'
import { users, sites, subscriptions, siteUsers } from '../../../../utils/db'

/**
 * GET /api/admin/dashboard/stats
 * Returns dashboard metrics for admin portal
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

  const db = hubDatabase()

  try {
    // Calculate date boundaries
    const now = new Date()
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)

    // Get total users count
    const totalUsersResult = await db
      .select({ count: count() })
      .from(users)
    const totalUsers = totalUsersResult[0]?.count || 0

    // Get total sites count
    const totalSitesResult = await db
      .select({ count: count() })
      .from(sites)
    const totalSites = totalSitesResult[0]?.count || 0

    // Get total subscriptions count
    const totalSubscriptionsResult = await db
      .select({ count: count() })
      .from(subscriptions)
    const totalSubscriptions = totalSubscriptionsResult[0]?.count || 0

    // Get new users in last 7 days
    const newUsersLast7DaysResult = await db
      .select({ count: count() })
      .from(users)
      .where(gte(users.createdAt, sevenDaysAgo.toISOString()))
    const newUsersLast7Days = newUsersLast7DaysResult[0]?.count || 0

    // Get new users in last 30 days
    const newUsersLast30DaysResult = await db
      .select({ count: count() })
      .from(users)
      .where(gte(users.createdAt, thirtyDaysAgo.toISOString()))
    const newUsersLast30Days = newUsersLast30DaysResult[0]?.count || 0

    // Get verified sites count (sites with verified SiteUsers entries)
    const verifiedSitesResult = await db
      .select({ count: count() })
      .from(sites)
      .innerJoin(siteUsers, eq(sites.id, siteUsers.site_id))
      .where(isNotNull(siteUsers.verified_at))
    const verifiedSites = verifiedSitesResult[0]?.count || 0

    // Get unverified sites count (total sites - verified sites)
    const unverifiedSites = totalSites - verifiedSites

    // Calculate MRR (Monthly Recurring Revenue)
    // For now, we'll use a simple calculation based on active subscriptions
    // Assuming each pro subscription is $10/month (this should come from a config)
    const PRO_SUBSCRIPTION_PRICE = 10
    const activeSubscriptionsResult = await db
      .select({ count: count() })
      .from(subscriptions)
      .where(
        and(
          eq(subscriptions.status, 'active'),
          eq(subscriptions.tier, 'pro')
        )
      )
    const activeProSubscriptions = activeSubscriptionsResult[0]?.count || 0
    const mrr = activeProSubscriptions * PRO_SUBSCRIPTION_PRICE

    return {
      totalUsers,
      totalSites,
      totalSubscriptions,
      newUsersLast7Days,
      newUsersLast30Days,
      verifiedSites,
      unverifiedSites,
      mrr,
    }
  } catch (error) {
    console.error('Error fetching dashboard stats:', error)
    throw createError({
      statusCode: 500,
      message: 'Failed to fetch dashboard statistics',
    })
  }
})
