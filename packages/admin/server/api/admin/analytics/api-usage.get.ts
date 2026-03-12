/**
 * API Version Usage Analytics
 * Returns v1 vs v2 API call counts and endpoint breakdown from D1 daily_summaries.
 */

import { drizzle } from 'drizzle-orm/d1'
import { getApiUsageMetrics } from '../../../utils/analytics-queries'

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
    const d1 = event.context.cloudflare.env.DB_ANALYTICS as D1Database
    const db = drizzle(d1)
    return await getApiUsageMetrics(db, startDate, endDate)
  } catch (error) {
    console.error('Error fetching API usage data:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to fetch API usage data',
    })
  }
})
