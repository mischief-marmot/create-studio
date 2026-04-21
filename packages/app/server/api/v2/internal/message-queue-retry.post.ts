/**
 * POST /api/v2/internal/message-queue-retry
 * Admin-only: requeue a dead/failed message for another attempt.
 *
 * Auth: X-Admin-Api-Key header
 * Body: { id: number }
 */

import { and, eq, inArray } from 'drizzle-orm'
import { requireAdminApiKey } from '~~/server/utils/admin-auth'

export default defineEventHandler(async (event) => {
  requireAdminApiKey(event)

  const body = await readBody(event)
  const id = Number(body.id)
  if (!id) {
    throw createError({ statusCode: 400, message: 'id is required' })
  }

  const existing = await db
    .select()
    .from(schema.messageQueue)
    .where(eq(schema.messageQueue.id, id))
    .get()

  if (!existing) {
    throw createError({ statusCode: 404, message: 'Message not found' })
  }

  if (!['dead', 'failed'].includes(existing.status)) {
    throw createError({
      statusCode: 409,
      message: `Only dead or failed messages can be retried (current status: ${existing.status})`,
    })
  }

  const now = new Date().toISOString()
  const updated = await db
    .update(schema.messageQueue)
    .set({
      status: 'pending',
      attempts: 0,
      last_error: null,
      next_attempt_at: now,
      updated_at: now,
    })
    .where(
      and(
        eq(schema.messageQueue.id, id),
        inArray(schema.messageQueue.status, ['dead', 'failed']),
      ),
    )
    .returning()
    .get()

  return { success: true, row: updated }
})
