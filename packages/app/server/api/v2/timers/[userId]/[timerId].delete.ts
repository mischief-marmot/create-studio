/**
 * Delete a timer
 * DELETE /api/v2/timers/:userId/:timerId
 */

export default defineEventHandler(async (event) => {
  const userId = getRouterParam(event, 'userId')
  const timerId = getRouterParam(event, 'timerId')

  if (!userId || !timerId) {
    throw createError({
      statusCode: 400,
      message: 'Missing userId or timerId'
    })
  }

  await deleteTimer(userId, timerId)

  return {
    ok: true
  }
})
