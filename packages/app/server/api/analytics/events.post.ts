/**
 * Analytics event receiver endpoint
 * POST /api/analytics/events
 *
 * Receives batched analytics events from client and stores them in KV
 */

import type { SessionData } from '~/server/utils/analytics'

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody<SessionData>(event)

    // Validate required fields
    if (!body.userId || !body.sessionId || !body.domain || !body.creationId) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Missing required fields'
      })
    }

    // Validate events array
    if (!Array.isArray(body.events)) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Events must be an array'
      })
    }

    // Store the session data
    await storeSession(body)

    // Update daily aggregate for this site/creation
    await updateDailyAggregate(body)

    // Update global summary
    await updateGlobalSummary(body)

    // Store individual event counters for dashboard queries
    const date = getDateString(new Date(body.endTime))
    const siteId = `${body.domain}:${body.creationId}`

    for (const evt of body.events) {
      const eventKey = getAnalyticsKey(['events', siteId, evt.type, date])
      await incrementCounter(eventKey)
    }

    return {
      success: true,
      message: 'Analytics events recorded'
    }
  } catch (error) {
    console.error('[Analytics] Error recording analytics:', error)

    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to record analytics events'
    })
  }
})
