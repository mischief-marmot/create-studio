/**
 * GET /api/admin/pipeline/stats
 *
 * Summary statistics for the publisher intelligence pipeline.
 */
import { sql, eq } from 'drizzle-orm'
import { useAdminOpsDb, publishers, contacts, adNetworks, outreach } from '~~/server/utils/admin-ops-db'

export default defineEventHandler(async (event) => {
  const session = await getUserSession(event)
  if (!session?.user) {
    throw createError({ statusCode: 401, message: 'Unauthorized' })
  }

  const db = useAdminOpsDb(event)

  const [
    publisherCount,
    wpCount,
    contactCount,
    emailCount,
    outreachCount,
    statusCounts,
    networkData,
  ] = await Promise.all([
    db.select({ count: sql<number>`COUNT(*)` }).from(publishers),
    db.select({ count: sql<number>`COUNT(*)` }).from(publishers).where(eq(publishers.isWordpress, true)),
    db.select({ count: sql<number>`COUNT(*)` }).from(contacts),
    db.select({ count: sql<number>`COUNT(*)` }).from(contacts).where(sql`email IS NOT NULL AND email != ''`),
    db.select({ count: sql<number>`COUNT(*)` }).from(outreach),
    db.select({
      status: publishers.scrapeStatus,
      count: sql<number>`COUNT(*)`,
    }).from(publishers).groupBy(publishers.scrapeStatus),
    db.select({
      slug: adNetworks.slug,
      name: adNetworks.name,
      publisherCount: adNetworks.publisherCount,
      lastFetchedAt: adNetworks.lastFetchedAt,
    }).from(adNetworks),
  ])

  return {
    publishers: {
      total: publisherCount[0]?.count ?? 0,
      wordpress: wpCount[0]?.count ?? 0,
      byStatus: Object.fromEntries(statusCounts.map((s) => [s.status, s.count])),
    },
    contacts: {
      total: contactCount[0]?.count ?? 0,
      withEmail: emailCount[0]?.count ?? 0,
    },
    outreach: {
      total: outreachCount[0]?.count ?? 0,
    },
    networks: networkData,
  }
})
