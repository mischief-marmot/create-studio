/**
 * GET /api/admin/pipeline/publishers
 *
 * List publishers with filtering and pagination.
 * Query params: page, limit, status, category, network, search, wordpress
 */
import { eq, like, sql, and, desc } from 'drizzle-orm'
import { useAdminOpsDb, publishers, contacts } from '~~/server/utils/admin-ops-db'

export default defineEventHandler(async (event) => {
  const session = await getUserSession(event)
  if (!session?.user) {
    throw createError({ statusCode: 401, message: 'Unauthorized' })
  }

  const query = getQuery(event)
  const page = Math.max(1, Number(query.page) || 1)
  const limit = Math.min(100, Math.max(1, Number(query.limit) || 50))
  const offset = (page - 1) * limit

  const conditions = []

  if (query.status && typeof query.status === 'string') {
    conditions.push(eq(publishers.scrapeStatus, query.status))
  }

  if (query.category && typeof query.category === 'string') {
    conditions.push(eq(publishers.siteCategory, query.category))
  }

  if (query.search && typeof query.search === 'string') {
    conditions.push(like(publishers.domain, `%${query.search}%`))
  }

  if (query.wordpress === 'true') {
    conditions.push(eq(publishers.isWordpress, true))
  }

  if (query.network && typeof query.network === 'string') {
    conditions.push(like(publishers.adNetworks, `%"${query.network}"%`))
  }

  const db = useAdminOpsDb(event)
  const whereClause = conditions.length > 0 ? and(...conditions) : undefined

  const [rows, countResult] = await Promise.all([
    db.select({
      publisher: publishers,
      contactEmail: contacts.email,
      contactName: contacts.name,
      contactSource: contacts.source,
    })
      .from(publishers)
      .leftJoin(contacts, eq(publishers.contactId, contacts.id))
      .where(whereClause)
      .orderBy(desc(publishers.createdAt))
      .limit(limit)
      .offset(offset),
    db.select({ total: sql<number>`COUNT(*)` })
      .from(publishers)
      .where(whereClause),
  ])

  const total = countResult[0]?.total ?? 0

  // Flatten the join result
  const data = rows.map((row) => ({
    ...row.publisher,
    contactEmail: row.contactEmail,
    contactName: row.contactName,
    contactSource: row.contactSource,
  }))

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
