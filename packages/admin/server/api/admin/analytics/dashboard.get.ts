/**
 * Analytics Dashboard API for Admin
 * Aggregates analytics data from the shared KV store
 */

import type { SessionData, ApiCounter } from '~~/server/utils/analytics-types'
import { getAnalyticsKey, getDateString } from '~~/server/utils/analytics-types'

export default defineEventHandler(async (event) => {
  // Auth check
  const session = await getUserSession(event)
  if (!session?.user) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }

  const query = getQuery(event)
  const startDate = query.startDate as string
  const endDate = query.endDate as string

  if (!startDate || !endDate) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Start date and end date are required',
    })
  }

  try {
    const [apiUsage, interactive, timers, ratings] = await Promise.all([
      getApiUsageData(startDate, endDate),
      getInteractiveData(startDate, endDate),
      getTimerData(startDate, endDate),
      getRatingData(startDate, endDate),
    ])

    return { apiUsage, interactive, timers, ratings }
  } catch (error) {
    console.error('Error fetching analytics dashboard data:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to fetch analytics data',
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
    const allApiKeys = await kv.keys('analytics:api')

    const v1Keys = allApiKeys.filter((key) => {
      const parts = key.split(':')
      return parts[2] === 'v1' && parts[4] === date && parts.length === 5
    })

    const v2Keys = allApiKeys.filter((key) => {
      const parts = key.split(':')
      return parts[2] === 'v2' && parts[4] === date && parts.length === 5
    })

    for (const key of v1Keys) {
      if (key.endsWith(':errors')) continue

      const parts = key.split(':')
      const endpoint = parts[3]

      const counterData = await kv.get<ApiCounter>(key)
      const count = counterData?.count || 0

      const errorKey = getAnalyticsKey(['api', 'v1', endpoint, date, 'errors'])
      const errorData = await kv.get<ApiCounter>(errorKey)
      const errors = errorData?.count || 0

      v1Total += count

      if (!v1Endpoints[endpoint]) {
        v1Endpoints[endpoint] = { count: 0, errors: 0 }
      }
      v1Endpoints[endpoint].count += count
      v1Endpoints[endpoint].errors += errors
    }

    for (const key of v2Keys) {
      if (key.endsWith(':errors')) continue
      const counterData = await kv.get<ApiCounter>(key)
      const count = counterData?.count || 0
      v2Total += count
    }
  }

  return { v1Total, v2Total, v1Endpoints }
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

  const allKeys = await kv.keys('analytics')
  const allSessionKeys = allKeys.filter((k) => k.startsWith('analytics:session:'))

  const startTimestamp = new Date(startDate + 'T00:00:00.000Z').getTime()
  const endTimestamp = new Date(endDate + 'T23:59:59.999Z').getTime()

  for (const key of allSessionKeys) {
    const sessionData = await kv.get<SessionData>(key)

    if (sessionData) {
      if (sessionData.endTime >= startTimestamp && sessionData.endTime <= endTimestamp) {
        totalSessions++
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
    totalPages,
  }
}

/**
 * Get timer analytics
 */
async function getTimerData(startDate: string, endDate: string) {
  const dates = getDateRange(startDate, endDate)

  let started = 0
  let completed = 0

  const allKeys = await kv.keys('analytics')
  const allEventKeys = allKeys.filter((k) => k.startsWith('analytics:events:'))

  for (const date of dates) {
    const startKeys = allEventKeys.filter((key) => {
      const parts = key.split(':')
      return parts[4] === 'timer_start' && parts[5] === date
    })

    const completeKeys = allEventKeys.filter((key) => {
      const parts = key.split(':')
      return parts[4] === 'timer_complete' && parts[5] === date
    })

    for (const key of startKeys) {
      const counterData = await kv.get<ApiCounter>(key)
      started += counterData?.count || 0
    }

    for (const key of completeKeys) {
      const counterData = await kv.get<ApiCounter>(key)
      completed += counterData?.count || 0
    }
  }

  return { started, completed }
}

/**
 * Get rating analytics
 */
async function getRatingData(startDate: string, endDate: string) {
  const dates = getDateRange(startDate, endDate)

  let screensShown = 0
  let submitted = 0

  const allKeys = await kv.keys('analytics')
  const allEventKeys = allKeys.filter((k) => k.startsWith('analytics:events:'))

  for (const date of dates) {
    const shownKeys = allEventKeys.filter((key) => {
      const parts = key.split(':')
      return parts[4] === 'rating_screen_shown' && parts[5] === date
    })

    const submittedKeys = allEventKeys.filter((key) => {
      const parts = key.split(':')
      return parts[4] === 'rating_submitted' && parts[5] === date
    })

    for (const key of shownKeys) {
      const counterData = await kv.get<ApiCounter>(key)
      screensShown += counterData?.count || 0
    }

    for (const key of submittedKeys) {
      const counterData = await kv.get<ApiCounter>(key)
      submitted += counterData?.count || 0
    }
  }

  return { screensShown, submitted }
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
