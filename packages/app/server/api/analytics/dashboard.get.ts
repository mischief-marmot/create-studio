/**
 * Analytics Dashboard API
 * Aggregates analytics data for the admin dashboard
 */

import type { SessionData, ApiCounter } from '~/server/utils/analytics'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const startDate = query.startDate as string
  const endDate = query.endDate as string

  if (!startDate || !endDate) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Start date and end date are required'
    })
  }

  // TODO: Add auth check - only admin should access this
  // For now, we'll assume auth middleware handles it

  try {
    // 1. Get API usage data (v1 vs v2)
    const apiUsage = await getApiUsageData(startDate, endDate)

    // 2. Get interactive mode engagement data
    const interactive = await getInteractiveData(startDate, endDate)

    // 3. Get timer analytics
    const timers = await getTimerData(startDate, endDate)

    // 4. Get rating analytics
    const ratings = await getRatingData(startDate, endDate)

    return {
      apiUsage,
      interactive,
      timers,
      ratings
    }
  } catch (error) {
    console.error('Error fetching analytics dashboard data:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to fetch analytics data'
    })
  }
})

/**
 * Get API usage statistics (v1 vs v2)
 */
async function getApiUsageData(startDate: string, endDate: string) {
  const dates = getDateRange(startDate, endDate)

  let v1Total = 0
  let v2Total = 0
  const v1Endpoints: Record<string, { count: number; errors: number }> = {}

  for (const date of dates) {
    // Get all keys with the analytics:api prefix and filter in code
    // Note: KV keys() doesn't support wildcards in the middle, only prefix matching
    const allApiKeys = await hubKV().keys('analytics:api')

    // Filter for v1 keys matching this date (not error keys, not hourly keys)
    const v1Keys = allApiKeys.filter(key => {
      const parts = key.split(':')
      // analytics:api:v1:{endpoint}:{date} (5 parts)
      return parts[2] === 'v1' && parts[4] === date && parts.length === 5
    })

    // Filter for v2 keys matching this date
    const v2Keys = allApiKeys.filter(key => {
      const parts = key.split(':')
      return parts[2] === 'v2' && parts[4] === date && parts.length === 5
    })

    // Process v1 endpoints
    for (const key of v1Keys) {
      // Skip error keys (they end with :errors)
      if (key.endsWith(':errors')) continue

      const parts = key.split(':')
      const endpoint = parts[3] // analytics:api:v1:{endpoint}:{date}

      const counterData = await hubKV().get<ApiCounter>(key)
      const count = counterData?.count || 0

      const errorKey = getAnalyticsKey(['api', 'v1', endpoint, date, 'errors'])
      const errorData = await hubKV().get<ApiCounter>(errorKey)
      const errors = errorData?.count || 0

      v1Total += count

      if (!v1Endpoints[endpoint]) {
        v1Endpoints[endpoint] = { count: 0, errors: 0 }
      }
      v1Endpoints[endpoint].count += count
      v1Endpoints[endpoint].errors += errors
    }

    // Process v2 endpoints
    for (const key of v2Keys) {
      // Skip error keys (they end with :errors)
      if (key.endsWith(':errors')) continue

      const counterData = await hubKV().get<ApiCounter>(key)
      const count = counterData?.count || 0
      v2Total += count
    }
  }

  return {
    v1Total,
    v2Total,
    v1Endpoints
  }
}

/**
 * Get interactive mode engagement data
 */
