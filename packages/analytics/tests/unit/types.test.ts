import { describe, it, expect, expectTypeOf } from 'vitest'
import type {
  AnalyticsEvent,
  AnalyticsEventType,
  EventBody,
  StoredEvent,
  DailySummary,
  Counter,
} from '../../types'

describe('types', () => {
  describe('AnalyticsEventType', () => {
    it('should accept all valid event type strings', () => {
      const validTypes: AnalyticsEventType[] = [
        'cta_rendered',
        'cta_activated',
        'im_session_start',
        'im_session_complete',
        'rating_screen_shown',
        'rating_submitted',
        'page_view',
        'timer_start',
        'timer_complete',
        'trial_started',
        'trial_converted',
      ]
      expect(validTypes).toHaveLength(11)
    })
  })

  describe('EventBody<T> type extraction', () => {
    it('should extract correct body for cta_rendered', () => {
      expectTypeOf<EventBody<'cta_rendered'>>().toEqualTypeOf<{
        variant: string
        creation_id: string
      }>()
    })

    it('should extract correct body for cta_activated', () => {
      expectTypeOf<EventBody<'cta_activated'>>().toEqualTypeOf<{
        variant: string
        creation_id: string
      }>()
    })

    it('should extract correct body for im_session_start', () => {
      expectTypeOf<EventBody<'im_session_start'>>().toEqualTypeOf<{
        creation_id: string
        total_pages: number
        theme_id?: string
      }>()
    })

    it('should extract correct body for im_session_complete', () => {
      expectTypeOf<EventBody<'im_session_complete'>>().toEqualTypeOf<{
        creation_id: string
        duration: number
        pages_viewed: number
        theme_id?: string
      }>()
    })

    it('should extract correct body for rating_submitted', () => {
      expectTypeOf<EventBody<'rating_submitted'>>().toEqualTypeOf<{
        creation_id: string
        rating: number
      }>()
    })

    it('should extract correct body for page_view', () => {
      expectTypeOf<EventBody<'page_view'>>().toEqualTypeOf<{
        creation_id: string
        page_number: number
        total_pages: number
      }>()
    })

    it('should extract correct body for trial_started', () => {
      expectTypeOf<EventBody<'trial_started'>>().toEqualTypeOf<{
        user_id: string
        plan?: string
        source?: string
      }>()
    })

    it('should extract correct body for trial_converted', () => {
      expectTypeOf<EventBody<'trial_converted'>>().toEqualTypeOf<{
        user_id: string
        plan: string
      }>()
    })
  })

  describe('StoredEvent interface', () => {
    it('should have the correct shape', () => {
      const event: StoredEvent = {
        id: 1,
        type: 'cta_rendered',
        body: '{"variant":"inline","creation_id":"abc"}',
        domain: 'example.com',
        session_id: 'sess_123',
        sample_rate: 1.0,
        created_at: 1710000000,
      }

      expect(event.id).toBe(1)
      expect(event.type).toBe('cta_rendered')
      expect(event.body).toBeTypeOf('string')
      expect(event.domain).toBe('example.com')
      expect(event.session_id).toBe('sess_123')
      expect(event.sample_rate).toBe(1.0)
      expect(event.created_at).toBe(1710000000)
    })

    it('should allow null domain and session_id', () => {
      const event: StoredEvent = {
        id: 1,
        type: 'page_view',
        body: '{"creation_id":"abc","page_number":1,"total_pages":3}',
        domain: null,
        session_id: null,
        sample_rate: 0.1,
        created_at: 1710000000,
      }

      expect(event.domain).toBeNull()
      expect(event.session_id).toBeNull()
    })
  })

  describe('DailySummary interface', () => {
    it('should have the correct shape', () => {
      const summary: DailySummary = {
        id: 1,
        date: '2026-03-11',
        domain: 'example.com',
        metric: 'cta_rendered_count',
        dimensions: '{"variant":"inline"}',
        value: 42,
        sample_rate: 1.0,
        created_at: 1710000000,
      }

      expect(summary.date).toBe('2026-03-11')
      expect(summary.metric).toBe('cta_rendered_count')
      expect(summary.value).toBe(42)
    })

    it('should allow null domain and dimensions', () => {
      const summary: DailySummary = {
        id: 1,
        date: '2026-03-11',
        domain: null,
        metric: 'api_call_count',
        dimensions: null,
        value: 1000,
        sample_rate: 0.001,
        created_at: 1710000000,
      }

      expect(summary.domain).toBeNull()
      expect(summary.dimensions).toBeNull()
    })
  })

  describe('Counter interface', () => {
    it('should have the correct shape', () => {
      const counter: Counter = {
        id: 1,
        key: 'cta_rendered:example.com',
        value: 100,
        updated_at: 1710000000,
      }

      expect(counter.key).toBe('cta_rendered:example.com')
      expect(counter.value).toBe(100)
    })
  })
})
