/**
 * GET /api/admin/releases/drafts
 * List all release email drafts, newest first.
 */

import { desc } from 'drizzle-orm'
import { useAdminOpsDb, releaseEmails } from '~~/server/utils/admin-ops-db'

export default defineEventHandler(async (event) => {
  const session = await getUserSession(event)
  if (!session?.user) {
    throw createError({ statusCode: 401, message: 'Unauthorized' })
  }

  const db = useAdminOpsDb(event)

  const drafts = await db
    .select()
    .from(releaseEmails)
    .orderBy(desc(releaseEmails.updatedAt))
    .all()

  return {
    data: drafts.map(d => ({
      ...d,
      highlights: d.highlights ? JSON.parse(d.highlights) : [],
    })),
  }
})
