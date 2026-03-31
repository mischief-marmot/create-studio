/**
 * POST /api/admin/pipeline/enrich-plugins
 *
 * Enriches unenriched plugins with data from wordpress.org.
 * Fetches name, description, active installs, rating, URLs.
 * Non-blocking — runs in background.
 *
 * Query params:
 *   limit: plugins to enrich (default 100, max 500)
 */
import { eq, sql, isNull } from 'drizzle-orm'
import { useAdminOpsDb, plugins, scrapeJobs } from '~~/server/utils/admin-ops-db'

export default defineEventHandler(async (event) => {
  const session = await getUserSession(event)
  if (!session?.user) {
    throw createError({ statusCode: 401, message: 'Unauthorized' })
  }

  const query = getQuery(event)
  const limit = Math.min(500, Math.max(1, Number(query.limit) || 100))

  const db = useAdminOpsDb(event)
  const now = new Date().toISOString()

  // Get plugins that haven't been enriched yet
  const unenriched = await db.select({ id: plugins.id, namespace: plugins.namespace })
    .from(plugins)
    .where(isNull(plugins.enrichedAt))
    .limit(limit)

  if (unenriched.length === 0) {
    return { success: true, message: 'All plugins already enriched', enriched: 0 }
  }

  // Create job
  const [job] = await db.insert(scrapeJobs).values({
    type: 'plugin_enrich',
    status: 'running',
    totalCount: unenriched.length,
    startedAt: now,
    startedBy: (session.user as any).id,
    createdAt: now,
    updatedAt: now,
  }).returning()

  if (!job) {
    throw createError({ statusCode: 500, message: 'Failed to create job' })
  }

  runInBackground(event, async () => {
    let found = 0
    let notFound = 0

    const results = await enrichPluginBatch(
      unenriched.map((p) => p.namespace),
      async (completed, total) => {
        await db.update(scrapeJobs).set({
          completedCount: completed, updatedAt: new Date().toISOString(),
        }).where(eq(scrapeJobs.id, job.id))
      },
    )

    const namespaceToId = new Map(unenriched.map((p) => [p.namespace, p.id]))

    for (const result of results) {
      const pluginId = namespaceToId.get(result.namespace)
      if (!pluginId) continue

      if (result.found) {
        found++
        await db.update(plugins).set({
          name: result.name,
          wpSlug: result.wpSlug,
          wpUrl: result.wpUrl,
          homepageUrl: result.homepageUrl,
          description: result.description,
          activeInstalls: result.activeInstalls,
          rating: result.rating,
          enrichedAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }).where(eq(plugins.id, pluginId))
      } else {
        notFound++
        // Mark as enriched (attempted) so we don't retry
        await db.update(plugins).set({
          enrichedAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }).where(eq(plugins.id, pluginId))
      }
    }

    await db.update(scrapeJobs).set({
      status: 'completed',
      completedCount: found + notFound,
      failedCount: 0,
      completedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }).where(eq(scrapeJobs.id, job.id))
  })

  return {
    success: true,
    jobId: job.id,
    status: 'started',
    count: unenriched.length,
  }
})
