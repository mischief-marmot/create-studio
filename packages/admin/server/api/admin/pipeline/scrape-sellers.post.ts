/**
 * POST /api/admin/pipeline/scrape-sellers
 *
 * Fetches sellers.json from all ad networks, extracts publisher domains,
 * deduplicates, and upserts into the Publishers table.
 * Creates a ScrapeJob record to track progress.
 */
import { eq } from 'drizzle-orm'
import { useAdminOpsDb, adNetworks, publishers, scrapeJobs, getAuditEnvironment } from '~~/server/utils/admin-ops-db'

export default defineEventHandler(async (event) => {
  const session = await getUserSession(event)
  if (!session?.user) {
    throw createError({ statusCode: 401, message: 'Unauthorized' })
  }

  const db = useAdminOpsDb(event)
  const now = new Date().toISOString()

  // Load ad networks from the database
  const networks = await db.select().from(adNetworks)
  if (networks.length === 0) {
    throw createError({ statusCode: 400, message: 'No ad networks configured. Run seed data first.' })
  }

  // Create a ScrapeJob to track this run
  const [job] = await db.insert(scrapeJobs).values({
    type: 'sellers_json',
    status: 'running',
    startedAt: now,
    startedBy: (session.user as any).id,
    createdAt: now,
    updatedAt: now,
  }).returning()

  if (!job) {
    throw createError({ statusCode: 500, message: 'Failed to create scrape job' })
  }

  try {
    // Fetch and merge all sellers.json files
    const { publishers: parsed, results: networkResults } = await fetchAllSellersJson(
      networks.map((n) => ({ slug: n.slug, sellersJsonUrl: n.sellersJsonUrl }))
    )

    // Update ad network publisher counts
    for (const result of networkResults) {
      if (!result.error) {
        await db.update(adNetworks)
          .set({ publisherCount: result.count, lastFetchedAt: now, updatedAt: now })
          .where(eq(adNetworks.slug, result.slug))
      }
    }

    // Batch upsert publishers
    let insertedCount = 0
    let updatedCount = 0
    const batchSize = 100

    for (let i = 0; i < parsed.length; i += batchSize) {
      const batch = parsed.slice(i, i + batchSize)

      for (const pub of batch) {
        const [existing] = await db.select({ id: publishers.id, adNetworks: publishers.adNetworks })
          .from(publishers)
          .where(eq(publishers.domain, pub.domain))
          .limit(1)

        if (existing) {
          // Merge ad networks
          const existingNetworks: string[] = (existing.adNetworks as string[]) || []
          const mergedNetworks = Array.from(new Set([...existingNetworks, ...pub.adNetworks]))

          await db.update(publishers)
            .set({
              adNetworks: mergedNetworks,
              siteName: pub.siteName || undefined,
              updatedAt: now,
            })
            .where(eq(publishers.id, existing.id))
          updatedCount++
        } else {
          await db.insert(publishers).values({
            domain: pub.domain,
            siteName: pub.siteName,
            adNetworks: pub.adNetworks,
            scrapeStatus: 'pending',
            createdAt: now,
            updatedAt: now,
          })
          insertedCount++
        }
      }

      // Update job progress
      await db.update(scrapeJobs)
        .set({
          completedCount: Math.min(i + batchSize, parsed.length),
          totalCount: parsed.length,
          updatedAt: now,
        })
        .where(eq(scrapeJobs.id, job.id))
    }

    // Mark job complete
    const errors = networkResults.filter((r) => r.error)
    await db.update(scrapeJobs)
      .set({
        status: 'completed',
        totalCount: parsed.length,
        completedCount: parsed.length,
        failedCount: errors.length,
        completedAt: new Date().toISOString(),
        errorLog: errors.length > 0 ? errors.map((e) => ({
          domain: e.slug,
          error: e.error || 'Unknown error',
          timestamp: now,
        })) : null,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(scrapeJobs.id, job.id))

    return {
      success: true,
      jobId: job.id,
      totalPublishers: parsed.length,
      inserted: insertedCount,
      updated: updatedCount,
      networks: networkResults,
    }
  } catch (err: any) {
    // Mark job as failed
    await db.update(scrapeJobs)
      .set({
        status: 'failed',
        errorLog: [{ error: err.message || String(err), timestamp: now }],
        completedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })
      .where(eq(scrapeJobs.id, job.id))

    throw createError({ statusCode: 500, message: `Sellers.json scrape failed: ${err.message}` })
  }
})
