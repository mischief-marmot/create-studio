import { describe, it, expect, vi, beforeEach } from 'vitest'

/**
 * Unit Tests: Interactive Analytics Endpoint (D1 migration)
 *
 * Tests the DESIRED behavior after migrating from KV to D1.
 * The endpoint should query daily_summaries and counters from the
 * @create-studio/analytics package instead of scanning KV keys.
 *
 * These tests will FAIL until the endpoint is rewritten.
 */

// ---------------------------------------------------------------------------
// We test extracted pure functions that the endpoint should delegate to.
// The endpoint handler itself is a thin Nitro wrapper around these functions,
// so we import them directly once they exist.
//
// Expected module: packages/admin/server/utils/analytics-queries.ts
// Expected exports:
//   - getInteractiveMetrics(db, startDate, endDate)
//   - getTimerMetrics(db, startDate, endDate)
//   - getRatingMetrics(db, startDate, endDate)
//   - getCTAMetrics(db, startDate, endDate)
// ---------------------------------------------------------------------------

import {
  getInteractiveMetrics,
  getTimerMetrics,
  getRatingMetrics,
  getCTAMetrics,
} from '../../../server/utils/analytics-queries'

// ---------------------------------------------------------------------------
// Mock DB helper
// ---------------------------------------------------------------------------

/**
 * Build a mock Drizzle-like DB that returns canned rows for select().from().where() chains.
 * Each call to `addRows(rows)` queues a result set; calls are consumed in order.
 */
function createMockDb(resultSets: Record<string, any>[][] = []) {
  let callIndex = 0

  // Create a proxy that supports Drizzle's chained function call pattern:
  // db.select().from(table).where(condition).groupBy(col)
  // Each method call returns the proxy. Awaiting resolves to the next result set.
  const handler: ProxyHandler<object> = {
    get(_target: any, prop: string) {
      if (prop === 'then') {
        return (resolve: any) => {
          const rows = resultSets[callIndex] ?? []
          callIndex++
          return Promise.resolve(resolve(rows))
        }
      }
      // Return a function that accepts any args and returns the proxy for chaining
      return (..._args: any[]) => proxy
    },
  }
  const proxy = new Proxy({}, handler)
  return proxy
}

// ---------------------------------------------------------------------------
// Helpers – build daily_summaries rows matching the schema
// ---------------------------------------------------------------------------

interface SummaryRow {
  id?: number
  date: string
  domain?: string | null
  metric: string
  dimensions?: string | null
  value: number
  sample_rate?: number
  created_at?: number
}

