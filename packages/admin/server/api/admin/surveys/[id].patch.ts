import { eq, and, ne } from 'drizzle-orm'
import { useAdminDb, surveys } from '~~/server/utils/admin-db'

/**
 * PATCH /api/admin/surveys/:id
 * Update survey fields (partial — any subset of fields).
 */
export default defineEventHandler(async (event) => {
  const session = await getUserSession(event)
  if (!session?.user) {
    throw createError({ statusCode: 401, message: 'Unauthorized' })
  }

  const id = Number(getRouterParam(event, 'id'))
  if (!id || isNaN(id)) {
    throw createError({ statusCode: 400, message: 'Valid survey ID is required' })
  }

  const body = await readBody(event)
  const updates: Record<string, any> = {}

  if (body.slug !== undefined) {
    if (typeof body.slug !== 'string' || !body.slug.trim()) {
      throw createError({ statusCode: 400, message: 'slug must be a non-empty string' })
    }
    updates.slug = body.slug
  }
  if (body.title !== undefined) {
    if (typeof body.title !== 'string' || !body.title.trim()) {
      throw createError({ statusCode: 400, message: 'title must be a non-empty string' })
    }
    updates.title = body.title
  }
  if (body.description !== undefined) {
    updates.description = body.description ?? null
  }
  if (body.status !== undefined) {
    if (!['draft', 'active', 'closed'].includes(body.status)) {
      throw createError({ statusCode: 400, message: 'status must be draft, active, or closed' })
    }
    updates.status = body.status
  }
  if (body.promotion !== undefined) {
    updates.promotion = body.promotion ?? null
  }
  if (body.requires_auth !== undefined) {
    updates.requires_auth = !!body.requires_auth
  }
  if (body.definition !== undefined) {
    if (!body.definition || typeof body.definition !== 'object' || Array.isArray(body.definition)) {
      throw createError({ statusCode: 400, message: 'definition must be a JSON object' })
    }
    if (!Array.isArray(body.definition.pages)) {
      throw createError({ statusCode: 400, message: 'definition must include a "pages" array' })
    }
    updates.definition = body.definition
  }

  const db = useAdminDb(event)

  const existing = await db.select().from(surveys).where(eq(surveys.id, id)).get()
  if (!existing) {
    throw createError({ statusCode: 404, message: 'Survey not found' })
  }

  // Check for slug conflict with a different survey
  if (updates.slug && updates.slug !== existing.slug) {
    const conflict = await db.select().from(surveys)
      .where(and(eq(surveys.slug, updates.slug), ne(surveys.id, id)))
      .get()
    if (conflict) {
      throw createError({ statusCode: 409, message: 'A survey with this slug already exists' })
    }
  }

  const now = new Date().toISOString()
  await db.update(surveys)
    .set({ ...updates, updatedAt: now })
    .where(eq(surveys.id, id))

  const updated = await db.select().from(surveys).where(eq(surveys.id, id)).get()
  return { survey: updated }
})
