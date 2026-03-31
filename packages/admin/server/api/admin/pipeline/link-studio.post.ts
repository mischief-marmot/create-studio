/**
 * POST /api/admin/pipeline/link-studio
 *
 * Matches publishers to Create Studio sites by domain,
 * and contacts to Create Studio users by email.
 * Uses wrangler CLI to query production D1.
 *
 * Non-blocking — runs in background.
 */
import { eq, isNull, isNotNull } from 'drizzle-orm'
import { useAdminOpsDb, publishers, contacts, scrapeJobs } from '~~/server/utils/admin-ops-db'

export default defineEventHandler(async (event) => {
  const session = await getUserSession(event)
  if (!session?.user) {
    throw createError({ statusCode: 401, message: 'Unauthorized' })
  }

  const db = useAdminOpsDb(event)
  const now = new Date().toISOString()

  const [job] = await db.insert(scrapeJobs).values({
    type: 'studio_link',
    status: 'running',
    startedAt: now,
    startedBy: (session.user as any).id,
    createdAt: now,
    updatedAt: now,
  }).returning()

  if (!job) {
    throw createError({ statusCode: 500, message: 'Failed to create job' })
  }

  runInBackground(event, async () => {
    let sitesLinked = 0
    let usersLinked = 0

    try {
      // Fetch all Studio sites and users from production D1
      await db.update(scrapeJobs).set({
        status: 'running:fetch_studio', updatedAt: new Date().toISOString(),
      }).where(eq(scrapeJobs.id, job.id))

      const siteMap = fetchStudioSites()
      const userMap = fetchStudioUsers()

      // === Link publishers to sites by domain ===
      await db.update(scrapeJobs).set({
        status: 'running:link_sites',
        totalCount: siteMap.size,
        updatedAt: new Date().toISOString(),
      }).where(eq(scrapeJobs.id, job.id))

      // Get all publishers that aren't linked yet
      const unlinkedPublishers = await db.select({ id: publishers.id, domain: publishers.domain })
        .from(publishers)
        .where(isNull(publishers.createStudioSiteId))

      let checked = 0
      for (const pub of unlinkedPublishers) {
        const site = siteMap.get(pub.domain)
        if (site) {
          await db.update(publishers).set({
            createStudioSiteId: site.id,
            studioData: buildStudioData(site),
            updatedAt: now,
          }).where(eq(publishers.id, pub.id))
          sitesLinked++
        }

        checked++
        if (checked % 500 === 0) {
          await db.update(scrapeJobs).set({
            completedCount: checked, updatedAt: new Date().toISOString(),
          }).where(eq(scrapeJobs.id, job.id))
        }
      }

      // === Link contacts to users by email ===
      await db.update(scrapeJobs).set({
        status: 'running:link_users',
        completedCount: 0,
        totalCount: userMap.size,
        updatedAt: new Date().toISOString(),
      }).where(eq(scrapeJobs.id, job.id))

      const unlinkedContacts = await db.select({ id: contacts.id, email: contacts.email })
        .from(contacts)
        .where(isNull(contacts.createStudioUserId))

      checked = 0
      for (const contact of unlinkedContacts) {
        const user = userMap.get(contact.email.toLowerCase())
        if (user) {
          await db.update(contacts).set({
            createStudioUserId: user.id,
            updatedAt: now,
          }).where(eq(contacts.id, contact.id))
          usersLinked++
        }

        checked++
        if (checked % 100 === 0) {
          await db.update(scrapeJobs).set({
            completedCount: checked, updatedAt: new Date().toISOString(),
          }).where(eq(scrapeJobs.id, job.id))
        }
      }

      // Done
      await db.update(scrapeJobs).set({
        status: 'completed',
        completedCount: sitesLinked + usersLinked,
        totalCount: unlinkedPublishers.length + unlinkedContacts.length,
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
    }
  })

  return {
    success: true,
    jobId: job.id,
    status: 'started',
  }
})
