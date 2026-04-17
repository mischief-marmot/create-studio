/**
 * POST /api/v2/internal/message-queue-retry
 * Admin-only: requeue a dead/failed message for another attempt.
 *
 * Auth: X-Admin-Api-Key header
 * Body: { id: number }
 */

import { eq } from 'drizzle-orm'
import { requireAdminApiKey } from '~~/server/utils/admin-auth'

export default defineEventHandler(async (event) => {
  requireAdminApiKey(event)

  const body = await readBody(event)
  const id = Number(body.id)
  if (!id) {
    throw createError({ statusCode: 400, message: 'id is required' })
  }

  const updated = await db
    .update(schema.messageQueue)
    .set({
      status: 'pending',
      attempts: 0,
      last_error: null,
      next_attempt_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .where(eq(schema.messageQueue.id, id))
    .returning()
    .get()

  if (!updated) {
    throw createError({ statusCode: 404, message: 'Message not found' })
  }

  return { success: true, row: updated }
})
