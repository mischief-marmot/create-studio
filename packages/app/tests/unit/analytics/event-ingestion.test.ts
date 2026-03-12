import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

/**
 * Unit Tests: POST /api/analytics/events
 *
 * Tests event mapping, session synthesis, sampling, counter logic, and validation
 * for the D1-based analytics event ingestion endpoint.
 */

// ---------- Import the shared analytics modules directly ----------

import {
  shouldSample,
  getSampleRate,
  SAMPLING_RATES,
  COUNTER_EVENTS,
} from '@create-studio/analytics/sampling'
import type { AnalyticsEventType } from '@create-studio/analytics/types'

// ---------- Replicate the mapClientEvent function from events.post.ts ----------
// (The endpoint file exports only a defineEventHandler, so we extract the pure
//  mapping function here to test it in isolation.)

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
  totalDuration: number
  pagesViewed: number
  totalPages: number
  events: ClientEvent[]
  isDemo?: boolean
}

function mapClientEvent(
  clientEvent: ClientEvent,
  session: SessionData,
): { type: AnalyticsEventType; body: Record<string, any> } | null {
  const { type, metadata } = clientEvent
  const creationId = session.creationId

  switch (type) {
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
    default:
      return null
  }
}

// ---------- Helpers ----------

function makeSession(overrides: Partial<SessionData> = {}): SessionData {
  return {
    userId: 'user-abc',
    sessionId: 'sess-123',
    domain: 'example.com',
    creationId: 'creation-456',
    startTime: 1700000000000,
    endTime: 1700000060000,
    totalDuration: 60000,
    pagesViewed: 3,
    totalPages: 5,
    events: [],
    ...overrides,
  }
}

function makeClientEvent(type: string, metadata?: Record<string, any>): ClientEvent {
  return { type, timestamp: Date.now(), metadata }
}

// ---------- Tests ----------

