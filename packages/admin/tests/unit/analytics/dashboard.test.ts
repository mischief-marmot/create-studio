import { describe, it, expect, vi, beforeEach } from 'vitest'

/**
 * Unit Tests: Dashboard Aggregate Analytics Endpoint (D1 migration)
 *
 * Tests the DESIRED behavior after migrating from KV to D1.
 * The dashboard endpoint orchestrates all sub-queries in parallel
 * and returns a combined response.
 *
 * These tests will FAIL until the endpoint is rewritten.
 */

// ---------------------------------------------------------------------------
// Expected module: packages/admin/server/utils/analytics-queries.ts
// Expected export:
//   - getDashboardAnalytics(db, startDate, endDate)
//
// This function calls the sub-queries in parallel:
//   - getApiUsageMetrics(db, startDate, endDate)
//   - getInteractiveMetrics(db, startDate, endDate)
//   - getTimerMetrics(db, startDate, endDate)
//   - getRatingMetrics(db, startDate, endDate)
//   - getCTAMetrics(db, startDate, endDate)
// ---------------------------------------------------------------------------

import {
  getDashboardAnalytics,
  getApiUsageMetrics,
  getInteractiveMetrics,
  getTimerMetrics,
  getRatingMetrics,
  getCTAMetrics,
  _queryFns,
} from '../../../server/utils/analytics-queries'

// ---------------------------------------------------------------------------
// For dashboard tests, we mock the individual query functions and test
// the orchestration logic of getDashboardAnalytics.
//
// getDashboardAnalytics calls sub-queries via the _queryFns registry object,
// so we must patch _queryFns in addition to the named exports.
// ---------------------------------------------------------------------------

vi.mock('../../../server/utils/analytics-queries', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../../server/utils/analytics-queries')>()
  return {
    ...actual,
    // We'll spy on these in individual tests
    getApiUsageMetrics: vi.fn(),
    getInteractiveMetrics: vi.fn(),
    getTimerMetrics: vi.fn(),
    getRatingMetrics: vi.fn(),
    getCTAMetrics: vi.fn(),
    // Keep the real getDashboardAnalytics to test its orchestration
    getDashboardAnalytics: actual.getDashboardAnalytics,
  }
})

// ---------------------------------------------------------------------------
// Default mock return values
// ---------------------------------------------------------------------------

