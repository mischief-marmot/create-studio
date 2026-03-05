/**
 * DELETE /api/admin/releases/drafts/:id
 * Delete a release email draft.
 */

import { eq } from 'drizzle-orm'
import { useAdminOpsDb, releaseEmails } from '~~/server/utils/admin-ops-db'

export default defineEventHandler(async (event) => {
  const session = await getUserSession(event)
  if (!session?.user) {
    throw createError({ statusCode: 401, message: 'Unauthorized' })
  }

  const id = Number(getRouterParam(event, 'id'))
  if (!id) {
    throw createError({ statusCode: 400, message: 'Invalid draft ID' })
  }

  const db = useAdminOpsDb(event)

  const [existing] = await db
    .select()
    .from(releaseEmails)
    .where(eq(releaseEmails.id, id))
    .limit(1)

  if (!existing) {
    throw createError({ statusCode: 404, message: 'Draft not found' })
  }

  await db
    .delete(releaseEmails)
    .where(eq(releaseEmails.id, id))

  return { success: true }
})