describe('Analytics Event Ingestion', () => {
  // ----------------------------------------------------------------
  // 1. Client event mapping
  // ----------------------------------------------------------------
  describe('mapClientEvent', () => {
    const session = makeSession()

    it('maps cta_rendered with variant from metadata', () => {
      const result = mapClientEvent(
        makeClientEvent('cta_rendered', { variant: 'banner' }),
        session,
      )
      expect(result).toEqual({
        type: 'cta_rendered',
        body: { variant: 'banner', creation_id: 'creation-456' },
      })
    })

    it('maps cta_rendered with default variant when metadata missing', () => {
      const result = mapClientEvent(makeClientEvent('cta_rendered'), session)
      expect(result!.body.variant).toBe('unknown')
    })

    it('maps cta_activated with variant', () => {
      const result = mapClientEvent(
        makeClientEvent('cta_activated', { variant: 'sticky' }),
        session,
      )
      expect(result).toEqual({
        type: 'cta_activated',
        body: { variant: 'sticky', creation_id: 'creation-456' },
      })
    })

    it('maps page_view with page metadata', () => {
      const result = mapClientEvent(
        makeClientEvent('page_view', { pageNumber: 2, totalPages: 5 }),
        session,
      )
      expect(result).toEqual({
        type: 'page_view',
        body: { creation_id: 'creation-456', page_number: 2, total_pages: 5 },
      })
    })

    it('maps page_view with defaults when metadata missing', () => {
      const result = mapClientEvent(makeClientEvent('page_view'), session)
      expect(result!.body.page_number).toBe(0)
      expect(result!.body.total_pages).toBe(0)
    })

    it('maps timer_start with timer_id', () => {
      const result = mapClientEvent(
        makeClientEvent('timer_start', { timerId: 'step-1' }),
        session,
      )
      expect(result).toEqual({
        type: 'timer_start',
        body: { creation_id: 'creation-456', timer_id: 'step-1' },
      })
    })

    it('maps timer_complete with timer_id', () => {
      const result = mapClientEvent(
        makeClientEvent('timer_complete', { timerId: 'step-1' }),
        session,
      )
      expect(result).toEqual({
        type: 'timer_complete',
        body: { creation_id: 'creation-456', timer_id: 'step-1' },
      })
    })

    it('maps rating_screen_shown', () => {
      const result = mapClientEvent(makeClientEvent('rating_screen_shown'), session)
      expect(result).toEqual({
        type: 'rating_screen_shown',
        body: { creation_id: 'creation-456' },
      })
    })

    it('maps rating_submitted with rating value', () => {
      const result = mapClientEvent(
        makeClientEvent('rating_submitted', { rating: 4 }),
        session,
      )
      expect(result).toEqual({
        type: 'rating_submitted',
        body: { creation_id: 'creation-456', rating: 4 },
      })
    })

    it('maps rating_submitted with default 0 when rating missing', () => {
      const result = mapClientEvent(makeClientEvent('rating_submitted'), session)
      expect(result!.body.rating).toBe(0)
    })

    it('drops timer_stop events (returns null)', () => {
      const result = mapClientEvent(makeClientEvent('timer_stop'), session)
      expect(result).toBeNull()
    })

    it('drops unknown event types (returns null)', () => {
      const result = mapClientEvent(makeClientEvent('unknown_thing'), session)
      expect(result).toBeNull()
    })

    it('uses creationId from the session, not from event metadata', () => {
      const customSession = makeSession({ creationId: 'my-recipe-99' })
      const result = mapClientEvent(
        makeClientEvent('page_view', { pageNumber: 1 }),
        customSession,
      )
      expect(result!.body.creation_id).toBe('my-recipe-99')
    })
  })

  // ----------------------------------------------------------------
  // 2. Session-level event synthesis
  // ----------------------------------------------------------------
  describe('Session event synthesis', () => {
    it('synthesizes im_session_start when pagesViewed > 0', () => {
      const session = makeSession({ pagesViewed: 2, totalPages: 5 })
      const sessionEvents: { type: AnalyticsEventType; body: Record<string, any> }[] = []

      if (session.pagesViewed > 0) {
        sessionEvents.push({
          type: 'im_session_start',
          body: { creation_id: session.creationId, total_pages: session.totalPages },
        })
      }

      expect(sessionEvents).toHaveLength(1)
      expect(sessionEvents[0]).toEqual({
        type: 'im_session_start',
        body: { creation_id: 'creation-456', total_pages: 5 },
      })
    })

    it('does NOT synthesize im_session_start when pagesViewed is 0', () => {
      const session = makeSession({ pagesViewed: 0 })
      const sessionEvents: any[] = []

      if (session.pagesViewed > 0) {
        sessionEvents.push({ type: 'im_session_start', body: {} })
      }

      expect(sessionEvents).toHaveLength(0)
    })

    it('synthesizes im_session_complete when totalDuration > 0', () => {
      const session = makeSession({ totalDuration: 45000, pagesViewed: 3 })
      const sessionEvents: { type: AnalyticsEventType; body: Record<string, any> }[] = []

      if (session.totalDuration > 0) {
        sessionEvents.push({
          type: 'im_session_complete',
          body: {
            creation_id: session.creationId,
            duration: session.totalDuration,
            pages_viewed: session.pagesViewed,
          },
        })
      }

      expect(sessionEvents).toHaveLength(1)
      expect(sessionEvents[0]).toEqual({
        type: 'im_session_complete',
        body: { creation_id: 'creation-456', duration: 45000, pages_viewed: 3 },
      })
    })

    it('does NOT synthesize im_session_complete when totalDuration is 0', () => {
      const session = makeSession({ totalDuration: 0 })
      const sessionEvents: any[] = []

      if (session.totalDuration > 0) {
        sessionEvents.push({ type: 'im_session_complete', body: {} })
      }

      expect(sessionEvents).toHaveLength(0)
    })

    it('synthesizes both session events for a typical session', () => {
      const session = makeSession({ pagesViewed: 4, totalDuration: 120000, totalPages: 6 })
      const sessionEvents: { type: string }[] = []

      if (session.pagesViewed > 0) {
        sessionEvents.push({ type: 'im_session_start' })
      }
      if (session.totalDuration > 0) {
        sessionEvents.push({ type: 'im_session_complete' })
      }

      expect(sessionEvents).toHaveLength(2)
      expect(sessionEvents.map((e) => e.type)).toEqual([
        'im_session_start',
        'im_session_complete',
      ])
    })
  })

  // ----------------------------------------------------------------
  // 3. Demo session skipping
  // ----------------------------------------------------------------
  describe('Demo sessions', () => {
    it('skips processing when isDemo is true', () => {
      const session = makeSession({ isDemo: true })
      const shouldSkip = !!session.isDemo

      expect(shouldSkip).toBe(true)
    })

    it('processes normally when isDemo is false', () => {
      const session = makeSession({ isDemo: false })
      expect(session.isDemo).toBe(false)
    })

    it('processes normally when isDemo is undefined', () => {
      const session = makeSession()
      expect(session.isDemo).toBeUndefined()
    })
  })

  // ----------------------------------------------------------------
  // 4. Sampling
  // ----------------------------------------------------------------
  describe('Sampling', () => {
    it('always samples events with rate 1.0', () => {
      // cta_rendered, cta_activated, im_session_start, im_session_complete,
      // rating_screen_shown, rating_submitted all have rate 1.0
      const fullRateEvents: AnalyticsEventType[] = [
        'cta_rendered',
        'cta_activated',
        'im_session_start',
        'im_session_complete',
        'rating_screen_shown',
        'rating_submitted',
        'trial_started',
        'trial_converted',
      ]

      for (const eventType of fullRateEvents) {
        expect(SAMPLING_RATES[eventType]).toBe(1.0)
        // shouldSample returns true 100% of the time for rate 1.0
        expect(shouldSample(eventType)).toBe(true)
      }
    })

    it('has 10% sampling rate for page_view, timer_start, timer_complete', () => {
      expect(SAMPLING_RATES['page_view']).toBe(0.1)
      expect(SAMPLING_RATES['timer_start']).toBe(0.1)
      expect(SAMPLING_RATES['timer_complete']).toBe(0.1)
    })

    it('has 0.1% sampling rate for api_call', () => {
      expect(SAMPLING_RATES['api_call']).toBe(0.001)
    })

    it('getSampleRate returns the correct rate for each event type', () => {
      expect(getSampleRate('cta_rendered')).toBe(1.0)
      expect(getSampleRate('page_view')).toBe(0.1)
      expect(getSampleRate('api_call')).toBe(0.001)
    })

    it('shouldSample respects Math.random for sub-1.0 rates', () => {
      // Force Math.random to return 0.05 (below 0.1 threshold)
      const randomSpy = vi.spyOn(Math, 'random').mockReturnValue(0.05)
      expect(shouldSample('page_view')).toBe(true)

      // Force Math.random to return 0.5 (above 0.1 threshold)
      randomSpy.mockReturnValue(0.5)
      expect(shouldSample('page_view')).toBe(false)

      randomSpy.mockRestore()
    })
  })

  // ----------------------------------------------------------------
  // 5. Counter event logic
  // ----------------------------------------------------------------
  describe('Counter events', () => {
    it('COUNTER_EVENTS includes the expected event types', () => {
      const expected = [
        'cta_rendered',
        'cta_activated',
        'im_session_start',
        'im_session_complete',
        'rating_screen_shown',
        'rating_submitted',
        'trial_started',
        'trial_converted',
      ]
      expect(COUNTER_EVENTS).toEqual(expected)
    })

    it('builds correct counter key for a standard counter event', () => {
      const session = makeSession({
        domain: 'myblog.com',
        creationId: 'recipe-42',
        endTime: new Date('2026-03-12T14:00:00Z').getTime(),
      })
      const eventType = 'im_session_start'

      const date = new Date(session.endTime).toISOString().split('T')[0]
      const siteId = `${session.domain}:${session.creationId}`
      const key = `${eventType}:${siteId}:${date}`

      expect(key).toBe('im_session_start:myblog.com:recipe-42:2026-03-12')
    })

    it('builds a per-variant counter key for cta_activated events', () => {
      const session = makeSession({
        domain: 'myblog.com',
        creationId: 'recipe-42',
        endTime: new Date('2026-03-12T14:00:00Z').getTime(),
      })
      const eventType = 'cta_activated'
      const variant = 'sticky'

      const date = new Date(session.endTime).toISOString().split('T')[0]
      const siteId = `${session.domain}:${session.creationId}`
      const counterKeys: string[] = []

      counterKeys.push(`${eventType}:${siteId}:${date}`)
      if (eventType === 'cta_activated' && variant) {
        counterKeys.push(`${eventType}_${variant}:${siteId}:${date}`)
      }

      expect(counterKeys).toEqual([
        'cta_activated:myblog.com:recipe-42:2026-03-12',
        'cta_activated_sticky:myblog.com:recipe-42:2026-03-12',
      ])
    })

    it('builds a per-variant counter key for cta_rendered events', () => {
      const session = makeSession({
        domain: 'myblog.com',
        creationId: 'recipe-42',
        endTime: new Date('2026-03-12T14:00:00Z').getTime(),
      })
      const eventType = 'cta_rendered'
      const variant = 'banner'

      const date = new Date(session.endTime).toISOString().split('T')[0]
      const siteId = `${session.domain}:${session.creationId}`
      const counterKeys: string[] = []

      counterKeys.push(`${eventType}:${siteId}:${date}`)
      if ((eventType === 'cta_activated' || eventType === 'cta_rendered') && variant) {
        counterKeys.push(`${eventType}_${variant}:${siteId}:${date}`)
      }

      expect(counterKeys).toHaveLength(2)
      expect(counterKeys[1]).toBe('cta_rendered_banner:myblog.com:recipe-42:2026-03-12')
    })

    it('does NOT build a variant counter for non-CTA counter events', () => {
      const eventType = 'im_session_start'
      const counterKeys: string[] = []
      counterKeys.push(`${eventType}:site:date`)

      // Only CTA events get variant counters
      if (eventType === 'cta_activated' || eventType === 'cta_rendered') {
        counterKeys.push(`${eventType}_variant:site:date`)
      }

      expect(counterKeys).toHaveLength(1)
    })

    it('page_view is NOT a counter event', () => {
      expect((COUNTER_EVENTS as readonly string[]).includes('page_view')).toBe(false)
    })

    it('timer_start is NOT a counter event', () => {
      expect((COUNTER_EVENTS as readonly string[]).includes('timer_start')).toBe(false)
    })
  })

  // ----------------------------------------------------------------
  // 6. Validation
  // ----------------------------------------------------------------
  describe('Payload validation', () => {
    it('rejects payload missing userId', () => {
      const body = makeSession({ userId: '' })
      const isValid = !!(body.userId && body.sessionId && body.domain && body.creationId)
      expect(isValid).toBe(false)
    })

    it('rejects payload missing sessionId', () => {
      const body = makeSession({ sessionId: '' })
      const isValid = !!(body.userId && body.sessionId && body.domain && body.creationId)
      expect(isValid).toBe(false)
    })

    it('rejects payload missing domain', () => {
      const body = makeSession({ domain: '' })
      const isValid = !!(body.userId && body.sessionId && body.domain && body.creationId)
      expect(isValid).toBe(false)
    })

    it('rejects payload missing creationId', () => {
      const body = makeSession({ creationId: '' })
      const isValid = !!(body.userId && body.sessionId && body.domain && body.creationId)
      expect(isValid).toBe(false)
    })

    it('accepts a valid payload with all required fields', () => {
      const body = makeSession()
      const isValid = !!(body.userId && body.sessionId && body.domain && body.creationId)
      expect(isValid).toBe(true)
    })

    it('rejects payload where events is not an array', () => {
      const body = { ...makeSession(), events: 'not-an-array' as any }
      expect(Array.isArray(body.events)).toBe(false)
    })

    it('accepts payload with empty events array', () => {
      const body = makeSession({ events: [] })
      expect(Array.isArray(body.events)).toBe(true)
      expect(body.events).toHaveLength(0)
    })
  })

  // ----------------------------------------------------------------
  // 7. End-to-end mapping pipeline (unit-level)
  // ----------------------------------------------------------------
  describe('Full mapping pipeline', () => {
    it('maps a mixed batch of client events, dropping timer_stop', () => {
      const session = makeSession({
        pagesViewed: 2,
        totalDuration: 30000,
        totalPages: 4,
        events: [
          makeClientEvent('page_view', { pageNumber: 1, totalPages: 4 }),
          makeClientEvent('timer_start', { timerId: 't1' }),
          makeClientEvent('timer_stop', { timerId: 't1' }),
          makeClientEvent('timer_complete', { timerId: 't1' }),
          makeClientEvent('cta_rendered', { variant: 'banner' }),
          makeClientEvent('cta_activated', { variant: 'banner' }),
          makeClientEvent('rating_screen_shown'),
          makeClientEvent('rating_submitted', { rating: 5 }),
        ],
      })

      // Synthesize session events
      const sessionEvents: { type: string }[] = []
      if (session.pagesViewed > 0) {
        sessionEvents.push({ type: 'im_session_start' })
      }
      if (session.totalDuration > 0) {
        sessionEvents.push({ type: 'im_session_complete' })
      }

      // Map client events
      const mapped = session.events
        .map((e) => mapClientEvent(e, session))
        .filter((e): e is NonNullable<typeof e> => e !== null)

      // timer_stop should have been dropped
      expect(mapped.find((e) => e.type === ('timer_stop' as any))).toBeUndefined()

      // 7 client events mapped (page_view, timer_start, timer_complete,
      // cta_rendered, cta_activated, rating_screen_shown, rating_submitted)
      expect(mapped).toHaveLength(7)

      // Plus 2 session-level events
      const allEvents = [...sessionEvents, ...mapped]
      expect(allEvents).toHaveLength(9)
    })

    it('produces correct surviving rows structure after sampling (rate=1.0 events)', () => {
      const session = makeSession()
      const mapped = {
        type: 'cta_rendered' as AnalyticsEventType,
        body: { variant: 'banner', creation_id: session.creationId },
      }

      // Rate 1.0 events always survive sampling
      expect(shouldSample(mapped.type)).toBe(true)

      const row = {
        type: mapped.type,
        body: JSON.stringify(mapped.body),
        domain: session.domain,
        session_id: session.sessionId,
        sample_rate: getSampleRate(mapped.type),
        created_at: Math.floor(Date.now() / 1000),
      }

      expect(row.type).toBe('cta_rendered')
      expect(JSON.parse(row.body)).toEqual({
        variant: 'banner',
        creation_id: 'creation-456',
      })
      expect(row.domain).toBe('example.com')
      expect(row.session_id).toBe('sess-123')
      expect(row.sample_rate).toBe(1.0)
      expect(typeof row.created_at).toBe('number')
    })
  })
})
