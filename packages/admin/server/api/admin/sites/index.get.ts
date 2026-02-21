import { eq, like, or, sql, desc, count, isNotNull } from 'drizzle-orm'
import { useAdminDb, users, sites, subscriptions, siteUsers } from "~~/server/utils/admin-db"

/**
 * GET /api/admin/sites
 * Returns paginated list of sites with filtering and search
 *
 * Query params:
 * - page: number (default: 1)
 * - limit: number (default: 20)
 * - search: string (search in site name, URL)
 * - filter: 'verified' | 'has_subscription' (filter by site status)
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
    const filter = query.filter as string | undefined
    const offset = (page - 1) * limit

    // Build base query for sites with owner info
    let sitesQuery = db
      .select({
        id: sites.id,
        name: sites.name,
        url: sites.url,
        user_id: sites.user_id,
        createdAt: sites.createdAt,
        updatedAt: sites.updatedAt,
        ownerEmail: users.email,
        ownerFirstname: users.firstname,
        ownerLastname: users.lastname,
      })
      .from(sites)
      .innerJoin(users, eq(sites.user_id, users.id))

    // Apply search filter
    if (search) {
      const searchPattern = `%${search}%`
      sitesQuery = sitesQuery.where(
        or(
          like(sites.name, searchPattern),
          like(sites.url, searchPattern)
        )
      ) as any
    }

    // Build where condition for count query
    let whereCondition = undefined
    if (search) {
      whereCondition = or(
        like(sites.name, `%${search}%`),
        like(sites.url, `%${search}%`)
      )
    }

    // Get total count for pagination
    const countResult = await db
      .select({ count: count() })
      .from(sites)
      .where(whereCondition)

    const total = countResult[0]?.count || 0
    const totalPages = Math.ceil(total / limit)

    // Get paginated sites
    const sitesList = await sitesQuery
      .orderBy(desc(sites.createdAt))
      .limit(limit)
      .offset(offset)

    // For each site, get users count, subscription info, and verified status
    const sitesWithDetails = await Promise.all(
      sitesList.map(async (site) => {
        // Get users count for this site (from SiteUsers pivot table)
        const usersCountResult = await db
          .select({ count: count() })
          .from(siteUsers)
          .where(eq(siteUsers.site_id, site.id))
        const usersCount = usersCountResult[0]?.count || 0

        // Check if site is verified (at least one verified user in SiteUsers)
        const verifiedResult = await db
          .select({ verified_at: siteUsers.verified_at })
          .from(siteUsers)
          .where(eq(siteUsers.site_id, site.id))
          .where(isNotNull(siteUsers.verified_at))
          .limit(1)
        const isVerified = verifiedResult.length > 0

        // Get subscription info for this site
        const subscriptionResult = await db
          .select({
            id: subscriptions.id,
            status: subscriptions.status,
            tier: subscriptions.tier,
          })
          .from(subscriptions)
          .where(eq(subscriptions.site_id, site.id))
          .limit(1)

        const subscription = subscriptionResult[0] || null
        const hasSubscription = subscription !== null && subscription.tier !== 'free'

        return {
          id: site.id,
          name: site.name || 'Unnamed Site',
          url: site.url || '',
          owner: {
            id: site.user_id,
            email: site.ownerEmail,
            firstname: site.ownerFirstname,
            lastname: site.ownerLastname,
          },
          usersCount,
          subscription: subscription ? {
            tier: subscription.tier,
            status: subscription.status,
          } : null,
          isVerified,
          createdAt: site.createdAt,
        }
      })
    )

    // Apply filters after fetching (since they require additional queries)
    let filteredSites = sitesWithDetails

    if (filter === 'verified') {
      filteredSites = sitesWithDetails.filter(s => s.isVerified)
    } else if (filter === 'has_subscription') {
      filteredSites = sitesWithDetails.filter(s => s.subscription !== null && s.subscription.tier !== 'free')
    }

    return {
      data: filteredSites,
      pagination: {
        page,
        limit,
        total,
        totalPages,
      },
    }
  } catch (error) {
    console.error('Error fetching sites:', error)
    throw createError({
      statusCode: 500,
      message: 'Failed to fetch sites',
    })
  }
})
