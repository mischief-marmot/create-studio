/**
 * POST /api/admin/pipeline/run
 *
 * Runs the full pipeline, prioritizing publishers furthest along.
 * Fills the batch from the bottom up:
 *   1. enriched → scrape contacts
 *   2. plugins_scraped → enrich → scrape contacts
 *   3. pending → probe → enrich → scrape contacts
 *
 * Each publisher flows through all remaining stages in one run.
 * Non-blocking — returns immediately, runs in background.
 *
 * Query params:
 *   limit: batch size (default 50, max 2000)
 */
import { eq, and } from 'drizzle-orm'
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

  // Create job
  const [job] = await db.insert(scrapeJobs).values({
    type: 'full_pipeline',
    status: 'running',
    startedAt: now,
    startedBy: (session.user as any).id,
    createdAt: now,
    updatedAt: now,
  }).returning()

  if (!job) {
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

    // Track all IDs we lock so we can unlock on completion/failure
    let allLockedIds: number[] = []

    try {
      // === Gather batch, filling from bottom up ===
      // Over-fetch to account for locked IDs being filtered out
      const overFetch = limit * 3

      // 1. Enriched publishers → need contact scraping only
      const rawContacts = await db.select({ id: publishers.id, domain: publishers.domain })
        .from(publishers)
        .where(and(eq(publishers.scrapeStatus, 'enriched'), eq(publishers.isWordpress, true)))
        .limit(overFetch)
      const availContacts = filterUnlocked(rawContacts)
      const needContacts = availContacts.slice(0, limit)
      let remaining = limit - needContacts.length

      // 2. Plugins-scraped publishers → need enrich + contacts
      let needEnrich: typeof needContacts = []
      if (remaining > 0) {
        const rawEnrich = await db.select({ id: publishers.id, domain: publishers.domain })
          .from(publishers)
          .where(and(eq(publishers.scrapeStatus, 'plugins_scraped'), eq(publishers.isWordpress, true)))
          .limit(overFetch)
        const availEnrich = filterUnlocked(rawEnrich)
        needEnrich = availEnrich.slice(0, remaining)
        remaining -= needEnrich.length
      }

      // 3. Pending publishers → need probe + enrich + contacts
      let needProbe: typeof needContacts = []
      if (remaining > 0) {
        const rawProbe = await db.select({ id: publishers.id, domain: publishers.domain })
          .from(publishers)
          .where(eq(publishers.scrapeStatus, 'pending'))
          .limit(overFetch)
        const availProbe = filterUnlocked(rawProbe)
        needProbe = availProbe.slice(0, remaining)
      }

      const totalBatch = needContacts.length + needEnrich.length + needProbe.length
      if (totalBatch === 0) {
        await db.update(scrapeJobs).set({
          status: 'completed', completedCount: 0, totalCount: 0,
          completedAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
        }).where(eq(scrapeJobs.id, job.id))
        return
      }

      // Lock all claimed IDs
      allLockedIds = lockPublisherIds([
        ...needContacts.map((p) => p.id),
        ...needEnrich.map((p) => p.id),
        ...needProbe.map((p) => p.id),
      ])

      // === STAGE: Probe (only for needProbe set) ===
      const wordpressFromProbe: Array<{ id: number; domain: string }> = []

      if (needProbe.length > 0) {
        await updateJob('probe', 0, needProbe.length)

        const knownPlugins = await db.select().from(plugins)
        const pluginMap = new Map(knownPlugins.map((p) => [p.namespace, p]))
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
            // WordPress site → continue through pipeline
            await db.update(publishers).set({
              isWordpress: true, restApiAvailable: result.restApiAvailable,
              siteName: result.siteName || undefined,
              scrapeStatus: 'plugins_scraped', scrapeError: null, lastScrapedAt: now, updatedAt: now,
            }).where(eq(publishers.id, publisherId))
            wordpressFromProbe.push({ id: publisherId, domain: result.domain })
          } else {
            // Not WordPress → skip to terminal status
            await db.update(publishers).set({
              isWordpress: false, restApiAvailable: result.restApiAvailable,
              siteName: result.siteName || undefined,
              scrapeStatus: 'contacts_scraped', scrapeError: null, lastScrapedAt: now, updatedAt: now,
            }).where(eq(publishers.id, publisherId))
            totalProcessed++
          }

          for (const namespace of result.namespaces) {
            let plugin = pluginMap.get(namespace)
            if (!plugin) {
              try {
                const [created] = await db.insert(plugins).values({ namespace, createdAt: now, updatedAt: now }).returning()
                if (created) { plugin = created; pluginMap.set(namespace, created) }
              } catch {
                const [existing] = await db.select().from(plugins).where(eq(plugins.namespace, namespace)).limit(1)
                if (existing) { plugin = existing; pluginMap.set(namespace, existing) }
              }
            }
            if (plugin) {
              try { await db.insert(publisherPlugins).values({ publisherId, pluginId: plugin.id, discoveredAt: now }) } catch { /* dup */ }
            }
          }
        }
      }

      // === STAGE: Enrich (needEnrich + WordPress from probe) ===
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

      // === STAGE: Contacts (needContacts + newly enriched) ===
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

      // Mark pipeline complete
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
      // Always release locks
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
