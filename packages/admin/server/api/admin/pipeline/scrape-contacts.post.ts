/**
 * POST /api/admin/pipeline/scrape-contacts
 *
 * Scrapes contact emails and social links from enriched WordPress publishers.
 *
 * Only processes publishers with scrape_status = 'enriched' and is_wordpress = true.
 *
 * Query params:
 *   limit: number of publishers to scrape (default 100, max 500)
 *   concurrency: parallel requests (default 3, max 10)
 */
import { eq, and, inArray } from 'drizzle-orm'
import { useAdminOpsDb, publishers, contacts, scrapeJobs } from '~~/server/utils/admin-ops-db'

export default defineEventHandler(async (event) => {
  const session = await getUserSession(event)
  if (!session?.user) {
    throw createError({ statusCode: 401, message: 'Unauthorized' })
  }

  const query = getQuery(event)
  const limit = Math.min(500, Math.max(1, Number(query.limit) || 100))
  const concurrency = Math.min(10, Math.max(1, Number(query.concurrency) || 3))

  const db = useAdminOpsDb(event)
  const now = new Date().toISOString()

  // rescrape=true allows re-processing already-scraped publishers
  const rescrape = query.rescrape === 'true'

  const statusFilter = rescrape
    ? inArray(publishers.scrapeStatus, ['enriched', 'contacts_scraped'])
    : eq(publishers.scrapeStatus, 'enriched')

  // Get WordPress publishers that need contact scraping
  const pending = await db.select({ id: publishers.id, domain: publishers.domain })
    .from(publishers)
    .where(and(statusFilter, eq(publishers.isWordpress, true)))
    .limit(limit)

  if (pending.length === 0) {
    return { success: true, message: 'No publishers to scrape contacts for', scraped: 0 }
  }

  // Create a ScrapeJob
  const [job] = await db.insert(scrapeJobs).values({
    type: 'contact_scrape',
    status: 'running',
    totalCount: pending.length,
    startedAt: now,
    startedBy: (session.user as any).id,
    createdAt: now,
    updatedAt: now,
  }).returning()

  if (!job) {
    throw createError({ statusCode: 500, message: 'Failed to create contact scrape job' })
  }

  const domains = pending.map((p) => p.domain)
  const domainToId = new Map(pending.map((p) => [p.domain, p.id]))

  let scrapedCount = 0
  let withEmailCount = 0
  let withSocialCount = 0
  let failedCount = 0
  const errors: Array<{ domain: string; error: string; timestamp: string }> = []

  // Scrape in batches
  const results = await scrapeBatch(domains, concurrency, async (completed, total) => {
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

      // Don't change status on error — leave as 'enriched' for retry
      await db.update(publishers)
        .set({
          scrapeError: result.error,
          lastScrapedAt: now,
          updatedAt: now,
        })
        .where(eq(publishers.id, publisherId))
      continue
    }

    scrapedCount++

    const updateData: Record<string, any> = {
      scrapeStatus: 'contacts_scraped',
      scrapeError: null,
      lastScrapedAt: now,
      updatedAt: now,
    }

    // Upsert contact if we found an email
    if (result.email) {
      withEmailCount++

      let contactId: number | null = null

      // Try to find existing contact by email
      const [existing] = await db.select({ id: contacts.id })
        .from(contacts)
        .where(eq(contacts.email, result.email))
        .limit(1)

      if (existing) {
        contactId = existing.id

        // Update existing contact with new info
        await db.update(contacts)
          .set({
            name: result.contactName || undefined,
            source: result.source || undefined,
            siteCount: (await db.select({ id: publishers.id })
              .from(publishers)
              .where(eq(publishers.contactId, existing.id))).length + 1,
            updatedAt: now,
          })
          .where(eq(contacts.id, existing.id))
      } else {
        // Create new contact
        try {
          const [created] = await db.insert(contacts).values({
            name: result.contactName,
            email: result.email,
            source: result.source,
            siteCount: 1,
            createdAt: now,
            updatedAt: now,
          }).returning()

          if (created) {
            contactId = created.id
          }
        } catch {
          // Unique constraint race — another request may have created it
          const [raced] = await db.select({ id: contacts.id })
            .from(contacts)
            .where(eq(contacts.email, result.email))
            .limit(1)

          if (raced) {
            contactId = raced.id
          }
        }
      }

      if (contactId) {
        updateData.contactId = contactId
      }
    }

    // Update social links if found
    if (result.socialLinks) {
      withSocialCount++
      updateData.socialLinks = result.socialLinks
    }

    await db.update(publishers)
      .set(updateData)
      .where(eq(publishers.id, publisherId))
  }

  // Mark job complete
  await db.update(scrapeJobs)
    .set({
      status: 'completed',
      completedCount: scrapedCount,
      failedCount,
      completedAt: new Date().toISOString(),
      errorLog: errors.length > 0 ? errors : null,
      updatedAt: new Date().toISOString(),
    })
    .where(eq(scrapeJobs.id, job.id))

  return {
    success: true,
    jobId: job.id,
    scraped: scrapedCount,
    withEmail: withEmailCount,
    withSocial: withSocialCount,
    failed: failedCount,
  }
})
