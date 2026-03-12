/**
 * Interactive Mode Analytics
 * Returns session engagement, timer, rating, and CTA data from D1 daily_summaries.
 */

import { drizzle } from 'drizzle-orm/d1'
import {
  getInteractiveMetrics,
  getTimerMetrics,
  getRatingMetrics,
  getCTAMetrics,
} from '../../../utils/analytics-queries'

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

    const [interactive, timers, ratings, cta] = await Promise.all([
      getInteractiveMetrics(db, startDate, endDate),
      getTimerMetrics(db, startDate, endDate),
      getRatingMetrics(db, startDate, endDate),
      getCTAMetrics(db, startDate, endDate),
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
