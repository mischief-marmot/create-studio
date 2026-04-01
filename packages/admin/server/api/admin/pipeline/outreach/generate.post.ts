/**
 * POST /api/admin/pipeline/outreach/generate
 *
 * Auto-generate outreach records from pipeline data.
 * Finds all WordPress publishers with a contact email that don't yet have
 * an outreach record, derives a segment for each, and creates outreach rows.
 *
 * Runs the heavy work in the background via runInBackground.
 */
import { eq, and, isNotNull, notInArray, inArray } from 'drizzle-orm'
import {
  useAdminOpsDb,
  publishers,
  outreach,
  scrapeJobs,
  publisherPlugins,
  plugins,
} from '~~/server/utils/admin-ops-db'
import type { StudioData } from '~~/server/db/admin-schema'

export default defineEventHandler(async (event) => {
  const session = await getUserSession(event)
  if (!session?.user) {
    throw createError({ statusCode: 401, message: 'Unauthorized' })
  }

  const db = useAdminOpsDb(event)
  const now = new Date().toISOString()

  // Create a ScrapeJob to track progress
  const [job] = await db.insert(scrapeJobs).values({
    type: 'outreach_generate',
    status: 'running',
    totalCount: 0,
    startedAt: now,
    startedBy: (session.user as any).id,
    createdAt: now,
    updatedAt: now,
  }).returning()

  if (!job) {
    throw createError({ statusCode: 500, message: 'Failed to create outreach generation job' })
  }

  // Run generation in background
  runInBackground(event, async () => {
    let completedCount = 0
    let failedCount = 0
    const errors: Array<{ domain?: string; error: string; timestamp: string }> = []

    try {
      // Get IDs of publishers that already have outreach records
      const existingOutreach = await db.select({ publisherId: outreach.publisherId })
        .from(outreach)
        .where(isNotNull(outreach.publisherId))

      const existingPublisherIds = new Set(existingOutreach.map((r) => r.publisherId!))

      // Get all WordPress publishers with a contact
      const allPublishers = await db.select({
        id: publishers.id,
        domain: publishers.domain,
        siteCategory: publishers.siteCategory,
        studioData: publishers.studioData,
        createStudioSiteId: publishers.createStudioSiteId,
      })
        .from(publishers)
        .where(
          and(
            eq(publishers.isWordpress, true),
            isNotNull(publishers.contactId),
          ),
        )

      // Filter out publishers that already have outreach records
      const eligible = allPublishers.filter((p) => !existingPublisherIds.has(p.id))

      // Update job with total count
      await db.update(scrapeJobs)
        .set({ totalCount: eligible.length, updatedAt: new Date().toISOString() })
        .where(eq(scrapeJobs.id, job.id))

      if (eligible.length === 0) {
        await db.update(scrapeJobs)
          .set({
            status: 'completed',
            completedAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          })
          .where(eq(scrapeJobs.id, job.id))
        return
      }

      // Batch-fetch plugin data for all eligible publishers
      const eligibleIds = eligible.map((p) => p.id)

      // Get publisher-plugin associations with competitor info
      const pluginRows = await db.select({
        publisherId: publisherPlugins.publisherId,
        namespace: plugins.namespace,
        isCompetitor: plugins.isCompetitor,
        isPaid: plugins.isPaid,
      })
        .from(publisherPlugins)
        .innerJoin(plugins, eq(publisherPlugins.pluginId, plugins.id))
        .where(inArray(publisherPlugins.publisherId, eligibleIds))

      // Build lookup: publisherId -> { namespaces, hasCompetitor, paidCount }
      const pluginMap = new Map<number, { namespaces: Set<string>; hasCompetitor: boolean; paidCount: number }>()
      for (const row of pluginRows) {
        let entry = pluginMap.get(row.publisherId)
        if (!entry) {
          entry = { namespaces: new Set(), hasCompetitor: false, paidCount: 0 }
          pluginMap.set(row.publisherId, entry)
        }
        entry.namespaces.add(row.namespace)
        if (row.isCompetitor) entry.hasCompetitor = true
        if (row.isPaid) entry.paidCount++
      }

      // Generate outreach records in batches
      const BATCH_SIZE = 100
      for (let i = 0; i < eligible.length; i += BATCH_SIZE) {
        const batch = eligible.slice(i, i + BATCH_SIZE)

        const values = batch.map((pub) => {
          const sd = pub.studioData as StudioData | null
          const pluginInfo = pluginMap.get(pub.id)
          const namespaces = pluginInfo?.namespaces ?? new Set<string>()
          const hasCompetitor = pluginInfo?.hasCompetitor ?? false
          const paidCount = pluginInfo?.paidCount ?? 0
          const hasMvCreate = namespaces.has('mv-create')
          const hasWprm = namespaces.has('wp-recipe-maker')

          // Derive segment in priority order
          let segment = 'other'
          if (sd) {
            if (sd.subscriptionTier === 'pro') {
              segment = 'pro'
            } else if (sd.isLegacy) {
              segment = 'legacy'
            } else if (!sd.isLegacy && sd.isActive) {
              segment = 'current'
            } else if (!sd.isActive) {
              segment = 'inactive'
            }
          } else if (hasWprm && !hasMvCreate) {
            segment = 'wprm'
          } else if (hasCompetitor && !hasMvCreate) {
            segment = 'competitor'
          } else if (paidCount >= 2 && !hasMvCreate) {
            segment = 'paid_plugins'
          } else if (pub.siteCategory === 'food' && !hasMvCreate && !hasWprm && !hasCompetitor) {
            segment = 'no_recipe_plugin'
          }

          return {
            contactType: sd ? 'user' : 'lead',
            publisherId: pub.id,
            userId: sd ? pub.createStudioSiteId : null,
            segment,
            paidPluginCount: paidCount,
            status: 'queued' as const,
            stage: 'queued' as const,
            createdAt: now,
            updatedAt: now,
          }
        })

        try {
          await db.insert(outreach).values(values)
          completedCount += values.length
        } catch (err: any) {
          failedCount += values.length
          errors.push({
            error: `Batch insert failed at offset ${i}: ${err.message}`,
            timestamp: new Date().toISOString(),
          })
        }

        // Update progress
        await db.update(scrapeJobs)
          .set({
            completedCount,
            failedCount,
            updatedAt: new Date().toISOString(),
          })
          .where(eq(scrapeJobs.id, job.id))
      }
    } catch (err: any) {
      errors.push({
        error: `Outreach generation failed: ${err.message}`,
        timestamp: new Date().toISOString(),
      })
    }

    // Mark job complete
    await db.update(scrapeJobs)
      .set({
        status: failedCount > 0 && completedCount === 0 ? 'failed' : 'completed',
        completedCount,
        failedCount,
        completedAt: new Date().toISOString(),
        errorLog: errors.length > 0 ? errors : null,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(scrapeJobs.id, job.id))
  })

  return {
    success: true,
    jobId: job.id,
    status: 'started',
  }
})
