/**
 * GET /api/admin/pipeline/outreach
 *
 * List outreach records with filtering and pagination.
 * Joins with publishers and contacts to return full context.
 *
 * Query params: page, limit, segment, stage, search
 */
import { eq, like, sql, and, or, desc } from 'drizzle-orm'
import { useAdminOpsDb, outreach, publishers, contacts } from '~~/server/utils/admin-ops-db'

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

  if (query.segment && typeof query.segment === 'string') {
    conditions.push(eq(outreach.segment, query.segment))
  }

  if (query.stage && typeof query.stage === 'string') {
    conditions.push(eq(outreach.stage, query.stage))
  }

  if (query.search && typeof query.search === 'string') {
    const term = `%${query.search}%`
    conditions.push(
      or(
        like(contacts.email, term),
        like(contacts.name, term),
        like(publishers.domain, term),
      ),
    )
  }

  const db = useAdminOpsDb(event)
  const whereClause = conditions.length > 0 ? and(...conditions) : undefined

  const [rows, countResult, segmentCountRows] = await Promise.all([
    // Main query with joins
    db.select({
      // Outreach fields
      id: outreach.id,
      contactType: outreach.contactType,
      publisherId: outreach.publisherId,
      userId: outreach.userId,
      segment: outreach.segment,
      status: outreach.status,
      stage: outreach.stage,
      rating: outreach.rating,
      notes: outreach.notes,
      lastContactedAt: outreach.lastContactedAt,
      createdAt: outreach.createdAt,
      updatedAt: outreach.updatedAt,
      // Publisher fields
      publisherDomain: publishers.domain,
      publisherSiteName: publishers.siteName,
      publisherSiteCategory: publishers.siteCategory,
      publisherIsWordpress: publishers.isWordpress,
      publisherStudioData: publishers.studioData,
      publisherAdNetworks: publishers.adNetworks,
      // Contact fields
      contactEmail: contacts.email,
      contactName: contacts.name,
      contactSource: contacts.source,
    })
      .from(outreach)
      .leftJoin(publishers, eq(outreach.publisherId, publishers.id))
      .leftJoin(contacts, eq(publishers.contactId, contacts.id))
      .where(whereClause)
      .orderBy(desc(outreach.createdAt))
      .limit(limit)
      .offset(offset),

    // Total count (with same filters)
    db.select({ total: sql<number>`COUNT(*)` })
      .from(outreach)
      .leftJoin(publishers, eq(outreach.publisherId, publishers.id))
      .leftJoin(contacts, eq(publishers.contactId, contacts.id))
      .where(whereClause),

    // Segment counts (unfiltered, for tab badges)
    db.select({
      segment: outreach.segment,
      count: sql<number>`COUNT(*)`,
    })
      .from(outreach)
      .groupBy(outreach.segment),
  ])

  const total = countResult[0]?.total ?? 0

  // Build segmentCounts map
  const segmentCounts: Record<string, number> = {}
  for (const row of segmentCountRows) {
    if (row.segment) {
      segmentCounts[row.segment] = row.count
    }
  }

  return {
    data: rows,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
    segmentCounts,
  }
})
