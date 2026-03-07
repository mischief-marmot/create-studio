/**
 * Interactive Mode Analytics
 * Returns session engagement, timer, rating, and CTA data
 */

import type { SessionData, ApiCounter } from '~~/server/utils/analytics-types'
import { getDateString } from '~~/server/utils/analytics-types'

export default defineEventHandler(async (event) => {
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
    const [interactive, timers, ratings, cta] = await Promise.all([
      getInteractiveData(startDate, endDate),
      getTimerData(startDate, endDate),
      getRatingData(startDate, endDate),
      getCTAData(startDate, endDate),
    ])

    return { interactive, timers, ratings, cta }
  } catch (error) {
    console.error('Error fetching interactive analytics data:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to fetch interactive analytics data',
    })
  }
})

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

async function getCTAData(startDate: string, endDate: string) {
  const dates = getDateRange(startDate, endDate)

  const variants = ['button', 'inline-banner', 'sticky-bar', 'tooltip'] as const
  const activations: Record<string, number> = {
    button: 0,
    'inline-banner': 0,
    'sticky-bar': 0,
    tooltip: 0,
  }
  const renders: Record<string, number> = {
    button: 0,
    'inline-banner': 0,
    'sticky-bar': 0,
    tooltip: 0,
  }
  let totalActivations = 0
  let totalRenders = 0

  const allKeys = await kv.keys('analytics')
  const allEventKeys = allKeys.filter((k) => k.startsWith('analytics:events:'))

  for (const date of dates) {
    for (const variant of variants) {
      // Count activations (clicks)
      const activationKeys = allEventKeys.filter((key) => {
        const parts = key.split(':')
        return parts[4] === `cta_activated_${variant}` && parts[5] === date
      })

      for (const key of activationKeys) {
        const counterData = await kv.get<ApiCounter>(key)
        const count = counterData?.count || 0
        activations[variant] += count
        totalActivations += count
      }

      // Count renders (impressions)
      const renderKeys = allEventKeys.filter((key) => {
        const parts = key.split(':')
        return parts[4] === `cta_rendered_${variant}` && parts[5] === date
      })

      for (const key of renderKeys) {
        const counterData = await kv.get<ApiCounter>(key)
        const count = counterData?.count || 0
        renders[variant] += count
        totalRenders += count
      }
    }
  }

  return {
    totalActivations,
    totalRenders,
    variants: Object.fromEntries(
      variants.map(v => [v, {
        renders: renders[v],
        activations: activations[v],
        conversionRate: renders[v] > 0 ? Math.round((activations[v] / renders[v]) * 10000) / 100 : 0,
      }])
    ),
  }
}

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
