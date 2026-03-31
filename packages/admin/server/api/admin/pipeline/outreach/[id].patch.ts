/**
 * PATCH /api/admin/pipeline/outreach/:id
 *
 * Update an outreach record's stage, rating, or notes.
 * If stage transitions to a contact stage, also sets lastContactedAt.
 */
import { eq } from 'drizzle-orm'
import { useAdminOpsDb, outreach } from '~~/server/utils/admin-ops-db'

const CONTACT_STAGES = new Set(['contacted', 'responded', 'engaged'])

export default defineEventHandler(async (event) => {
  const session = await getUserSession(event)
  if (!session?.user) {
    throw createError({ statusCode: 401, message: 'Unauthorized' })
  }

  const id = Number(event.context.params?.id)
  if (!id || Number.isNaN(id)) {
    throw createError({ statusCode: 400, message: 'Invalid outreach ID' })
  }

  const body = await readBody(event)
  if (!body || (body.stage === undefined && body.rating === undefined && body.notes === undefined)) {
    throw createError({ statusCode: 400, message: 'No fields to update. Provide stage, rating, or notes.' })
  }

  const db = useAdminOpsDb(event)
  const now = new Date().toISOString()

  // Verify record exists
  const [existing] = await db.select({ id: outreach.id })
    .from(outreach)
    .where(eq(outreach.id, id))
    .limit(1)

  if (!existing) {
    throw createError({ statusCode: 404, message: 'Outreach record not found' })
  }

  // Build update payload
  const updateData: Record<string, any> = {
    updatedAt: now,
  }

  if (body.stage !== undefined) {
    updateData.stage = body.stage
    updateData.status = body.stage // status mirrors stage

    if (CONTACT_STAGES.has(body.stage)) {
      updateData.lastContactedAt = now
    }
  }

  if (body.rating !== undefined) {
    updateData.rating = body.rating
  }

  if (body.notes !== undefined) {
    updateData.notes = body.notes
  }

  const [updated] = await db.update(outreach)
    .set(updateData)
    .where(eq(outreach.id, id))
    .returning()

  return updated
})
