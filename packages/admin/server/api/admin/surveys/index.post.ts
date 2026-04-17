import { eq } from 'drizzle-orm'
import { useAdminDb, surveys } from '~~/server/utils/admin-db'

/**
 * POST /api/admin/surveys
 * Create a new survey.
 */
export default defineEventHandler(async (event) => {
  const session = await getUserSession(event)
  if (!session?.user) {
    throw createError({ statusCode: 401, message: 'Unauthorized' })
  }

  const body = await readBody(event)

  if (!body?.slug || typeof body.slug !== 'string') {
    throw createError({ statusCode: 400, message: 'slug is required' })
  }
  if (!body?.title || typeof body.title !== 'string') {
    throw createError({ statusCode: 400, message: 'title is required' })
  }
  if (!body?.definition || typeof body.definition !== 'object' || Array.isArray(body.definition)) {
    throw createError({ statusCode: 400, message: 'definition must be a JSON object' })
  }
  if (!Array.isArray(body.definition.pages)) {
    throw createError({ statusCode: 400, message: 'definition must include a "pages" array' })
  }

  const db = useAdminDb(event)

  const existing = await db.select().from(surveys).where(eq(surveys.slug, body.slug)).get()
  if (existing) {
    throw createError({ statusCode: 409, message: 'A survey with this slug already exists' })
  }

  const now = new Date().toISOString()
  const created = await db.insert(surveys).values({
    slug: body.slug,
    title: body.title,
    description: body.description ?? null,
    definition: body.definition,
    status: body.status || 'draft',
    promotion: body.promotion ?? null,
    requires_auth: !!body.requires_auth,
    createdAt: now,
    updatedAt: now,
  }).returning().get()

  setResponseStatus(event, 201)
  return { data: created }
})
