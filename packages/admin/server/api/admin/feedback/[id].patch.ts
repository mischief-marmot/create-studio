import { eq } from 'drizzle-orm'
import { feedbackReports } from '~~/server/utils/admin-db'

const VALID_STATUSES = ['new', 'acknowledged', 'resolved']

/**
 * PATCH /api/admin/feedback/:id
 * Update status and admin notes on a feedback report.
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
    const existing = await db.select().from(feedbackReports).where(eq(feedbackReports.id, id)).limit(1)

    if (existing.length === 0) {
      throw createError({
        statusCode: 404,
        message: 'Feedback report not found',
      })
    }

    const body = await readBody(event)

    if (body.status && !VALID_STATUSES.includes(body.status)) {
      throw createError({
        statusCode: 400,
        message: `Invalid status. Must be one of: ${VALID_STATUSES.join(', ')}`,
      })
    }

    const updates: Record<string, any> = {}

    if (body.status !== undefined) {
      updates.status = body.status
    }

    if (body.admin_notes !== undefined) {
      updates.admin_notes = body.admin_notes
    }

    if (Object.keys(updates).length === 0) {
      return {
        success: true,
        message: 'No changes detected',
        report: existing[0],
      }
    }

    updates.updatedAt = new Date().toISOString()

    await db.update(feedbackReports).set(updates).where(eq(feedbackReports.id, id))

    const updated = await db.select().from(feedbackReports).where(eq(feedbackReports.id, id)).limit(1)

    return {
      success: true,
      message: 'Feedback report updated successfully',
      report: updated[0],
    }
  } catch (error) {
    if (error && typeof error === 'object' && 'statusCode' in error) {
      throw error
    }

    console.error('Error updating feedback report:', error)
    throw createError({
      statusCode: 500,
      message: 'Failed to update feedback report',
    })
  }
})
