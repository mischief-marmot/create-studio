/**
 * PUT /api/admin/releases/drafts/:id
 * Update an existing release email draft.
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

  const body = await readBody(event)
  const { product, version, title, description, heroImageUrl, releaseUrl, highlights, status } = body

  const db = useAdminOpsDb(event)

  const [existing] = await db
    .select()
    .from(releaseEmails)
    .where(eq(releaseEmails.id, id))
    .limit(1)

  if (!existing) {
    throw createError({ statusCode: 404, message: 'Draft not found' })
  }

  const [updated] = await db
    .update(releaseEmails)
    .set({
      product: product ?? existing.product,
      version: version ?? existing.version,
      title: title ?? existing.title,
      description: description ?? existing.description,
      heroImageUrl: heroImageUrl !== undefined ? (heroImageUrl || null) : existing.heroImageUrl,
      releaseUrl: releaseUrl !== undefined ? (releaseUrl || null) : existing.releaseUrl,
      highlights: highlights !== undefined ? JSON.stringify(highlights) : existing.highlights,
      status: status ?? existing.status,
      updatedAt: new Date().toISOString(),
    })
    .where(eq(releaseEmails.id, id))
    .returning()

  return {
    success: true,
    draft: {
      ...updated,
      highlights: updated.highlights ? JSON.parse(updated.highlights) : [],
    },
  }
})
