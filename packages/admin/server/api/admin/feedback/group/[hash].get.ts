import { eq, desc, count, sql } from 'drizzle-orm'
import { useAdminDb, feedbackReports, sites } from '~~/server/utils/admin-db'

/**
 * GET /api/admin/feedback/group/:hash
 * Returns all reports for a specific error message group.
 * The hash is a base64url-encoded error_message.
 *
 * Query params:
 * - page: number (default: 1)
 * - limit: number (default: 50)
 */
export default defineEventHandler(async (event) => {
  const session = await getUserSession(event)
  if (!session?.user) {
    throw createError({ statusCode: 401, message: 'Unauthorized' })
  }

  const db = useAdminDb(event)
  const hash = getRouterParam(event, 'hash')

  if (!hash) {
    throw createError({ statusCode: 400, message: 'Missing error hash' })
  }

  // Decode the base64url hash back to the error message
  let errorMessage: string
  try {
    errorMessage = atob(hash.replace(/-/g, '+').replace(/_/g, '/'))
  } catch {
    throw createError({ statusCode: 400, message: 'Invalid error hash' })
  }

  try {
    const query = getQuery(event)
    const page = Math.max(1, Number(query.page) || 1)
    const limit = Math.min(100, Math.max(1, Number(query.limit) || 50))
    const offset = (page - 1) * limit

    const whereClause = eq(feedbackReports.error_message, errorMessage)

    // Count total
    const countResult = await db
      .select({ count: count() })
      .from(feedbackReports)
      .where(whereClause)

    const total = countResult[0]?.count || 0
    const totalPages = Math.ceil(total / limit)

    // Fetch all reports for this error
    const reports = await db
      .select({
        id: feedbackReports.id,
        site_id: feedbackReports.site_id,
        error_message: feedbackReports.error_message,
        stack_trace: feedbackReports.stack_trace,
        create_version: feedbackReports.create_version,
        wp_version: feedbackReports.wp_version,
        php_version: feedbackReports.php_version,
        current_url: feedbackReports.current_url,
        user_message: feedbackReports.user_message,
        user_email: feedbackReports.user_email,
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

    // Aggregate stats
    const stats = await db
      .select({
        total_count: count(),
        site_count: sql<number>`count(distinct ${feedbackReports.site_id})`,
        earliest_at: sql<string>`min(${feedbackReports.createdAt})`,
        latest_at: sql<string>`max(${feedbackReports.createdAt})`,
        new_count: sql<number>`sum(case when ${feedbackReports.status} = 'new' then 1 else 0 end)`,
        acknowledged_count: sql<number>`sum(case when ${feedbackReports.status} = 'acknowledged' then 1 else 0 end)`,
        resolved_count: sql<number>`sum(case when ${feedbackReports.status} = 'resolved' then 1 else 0 end)`,
      })
      .from(feedbackReports)
      .where(whereClause)

    // Version breakdown
    const versionBreakdown = await db
      .select({
        create_version: feedbackReports.create_version,
        wp_version: feedbackReports.wp_version,
        count: count(),
      })
      .from(feedbackReports)
      .where(whereClause)
      .groupBy(feedbackReports.create_version, feedbackReports.wp_version)
      .orderBy(desc(count()))

    // Affected sites
    const affectedSites = await db
      .select({
        site_id: feedbackReports.site_id,
        site_name: sites.name,
        site_url: sites.url,
        count: count(),
        has_new: sql<number>`sum(case when ${feedbackReports.status} = 'new' then 1 else 0 end)`,
      })
      .from(feedbackReports)
      .leftJoin(sites, eq(feedbackReports.site_id, sites.id))
      .where(whereClause)
      .groupBy(feedbackReports.site_id)
      .orderBy(desc(count()))

    return {
      error_message: errorMessage,
      hash,
      stats: stats[0],
      versionBreakdown,
      affectedSites,
      data: reports,
      pagination: { page, limit, total, totalPages },
    }
  } catch (error) {
    console.error('Error fetching grouped feedback:', error)
    throw createError({ statusCode: 500, message: 'Failed to fetch grouped feedback' })
  }
})
