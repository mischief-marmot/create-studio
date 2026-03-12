/**
 * API usage tracking middleware
 * Tracks API calls to measure v1 vs v2 usage via D1 analytics database.
 *
 * Samples 0.1% of matching requests and inserts an `api_call` event
 * into the analytics D1 — replacing the old KV-based counters.
 */

import { insertEvents } from '@create-studio/analytics/queries/events'
import { shouldSample, getSampleRate } from '@create-studio/analytics/sampling'
import { useAnalyticsDB } from '#server/utils/analytics-db'

export default defineEventHandler((event) => {
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

  if (!shouldSample('api_call')) {
    return
  }

  const [_, version, endpoint] = match

  // Fire async — don't block the response
  const analyticsDb = useAnalyticsDB(event)
  const now = Math.floor(Date.now() / 1000)

  insertEvents(analyticsDb, [
    {
      type: 'api_call',
      body: JSON.stringify({ version, endpoint }),
      domain: null,
      session_id: null,
      sample_rate: getSampleRate('api_call'),
      created_at: now,
    },
  ]).catch((err) => {
    console.error('[Analytics] Error tracking API call:', err)
  })
})
