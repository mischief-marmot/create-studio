/**
 * GET /api/admin/pipeline/plugin-stats
 *
 * Quick count of total, enriched, and unenriched plugins.
 */
import { sql, isNull, isNotNull } from 'drizzle-orm'
import { useAdminOpsDb, plugins } from '~~/server/utils/admin-ops-db'

export default defineEventHandler(async (event) => {
  const session = await getUserSession(event)
  if (!session?.user) {
    throw createError({ statusCode: 401, message: 'Unauthorized' })
  }

  const db = useAdminOpsDb(event)

  const [[{ total }], [{ enriched }], [{ unenriched }]] = await Promise.all([
    db.select({ total: sql<number>`COUNT(*)` }).from(plugins),
    db.select({ enriched: sql<number>`COUNT(*)` }).from(plugins).where(isNotNull(plugins.enrichedAt)),
    db.select({ unenriched: sql<number>`COUNT(*)` }).from(plugins).where(isNull(plugins.enrichedAt)),
  ])

  return {
    total: total ?? 0,
    enriched: enriched ?? 0,
    unenriched: unenriched ?? 0,
  }
})