function makeSummary(overrides: Partial<SummaryRow> & Pick<SummaryRow, 'date' | 'metric' | 'value'>): SummaryRow {
  return {
    id: 1,
    domain: null,
    dimensions: null,
    sample_rate: 1.0,
    created_at: Math.floor(Date.now() / 1000),
    ...overrides,
  }
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('Interactive Analytics – D1 queries', () => {
  // ----------------------------------------------------------------
  // 1. IM Session Metrics
  // ----------------------------------------------------------------
  describe('getInteractiveMetrics', () => {
    it('returns total sessions from im_session_start daily summaries', async () => {
      const db = createMockDb([
        // querySummaries for im_session_start (globalOnly)
        [
          makeSummary({ date: '2026-03-10', metric: 'im_session_start', value: 50 }),
          makeSummary({ date: '2026-03-11', metric: 'im_session_start', value: 75 }),
        ],
        // querySummaries for im_session_complete (globalOnly)
        [
          makeSummary({ date: '2026-03-10', metric: 'im_session_complete', value: 40 }),
          makeSummary({ date: '2026-03-11', metric: 'im_session_complete', value: 60 }),
        ],
        // queryDomainBreakdown for unique domains
        [
          { domain: 'site-a.com', total: 80 },
          { domain: 'site-b.com', total: 45 },
        ],
        // querySummaries for page_view (sampled at 0.1)
        [
          makeSummary({ date: '2026-03-10', metric: 'page_view', value: 30, sample_rate: 0.1 }),
          makeSummary({ date: '2026-03-11', metric: 'page_view', value: 45, sample_rate: 0.1 }),
        ],
      ])

      const result = await getInteractiveMetrics(db as any, '2026-03-10', '2026-03-11')

      expect(result.totalSessions).toBe(125) // 50 + 75
      expect(result.uniqueDomains).toBe(2)
      expect(result.completionRate).toBeCloseTo(80) // 100/125 = 80%
    })

    it('returns zero metrics when no data exists', async () => {
      const db = createMockDb([[], [], [], []])

      const result = await getInteractiveMetrics(db as any, '2026-03-10', '2026-03-11')

      expect(result.totalSessions).toBe(0)
      expect(result.uniqueDomains).toBe(0)
      expect(result.completionRate).toBe(0)
    })

    it('extrapolates page_view counts at 10x (sample_rate 0.1)', async () => {
      const db = createMockDb([
        // im_session_start
        [makeSummary({ date: '2026-03-10', metric: 'im_session_start', value: 10 })],
        // im_session_complete
        [makeSummary({ date: '2026-03-10', metric: 'im_session_complete', value: 8 })],
        // domain breakdown
        [{ domain: 'site-a.com', total: 10 }],
        // page_view at 10% sample rate
        [makeSummary({ date: '2026-03-10', metric: 'page_view', value: 5, sample_rate: 0.1 })],
      ])

      const result = await getInteractiveMetrics(db as any, '2026-03-10', '2026-03-10')

      // 5 sampled at 0.1 -> extrapolated to 50
      expect(result.totalPageViews).toBe(50)
    })

    it('handles date range filtering via startDate and endDate', async () => {
      // This test verifies the function passes dates through to the query layer.
      // The mock DB doesn't filter, but we verify the function signature accepts dates.
      const db = createMockDb([[], [], [], []])

      const result = await getInteractiveMetrics(db as any, '2026-01-01', '2026-01-31')

      expect(result).toBeDefined()
      expect(result.totalSessions).toBe(0)
    })
  })

  // ----------------------------------------------------------------
  // 2. Timer Metrics
  // ----------------------------------------------------------------
  describe('getTimerMetrics', () => {
    it('returns timer starts and completions from daily summaries', async () => {
      const db = createMockDb([
        // timer_start summaries (sampled at 0.1)
        [
          makeSummary({ date: '2026-03-10', metric: 'timer_start', value: 20, sample_rate: 0.1 }),
          makeSummary({ date: '2026-03-11', metric: 'timer_start', value: 30, sample_rate: 0.1 }),
        ],
        // timer_complete summaries (sampled at 0.1)
        [
          makeSummary({ date: '2026-03-10', metric: 'timer_complete', value: 15, sample_rate: 0.1 }),
          makeSummary({ date: '2026-03-11', metric: 'timer_complete', value: 25, sample_rate: 0.1 }),
        ],
      ])

      const result = await getTimerMetrics(db as any, '2026-03-10', '2026-03-11')

      // Extrapolated at 10x: (20+30)*10 = 500 starts, (15+25)*10 = 400 completions
      expect(result.started).toBe(500)
      expect(result.completed).toBe(400)
      expect(result.completionRate).toBeCloseTo(80) // 400/500 = 80%
    })

    it('returns zeros when no timer data exists', async () => {
      const db = createMockDb([[], []])

      const result = await getTimerMetrics(db as any, '2026-03-10', '2026-03-11')

      expect(result.started).toBe(0)
      expect(result.completed).toBe(0)
      expect(result.completionRate).toBe(0)
    })

    it('extrapolates timer metrics at 10x (sample_rate 0.1)', async () => {
      const db = createMockDb([
        [makeSummary({ date: '2026-03-10', metric: 'timer_start', value: 7, sample_rate: 0.1 })],
        [makeSummary({ date: '2026-03-10', metric: 'timer_complete', value: 3, sample_rate: 0.1 })],
      ])

      const result = await getTimerMetrics(db as any, '2026-03-10', '2026-03-10')

      expect(result.started).toBe(70)
      expect(result.completed).toBe(30)
    })
  })

  // ----------------------------------------------------------------
  // 3. Rating Metrics
  // ----------------------------------------------------------------
  describe('getRatingMetrics', () => {
    it('returns screens shown, submitted, and conversion rate from daily summaries', async () => {
      const db = createMockDb([
        // rating_screen_shown (rate 1.0)
        [
          makeSummary({ date: '2026-03-10', metric: 'rating_screen_shown', value: 100 }),
          makeSummary({ date: '2026-03-11', metric: 'rating_screen_shown', value: 150 }),
        ],
        // rating_submitted (rate 1.0)
        [
          makeSummary({ date: '2026-03-10', metric: 'rating_submitted', value: 20 }),
          makeSummary({ date: '2026-03-11', metric: 'rating_submitted', value: 30 }),
        ],
      ])

      const result = await getRatingMetrics(db as any, '2026-03-10', '2026-03-11')

      expect(result.screensShown).toBe(250) // 100 + 150
      expect(result.submitted).toBe(50) // 20 + 30
      expect(result.conversionRate).toBeCloseTo(20) // 50/250 = 20%
    })

    it('returns zeros when no rating data exists', async () => {
      const db = createMockDb([[], []])

      const result = await getRatingMetrics(db as any, '2026-03-10', '2026-03-11')

      expect(result.screensShown).toBe(0)
      expect(result.submitted).toBe(0)
      expect(result.conversionRate).toBe(0)
    })

    it('does not extrapolate rating metrics (sample_rate 1.0)', async () => {
      const db = createMockDb([
        [makeSummary({ date: '2026-03-10', metric: 'rating_screen_shown', value: 42, sample_rate: 1.0 })],
        [makeSummary({ date: '2026-03-10', metric: 'rating_submitted', value: 10, sample_rate: 1.0 })],
      ])

      const result = await getRatingMetrics(db as any, '2026-03-10', '2026-03-10')

      expect(result.screensShown).toBe(42) // No extrapolation — 1:1
      expect(result.submitted).toBe(10)
    })
  })

  // ----------------------------------------------------------------
  // 4. CTA Metrics
  // ----------------------------------------------------------------
  describe('getCTAMetrics', () => {
    it('returns total renders and activations from daily summaries', async () => {
      const db = createMockDb([
        // cta_rendered summaries (rate 1.0)
        [
          makeSummary({ date: '2026-03-10', metric: 'cta_rendered', value: 200, dimensions: '{"variant":"button"}' }),
          makeSummary({ date: '2026-03-10', metric: 'cta_rendered', value: 100, dimensions: '{"variant":"inline-banner"}' }),
          makeSummary({ date: '2026-03-11', metric: 'cta_rendered', value: 150, dimensions: '{"variant":"button"}' }),
        ],
        // cta_activated summaries (rate 1.0)
        [
          makeSummary({ date: '2026-03-10', metric: 'cta_activated', value: 30, dimensions: '{"variant":"button"}' }),
          makeSummary({ date: '2026-03-10', metric: 'cta_activated', value: 10, dimensions: '{"variant":"inline-banner"}' }),
          makeSummary({ date: '2026-03-11', metric: 'cta_activated', value: 20, dimensions: '{"variant":"button"}' }),
        ],
        // dimension breakdown for renders
        [
          { dimension: 'button', total: 350 },
          { dimension: 'inline-banner', total: 100 },
        ],
        // dimension breakdown for activations
        [
          { dimension: 'button', total: 50 },
          { dimension: 'inline-banner', total: 10 },
        ],
      ])

      const result = await getCTAMetrics(db as any, '2026-03-10', '2026-03-11')

      expect(result.totalRenders).toBe(450) // 200 + 100 + 150
      expect(result.totalActivations).toBe(60) // 30 + 10 + 20
    })

    it('returns per-variant breakdown with conversion rates', async () => {
      const db = createMockDb([
        // cta_rendered
        [
          makeSummary({ date: '2026-03-10', metric: 'cta_rendered', value: 200, dimensions: '{"variant":"button"}' }),
          makeSummary({ date: '2026-03-10', metric: 'cta_rendered', value: 100, dimensions: '{"variant":"sticky-bar"}' }),
        ],
        // cta_activated
        [
          makeSummary({ date: '2026-03-10', metric: 'cta_activated', value: 40, dimensions: '{"variant":"button"}' }),
          makeSummary({ date: '2026-03-10', metric: 'cta_activated', value: 5, dimensions: '{"variant":"sticky-bar"}' }),
        ],
        // dimension breakdown renders
        [
          { dimension: 'button', total: 200 },
          { dimension: 'sticky-bar', total: 100 },
        ],
        // dimension breakdown activations
        [
          { dimension: 'button', total: 40 },
          { dimension: 'sticky-bar', total: 5 },
        ],
      ])

      const result = await getCTAMetrics(db as any, '2026-03-10', '2026-03-10')

      expect(result.variants).toBeDefined()
      expect(result.variants['button']).toEqual({
        renders: 200,
        activations: 40,
        conversionRate: 20, // 40/200 = 20%
      })
      expect(result.variants['sticky-bar']).toEqual({
        renders: 100,
        activations: 5,
        conversionRate: 5, // 5/100 = 5%
      })
    })

    it('returns zeros when no CTA data exists', async () => {
      const db = createMockDb([[], [], [], []])

      const result = await getCTAMetrics(db as any, '2026-03-10', '2026-03-11')

      expect(result.totalRenders).toBe(0)
      expect(result.totalActivations).toBe(0)
      expect(result.variants).toEqual({})
    })

    it('calculates conversion rate as 0 when renders is 0 for a variant', async () => {
      const db = createMockDb([
        // No renders
        [],
        // Some activations (edge case — shouldn't happen, but guard against division by zero)
        [makeSummary({ date: '2026-03-10', metric: 'cta_activated', value: 5, dimensions: '{"variant":"tooltip"}' })],
        // dimension breakdown renders – empty
        [],
        // dimension breakdown activations
        [{ dimension: 'tooltip', total: 5 }],
      ])

      const result = await getCTAMetrics(db as any, '2026-03-10', '2026-03-10')

      // With 0 renders, conversion rate should be 0 (not Infinity or NaN)
      if (result.variants['tooltip']) {
        expect(result.variants['tooltip'].conversionRate).toBe(0)
      }
    })
  })
})
