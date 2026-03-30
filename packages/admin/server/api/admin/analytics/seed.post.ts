/**
 * Seed Analytics Events (DEV ONLY)
 * POST /api/admin/analytics/seed
 *
 * Inserts realistic fake raw events into the analytics DB
 * so the rollup can aggregate them into daily summaries.
 */

import { drizzle } from 'drizzle-orm/d1'
import { insertEvents } from '@create-studio/analytics/queries/events'
import type { AnalyticsEventType } from '@create-studio/analytics/types'

interface InsertEvent {
  type: AnalyticsEventType
  body: string
  domain?: string | null
  session_id?: string | null
  sample_rate: number
  created_at: number
}

function rand(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]!
}

function uuid() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0
    return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16)
  })
}

export default defineEventHandler(async (event) => {
  const session = await getUserSession(event)
  if (!session?.user) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }

  const d1Analytics = event.context.cloudflare.env.DB_ANALYTICS as D1Database
  const db = drizzle(d1Analytics)

  // Clear existing events and summaries for a clean slate
  await d1Analytics.exec('DELETE FROM events')
  await d1Analytics.exec('DELETE FROM daily_summaries')

  const domains = [
    'cooking-blog.com',
    'recipes-daily.net',
    'healthyfood.org',
    'diy-crafts.com',
    'gardening-tips.net',
    'tech-howto.com',
    'fitness-guide.io',
  ]

  const creationIds = [
    'clk_recipe_001',
    'clk_recipe_002',
    'clk_howto_001',
    'clk_faq_001',
    'clk_recipe_003',
    'clk_howto_002',
  ]

  const ctaVariants = ['button', 'inline-banner', 'sticky-bar', 'tooltip']

  const allEvents: InsertEvent[] = []

  // Generate 30 days of data with realistic daily variance
  const now = new Date()
  for (let daysAgo = 30; daysAgo >= 0; daysAgo--) {
    const day = new Date(now)
    day.setDate(day.getDate() - daysAgo)
    day.setHours(0, 0, 0, 0)

    const dayStart = Math.floor(day.getTime() / 1000)

    // Ramp up sessions over time (organic growth curve)
    const baseSessionCount = Math.max(2, Math.floor(3 + (30 - daysAgo) * 0.5))
    const sessionCount = baseSessionCount + rand(-2, 3)

    // Pick a subset of domains active today (2-5 domains)
    const activeDomainCount = rand(2, Math.min(5, domains.length))
    const activeDomains = [...domains].sort(() => Math.random() - 0.5).slice(0, activeDomainCount)

    for (let s = 0; s < sessionCount; s++) {
      const sessionId = uuid()
      const domain = pick(activeDomains)
      const creationId = pick(creationIds)
      const totalPages = rand(3, 8)

      // Simulate varying engagement: some users view all pages, some bounce early
      const engagementLevel = Math.random()
      let pagesViewed: number
      if (engagementLevel < 0.2) {
        pagesViewed = 1 // bounce
      } else if (engagementLevel < 0.5) {
        pagesViewed = rand(1, Math.ceil(totalPages / 2)) // partial
      } else if (engagementLevel < 0.8) {
        pagesViewed = rand(Math.ceil(totalPages / 2), totalPages) // good engagement
      } else {
        pagesViewed = totalPages // full completion
      }

      // Session duration correlates with pages viewed (5-20s per page, with variance)
      const baseSecsPerPage = rand(5, 20)
      const totalDuration = pagesViewed * baseSecsPerPage + rand(-3, 10)

      // Timestamp within the day (spread across waking hours 8am-11pm)
      const sessionTs = dayStart + rand(8 * 3600, 23 * 3600)

      // --- Simulate batch sends like the real client ---
      // The real client sends batches every 15s, each with cumulative duration.
      // We simulate 1-3 batches per session depending on duration.

      const batchCount = Math.max(1, Math.ceil(totalDuration / 15))
      for (let b = 0; b < batchCount; b++) {
        const batchTs = sessionTs + b * 15
        const cumulativeDuration = Math.min(
          Math.round(((b + 1) / batchCount) * totalDuration),
          totalDuration,
        )
        const cumulativePages = Math.min(
          Math.ceil(((b + 1) / batchCount) * pagesViewed),
          pagesViewed,
        )

        // im_session_start (one per batch, like the real endpoint)
        allEvents.push({
          type: 'im_session_start',
          body: JSON.stringify({
            creation_id: creationId,
            total_pages: totalPages,
          }),
          domain,
          session_id: sessionId,
          sample_rate: 1.0,
          created_at: batchTs,
        })

        // im_session_complete (one per batch with growing duration)
        if (cumulativeDuration > 0) {
          allEvents.push({
            type: 'im_session_complete',
            body: JSON.stringify({
              creation_id: creationId,
              duration: cumulativeDuration,
              pages_viewed: cumulativePages,
              total_pages: totalPages,
            }),
            domain,
            session_id: sessionId,
            sample_rate: 1.0,
            created_at: batchTs,
          })
        }
      }

      // page_view events (one per page actually viewed)
      for (let p = 1; p <= pagesViewed; p++) {
        allEvents.push({
          type: 'page_view',
          body: JSON.stringify({
            creation_id: creationId,
            page_number: p,
            total_pages: totalPages,
          }),
          domain,
          session_id: sessionId,
          sample_rate: 1.0,
          created_at: sessionTs + p * rand(5, 15),
        })
      }

      // Rating: only ~12% of sessions see the rating screen (end of session)
      if (pagesViewed === totalPages && Math.random() < 0.3) {
        allEvents.push({
          type: 'rating_screen_shown',
          body: JSON.stringify({ creation_id: creationId }),
          domain,
          session_id: sessionId,
          sample_rate: 1.0,
          created_at: sessionTs + totalDuration,
        })

        // ~60% of those who see rating actually submit
        if (Math.random() < 0.6) {
          allEvents.push({
            type: 'rating_submitted',
            body: JSON.stringify({
              creation_id: creationId,
              rating: pick([3, 4, 4, 5, 5, 5]),
            }),
            domain,
            session_id: sessionId,
            sample_rate: 1.0,
            created_at: sessionTs + totalDuration + rand(2, 8),
          })
        }
      }

      // CTA events: ~40% of sessions see a CTA rendered
      if (Math.random() < 0.4) {
        const variant = pick(ctaVariants)
        allEvents.push({
          type: 'cta_rendered',
          body: JSON.stringify({ variant, creation_id: creationId }),
          domain,
          session_id: sessionId,
          sample_rate: 1.0,
          created_at: sessionTs + rand(5, totalDuration),
        })

        // ~25% of rendered CTAs get activated
        if (Math.random() < 0.25) {
          allEvents.push({
            type: 'cta_activated',
            body: JSON.stringify({ variant, creation_id: creationId }),
            domain,
            session_id: sessionId,
            sample_rate: 1.0,
            created_at: sessionTs + rand(5, totalDuration) + 2,
          })
        }
      }

      // Timer events: ~20% of sessions start a timer
      if (Math.random() < 0.2) {
        const timerId = `timer_${rand(1, 5)}`
        allEvents.push({
          type: 'timer_start',
          body: JSON.stringify({ creation_id: creationId, timer_id: timerId }),
          domain,
          session_id: sessionId,
          sample_rate: 1.0,
          created_at: sessionTs + rand(10, totalDuration),
        })

        // ~70% complete the timer
        if (Math.random() < 0.7) {
          allEvents.push({
            type: 'timer_complete',
            body: JSON.stringify({ creation_id: creationId, timer_id: timerId }),
            domain,
            session_id: sessionId,
            sample_rate: 1.0,
            created_at: sessionTs + totalDuration + rand(30, 300),
          })
        }
      }
    }
  }

  // Batch insert in small chunks (D1 limits bind params per query)
  const chunkSize = 10
  let inserted = 0
  for (let i = 0; i < allEvents.length; i += chunkSize) {
    const chunk = allEvents.slice(i, i + chunkSize)
    await insertEvents(db, chunk)
    inserted += chunk.length
  }

  return {
    success: true,
    eventsInserted: inserted,
    daysGenerated: 31,
    domainsUsed: domains.length,
    message: 'Seed data inserted. Run rollup to aggregate into daily summaries.',
  }
})
