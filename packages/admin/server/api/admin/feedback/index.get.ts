import { eq, like, or, desc, count, and } from 'drizzle-orm'
import { feedbackReports, sites } from '~~/server/utils/admin-db'

/**
 * GET /api/admin/feedback
 * Returns paginated list of feedback reports with filtering and search.
 * Excludes screenshot_base64 from list response for performance.
 *
 * Query params:
 * - page: number (default: 1)
 * - limit: number (default: 20)
 * - search: string (search in error_message, user_message)
 * - status: 'new' | 'acknowledged' | 'resolved'
 * - site_id: number
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
    const statusFilter = query.status as string | undefined
    const siteIdFilter = query.site_id ? Number(query.site_id) : undefined
    const offset = (page - 1) * limit

    const conditions: any[] = []

    if (search) {
      const searchPattern = `%${search}%`
      conditions.push(
        or(
          like(feedbackReports.error_message, searchPattern),
          like(feedbackReports.user_message, searchPattern)
        )
      )
    }

    if (statusFilter && ['new', 'acknowledged', 'resolved'].includes(statusFilter)) {
      conditions.push(eq(feedbackReports.status, statusFilter))
    }

    if (siteIdFilter) {
      conditions.push(eq(feedbackReports.site_id, siteIdFilter))
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined

    const countResult = await db
      .select({ count: count() })
      .from(feedbackReports)
      .where(whereClause)

    const total = countResult[0]?.count || 0
    const totalPages = Math.ceil(total / limit)

    const reports = await db
      .select({
        id: feedbackReports.id,
        site_id: feedbackReports.site_id,
        error_message: feedbackReports.error_message,
        create_version: feedbackReports.create_version,
        wp_version: feedbackReports.wp_version,
        php_version: feedbackReports.php_version,
        current_url: feedbackReports.current_url,
        user_message: feedbackReports.user_message,
        status: feedbackReports.status,
        admin_notes: feedbackReports.admin_notes,
        createdAt: feedbackReports.createdAt,
        updatedAt: feedbackReports.updatedAt,
        site_name: sites.name,
        site_url: sites.url,
      })
      .from(feedbackReports)
      .leftJoin(sites, eq(feedbackReports.site_id, sites.id))
      .where(whereClause)
      .orderBy(desc(feedbackReports.createdAt))
      .limit(limit)
      .offset(offset)

    return {
      data: reports,
      pagination: {
        page,
        limit,
        total,
        totalPages,
      },
    }
  } catch (error) {
    console.error('Error fetching feedback reports:', error)
    throw createError({
      statusCode: 500,
      message: 'Failed to fetch feedback reports',
    })
  }
})
