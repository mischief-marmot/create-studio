/**
 * POST /api/admin/pipeline/run
 *
 * Full pipeline in one pass. Fills batch from bottom up (most-progressed first),
 * then each publisher flows through all remaining stages:
 *
 *   1. Probe — detect WordPress, get REST namespaces
 *   2. Detect plugins — scan homepage + post HTML for /wp-content/plugins/ paths, flag premium
 *   3. Enrich publisher — post counts, categories, top content
 *   4. Scrape contacts — emails, social links, Gravatar verification
 *   5. Enrich plugins — look up new plugins on wordpress.org (once per plugin, not per publisher)
 *
 * Non-blocking — returns immediately, runs in background.
 *
 * Query params:
 *   limit: batch size (default 50, max 2000)
 */
import { eq, and, isNull } from 'drizzle-orm'
import { useAdminOpsDb, publishers, plugins, publisherPlugins, contacts, scrapeJobs } from '~~/server/utils/admin-ops-db'

export default defineEventHandler(async (event) => {
  const session = await getUserSession(event)
  if (!session?.user) {
    throw createError({ statusCode: 401, message: 'Unauthorized' })
  }

  const query = getQuery(event)
  const limit = Math.min(2000, Math.max(1, Number(query.limit) || 50))

  const db = useAdminOpsDb(event)
  const now = new Date().toISOString()

  // === Pre-check: gather batch BEFORE creating job ===
  // Over-fetch generously to account for locked IDs from concurrent jobs
  const overFetch = limit * 10

  const rawContacts = await db.select({ id: publishers.id, domain: publishers.domain })
    .from(publishers)
    .where(and(eq(publishers.scrapeStatus, 'enriched'), eq(publishers.isWordpress, true)))
    .limit(overFetch)
  const needContacts = filterUnlocked(rawContacts).slice(0, limit)
  let remaining = limit - needContacts.length

  let needEnrich: typeof needContacts = []
  if (remaining > 0) {
    const raw = await db.select({ id: publishers.id, domain: publishers.domain })
      .from(publishers)
      .where(and(eq(publishers.scrapeStatus, 'plugins_scraped'), eq(publishers.isWordpress, true)))
      .limit(overFetch)
    needEnrich = filterUnlocked(raw).slice(0, remaining)
    remaining -= needEnrich.length
  }

  let needProbe: typeof needContacts = []
  if (remaining > 0) {
    const raw = await db.select({ id: publishers.id, domain: publishers.domain })
      .from(publishers)
      .where(eq(publishers.scrapeStatus, 'pending'))
      .limit(overFetch)
    needProbe = filterUnlocked(raw).slice(0, remaining)
  }

  const totalBatch = needContacts.length + needEnrich.length + needProbe.length
  if (totalBatch === 0) {
    return { success: true, message: 'No publishers available to process', jobId: null, status: 'skipped', limit }
  }

  // Lock IDs before creating job
  const allLockedIds = lockPublisherIds([
    ...needContacts.map((p) => p.id),
    ...needEnrich.map((p) => p.id),
    ...needProbe.map((p) => p.id),
  ])

  const [job] = await db.insert(scrapeJobs).values({
    type: 'full_pipeline',
    status: 'running',
    totalCount: totalBatch,
    startedAt: now,
    startedBy: (session.user as any).id,
    createdAt: now,
    updatedAt: now,
  }).returning()

  if (!job) {
    unlockPublisherIds(allLockedIds)
    throw createError({ statusCode: 500, message: 'Failed to create pipeline job' })
  }

  runInBackground(event, async () => {
    let totalProcessed = 0
    let totalFailed = 0

    const updateJob = async (stage: string, completed: number, total: number) => {
      await db.update(scrapeJobs).set({
        status: `running:${stage}`,
        completedCount: completed,
        totalCount: total,
        updatedAt: new Date().toISOString(),
      }).where(eq(scrapeJobs.id, job.id))
    }

    try {

      // Load plugin map
      const knownPlugins = await db.select().from(plugins)
      const pluginMap = new Map(knownPlugins.map((p) => [p.namespace, p]))

      // Helper to upsert a plugin
      const upsertPlugin = async (namespace: string, isPaid?: boolean) => {
        let plugin = pluginMap.get(namespace)
        if (!plugin) {
          try {
            const [created] = await db.insert(plugins).values({
              namespace, isPaid: isPaid || false, createdAt: now, updatedAt: now,
            }).returning()
            if (created) { plugin = created; pluginMap.set(namespace, created) }
          } catch {
            const [existing] = await db.select().from(plugins).where(eq(plugins.namespace, namespace)).limit(1)
            if (existing) { plugin = existing; pluginMap.set(namespace, existing) }
          }
        }
        if (plugin && isPaid && !plugin.isPaid) {
          await db.update(plugins).set({ isPaid: true, updatedAt: now }).where(eq(plugins.id, plugin.id))
          plugin = { ...plugin, isPaid: true }
          pluginMap.set(namespace, plugin)
        }
        return plugin
      }

      // Helper to link publisher ↔ plugin
      const linkPlugin = async (publisherId: number, pluginId: number) => {
        try {
          await db.insert(publisherPlugins).values({ publisherId, pluginId, discoveredAt: now })
        } catch { /* dup */ }
      }

      // ================================================================
      // STAGE 1: Probe (pending publishers only)
      // ================================================================
      const wordpressFromProbe: Array<{ id: number; domain: string }> = []

      if (needProbe.length > 0) {
        await updateJob('probe', 0, needProbe.length)

        const probeResults = await probeBatch(
          needProbe.map((p) => p.domain), 15,
          async (completed) => { await updateJob('probe', completed, needProbe.length) },
        )

        const domainToId = new Map(needProbe.map((p) => [p.domain, p.id]))

        for (const result of probeResults) {
          const publisherId = domainToId.get(result.domain)
          if (!publisherId) continue

          if (result.error) {
            totalFailed++
            await db.update(publishers).set({
              scrapeStatus: 'failed', scrapeError: result.error, lastScrapedAt: now, updatedAt: now,
            }).where(eq(publishers.id, publisherId))
            continue
          }

          if (result.isWordpress) {
            await db.update(publishers).set({
              isWordpress: true, restApiAvailable: result.restApiAvailable,
              siteName: result.siteName || undefined,
              scrapeStatus: 'plugins_scraped', scrapeError: null, lastScrapedAt: now, updatedAt: now,
            }).where(eq(publishers.id, publisherId))
            wordpressFromProbe.push({ id: publisherId, domain: result.domain })

            for (const ns of result.namespaces) {
              const plugin = await upsertPlugin(ns)
              if (plugin) await linkPlugin(publisherId, plugin.id)
            }
          } else {
            await db.update(publishers).set({
              isWordpress: false, restApiAvailable: result.restApiAvailable,
              siteName: result.siteName || undefined,
              scrapeStatus: 'contacts_scraped', scrapeError: null, lastScrapedAt: now, updatedAt: now,
            }).where(eq(publishers.id, publisherId))
            totalProcessed++
          }
        }
      }

      // ================================================================
      // STAGE 2: Detect plugins via HTML scanning
      // (all WordPress publishers that need enrich or were just probed)
      // ================================================================
      const allWordpress = [...needEnrich, ...wordpressFromProbe, ...needContacts]

      if (allWordpress.length > 0) {
        await updateJob('detect_plugins', 0, allWordpress.length)

        // Get existing namespaces per publisher
        const existingLinks = await db.select({
          publisherId: publisherPlugins.publisherId,
          namespace: plugins.namespace,
        })
          .from(publisherPlugins)
          .innerJoin(plugins, eq(publisherPlugins.pluginId, plugins.id))

        const pubNamespaces = new Map<number, string[]>()
        for (const link of existingLinks) {
          const ns = pubNamespaces.get(link.publisherId) || []
          ns.push(link.namespace)
          pubNamespaces.set(link.publisherId, ns)
        }

        const detectResults = await detectPluginsBatch(
          allWordpress.map((p) => ({ domain: p.domain, namespaces: pubNamespaces.get(p.id) })),
          5,
          async (completed) => { await updateJob('detect_plugins', completed, allWordpress.length) },
        )

        const domainToId = new Map(allWordpress.map((p) => [p.domain, p.id]))

        for (const result of detectResults) {
          const publisherId = domainToId.get(result.domain)
          if (!publisherId) continue

          for (const detected of result.plugins) {
            const plugin = await upsertPlugin(detected.slug, detected.isPremium)
            if (plugin) await linkPlugin(publisherId, plugin.id)
          }
        }
      }

      // ================================================================
      // STAGE 3: Enrich publishers (needEnrich + WordPress from probe)
      // ================================================================
      const toEnrich = [...needEnrich, ...wordpressFromProbe]
      const enrichedIds: Array<{ id: number; domain: string }> = []

      if (toEnrich.length > 0) {
        await updateJob('enrich', 0, toEnrich.length)

        const enrichResults = await enrichBatch(
          toEnrich.map((p) => p.domain), 10,
          async (completed) => { await updateJob('enrich', completed, toEnrich.length) },
        )

        const domainToId = new Map(toEnrich.map((p) => [p.domain, p.id]))

        for (const result of enrichResults) {
          const publisherId = domainToId.get(result.domain)
          if (!publisherId) continue

          if (result.error) {
            totalFailed++
            await db.update(publishers).set({ scrapeError: result.error, lastScrapedAt: now, updatedAt: now })
              .where(eq(publishers.id, publisherId))
            continue
          }

          totalProcessed++
          await db.update(publishers).set({
            postCount: result.postCount, oldestPostDate: result.oldestPostDate,
            newestPostDate: result.newestPostDate, siteCategory: result.siteCategory,
            topContent: result.topContent, scrapeStatus: 'enriched',
            scrapeError: null, lastScrapedAt: now, updatedAt: now,
          }).where(eq(publishers.id, publisherId))

          enrichedIds.push({ id: publisherId, domain: result.domain })
        }
      }

      // ================================================================
      // STAGE 4: Scrape contacts (needContacts + newly enriched)
      // ================================================================
      const toScrapeContacts = [...needContacts, ...enrichedIds]

      if (toScrapeContacts.length > 0) {
        await updateJob('contacts', 0, toScrapeContacts.length)

        const contactResults = await scrapeBatch(
          toScrapeContacts.map((p) => p.domain), 8,
          async (completed) => { await updateJob('contacts', completed, toScrapeContacts.length) },
        )

        const domainToId = new Map(toScrapeContacts.map((p) => [p.domain, p.id]))

        for (const result of contactResults) {
          const publisherId = domainToId.get(result.domain)
          if (!publisherId) continue

          if (result.error) {
            totalFailed++
            await db.update(publishers).set({ scrapeError: result.error, lastScrapedAt: now, updatedAt: now })
              .where(eq(publishers.id, publisherId))
            continue
          }

          totalProcessed++
          const updateData: Record<string, any> = {
            scrapeStatus: 'contacts_scraped', scrapeError: null, lastScrapedAt: now, updatedAt: now,
          }

          if (result.email) {
            let contactId: number | null = null
            const [existing] = await db.select({ id: contacts.id }).from(contacts)
              .where(eq(contacts.email, result.email)).limit(1)

            if (existing) {
              contactId = existing.id
              await db.update(contacts).set({
                name: result.contactName || undefined, source: result.source || undefined, updatedAt: now,
              }).where(eq(contacts.id, existing.id))
            } else {
              try {
                const [created] = await db.insert(contacts).values({
                  name: result.contactName, email: result.email, source: result.source,
                  siteCount: 1, createdAt: now, updatedAt: now,
                }).returning()
                if (created) contactId = created.id
              } catch {
                const [raced] = await db.select({ id: contacts.id }).from(contacts)
                  .where(eq(contacts.email, result.email)).limit(1)
                if (raced) contactId = raced.id
              }
            }
            if (contactId) updateData.contactId = contactId
          }

          if (result.socialLinks) updateData.socialLinks = result.socialLinks

          await db.update(publishers).set(updateData).where(eq(publishers.id, publisherId))
        }
      }

      // ================================================================
      // STAGE 5: Enrich newly discovered plugins on wordpress.org
      // ================================================================
      const rawUnenriched = await db.select({ id: plugins.id, namespace: plugins.namespace })
        .from(plugins)
        .where(isNull(plugins.enrichedAt))
        .limit(200)

      const unenrichedPlugins = filterUnlockedPlugins(rawUnenriched).slice(0, 100)
      const lockedPluginIds = lockPluginIds(unenrichedPlugins.map((p) => p.id))

      if (unenrichedPlugins.length > 0) {
        try {
          await updateJob('enrich_plugins', 0, unenrichedPlugins.length)

          const enrichResults = await enrichPluginBatch(
            unenrichedPlugins.map((p) => p.namespace),
            async (completed, total) => { await updateJob('enrich_plugins', completed, total) },
          )

          const nsToId = new Map(unenrichedPlugins.map((p) => [p.namespace, p.id]))

          for (const result of enrichResults) {
            const pluginId = nsToId.get(result.namespace)
            if (!pluginId) continue

            if (result.found) {
              await db.update(plugins).set({
                name: result.name, wpSlug: result.wpSlug, wpUrl: result.wpUrl,
                homepageUrl: result.homepageUrl, description: result.description,
                activeInstalls: result.activeInstalls, rating: result.rating,
                enrichedAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
              }).where(eq(plugins.id, pluginId))
            } else {
              await db.update(plugins).set({
                enrichedAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
              }).where(eq(plugins.id, pluginId))
            }
          }
        } finally {
          unlockPluginIds(lockedPluginIds)
        }
      }

      // ================================================================
      // Done
      // ================================================================
      await db.update(scrapeJobs).set({
        status: 'completed',
        totalCount: totalProcessed + totalFailed,
        completedCount: totalProcessed,
        failedCount: totalFailed,
        completedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }).where(eq(scrapeJobs.id, job.id))

    } catch (err: any) {
      await db.update(scrapeJobs).set({
        status: 'failed',
        errorLog: [{ error: err.message || String(err), timestamp: new Date().toISOString() }],
        completedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }).where(eq(scrapeJobs.id, job.id))
    } finally {
      unlockPublisherIds(allLockedIds)
    }
  })

  return {
    success: true,
    jobId: job.id,
    status: 'started',
    limit,
  }
})
