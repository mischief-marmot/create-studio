/**
 * Manual Analytics Rollup Trigger
 * POST /api/admin/analytics/rollup
 *
 * Runs the daily rollup on demand from the admin dashboard.
 */

import { drizzle } from 'drizzle-orm/d1'
import { runDailyRollup } from '@create-studio/analytics/rollup'

export default defineEventHandler(async (event) => {
  const session = await getUserSession(event)
  if (!session?.user) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }

  try {
    const d1Analytics = event.context.cloudflare.env.DB_ANALYTICS as D1Database
    const d1Main = event.context.cloudflare.env.DB as D1Database
    const analyticsDb = drizzle(d1Analytics)
    const mainDb = drizzle(d1Main)
    const result = await runDailyRollup(analyticsDb, mainDb, { includeToday: true })
    return result
  } catch (error) {
    console.error('Error running manual analytics rollup:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to run analytics rollup',
    })
  }
})
