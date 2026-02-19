import { eq } from 'drizzle-orm'
import { feedbackReports, sites } from '~~/server/utils/admin-db'

/**
 * GET /api/admin/feedback/:id
 * Returns a single feedback report with full details including screenshot.
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
  const id = Number(getRouterParam(event, 'id'))

  if (!id || isNaN(id)) {
    throw createError({
      statusCode: 400,
      message: 'Invalid feedback report ID',
    })
  }

  try {
    const result = await db
      .select({
        id: feedbackReports.id,
        site_id: feedbackReports.site_id,
        error_message: feedbackReports.error_message,
        stack_trace: feedbackReports.stack_trace,
        component_stack: feedbackReports.component_stack,
        create_version: feedbackReports.create_version,
        wp_version: feedbackReports.wp_version,
        php_version: feedbackReports.php_version,
        browser_info: feedbackReports.browser_info,
        current_url: feedbackReports.current_url,
        user_message: feedbackReports.user_message,
        screenshot_base64: feedbackReports.screenshot_base64,
        status: feedbackReports.status,
        admin_notes: feedbackReports.admin_notes,
        createdAt: feedbackReports.createdAt,
        updatedAt: feedbackReports.updatedAt,
        site_name: sites.name,
        site_url: sites.url,
      })
      .from(feedbackReports)
      .leftJoin(sites, eq(feedbackReports.site_id, sites.id))
      .where(eq(feedbackReports.id, id))
      .limit(1)

    if (result.length === 0) {
      throw createError({
        statusCode: 404,
        message: 'Feedback report not found',
      })
    }

    return result[0]
  } catch (error) {
    if (error && typeof error === 'object' && 'statusCode' in error) {
      throw error
    }

    console.error('Error fetching feedback report:', error)
    throw createError({
      statusCode: 500,
      message: 'Failed to fetch feedback report',
    })
  }
})
