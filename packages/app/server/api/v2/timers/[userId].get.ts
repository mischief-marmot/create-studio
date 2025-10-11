/**
 * Get all timers for a user
 * GET /api/v2/timers/:userId
 */

import { getUserTimers, calculateRemaining } from '~~/server/utils/timerManager'

export default defineEventHandler(async (event) => {
  const userId = getRouterParam(event, 'userId')

  if (!userId) {
    throw createError({
      statusCode: 400,
      message: 'Missing userId'
    })
  }

  const timers = await getUserTimers(userId)

  // Calculate current remaining time for running timers
  const timersWithRemaining = timers.map(timer => ({
    ...timer,
    remaining: calculateRemaining(timer)
  }))

  return {
    ok: true,
    timers: timersWithRemaining
  }
})
