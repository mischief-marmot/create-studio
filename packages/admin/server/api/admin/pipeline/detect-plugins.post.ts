/**
 * POST /api/admin/pipeline/detect-plugins
 *
 * Runs multi-layered plugin detection on publishers:
 * REST API namespaces + homepage HTML + post HTML scanning.
 * Replaces namespace-only detection with richer data including
 * premium plugin identification.
 *
 * Targets publishers with scrape_status = 'contacts_scraped'
 * (fully processed) or 'plugins_scraped'/'enriched' (WordPress sites).
 *
 * Non-blocking — runs in background.
 *
 * Query params:
 *   limit: publishers to scan (default 50, max 500)
 *   concurrency: parallel scans (default 5, max 15)
 */
import { eq, and, inArray } from 'drizzle-orm'
import { useAdminOpsDb, publishers, plugins, publisherPlugins, scrapeJobs } from '~~/server/utils/admin-ops-db'

export default defineEventHandler(async (event) => {
  const session = await getUserSession(event)
  if (!session?.user) {
    throw createError({ statusCode: 401, message: 'Unauthorized' })
  }

  const query = getQuery(event)
  const limit = Math.min(500, Math.max(1, Number(query.limit) || 50))
  const concurrency = Math.min(15, Math.max(1, Number(query.concurrency) || 5))

  const db = useAdminOpsDb(event)
  const now = new Date().toISOString()

  // Get WordPress publishers that have been through the pipeline
  const targets = await db.select({ id: publishers.id, domain: publishers.domain })
    .from(publishers)
    .where(and(
      eq(publishers.isWordpress, true),
      inArray(publishers.scrapeStatus, ['plugins_scraped', 'enriched', 'contacts_scraped']),
    ))
    .limit(limit)

  if (targets.length === 0) {
    return { success: true, message: 'No publishers to scan', count: 0 }
  }

  const [job] = await db.insert(scrapeJobs).values({
    type: 'plugin_detect',
    status: 'running',
    totalCount: targets.length,
    startedAt: now,
    startedBy: (session.user as any).id,
    createdAt: now,
    updatedAt: now,
  }).returning()

  if (!job) {
    throw createError({ statusCode: 500, message: 'Failed to create job' })
  }

  runInBackground(event, async () => {
    let processed = 0
    let newPlugins = 0
    let premiumDetected = 0

    // Load existing plugin map
    const knownPlugins = await db.select().from(plugins)
    const pluginMap = new Map(knownPlugins.map((p) => [p.namespace, p]))

    // Get existing namespaces per publisher for Layer 1
    const existingLinks = await db.select({
      publisherId: publisherPlugins.publisherId,
      namespace: plugins.namespace,
    })
      .from(publisherPlugins)
      .innerJoin(plugins, eq(publisherPlugins.pluginId, plugins.id))
      .where(inArray(publisherPlugins.publisherId, targets.map((t) => t.id)))

    const pubNamespaces = new Map<number, string[]>()
    for (const link of existingLinks) {
      const ns = pubNamespaces.get(link.publisherId) || []
      ns.push(link.namespace)
      pubNamespaces.set(link.publisherId, ns)
    }

    const domainToId = new Map(targets.map((t) => [t.domain, t.id]))

    const results = await detectPluginsBatch(
      targets.map((t) => ({
        domain: t.domain,
        namespaces: pubNamespaces.get(t.id),
      })),
      concurrency,
      async (completed, total) => {
        await db.update(scrapeJobs).set({
          completedCount: completed,
          updatedAt: new Date().toISOString(),
        }).where(eq(scrapeJobs.id, job.id))
      },
    )

    for (const result of results) {
      const publisherId = domainToId.get(result.domain)
      if (!publisherId) continue

      processed++

      for (const detected of result.plugins) {
        // Find or create plugin record
        let plugin = pluginMap.get(detected.slug)

        if (!plugin) {
          try {
            const [created] = await db.insert(plugins).values({
              namespace: detected.slug,
              isPaid: detected.isPremium,
              createdAt: now,
              updatedAt: now,
            }).returning()
            if (created) {
              plugin = created
              pluginMap.set(detected.slug, created)
              newPlugins++
            }
          } catch {
            const [existing] = await db.select().from(plugins)
              .where(eq(plugins.namespace, detected.slug)).limit(1)
            if (existing) {
              plugin = existing
              pluginMap.set(detected.slug, existing)
            }
          }
        }

        if (!plugin) continue

        // Update isPaid if we detected premium
        if (detected.isPremium && !plugin.isPaid) {
          await db.update(plugins).set({ isPaid: true, updatedAt: now })
            .where(eq(plugins.id, plugin.id))
          plugin.isPaid = true
          premiumDetected++
        }

        // Link publisher to plugin
        try {
          await db.insert(publisherPlugins).values({
            publisherId,
            pluginId: plugin.id,
            discoveredAt: now,
          })
        } catch {
          // Already linked
        }
      }
    }

    await db.update(scrapeJobs).set({
      status: 'completed',
      completedCount: processed,
      completedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }).where(eq(scrapeJobs.id, job.id))
  })

  return {
    success: true,
    jobId: job.id,
    status: 'started',
    count: targets.length,
  }
})
