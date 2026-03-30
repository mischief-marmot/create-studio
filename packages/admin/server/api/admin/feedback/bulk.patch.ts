import { inArray } from 'drizzle-orm'
import { useAdminDb, feedbackReports } from '~~/server/utils/admin-db'

const VALID_STATUSES = ['new', 'acknowledged', 'resolved']

/**
 * PATCH /api/admin/feedback/bulk
 * Bulk update status on multiple feedback reports.
 *
 * Body:
 * - ids: number[] (required)
 * - status: 'new' | 'acknowledged' | 'resolved' (required)
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
  const body = await readBody(event)

  const { ids, status } = body || {}

  if (!Array.isArray(ids) || ids.length === 0) {
    throw createError({
      statusCode: 400,
      message: 'ids must be a non-empty array',
    })
  }

  if (!status || !VALID_STATUSES.includes(status)) {
    throw createError({
      statusCode: 400,
      message: `Invalid status. Must be one of: ${VALID_STATUSES.join(', ')}`,
    })
  }

  try {
    const numericIds = ids.map(Number).filter((id: number) => !isNaN(id))

    await db
      .update(feedbackReports)
      .set({
        status,
        updatedAt: new Date().toISOString(),
      })
      .where(inArray(feedbackReports.id, numericIds))

    return {
      success: true,
      message: `Updated ${numericIds.length} report(s) to "${status}"`,
      count: numericIds.length,
    }
  } catch (error) {
    console.error('Error bulk updating feedback reports:', error)
    throw createError({
      statusCode: 500,
      message: 'Failed to bulk update feedback reports',
    })
  }
})
