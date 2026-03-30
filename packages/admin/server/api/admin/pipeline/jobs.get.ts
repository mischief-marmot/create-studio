/**
 * GET /api/admin/pipeline/jobs
 *
 * List scrape jobs with pagination. Most recent first.
 * Query params: page, limit, type, status
 */
import { eq, and, desc, sql } from 'drizzle-orm'
import { useAdminOpsDb, scrapeJobs } from '~~/server/utils/admin-ops-db'

export default defineEventHandler(async (event) => {
  const session = await getUserSession(event)
  if (!session?.user) {
    throw createError({ statusCode: 401, message: 'Unauthorized' })
  }

  const query = getQuery(event)
  const page = Math.max(1, Number(query.page) || 1)
  const limit = Math.min(50, Math.max(1, Number(query.limit) || 20))
  const offset = (page - 1) * limit

  const conditions = []

  if (query.type && typeof query.type === 'string') {
    conditions.push(eq(scrapeJobs.type, query.type))
  }

  if (query.status && typeof query.status === 'string') {
    conditions.push(eq(scrapeJobs.status, query.status))
  }

  const db = useAdminOpsDb(event)
  const whereClause = conditions.length > 0 ? and(...conditions) : undefined

  const [data, countResult] = await Promise.all([
    db.select()
      .from(scrapeJobs)
      .where(whereClause)
      .orderBy(desc(scrapeJobs.createdAt))
      .limit(limit)
      .offset(offset),
    db.select({ total: sql<number>`COUNT(*)` })
      .from(scrapeJobs)
      .where(whereClause),
  ])

  const total = countResult[0]?.total ?? 0

  return {
    data,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  }
})
