/**
 * Start or update a timer
 * POST /api/v2/timers
 */


export default defineEventHandler(async (event) => {
  const body = await readBody(event)

  const { userId, timerId, duration, label, remaining, status, stepIndex, creationId } = body

  if (!userId || !timerId || !creationId) {
    throw createError({
      statusCode: 400,
      message: 'Missing required fields: userId, timerId, creationId'
    })
  }

  const timer = {
    id: timerId,
    userId,
    creationId,
    duration: duration || 0,
    label: label || 'Timer',
    startTime: status === 'running' ? Date.now() : 0,
    remaining: remaining !== undefined ? remaining : duration,
    status: status || 'running',
    stepIndex
  }

  await storeTimer(timer)

  return {
    ok: true,
    timer
  }
})