async function getInteractiveData(startDate: string, endDate: string) {
  let totalSessions = 0
  const uniqueUsers = new Set<string>()
  let totalDuration = 0
  let pagesViewed = 0
  let totalPages = 0

  // Get all analytics keys and filter for sessions
  // (KV keys() only does prefix matching, so we need to filter in code)
  const allKeys = await hubKV().keys('analytics')
  const allSessionKeys = allKeys.filter(k => k.startsWith('analytics:session:'))

  // Create date range timestamps for filtering
  // Use UTC to avoid timezone issues - session timestamps are in UTC
  const startTimestamp = new Date(startDate + 'T00:00:00.000Z').getTime()
  const endTimestamp = new Date(endDate + 'T23:59:59.999Z').getTime()

  for (const key of allSessionKeys) {
    const sessionData = await hubKV().get<SessionData>(key)

    if (sessionData) {
      // Filter by endTime to match date range
      if (sessionData.endTime >= startTimestamp && sessionData.endTime <= endTimestamp) {
        totalSessions++

        // Extract userId from key (analytics:session:{userId}:{sessionId})
        const parts = key.split(':')
        uniqueUsers.add(parts[2])

        totalDuration += sessionData.totalDuration || 0
        pagesViewed += sessionData.pagesViewed || 0
        totalPages += sessionData.totalPages || 0
      }
    }
  }

  return {
    totalSessions,
    uniqueUsers: uniqueUsers.size,
    avgDuration: totalSessions > 0 ? Math.round(totalDuration / totalSessions) : 0,
    pagesViewed,
    totalPages
  }
}

/**
 * Get timer analytics
 */
async function getTimerData(startDate: string, endDate: string) {
  const dates = getDateRange(startDate, endDate)

  let started = 0
  let completed = 0

  // Get all analytics keys once and filter for events
  const allKeys = await hubKV().keys('analytics')
  const allEventKeys = allKeys.filter(k => k.startsWith('analytics:events:'))

  for (const date of dates) {
    // Filter for timer_start events for this date
    const startKeys = allEventKeys.filter(key => {
      const parts = key.split(':')
      // analytics:events:{domain}:{creationId}:timer_start:{date}
      // Note: domain and creationId are separate parts
      return parts[4] === 'timer_start' && parts[5] === date
    })

    // Filter for timer_complete events for this date
    const completeKeys = allEventKeys.filter(key => {
      const parts = key.split(':')
      return parts[4] === 'timer_complete' && parts[5] === date
    })

    // Count start events
    for (const key of startKeys) {
      const counterData = await hubKV().get<ApiCounter>(key)
      const count = counterData?.count || 0
      started += count
    }

    // Count complete events
    for (const key of completeKeys) {
      const counterData = await hubKV().get<ApiCounter>(key)
      const count = counterData?.count || 0
      completed += count
    }
  }

  return {
    started,
    completed
  }
}

/**
 * Get rating analytics
 */
async function getRatingData(startDate: string, endDate: string) {
  const dates = getDateRange(startDate, endDate)

  let screensShown = 0
  let submitted = 0

  // Get all analytics keys once and filter for events
  const allKeys = await hubKV().keys('analytics')
  const allEventKeys = allKeys.filter(k => k.startsWith('analytics:events:'))

  for (const date of dates) {
    // Filter for rating_screen_shown events for this date
    const shownKeys = allEventKeys.filter(key => {
      const parts = key.split(':')
      // analytics:events:{domain}:{creationId}:rating_screen_shown:{date}
      return parts[4] === 'rating_screen_shown' && parts[5] === date
    })

    // Filter for rating_submitted events for this date
    const submittedKeys = allEventKeys.filter(key => {
      const parts = key.split(':')
      return parts[4] === 'rating_submitted' && parts[5] === date
    })

    // Count screens shown
    for (const key of shownKeys) {
      const counterData = await hubKV().get<ApiCounter>(key)
      const count = counterData?.count || 0
      screensShown += count
    }

    // Count submissions
    for (const key of submittedKeys) {
      const counterData = await hubKV().get<ApiCounter>(key)
      const count = counterData?.count || 0
      submitted += count
    }
  }

  return {
    screensShown,
    submitted
  }
}

/**
 * Generate array of date strings between start and end dates
 */
function getDateRange(startDate: string, endDate: string): string[] {
  const dates: string[] = []
  const start = new Date(startDate)
  const end = new Date(endDate)

  const current = new Date(start)
  while (current <= end) {
    dates.push(getDateString(current))
    current.setDate(current.getDate() + 1)
  }

  return dates
}
