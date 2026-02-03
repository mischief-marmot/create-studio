import { eq, like, or, sql, desc, count } from 'drizzle-orm'
import { users, sites, subscriptions, siteUsers } from "~~/server/utils/db"

/**
 * GET /api/admin/users
 * Returns paginated list of users with filtering and search
 *
 * Query params:
 * - page: number (default: 1)
 * - limit: number (default: 20)
 * - search: string (search in email, firstname, lastname)
 * - filter: 'verified' | 'has_sites' (filter by user status)
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

  try {
    // Get query parameters
    const query = getQuery(event)
    const page = Math.max(1, Number(query.page) || 1)
    const limit = Math.min(100, Math.max(1, Number(query.limit) || 20))
    const search = query.search as string | undefined
    const filter = query.filter as string | undefined
    const offset = (page - 1) * limit

    // Build base query for users with site counts
    let usersQuery = db
      .select({
        id: users.id,
        email: users.email,
        firstname: users.firstname,
        lastname: users.lastname,
        validEmail: users.validEmail,
        mediavine_publisher: users.mediavine_publisher,
        createdAt: users.createdAt,
        updatedAt: users.updatedAt,
      })
      .from(users)

    // Apply search filter
    if (search) {
      const searchPattern = `%${search}%`
      usersQuery = usersQuery.where(
        or(
          like(users.email, searchPattern),
          like(users.firstname, searchPattern),
          like(users.lastname, searchPattern)
        )
      ) as any
    }

    // Apply status filters
    if (filter === 'verified') {
      usersQuery = usersQuery.where(eq(users.validEmail, true)) as any
    }

    // Get total count for pagination
    const countResult = await db
      .select({ count: count() })
      .from(users)
      .where((search || filter === 'verified') ?
        (search && filter === 'verified' ?
          sql`${or(
            like(users.email, `%${search}%`),
            like(users.firstname, `%${search}%`),
            like(users.lastname, `%${search}%`)
          )} AND ${eq(users.validEmail, true)}` :
          search ?
            or(
              like(users.email, `%${search}%`),
              like(users.firstname, `%${search}%`),
              like(users.lastname, `%${search}%`)
            ) :
            eq(users.validEmail, true)
        ) : undefined
      )

    const total = countResult[0]?.count || 0
    const totalPages = Math.ceil(total / limit)

    // Get paginated users
    const usersList = await usersQuery
      .orderBy(desc(users.createdAt))
      .limit(limit)
      .offset(offset)

    // For each user, get sites count and subscription status
    const usersWithDetails = await Promise.all(
      usersList.map(async (user) => {
        // Get sites count for this user
        const sitesCountResult = await db
          .select({ count: count() })
          .from(sites)
          .where(eq(sites.user_id, user.id))
        const sitesCount = sitesCountResult[0]?.count || 0

        // Check if user has any active subscription
        const activeSubscriptionResult = await db
          .select({ id: subscriptions.id })
          .from(subscriptions)
          .innerJoin(sites, eq(subscriptions.site_id, sites.id))
          .where(eq(sites.user_id, user.id))
          .where(eq(subscriptions.status, 'active'))
          .limit(1)
        const hasActiveSubscription = activeSubscriptionResult.length > 0

        return {
          ...user,
          sitesCount,
          hasActiveSubscription,
        }
      })
    )

    // Apply has_sites filter after fetching (since it requires counting)
    let filteredUsers = usersWithDetails
    if (filter === 'has_sites') {
      filteredUsers = usersWithDetails.filter(u => u.sitesCount > 0)
    }

    return {
      data: filteredUsers,
      pagination: {
        page,
        limit,
        total,
        totalPages,
      },
    }
  } catch (error) {
    console.error('Error fetching users:', error)
    throw createError({
      statusCode: 500,
      message: 'Failed to fetch users',
    })
  }
})
