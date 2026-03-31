/**
 * POST /api/admin/pipeline/run
 *
 * Runs the full pipeline: probe → enrich → contacts
 * Each stage processes publishers that are ready for it.
 * Non-blocking — returns immediately, runs in background.
 *
 * Query params:
 *   limit: publishers per stage (default 500, max 2000)
 */
import { eq, and, inArray, sql } from 'drizzle-orm'
import { useAdminOpsDb, publishers, plugins, publisherPlugins, contacts, scrapeJobs } from '~~/server/utils/admin-ops-db'

export default defineEventHandler(async (event) => {
  const session = await getUserSession(event)
  if (!session?.user) {
    throw createError({ statusCode: 401, message: 'Unauthorized' })
  }

  const query = getQuery(event)
  const limit = Math.min(2000, Math.max(1, Number(query.limit) || 500))

  const db = useAdminOpsDb(event)
  const now = new Date().toISOString()
  const adminId = (session.user as any).id

  // Create a parent job to track the full pipeline
  const [parentJob] = await db.insert(scrapeJobs).values({
    type: 'full_pipeline',
    status: 'running',
    startedAt: now,
    startedBy: adminId,
    createdAt: now,
    updatedAt: now,
  }).returning()

  if (!parentJob) {
    throw createError({ statusCode: 500, message: 'Failed to create pipeline job' })
  }

  runInBackground(event, async () => {
    let totalProcessed = 0
    let totalFailed = 0

    try {
      // === STAGE 1: Probe WordPress ===
      const pendingProbe = await db.select({ id: publishers.id, domain: publishers.domain })
        .from(publishers)
        .where(eq(publishers.scrapeStatus, 'pending'))
        .limit(limit)

      if (pendingProbe.length > 0) {
        await db.update(scrapeJobs)
          .set({ totalCount: pendingProbe.length, updatedAt: new Date().toISOString() })
          .where(eq(scrapeJobs.id, parentJob.id))

        const knownPlugins = await db.select().from(plugins)
        const pluginMap = new Map(knownPlugins.map((p) => [p.namespace, p]))
        const probeResults = await probeBatch(
          pendingProbe.map((p) => p.domain),
          15,
          async (completed) => {
            await db.update(scrapeJobs)
              .set({ completedCount: completed, updatedAt: new Date().toISOString() })
              .where(eq(scrapeJobs.id, parentJob.id))
          },
        )

        const domainToId = new Map(pendingProbe.map((p) => [p.domain, p.id]))

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

          totalProcessed++
          await db.update(publishers).set({
            isWordpress: result.isWordpress, restApiAvailable: result.restApiAvailable,
            siteName: result.siteName || undefined,
            scrapeStatus: 'plugins_scraped', scrapeError: null, lastScrapedAt: now, updatedAt: now,
          }).where(eq(publishers.id, publisherId))

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

      // === STAGE 2: Enrich ===
      const pendingEnrich = await db.select({ id: publishers.id, domain: publishers.domain })
        .from(publishers)
        .where(and(eq(publishers.scrapeStatus, 'plugins_scraped'), eq(publishers.isWordpress, true)))
        .limit(limit)

      if (pendingEnrich.length > 0) {
        const enrichResults = await enrichBatch(
          pendingEnrich.map((p) => p.domain),
          10,
          async (completed) => {
            await db.update(scrapeJobs)
              .set({ completedCount: totalProcessed + completed, updatedAt: new Date().toISOString() })
              .where(eq(scrapeJobs.id, parentJob.id))
          },
        )

        const domainToId = new Map(pendingEnrich.map((p) => [p.domain, p.id]))

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
        }
      }

      // === STAGE 3: Contact Scrape ===
      const pendingContacts = await db.select({ id: publishers.id, domain: publishers.domain })
        .from(publishers)
        .where(and(eq(publishers.scrapeStatus, 'enriched'), eq(publishers.isWordpress, true)))
        .limit(limit)

      if (pendingContacts.length > 0) {
        const contactResults = await scrapeBatch(
          pendingContacts.map((p) => p.domain),
          8,
          async (completed) => {
            await db.update(scrapeJobs)
              .set({ completedCount: totalProcessed + completed, updatedAt: new Date().toISOString() })
              .where(eq(scrapeJobs.id, parentJob.id))
          },
        )

        const domainToId = new Map(pendingContacts.map((p) => [p.domain, p.id]))

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
      }).where(eq(scrapeJobs.id, parentJob.id))

    } catch (err: any) {
      await db.update(scrapeJobs).set({
        status: 'failed',
        errorLog: [{ error: err.message || String(err), timestamp: new Date().toISOString() }],
        completedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }).where(eq(scrapeJobs.id, parentJob.id))
    }
  })

  return {
    success: true,
    jobId: parentJob.id,
    status: 'started',
    limit,
  }
})
