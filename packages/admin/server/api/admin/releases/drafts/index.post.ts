/**
 * POST /api/admin/releases/drafts
 * Create a new release email draft.
 */

import { useAdminOpsDb, releaseEmails } from '~~/server/utils/admin-ops-db'

export default defineEventHandler(async (event) => {
  const session = await getUserSession(event)
  if (!session?.user) {
    throw createError({ statusCode: 401, message: 'Unauthorized' })
  }

  const body = await readBody(event)
  const { product, version, title, description, heroImageUrl, releaseUrl, highlights } = body

  if (!product || !version || !title || !description) {
    throw createError({ statusCode: 400, message: 'product, version, title, and description are required' })
  }

  const db = useAdminOpsDb(event)
  const now = new Date().toISOString()

  const [draft] = await db
    .insert(releaseEmails)
    .values({
      product,
      version,
      title,
      description,
      heroImageUrl: heroImageUrl || null,
      releaseUrl: releaseUrl || null,
      highlights: highlights ? JSON.stringify(highlights) : null,
      status: 'draft',
      createdAt: now,
      updatedAt: now,
    })
    .returning()

  return {
    success: true,
    draft: {
      ...draft,
      highlights: draft.highlights ? JSON.parse(draft.highlights) : [],
    },
  }
})
