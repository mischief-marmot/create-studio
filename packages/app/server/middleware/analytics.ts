/**
 * API usage tracking middleware
 * Tracks all API calls to measure v1 vs v2 usage
 */

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
  } catch (error) {
    console.error('[Analytics] Error tracking API call:', error)
  }
})
