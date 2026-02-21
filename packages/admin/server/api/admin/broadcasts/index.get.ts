import { eq, like, or, desc, count, and } from 'drizzle-orm'
import { useAdminDb, broadcasts } from '~~/server/utils/admin-db'

/**
 * GET /api/admin/broadcasts
 * Returns paginated list of broadcasts with filtering and search
 *
 * Query params:
 * - page: number (default: 1)
 * - limit: number (default: 20)
 * - search: string (search in title, body)
 * - type: 'announcement' | 'feature' | 'promotion' | 'beta'
 * - status: 'draft' | 'published' | 'archived'
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
    const query = getQuery(event)
    const page = Math.max(1, Number(query.page) || 1)
    const limit = Math.min(100, Math.max(1, Number(query.limit) || 20))
    const search = query.search as string | undefined
    const typeFilter = query.type as string | undefined
    const statusFilter = query.status as string | undefined
    const offset = (page - 1) * limit

    const conditions: any[] = []

    if (search) {
      const searchPattern = `%${search}%`
      conditions.push(
        or(
          like(broadcasts.title, searchPattern),
          like(broadcasts.body, searchPattern)
        )
      )
    }

    if (typeFilter && ['announcement', 'feature', 'promotion', 'beta'].includes(typeFilter)) {
      conditions.push(eq(broadcasts.type, typeFilter))
    }

    if (statusFilter && ['draft', 'published', 'archived'].includes(statusFilter)) {
      conditions.push(eq(broadcasts.status, statusFilter))
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined

    const countResult = await db
      .select({ count: count() })
      .from(broadcasts)
      .where(whereClause)

    const total = countResult[0]?.count || 0
    const totalPages = Math.ceil(total / limit)

    const broadcastsList = await db
      .select()
      .from(broadcasts)
      .where(whereClause)
      .orderBy(desc(broadcasts.priority), desc(broadcasts.createdAt))
      .limit(limit)
      .offset(offset)

    return {
      data: broadcastsList,
      pagination: {
        page,
        limit,
        total,
        totalPages,
      },
    }
  } catch (error) {
    console.error('Error fetching broadcasts:', error)
    throw createError({
      statusCode: 500,
      message: 'Failed to fetch broadcasts',
    })
  }
})
