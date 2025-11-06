/**
 * API usage tracking middleware
 * Tracks all API calls to measure v1 vs v2 usage
 * Also updates last_active_at for users and sites
 */

import { UserRepository, SiteRepository } from '~/server/utils/database'

export default defineEventHandler(async (event) => {
  const path = event.path
  // Only track API calls (not static assets, pages, etc.)
  if (!path.startsWith('/api/')) {
    return
  }

  // Extract API version and endpoint
  // Match patterns like: /api/v1/nutrition or /api/v2/timers/123
  const match = path.match(/^\/api\/(v[12])\/([^\/\?]+)/)

  if (!match) {
    return
  }

  const [_, version, endpoint] = match

  const now = new Date()
  const date = getDateString(now)
  const hour = now.getHours()

  // Immediately track in KV (don't wait for response)
  try {
    const dailyKey = getAnalyticsKey(['api', version, endpoint, date])
    await incrementCounter(dailyKey)

    // Increment hourly counter
    const hourlyKey = getAnalyticsKey(['api', version, endpoint, date, hour.toString()])
    await incrementCounter(hourlyKey)

    // Increment global API summary
    const summaryKey = getAnalyticsKey(['summary', 'api', date])
    await incrementCounter(summaryKey)

    // Track last active time for authenticated users
    try {
      const session = await getUserSession(event)
      if (session?.user?.id) {
        const userRepo = new UserRepository()
        await userRepo.updateLastActive(session.user.id)
      }
    } catch (err) {
      // Silently fail if session not available (e.g., public endpoints)
    }

    // Track last active time for sites (v1 API uses site authentication)
    if (version === 'v1') {
      try {
        // For v1 API, try to get site ID from query or body
        const query = getQuery(event)
        const siteId = query.site_id || query.siteId

        if (siteId) {
          const siteRepo = new SiteRepository()
          await siteRepo.updateLastActive(Number(siteId))
        }
      } catch (err) {
        // Silently fail if site ID not available
      }
    }
  } catch (error) {
    console.error('[Analytics] Error tracking API call:', error)
  }
})
