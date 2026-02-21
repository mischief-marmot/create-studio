import { eq, and, gte, isNotNull, count } from 'drizzle-orm'
import { useAdminDb, users, sites, subscriptions, siteUsers } from "~~/server/utils/admin-db"

/**
 * GET /api/admin/dashboard/stats
 * Returns dashboard metrics for admin portal
 */
export default defineEventHandler(async (event) => {
  const session = await getUserSession(event)
  if (!session?.user) {
    throw createError({
      statusCode: 401,
      message: 'Unauthorized',
    })
  }

  const db = useAdminDb(event)

  try {
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

    const unverifiedSites = totalSites - verifiedSites

    // Get active users (users with at least one site that has an active subscription)
    const activeUsersResult = await db
      .select({ count: count() })
      .from(users)
      .innerJoin(sites, eq(users.id, sites.user_id))
      .innerJoin(subscriptions, eq(sites.id, subscriptions.site_id))
      .where(eq(subscriptions.status, 'active'))
    const activeUsers = activeUsersResult[0]?.count || 0

    // Get paid pro subscriptions (active pro with Stripe billing)
    const paidProResult = await db
      .select({ count: count() })
      .from(subscriptions)
      .where(
        and(
          eq(subscriptions.status, 'active'),
          eq(subscriptions.tier, 'pro'),
          isNotNull(subscriptions.stripe_subscription_id)
        )
      )
    const paidProSubscriptions = paidProResult[0]?.count || 0

    // Get manual pro subscriptions (active pro without Stripe billing)
    const allProResult = await db
      .select({ count: count() })
      .from(subscriptions)
      .where(
        and(
          eq(subscriptions.status, 'active'),
          eq(subscriptions.tier, 'pro')
        )
      )
    const totalProSubscriptions = allProResult[0]?.count || 0
    const manualProSubscriptions = totalProSubscriptions - paidProSubscriptions

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

    // MRR: only count Stripe-billed pro subscriptions
    // Uses $10/month estimate — accurate MRR requires Stripe price data
    const PRO_MONTHLY_ESTIMATE = 10
    const mrr = paidProSubscriptions * PRO_MONTHLY_ESTIMATE

    return {
      users: {
        total: totalUsers,
        newLast7Days: newUsersLast7Days,
        newLast30Days: newUsersLast30Days,
        active: activeUsers,
      },
      revenue: {
        mrr,
        paidProSubscriptions,
        manualProSubscriptions,
        freeSubscriptions,
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
