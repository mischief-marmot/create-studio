import { eq, and, gte, sql, isNotNull, count } from 'drizzle-orm'
import { users, sites, subscriptions, siteUsers } from "~~/server/utils/admin-db"

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

  const db = useAdminDb(event)

  try {
    console.log('=== Dashboard Stats Debug ===')
    console.log('DB instance:', typeof db)

    // Calculate date boundaries
    const now = new Date()
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)

    // Get total users count
    const totalUsersResult = await db
      .select({ count: count() })
      .from(users)
    console.log('Total users result:', totalUsersResult)
    const totalUsers = totalUsersResult[0]?.count || 0
    console.log('Total users:', totalUsers)

    // Get total sites count
    const totalSitesResult = await db
      .select({ count: count() })
      .from(sites)
    console.log('Total sites result:', totalSitesResult)
    const totalSites = totalSitesResult[0]?.count || 0

    // Get total subscriptions count
    const totalSubscriptionsResult = await db
      .select({ count: count() })
      .from(subscriptions)
    console.log('Total subscriptions result:', totalSubscriptionsResult)
    const totalSubscriptions = totalSubscriptionsResult[0]?.count || 0
    console.log('=== End Debug ===')


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

    // Get active users (users with at least one site that has an active subscription)
    const activeUsersResult = await db
      .select({ count: count() })
      .from(users)
      .innerJoin(sites, eq(users.id, sites.user_id))
      .innerJoin(subscriptions, eq(sites.id, subscriptions.site_id))
      .where(eq(subscriptions.status, 'active'))
    const activeUsers = activeUsersResult[0]?.count || 0

    // Get pro subscriptions count
    const proSubscriptionsResult = await db
      .select({ count: count() })
      .from(subscriptions)
      .where(
        and(
          eq(subscriptions.status, 'active'),
          eq(subscriptions.tier, 'pro')
        )
      )
    const proSubscriptions = proSubscriptionsResult[0]?.count || 0

    // Get free subscriptions count
    const freeSubscriptionsResult = await db
      .select({ count: count() })
      .from(subscriptions)
      .where(
        and(
          eq(subscriptions.status, 'active'),
          eq(subscriptions.tier, 'free')
        )
      )
    const freeSubscriptions = freeSubscriptionsResult[0]?.count || 0

    // Calculate MRR (Monthly Recurring Revenue)
    // Assuming each pro subscription is $10/month (this should come from a config)
    const PRO_SUBSCRIPTION_PRICE = 10
    const mrr = proSubscriptions * PRO_SUBSCRIPTION_PRICE

    // Calculate churn rate (for now, just return 0 - needs historical data)
    const churnRate = 0

    return {
      users: {
        total: totalUsers,
        newLast7Days: newUsersLast7Days,
        newLast30Days: newUsersLast30Days,
        active: activeUsers,
      },
      revenue: {
        mrr,
        proSubscriptions,
        freeSubscriptions,
        churnRate,
      },
      sites: {
        total: totalSites,
        verified: verifiedSites,
        pendingVerifications: unverifiedSites,
      },
    }
  } catch (error) {
    console.error('Error fetching dashboard stats:', error)
    throw createError({
      statusCode: 500,
      message: 'Failed to fetch dashboard statistics',
    })
  }
})
