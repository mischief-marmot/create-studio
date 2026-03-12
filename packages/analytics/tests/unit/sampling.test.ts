import { describe, it, expect } from 'vitest'
import {
  SAMPLING_RATES,
  COUNTER_EVENTS,
  shouldSample,
  getSampleRate,
} from '../../sampling'
import type { AnalyticsEventType } from '../../types'

// All 12 event types defined in the AnalyticsEvent union
const ALL_EVENT_TYPES: AnalyticsEventType[] = [
  'cta_rendered',
  'cta_activated',
  'im_session_start',
  'im_session_complete',
  'rating_screen_shown',
  'rating_submitted',
  'page_view',
  'timer_start',
  'timer_complete',
  'api_call',
  'trial_started',
  'trial_converted',
]

describe('sampling', () => {
  describe('SAMPLING_RATES', () => {
    it('should define a sampling rate for all 12 event types', () => {
      expect(Object.keys(SAMPLING_RATES)).toHaveLength(12)
      for (const eventType of ALL_EVENT_TYPES) {
        expect(SAMPLING_RATES).toHaveProperty(eventType)
        expect(typeof SAMPLING_RATES[eventType]).toBe('number')
      }
    })

    it('should have rates between 0 and 1 (inclusive)', () => {
      for (const [type, rate] of Object.entries(SAMPLING_RATES)) {
        expect(rate, `${type} rate should be >= 0`).toBeGreaterThanOrEqual(0)
        expect(rate, `${type} rate should be <= 1`).toBeLessThanOrEqual(1)
      }
    })

    it('should set 100% for high-value events', () => {
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
        expect(SAMPLING_RATES[eventType], `${eventType} should be 1.0`).toBe(1.0)
      }
    })

    it('should set 10% for page_view, timer_start, timer_complete', () => {
      expect(SAMPLING_RATES.page_view).toBe(0.1)
      expect(SAMPLING_RATES.timer_start).toBe(0.1)
      expect(SAMPLING_RATES.timer_complete).toBe(0.1)
    })

    it('should set 0.1% for api_call', () => {
      expect(SAMPLING_RATES.api_call).toBe(0.001)
    })
  })

  describe('COUNTER_EVENTS', () => {
    it('should contain the expected event types', () => {
      const expected: AnalyticsEventType[] = [
        'cta_rendered',
        'cta_activated',
        'im_session_start',
        'im_session_complete',
        'rating_screen_shown',
        'rating_submitted',
        'trial_started',
        'trial_converted',
      ]
      expect(COUNTER_EVENTS).toEqual(expect.arrayContaining(expected))
      expect(COUNTER_EVENTS).toHaveLength(expected.length)
    })

    it('should NOT contain sampled events', () => {
      expect(COUNTER_EVENTS).not.toContain('page_view')
      expect(COUNTER_EVENTS).not.toContain('timer_start')
      expect(COUNTER_EVENTS).not.toContain('timer_complete')
      expect(COUNTER_EVENTS).not.toContain('api_call')
    })
  })

  describe('getSampleRate()', () => {
    it('should return the correct rate for each event type', () => {
      for (const eventType of ALL_EVENT_TYPES) {
        expect(getSampleRate(eventType)).toBe(SAMPLING_RATES[eventType])
      }
    })
  })

  describe('shouldSample()', () => {
    it('should always return true for 100% sampled events', () => {
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

      // Run each 100 times to be sure
      for (const eventType of fullRateEvents) {
        for (let i = 0; i < 100; i++) {
          expect(shouldSample(eventType), `${eventType} should always be sampled`).toBe(true)
        }
      }
    })

    it('should not always return true for 10% sampled events', () => {
      // Over 1000 trials, a 10% rate should produce some false results.
      // The probability of all 1000 returning true at 10% is astronomically low.
      const lowRateEvents: AnalyticsEventType[] = ['page_view', 'timer_start', 'timer_complete']

      for (const eventType of lowRateEvents) {
        let trueCount = 0
        const trials = 1000
        for (let i = 0; i < trials; i++) {
          if (shouldSample(eventType)) trueCount++
        }
        expect(trueCount, `${eventType} should not always be true`).toBeLessThan(trials)
        expect(trueCount, `${eventType} should sometimes be true`).toBeGreaterThan(0)
      }
    })

    it('should have a very low acceptance rate for api_call (0.1%)', () => {
      let trueCount = 0
      const trials = 10000
      for (let i = 0; i < trials; i++) {
        if (shouldSample('api_call')) trueCount++
      }
      // With 0.1% rate over 10000 trials, expect roughly 10 (allow 0 to 50)
      expect(trueCount, 'api_call should rarely be sampled').toBeLessThan(50)
    })
  })
})
