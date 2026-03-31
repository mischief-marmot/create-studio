/**
 * POST /api/admin/pipeline/reset-stalled
 *
 * Finds jobs stuck in 'running' status for more than 5 minutes,
 * marks them as failed, and does NOT reset publisher statuses
 * (publishers that were already processed keep their status).
 *
 * The next "Run Pipeline" will naturally pick up any publishers
 * still at intermediate statuses (pending, plugins_scraped, enriched).
 */
import { eq, sql, and, lt } from 'drizzle-orm'
import { useAdminOpsDb, scrapeJobs } from '~~/server/utils/admin-ops-db'

export default defineEventHandler(async (event) => {
  const session = await getUserSession(event)
  if (!session?.user) {
    throw createError({ statusCode: 401, message: 'Unauthorized' })
  }

  const db = useAdminOpsDb(event)
  const now = new Date().toISOString()
  const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString()

  // Find all running jobs (including running:stage variants) that haven't been updated in 5+ minutes
  const stalledJobs = await db.select({ id: scrapeJobs.id, type: scrapeJobs.type, status: scrapeJobs.status, updatedAt: scrapeJobs.updatedAt })
    .from(scrapeJobs)
    .where(and(
      sql`${scrapeJobs.status} LIKE 'running%'`,
      lt(scrapeJobs.updatedAt, fiveMinutesAgo),
    ))

  if (stalledJobs.length === 0) {
    return { success: true, message: 'No stalled jobs found', reset: 0 }
  }

  // Mark them as failed
  for (const job of stalledJobs) {
    await db.update(scrapeJobs)
      .set({
        status: 'failed',
        errorLog: [{ error: 'Job stalled — no progress for 5+ minutes', timestamp: now }],
        completedAt: now,
        updatedAt: now,
      })
      .where(eq(scrapeJobs.id, job.id))
  }

  return {
    success: true,
    reset: stalledJobs.length,
    message: `Marked ${stalledJobs.length} stalled job(s) as failed. Run Pipeline again to continue processing.`,
  }
})
