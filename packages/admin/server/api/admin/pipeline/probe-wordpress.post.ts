/**
 * POST /api/admin/pipeline/probe-wordpress
 *
 * Probes pending publishers' /wp-json/ endpoints to detect WordPress
 * and discover installed plugins via REST API namespaces.
 *
 * Query params:
 *   limit: number of publishers to probe (default 500, max 2000)
 *   concurrency: parallel requests (default 15, max 30)
 */
import { eq, sql } from 'drizzle-orm'
import { useAdminOpsDb, publishers, plugins, publisherPlugins, scrapeJobs } from '~~/server/utils/admin-ops-db'

export default defineEventHandler(async (event) => {
  const session = await getUserSession(event)
  if (!session?.user) {
    throw createError({ statusCode: 401, message: 'Unauthorized' })
  }

  const query = getQuery(event)
  const limit = Math.min(2000, Math.max(1, Number(query.limit) || 500))
  const concurrency = Math.min(30, Math.max(1, Number(query.concurrency) || 15))

  const db = useAdminOpsDb(event)
  const now = new Date().toISOString()

  // Get pending publishers
  const pending = await db.select({ id: publishers.id, domain: publishers.domain })
    .from(publishers)
    .where(eq(publishers.scrapeStatus, 'pending'))
    .limit(limit)

  if (pending.length === 0) {
    return { success: true, message: 'No pending publishers to probe', probed: 0 }
  }

  // Create a ScrapeJob
  const [job] = await db.insert(scrapeJobs).values({
    type: 'plugin_probe',
    status: 'running',
    totalCount: pending.length,
    startedAt: now,
    startedBy: (session.user as any).id,
    createdAt: now,
    updatedAt: now,
  }).returning()

  if (!job) {
    throw createError({ statusCode: 500, message: 'Failed to create probe job' })
  }

  // Dispatch batch processing in the background
  runInBackground(event, async () => {
    const db = useAdminOpsDb(event)

    // Load known plugins into a map for fast lookup
    const knownPlugins = await db.select().from(plugins)
    const pluginMap = new Map(knownPlugins.map((p) => [p.namespace, p]))

    const domains = pending.map((p) => p.domain)
    const domainToId = new Map(pending.map((p) => [p.domain, p.id]))

    let completedCount = 0
    let failedCount = 0
    let wordpressCount = 0
    const errors: Array<{ domain: string; error: string; timestamp: string }> = []

    // Probe in batches with concurrency
    const results = await probeBatch(domains, concurrency, async (completed, total) => {
      // Update job progress periodically
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

        await db.update(publishers)
          .set({
            scrapeStatus: 'failed',
            scrapeError: result.error,
            lastScrapedAt: now,
            updatedAt: now,
          })
          .where(eq(publishers.id, publisherId))
        continue
      }

      completedCount++

      if (result.isWordpress) {
        wordpressCount++
      }

      // Update publisher record
      await db.update(publishers)
        .set({
          isWordpress: result.isWordpress,
          restApiAvailable: result.restApiAvailable,
          siteName: result.siteName || undefined,
          scrapeStatus: 'plugins_scraped',
          scrapeError: null,
          lastScrapedAt: now,
          updatedAt: now,
        })
        .where(eq(publishers.id, publisherId))

      // Process discovered namespaces → create plugins + junction rows
      for (const namespace of result.namespaces) {
        let plugin = pluginMap.get(namespace)

        // Auto-create unknown plugins
        if (!plugin) {
          try {
            const [created] = await db.insert(plugins).values({
              namespace,
              createdAt: now,
              updatedAt: now,
            }).returning()

            if (created) {
              plugin = created
              pluginMap.set(namespace, created)
            }
          } catch {
            // Unique constraint race — another request may have created it
            const [existing] = await db.select().from(plugins).where(eq(plugins.namespace, namespace)).limit(1)
            if (existing) {
              plugin = existing
              pluginMap.set(namespace, existing)
            }
          }
        }

        if (plugin) {
          try {
            await db.insert(publisherPlugins).values({
              publisherId,
              pluginId: plugin.id,
              discoveredAt: now,
            })
          } catch {
            // Duplicate — already linked
          }
        }
      }
    }

    // Mark job complete
    await db.update(scrapeJobs)
      .set({
        status: 'completed',
        completedCount,
        failedCount,
        completedAt: new Date().toISOString(),
        errorLog: errors.length > 0 ? errors : null,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(scrapeJobs.id, job.id))
  })

  return { success: true, jobId: job.id, status: 'started', count: pending.length }
})
