/**
 * GET /api/v2/internal/message-queue
 * Admin-only endpoint for inspecting the message queue.
 *
 * Auth: X-Admin-Api-Key header (shared secret between admin and main app)
 *
 * Query params:
 *   status: 'pending' | 'processing' | 'failed' | 'dead' | 'completed' (optional)
 *   type:   message type filter (optional)
 *   siteId: number (optional)
 *   limit:  default 50, max 200
 */

import { and, eq, desc } from 'drizzle-orm'
import { requireAdminApiKey } from '~~/server/utils/admin-auth'

export default defineEventHandler(async (event) => {
  requireAdminApiKey(event)

  const query = getQuery(event)
  const status = query.status as string | undefined
  const type = query.type as string | undefined
  const siteId = query.siteId ? Number(query.siteId) : undefined
  const limit = Math.min(Number(query.limit) || 50, 200)

  const filters: any[] = []
  if (status) filters.push(eq(schema.messageQueue.status, status))
  if (type) filters.push(eq(schema.messageQueue.type, type))
  if (siteId) filters.push(eq(schema.messageQueue.site_id, siteId))

  const rows = await db
    .select()
    .from(schema.messageQueue)
    .where(filters.length ? and(...filters) : undefined)
    .orderBy(desc(schema.messageQueue.id))
    .limit(limit)
    .all()

  return { success: true, rows }
})
