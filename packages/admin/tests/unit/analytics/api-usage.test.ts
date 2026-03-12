import { describe, it, expect, vi } from 'vitest'

/**
 * Unit Tests: API Usage Analytics Endpoint (D1 migration)
 *
 * Tests the DESIRED behavior after migrating from KV to D1.
 * The endpoint should query daily_summaries for api_call metrics
 * from the @create-studio/analytics package.
 *
 * These tests will FAIL until the endpoint is rewritten.
 */

// ---------------------------------------------------------------------------
// Expected module: packages/admin/server/utils/analytics-queries.ts
// Expected export:
//   - getApiUsageMetrics(db, startDate, endDate)
// ---------------------------------------------------------------------------

import { getApiUsageMetrics } from '../../../server/utils/analytics-queries'

// ---------------------------------------------------------------------------
// Mock DB helper (same pattern as interactive tests)
// ---------------------------------------------------------------------------

function createMockDb(resultSets: Record<string, any>[][] = []) {
  let callIndex = 0

  const handler: ProxyHandler<object> = {
    get(_target: any, prop: string) {
      if (prop === 'then') {
        return (resolve: any) => {
          const rows = resultSets[callIndex] ?? []
          callIndex++
          return Promise.resolve(resolve(rows))
        }
      }
      return (..._args: any[]) => proxy
    },
  }
  const proxy = new Proxy({}, handler)
  return proxy
}

// ---------------------------------------------------------------------------
// Helpers
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
    sample_rate: 0.001,
    created_at: Math.floor(Date.now() / 1000),
    ...overrides,
  }
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('API Usage Analytics – D1 queries', () => {
  describe('getApiUsageMetrics', () => {
    it('returns v1 and v2 totals from daily summaries', async () => {
      const db = createMockDb([
        // api_call summaries with version dimension
        [
          makeSummary({ date: '2026-03-10', metric: 'api_call', value: 10, dimensions: '{"version":"v1"}', sample_rate: 0.001 }),
          makeSummary({ date: '2026-03-10', metric: 'api_call', value: 5, dimensions: '{"version":"v2"}', sample_rate: 0.001 }),
          makeSummary({ date: '2026-03-11', metric: 'api_call', value: 15, dimensions: '{"version":"v1"}', sample_rate: 0.001 }),
          makeSummary({ date: '2026-03-11', metric: 'api_call', value: 8, dimensions: '{"version":"v2"}', sample_rate: 0.001 }),
        ],
        // dimension breakdown by version
        [
          { dimension: 'v1', total: 25 },
          { dimension: 'v2', total: 13 },
        ],
      ])

      const result = await getApiUsageMetrics(db as any, '2026-03-10', '2026-03-11')

      // Extrapolated at 1000x: v1 = 25 * 1000 = 25000, v2 = 13 * 1000 = 13000
      expect(result.v1Total).toBe(25000)
      expect(result.v2Total).toBe(13000)
    })

    it('extrapolates from 0.1% sampling (1000x multiplier)', async () => {
      const db = createMockDb([
        [
          makeSummary({ date: '2026-03-10', metric: 'api_call', value: 3, dimensions: '{"version":"v1"}', sample_rate: 0.001 }),
        ],
        [
          { dimension: 'v1', total: 3 },
        ],
      ])

      const result = await getApiUsageMetrics(db as any, '2026-03-10', '2026-03-10')

      // 3 sampled at 0.001 -> extrapolated to 3000
      expect(result.v1Total).toBe(3000)
    })

    it('returns per-endpoint breakdown when available', async () => {
      const db = createMockDb([
        // All api_call summaries
        [
          makeSummary({ date: '2026-03-10', metric: 'api_call', value: 10, dimensions: '{"version":"v1","endpoint":"/api/v1/recipe"}', sample_rate: 0.001 }),
          makeSummary({ date: '2026-03-10', metric: 'api_call', value: 5, dimensions: '{"version":"v1","endpoint":"/api/v1/faq"}', sample_rate: 0.001 }),
          makeSummary({ date: '2026-03-10', metric: 'api_call', value: 8, dimensions: '{"version":"v2","endpoint":"/api/v2/creation"}', sample_rate: 0.001 }),
        ],
        // Version breakdown
        [
          { dimension: 'v1', total: 15 },
          { dimension: 'v2', total: 8 },
        ],
      ])

      const result = await getApiUsageMetrics(db as any, '2026-03-10', '2026-03-10')

      expect(result.v1Total).toBe(15000) // 15 * 1000
      expect(result.v2Total).toBe(8000) // 8 * 1000

      // Endpoint breakdown should be available
      if (result.v1Endpoints) {
        expect(result.v1Endpoints['/api/v1/recipe']).toBeDefined()
        expect(result.v1Endpoints['/api/v1/recipe'].count).toBe(10000) // 10 * 1000
        expect(result.v1Endpoints['/api/v1/faq'].count).toBe(5000) // 5 * 1000
      }
    })

    it('handles date range filtering', async () => {
      const db = createMockDb([[], []])

      const result = await getApiUsageMetrics(db as any, '2026-01-01', '2026-01-31')

      expect(result).toBeDefined()
      expect(result.v1Total).toBe(0)
      expect(result.v2Total).toBe(0)
    })

    it('returns zeros when no API data exists', async () => {
      const db = createMockDb([[], []])

      const result = await getApiUsageMetrics(db as any, '2026-03-10', '2026-03-11')

      expect(result.v1Total).toBe(0)
      expect(result.v2Total).toBe(0)
      expect(result.v1Endpoints).toEqual({})
    })

    it('returns correct structure shape', async () => {
      const db = createMockDb([[], []])

      const result = await getApiUsageMetrics(db as any, '2026-03-10', '2026-03-10')

      // Verify the response contract
      expect(result).toHaveProperty('v1Total')
      expect(result).toHaveProperty('v2Total')
      expect(result).toHaveProperty('v1Endpoints')
      expect(typeof result.v1Total).toBe('number')
      expect(typeof result.v2Total).toBe('number')
      expect(typeof result.v1Endpoints).toBe('object')
    })
  })
})