const defaultApiUsage = { v1Total: 0, v2Total: 0, v1Endpoints: {} }
const defaultInteractive = { totalSessions: 0, uniqueDomains: 0, completionRate: 0, totalPageViews: 0 }
const defaultTimers = { started: 0, completed: 0, completionRate: 0 }
const defaultRatings = { screensShown: 0, submitted: 0, conversionRate: 0 }
const defaultCTA = { totalRenders: 0, totalActivations: 0, variants: {} }

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('Dashboard Analytics – D1 orchestration', () => {
  beforeEach(() => {
    vi.mocked(getApiUsageMetrics).mockResolvedValue(defaultApiUsage)
    vi.mocked(getInteractiveMetrics).mockResolvedValue(defaultInteractive)
    vi.mocked(getTimerMetrics).mockResolvedValue(defaultTimers)
    vi.mocked(getRatingMetrics).mockResolvedValue(defaultRatings)
    vi.mocked(getCTAMetrics).mockResolvedValue(defaultCTA)

    // Patch the _queryFns registry so getDashboardAnalytics (which calls
    // sub-queries through _queryFns) uses the mocked functions above.
    _queryFns.getApiUsageMetrics = vi.mocked(getApiUsageMetrics)
    _queryFns.getInteractiveMetrics = vi.mocked(getInteractiveMetrics)
    _queryFns.getTimerMetrics = vi.mocked(getTimerMetrics)
    _queryFns.getRatingMetrics = vi.mocked(getRatingMetrics)
    _queryFns.getCTAMetrics = vi.mocked(getCTAMetrics)
  })

  describe('getDashboardAnalytics', () => {
    it('calls all sub-queries with the same db and date range', async () => {
      const fakeDb = {} as any

      await getDashboardAnalytics(fakeDb, '2026-03-10', '2026-03-11')

      expect(getApiUsageMetrics).toHaveBeenCalledWith(fakeDb, '2026-03-10', '2026-03-11', undefined)
      expect(getInteractiveMetrics).toHaveBeenCalledWith(fakeDb, '2026-03-10', '2026-03-11', undefined)
      expect(getTimerMetrics).toHaveBeenCalledWith(fakeDb, '2026-03-10', '2026-03-11', undefined)
      expect(getRatingMetrics).toHaveBeenCalledWith(fakeDb, '2026-03-10', '2026-03-11', undefined)
      expect(getCTAMetrics).toHaveBeenCalledWith(fakeDb, '2026-03-10', '2026-03-11', undefined)
    })

    it('returns combined response with all sections', async () => {
      const apiUsage = { v1Total: 5000, v2Total: 3000, v1Endpoints: { '/recipe': { count: 5000, errors: 0 } } }
      const interactive = { totalSessions: 100, uniqueDomains: 5, completionRate: 80, totalPageViews: 500 }
      const timers = { started: 200, completed: 160, completionRate: 80 }
      const ratings = { screensShown: 50, submitted: 10, conversionRate: 20 }
      const cta = {
        totalRenders: 300,
        totalActivations: 45,
        variants: { button: { renders: 200, activations: 30, conversionRate: 15 } },
      }

      vi.mocked(getApiUsageMetrics).mockResolvedValue(apiUsage)
      vi.mocked(getInteractiveMetrics).mockResolvedValue(interactive)
      vi.mocked(getTimerMetrics).mockResolvedValue(timers)
      vi.mocked(getRatingMetrics).mockResolvedValue(ratings)
      vi.mocked(getCTAMetrics).mockResolvedValue(cta)

      const result = await getDashboardAnalytics({} as any, '2026-03-10', '2026-03-11')

      expect(result.apiUsage).toEqual(apiUsage)
      expect(result.interactive).toEqual(interactive)
      expect(result.timers).toEqual(timers)
      expect(result.ratings).toEqual(ratings)
      expect(result.cta).toEqual(cta)
    })

    it('returns response shape matching the existing endpoint contract', async () => {
      const result = await getDashboardAnalytics({} as any, '2026-03-10', '2026-03-11')

      // The dashboard.get.ts endpoint currently returns:
      // { apiUsage, interactive, timers, ratings, cta }
      expect(result).toHaveProperty('apiUsage')
      expect(result).toHaveProperty('interactive')
      expect(result).toHaveProperty('timers')
      expect(result).toHaveProperty('ratings')
      expect(result).toHaveProperty('cta')
    })

    it('handles error in interactive sub-query gracefully', async () => {
      vi.mocked(getInteractiveMetrics).mockRejectedValue(new Error('D1 timeout'))

      // getDashboardAnalytics should either:
      // a) Let the error propagate (endpoint catches it), or
      // b) Return default values for the failed section
      // We test option (a) — the function should throw, and the endpoint handler
      // wraps it in a 500 response.
      await expect(getDashboardAnalytics({} as any, '2026-03-10', '2026-03-11'))
        .rejects.toThrow()
    })

    it('handles error in API usage sub-query gracefully', async () => {
      vi.mocked(getApiUsageMetrics).mockRejectedValue(new Error('query failed'))

      await expect(getDashboardAnalytics({} as any, '2026-03-10', '2026-03-11'))
        .rejects.toThrow()
    })

    it('handles error in CTA sub-query gracefully', async () => {
      vi.mocked(getCTAMetrics).mockRejectedValue(new Error('query failed'))

      await expect(getDashboardAnalytics({} as any, '2026-03-10', '2026-03-11'))
        .rejects.toThrow()
    })

    it('executes sub-queries in parallel (not sequentially)', async () => {
      // Track call order to verify parallel execution
      const callOrder: string[] = []

      vi.mocked(getApiUsageMetrics).mockImplementation(async () => {
        callOrder.push('api-start')
        await new Promise((r) => setTimeout(r, 10))
        callOrder.push('api-end')
        return defaultApiUsage
      })
      vi.mocked(getInteractiveMetrics).mockImplementation(async () => {
        callOrder.push('interactive-start')
        await new Promise((r) => setTimeout(r, 10))
        callOrder.push('interactive-end')
        return defaultInteractive
      })
      vi.mocked(getTimerMetrics).mockImplementation(async () => {
        callOrder.push('timer-start')
        await new Promise((r) => setTimeout(r, 10))
        callOrder.push('timer-end')
        return defaultTimers
      })
      vi.mocked(getRatingMetrics).mockImplementation(async () => {
        callOrder.push('rating-start')
        await new Promise((r) => setTimeout(r, 10))
        callOrder.push('rating-end')
        return defaultRatings
      })
      vi.mocked(getCTAMetrics).mockImplementation(async () => {
        callOrder.push('cta-start')
        await new Promise((r) => setTimeout(r, 10))
        callOrder.push('cta-end')
        return defaultCTA
      })

      await getDashboardAnalytics({} as any, '2026-03-10', '2026-03-11')

      // In parallel execution, all "start" events should appear before all "end" events
      const startIndices = callOrder
        .map((v, i) => (v.endsWith('-start') ? i : -1))
        .filter((i) => i >= 0)
      const endIndices = callOrder
        .map((v, i) => (v.endsWith('-end') ? i : -1))
        .filter((i) => i >= 0)

      // All starts should come before the first end
      const firstEnd = Math.min(...endIndices)
      const allStartsBeforeFirstEnd = startIndices.every((i) => i < firstEnd)
      expect(allStartsBeforeFirstEnd).toBe(true)
    })
  })
})
