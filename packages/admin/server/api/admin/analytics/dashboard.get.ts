/**
 * Analytics Dashboard API for Admin
 * Aggregates all analytics data from D1 daily_summaries via Drizzle.
 */

import { drizzle } from 'drizzle-orm/d1'
import { getDashboardAnalytics } from '../../../utils/analytics-queries'

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
    const d1 = event.context.cloudflare.env.DB_ANALYTICS as D1Database
    const db = drizzle(d1)
    return await getDashboardAnalytics(db, startDate, endDate)
  } catch (error) {
    console.error('Error fetching analytics dashboard data:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to fetch analytics data',
    })
  }
})
