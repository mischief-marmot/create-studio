/**
 * POST /api/admin/pipeline/enrich-publishers
 *
 * Enriches WordPress publishers with publishing history, categories,
 * and top content from their REST API.
 *
 * Only processes publishers with scrape_status = 'plugins_scraped'
 * (i.e., confirmed WordPress sites).
 *
 * Query params:
 *   limit: number of publishers to enrich (default 100, max 500)
 *   concurrency: parallel requests (default 3, max 10)
 */
import { eq } from 'drizzle-orm'
import { useAdminOpsDb, publishers, scrapeJobs } from '~~/server/utils/admin-ops-db'

export default defineEventHandler(async (event) => {
  const session = await getUserSession(event)
  if (!session?.user) {
    throw createError({ statusCode: 401, message: 'Unauthorized' })
  }

  const query = getQuery(event)
  const limit = Math.min(500, Math.max(1, Number(query.limit) || 100))
  const concurrency = Math.min(10, Math.max(1, Number(query.concurrency) || 3))

  const db = useAdminOpsDb(event)
  const now = new Date().toISOString()

  // Get WordPress publishers that need enrichment
  const pending = await db.select({ id: publishers.id, domain: publishers.domain })
    .from(publishers)
    .where(eq(publishers.scrapeStatus, 'plugins_scraped'))
    .limit(limit)

  if (pending.length === 0) {
    return { success: true, message: 'No publishers to enrich', enriched: 0 }
  }

  // Create a ScrapeJob
  const [job] = await db.insert(scrapeJobs).values({
    type: 'enrichment',
    status: 'running',
    totalCount: pending.length,
    startedAt: now,
    startedBy: (session.user as any).id,
    createdAt: now,
    updatedAt: now,
  }).returning()

  if (!job) {
    throw createError({ statusCode: 500, message: 'Failed to create enrichment job' })
  }

  const domains = pending.map((p) => p.domain)
  const domainToId = new Map(pending.map((p) => [p.domain, p.id]))

  let enrichedCount = 0
  let failedCount = 0
  const errors: Array<{ domain: string; error: string; timestamp: string }> = []
  const categoryCounts: Record<string, number> = {}

  // Enrich in batches
  const results = await enrichBatch(domains, concurrency, async (completed, total) => {
    if (completed % 10 === 0 || completed === total) {
      await db.update(scrapeJobs)
        .set({ completedCount: completed, updatedAt: new Date().toISOString() })
        .where(eq(scrapeJobs.id, job.id))
    }
  })

  // Process results
  for (const result of results) {
    const publisherId = domainToId.get(result.domain)
    if (!publisherId) continue

    if (result.error) {
      failedCount++
      errors.push({ domain: result.domain, error: result.error, timestamp: now })

      // Don't change status on error — leave as plugins_scraped for retry
      await db.update(publishers)
        .set({
          scrapeError: result.error,
          lastScrapedAt: now,
          updatedAt: now,
        })
        .where(eq(publishers.id, publisherId))
      continue
    }

    enrichedCount++

    if (result.siteCategory) {
      categoryCounts[result.siteCategory] = (categoryCounts[result.siteCategory] || 0) + 1
    }

    await db.update(publishers)
      .set({
        postCount: result.postCount,
        oldestPostDate: result.oldestPostDate,
        newestPostDate: result.newestPostDate,
        siteCategory: result.siteCategory,
        topContent: result.topContent,
        scrapeStatus: 'enriched',
        scrapeError: null,
        lastScrapedAt: now,
        updatedAt: now,
      })
      .where(eq(publishers.id, publisherId))
  }

  // Mark job complete
  await db.update(scrapeJobs)
    .set({
      status: 'completed',
      completedCount: enrichedCount,
      failedCount,
      completedAt: new Date().toISOString(),
      errorLog: errors.length > 0 ? errors : null,
      updatedAt: new Date().toISOString(),
    })
    .where(eq(scrapeJobs.id, job.id))

  return {
    success: true,
    jobId: job.id,
    enriched: enrichedCount,
    failed: failedCount,
    categories: categoryCounts,
  }
})
