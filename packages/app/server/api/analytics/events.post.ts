/**
 * Analytics event receiver endpoint
 * POST /api/analytics/events
 *
 * Receives batched analytics events from the client widget and stores them
 * in the D1 analytics database. Replaces the old KV-based storage.
 */

import { shouldSample, getSampleRate, COUNTER_EVENTS } from '@create-studio/analytics/sampling'
import { insertEvents } from '@create-studio/analytics/queries/events'
import { incrementCounter } from '@create-studio/analytics/queries/counters'
import type { AnalyticsEventType } from '@create-studio/analytics/types'
import { useAnalyticsDB } from '#server/utils/analytics-db'

interface ClientEvent {
  type: string
  timestamp: number
  metadata?: Record<string, any>
}

interface SessionData {
  userId: string
  sessionId: string
  domain: string
  creationId: string
  startTime: number
  endTime: number
  events: ClientEvent[]
  isDemo?: boolean
}

/**
 * Map a client event (from useAnalytics) to a D1 event row.
 * The client sends flat event objects; we need to reshape the body
 * to match the AnalyticsEvent discriminated union.
 */
function mapClientEvent(
  clientEvent: ClientEvent,
  session: SessionData,
): { type: AnalyticsEventType; body: Record<string, any> } | null {
  const { type, metadata } = clientEvent
  const creationId = session.creationId

  switch (type) {
    case 'im_session_start':
      return {
        type: 'im_session_start',
        body: {
          creation_id: metadata?.creationId ?? creationId,
          total_pages: metadata?.totalPages ?? 0,
        },
      }
    case 'im_session_complete':
      return {
        type: 'im_session_complete',
        body: {
          creation_id: metadata?.creationId ?? creationId,
          duration: metadata?.duration ?? 0,
          pages_viewed: metadata?.pagesViewed ?? 0,
          total_pages: metadata?.totalPages ?? 0,
        },
      }
    case 'cta_rendered':
      return {
        type: 'cta_rendered',
        body: { variant: metadata?.variant ?? 'unknown', creation_id: creationId },
      }
    case 'cta_activated':
      return {
        type: 'cta_activated',
        body: { variant: metadata?.variant ?? 'unknown', creation_id: creationId },
      }
    case 'page_view':
      return {
        type: 'page_view',
        body: {
          creation_id: creationId,
          page_number: metadata?.pageNumber ?? 0,
          total_pages: metadata?.totalPages ?? 0,
        },
      }
    case 'timer_start':
      return {
        type: 'timer_start',
        body: { creation_id: creationId, timer_id: metadata?.timerId },
      }
    case 'timer_complete':
      return {
        type: 'timer_complete',
        body: { creation_id: creationId, timer_id: metadata?.timerId },
      }
    case 'rating_screen_shown':
      return {
        type: 'rating_screen_shown',
        body: { creation_id: creationId },
      }
    case 'rating_submitted':
      return {
        type: 'rating_submitted',
        body: { creation_id: creationId, rating: metadata?.rating ?? 0 },
      }
    // timer_stop is a client-side event that doesn't map to a stored type — skip
    default:
      return null
  }
}

export default defineEventHandler(async (event) => {
  try {
    // Client sends JSON but with Content-Type: text/plain to skip the CORS
    // preflight. Parse manually so Content-Type doesn't matter.
    const raw = await readRawBody(event)
    let body: SessionData
    try {
      body = JSON.parse(raw || '{}') as SessionData
    } catch {
      throw createError({ statusCode: 400, statusMessage: 'Invalid JSON body' })
    }

    // Validate required fields
    if (!body.userId || !body.sessionId || !body.domain || !body.creationId) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Missing required fields',
      })
    }

    // Validate events array
    if (!Array.isArray(body.events)) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Events must be an array',
      })
    }

    // Skip demo traffic entirely
    if (body.isDemo) {
      return { success: true, message: 'Demo traffic ignored' }
    }

    const analyticsDb = useAnalyticsDB(event)
    const now = Math.floor(Date.now() / 1000)

    // --- Map client events ---

    const allMapped: { type: AnalyticsEventType; body: Record<string, any> }[] = []
    for (const clientEvt of body.events) {
      const mapped = mapClientEvent(clientEvt, body)
      if (mapped) {
        allMapped.push(mapped)
      }
    }

    // --- Apply per-event-type sampling ---

    const survivingRows: {
      type: AnalyticsEventType
      body: string
      domain: string | null
      session_id: string | null
      sample_rate: number
      created_at: number
    }[] = []

    const counterKeys: string[] = []

    for (const mapped of allMapped) {
      if (!shouldSample(mapped.type)) {
        continue
      }

      survivingRows.push({
        type: mapped.type,
        body: JSON.stringify(mapped.body),
        domain: body.domain,
        session_id: body.sessionId,
        sample_rate: getSampleRate(mapped.type),
        created_at: now,
      })

      // For counter events, build the counter key
      if ((COUNTER_EVENTS as readonly string[]).includes(mapped.type)) {
        const date = new Date(body.endTime).toISOString().split('T')[0]
        const siteId = `${body.domain}:${body.creationId}`
        counterKeys.push(`${mapped.type}:${siteId}:${date}`)

        // For CTA events, also store a per-variant counter
        if (
          (mapped.type === 'cta_activated' || mapped.type === 'cta_rendered') &&
          mapped.body.variant
        ) {
          counterKeys.push(`${mapped.type}_${mapped.body.variant}:${siteId}:${date}`)
        }
      }
    }

    // --- Batch insert events ---

    if (survivingRows.length > 0) {
      await insertEvents(analyticsDb, survivingRows)
    }

    // --- Increment counters (fire-and-forget for speed) ---

    if (counterKeys.length > 0) {
      // Don't await — counters are best-effort and shouldn't block the response
      Promise.all(
        counterKeys.map((key) => incrementCounter(analyticsDb, key)),
      ).catch((err) => {
        console.error('[Analytics] Counter increment error:', err)
      })
    }

    return {
      success: true,
      message: 'Analytics events recorded',
    }
  } catch (error: any) {
    // Re-throw client errors (400s)
    if (error?.statusCode === 400) {
      throw error
    }

    console.error('[Analytics] Error recording analytics:', error)

    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to record analytics events',
    })
  }
})
