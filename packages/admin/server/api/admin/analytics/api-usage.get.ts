/**
 * API Version Usage Analytics
 * Returns v1 vs v2 API call counts and endpoint breakdown
 */

import type { ApiCounter } from '~~/server/utils/analytics-types'
import { getAnalyticsKey, getDateString } from '~~/server/utils/analytics-types'

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
    return await getApiUsageData(startDate, endDate)
  } catch (error) {
    console.error('Error fetching API usage data:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to fetch API usage data',
    })
  }
})

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
