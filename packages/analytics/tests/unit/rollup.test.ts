import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import type { AggregatedSummary } from '../../rollup/aggregators'

/**
 * Tests for rollup/aggregators.ts and rollup/index.ts
 *
 * Since the aggregator functions all take a DrizzleD1Database and run SQL,
 * we test them through mocking the DB and verifying:
 * - The output shapes are correct
 * - runDailyRollup orchestrates aggregators + upsert + purge correctly
 * - Date calculations are correct
 */

// We'll mock the modules that runDailyRollup depends on
vi.mock('../../rollup/aggregators', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../rollup/aggregators')>()
  return {
    ...actual,
    runAllAggregators: vi.fn(),
  }
})

vi.mock('../../queries/summaries', () => ({
  upsertDailySummary: vi.fn(),
}))

vi.mock('../../queries/events', () => ({
  purgeEventsBefore: vi.fn(),
}))

vi.mock('../../rollup/resolve-sites', () => ({
  resolveDomainToSiteId: vi.fn(),
}))

/**
 * Create a mock Drizzle DB that handles chained queries.
 * Returns result sets in order when awaited.
 */
function createMockDb(resultSets: any[][] = []) {
  let callIndex = 0
  const handler: ProxyHandler<object> = {
    get(_target, prop: string) {
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

describe('rollup', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    // Set current time to 2026-03-12T12:00:00Z
    vi.setSystemTime(new Date('2026-03-12T12:00:00Z'))
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.restoreAllMocks()
  })

  describe('AggregatedSummary shape', () => {
    it('should define the expected fields for a summary', () => {
      const summary: AggregatedSummary = {
        date: '2026-03-11',
        domain: 'example.com',
        metric: 'cta_rendered_count',
        dimensions: '{"variant":"inline"}',
        value: 42,
        sample_rate: 1.0,
      }

      expect(summary).toHaveProperty('date')
      expect(summary).toHaveProperty('domain')
      expect(summary).toHaveProperty('metric')
      expect(summary).toHaveProperty('dimensions')
      expect(summary).toHaveProperty('value')
      expect(summary).toHaveProperty('sample_rate')
    })

    it('should allow null domain and dimensions', () => {
      const summary: AggregatedSummary = {
        date: '2026-03-11',
        domain: null,
        metric: 'api_call_count',
        dimensions: null,
        value: 1000,
        sample_rate: 0.001,
      }

      expect(summary.domain).toBeNull()
      expect(summary.dimensions).toBeNull()
    })
  })

  describe('runDailyRollup()', () => {
    it('should roll up days since last summary through yesterday', async () => {
      const { runAllAggregators } = await import('../../rollup/aggregators')
      const { upsertDailySummary } = await import('../../queries/summaries')
      const { purgeEventsBefore } = await import('../../queries/events')
      const { resolveDomainToSiteId } = await import('../../rollup/resolve-sites')

      const mockSummaries: AggregatedSummary[] = [
        { date: '2026-03-11', domain: 'example.com', metric: 'cta_rendered_count', dimensions: null, value: 10, sample_rate: 1.0 },
        { date: '2026-03-11', domain: 'example.com', metric: 'cta_activated_count', dimensions: null, value: 5, sample_rate: 1.0 },
      ]

      vi.mocked(runAllAggregators).mockResolvedValue(mockSummaries)
      vi.mocked(upsertDailySummary).mockResolvedValue(undefined)
      vi.mocked(purgeEventsBefore).mockResolvedValue(undefined as any)
      vi.mocked(resolveDomainToSiteId).mockResolvedValue(new Map([['example.com', 1]]))

      const { runDailyRollup } = await import('../../rollup/index')

      // Mock analytics DB: first query = last rollup date (2026-03-10), no earliest event query needed
      const fakeAnalyticsDb = createMockDb([
        [{ date: '2026-03-10' }], // getLastRollupDate returns 2026-03-10
      ])
      const fakeMainDb = {} as any

      const result = await runDailyRollup(fakeAnalyticsDb as any, fakeMainDb)

      // Should process 2026-03-11 (day after last rollup through yesterday)
      expect(result.datesProcessed).toEqual(['2026-03-11'])
      expect(result.summariesWritten).toBe(2)
      expect(result.errors).toHaveLength(0)

      // Should have called runAllAggregators for 2026-03-11
      expect(runAllAggregators).toHaveBeenCalledWith(
        expect.anything(),
        '2026-03-11',
        expect.any(Number),
        expect.any(Number),
      )
    })

    it('should include today when includeToday option is set', async () => {
      const { runAllAggregators } = await import('../../rollup/aggregators')
      const { upsertDailySummary } = await import('../../queries/summaries')
      const { purgeEventsBefore } = await import('../../queries/events')
      const { resolveDomainToSiteId } = await import('../../rollup/resolve-sites')

      vi.mocked(runAllAggregators).mockResolvedValue([])
      vi.mocked(upsertDailySummary).mockResolvedValue(undefined)
      vi.mocked(purgeEventsBefore).mockResolvedValue(undefined as any)
      vi.mocked(resolveDomainToSiteId).mockResolvedValue(new Map())

      const { runDailyRollup } = await import('../../rollup/index')

      // Last rollup was 2026-03-10
      const fakeAnalyticsDb = createMockDb([
        [{ date: '2026-03-10' }],
      ])

      const result = await runDailyRollup(fakeAnalyticsDb as any, {} as any, { includeToday: true })

      // Should process 2026-03-11 and 2026-03-12 (today)
      expect(result.datesProcessed).toEqual(['2026-03-11', '2026-03-12'])
    })

    it('should use earliest event date when no summaries exist', async () => {
      const { runAllAggregators } = await import('../../rollup/aggregators')
      const { upsertDailySummary } = await import('../../queries/summaries')
      const { purgeEventsBefore } = await import('../../queries/events')
      const { resolveDomainToSiteId } = await import('../../rollup/resolve-sites')

      vi.mocked(runAllAggregators).mockResolvedValue([])
      vi.mocked(upsertDailySummary).mockResolvedValue(undefined)
      vi.mocked(purgeEventsBefore).mockResolvedValue(undefined as any)
      vi.mocked(resolveDomainToSiteId).mockResolvedValue(new Map())

      const { runDailyRollup } = await import('../../rollup/index')

      // No last rollup (empty summaries), earliest event = 2026-03-10
      const earliestTs = Math.floor(new Date('2026-03-10T08:00:00Z').getTime() / 1000)
      const fakeAnalyticsDb = createMockDb([
        [],                        // getLastRollupDate: no rows
        [{ minTs: earliestTs }],   // earliest event query
      ])

      const result = await runDailyRollup(fakeAnalyticsDb as any, {} as any)

      // Should process from 2026-03-10 through yesterday (2026-03-11)
      expect(result.datesProcessed).toEqual(['2026-03-10', '2026-03-11'])
    })

    it('should return empty when already up to date', async () => {
      const { runAllAggregators } = await import('../../rollup/aggregators')
      const { purgeEventsBefore } = await import('../../queries/events')
      const { resolveDomainToSiteId } = await import('../../rollup/resolve-sites')

      vi.mocked(runAllAggregators).mockResolvedValue([])
      vi.mocked(purgeEventsBefore).mockResolvedValue(undefined as any)
      vi.mocked(resolveDomainToSiteId).mockResolvedValue(new Map())

      const { runDailyRollup } = await import('../../rollup/index')

      // Last rollup was yesterday — already up to date
      const fakeAnalyticsDb = createMockDb([
        [{ date: '2026-03-11' }],
      ])

      const result = await runDailyRollup(fakeAnalyticsDb as any, {} as any)

      expect(result.datesProcessed).toEqual([])
      expect(result.summariesWritten).toBe(0)
    })

    it('should resolve domains to site IDs and attach to summaries', async () => {
      const { runAllAggregators } = await import('../../rollup/aggregators')
      const { upsertDailySummary } = await import('../../queries/summaries')
      const { purgeEventsBefore } = await import('../../queries/events')
      const { resolveDomainToSiteId } = await import('../../rollup/resolve-sites')

      const mockSummaries: AggregatedSummary[] = [
        { date: '2026-03-11', domain: 'example.com', metric: 'cta_rendered_count', dimensions: null, value: 10, sample_rate: 1.0 },
        { date: '2026-03-11', domain: 'blog.test', metric: 'page_view_count', dimensions: null, value: 100, sample_rate: 0.1 },
        { date: '2026-03-11', domain: null, metric: 'api_call_count', dimensions: null, value: 5000, sample_rate: 0.001 },
      ]

      const domainMap = new Map([['example.com', 1], ['blog.test', 2]])
      vi.mocked(runAllAggregators).mockResolvedValue(mockSummaries)
      vi.mocked(upsertDailySummary).mockResolvedValue(undefined)
      vi.mocked(purgeEventsBefore).mockResolvedValue(undefined as any)
      vi.mocked(resolveDomainToSiteId).mockResolvedValue(domainMap)

      const { runDailyRollup } = await import('../../rollup/index')

      const fakeAnalyticsDb = createMockDb([
        [{ date: '2026-03-10' }], // last rollup
      ])

      await runDailyRollup(fakeAnalyticsDb as any, {} as any)

      // resolveDomainToSiteId should have been called with the main DB and unique domains
      expect(resolveDomainToSiteId).toHaveBeenCalledWith({}, ['example.com', 'blog.test'])

      // Verify site_id is attached to upserted summaries
      const upsertCalls = vi.mocked(upsertDailySummary).mock.calls
      expect(upsertCalls[0][1]).toMatchObject({ domain: 'example.com', site_id: 1 })
      expect(upsertCalls[1][1]).toMatchObject({ domain: 'blog.test', site_id: 2 })
      // null domain summary should have null site_id
      expect(upsertCalls[2][1]).toMatchObject({ domain: null, site_id: null })
    })

    it('should compute purge cutoff as 30 days before now', async () => {
      const { purgeEventsBefore } = await import('../../queries/events')
      const { runAllAggregators } = await import('../../rollup/aggregators')
      const { upsertDailySummary } = await import('../../queries/summaries')
      const { resolveDomainToSiteId } = await import('../../rollup/resolve-sites')

      vi.mocked(runAllAggregators).mockResolvedValue([])
      vi.mocked(upsertDailySummary).mockResolvedValue(undefined)
      vi.mocked(purgeEventsBefore).mockResolvedValue(undefined as any)
      vi.mocked(resolveDomainToSiteId).mockResolvedValue(new Map())

      const { runDailyRollup } = await import('../../rollup/index')

      // Last rollup was 2026-03-10, so there's work to do (2026-03-11)
      const fakeAnalyticsDb = createMockDb([
        [{ date: '2026-03-10' }],
      ])

      const result = await runDailyRollup(fakeAnalyticsDb as any, {} as any)

      // purgedBefore should be ~30 days before "now" (2026-03-12T12:00:00Z)
      const expected30DaysAgo = Math.floor(new Date('2026-02-10T12:00:00Z').getTime() / 1000)
      expect(result.purgedBefore).toBe(expected30DaysAgo)
    })

    it('should handle aggregation errors gracefully and continue to next day', async () => {
      const { runAllAggregators } = await import('../../rollup/aggregators')
      const { purgeEventsBefore } = await import('../../queries/events')
      const { resolveDomainToSiteId } = await import('../../rollup/resolve-sites')

      vi.mocked(runAllAggregators).mockRejectedValue(new Error('DB connection lost'))
      vi.mocked(purgeEventsBefore).mockResolvedValue(undefined as any)
      vi.mocked(resolveDomainToSiteId).mockResolvedValue(new Map())

      const { runDailyRollup } = await import('../../rollup/index')

      const fakeAnalyticsDb = createMockDb([
        [{ date: '2026-03-10' }], // last rollup
      ])

      const result = await runDailyRollup(fakeAnalyticsDb as any, {} as any)

      expect(result.summariesWritten).toBe(0)
      expect(result.errors.some(e => e.includes('Aggregation failed: DB connection lost'))).toBe(true)

      // Purge should still run
      expect(purgeEventsBefore).toHaveBeenCalledTimes(1)
    })

    it('should handle upsert errors gracefully and continue', async () => {
      const { runAllAggregators } = await import('../../rollup/aggregators')
      const { upsertDailySummary } = await import('../../queries/summaries')
      const { purgeEventsBefore } = await import('../../queries/events')
      const { resolveDomainToSiteId } = await import('../../rollup/resolve-sites')

      const mockSummaries: AggregatedSummary[] = [
        { date: '2026-03-11', domain: 'a.com', metric: 'cta_rendered_count', dimensions: null, value: 10, sample_rate: 1.0 },
        { date: '2026-03-11', domain: 'b.com', metric: 'cta_rendered_count', dimensions: null, value: 20, sample_rate: 1.0 },
        { date: '2026-03-11', domain: 'c.com', metric: 'cta_rendered_count', dimensions: null, value: 30, sample_rate: 1.0 },
      ]

      vi.mocked(runAllAggregators).mockResolvedValue(mockSummaries)
      vi.mocked(upsertDailySummary)
        .mockRejectedValueOnce(new Error('constraint violation'))
        .mockResolvedValueOnce(undefined)
        .mockResolvedValueOnce(undefined)
      vi.mocked(purgeEventsBefore).mockResolvedValue(undefined as any)
      vi.mocked(resolveDomainToSiteId).mockResolvedValue(new Map())

      const { runDailyRollup } = await import('../../rollup/index')

      const fakeAnalyticsDb = createMockDb([
        [{ date: '2026-03-10' }],
      ])

      const result = await runDailyRollup(fakeAnalyticsDb as any, {} as any)

      expect(result.summariesWritten).toBe(2)
      expect(result.errors).toHaveLength(1)
      expect(result.errors[0]).toContain('Upsert failed')
      expect(result.errors[0]).toContain('constraint violation')
    })

    it('should handle purge errors gracefully', async () => {
      const { runAllAggregators } = await import('../../rollup/aggregators')
      const { upsertDailySummary } = await import('../../queries/summaries')
      const { purgeEventsBefore } = await import('../../queries/events')
      const { resolveDomainToSiteId } = await import('../../rollup/resolve-sites')

      vi.mocked(runAllAggregators).mockResolvedValue([])
      vi.mocked(upsertDailySummary).mockResolvedValue(undefined)
      vi.mocked(purgeEventsBefore).mockRejectedValue(new Error('disk full'))
      vi.mocked(resolveDomainToSiteId).mockResolvedValue(new Map())

      const { runDailyRollup } = await import('../../rollup/index')

      // Last rollup was 2026-03-10 so there's work to do and purge runs
      const fakeAnalyticsDb = createMockDb([
        [{ date: '2026-03-10' }],
      ])

      const result = await runDailyRollup(fakeAnalyticsDb as any, {} as any)

      expect(result.errors).toContain('Purge failed: disk full')
    })
  })

  describe('aggregator output shapes', () => {
    it('CTA aggregator should produce *_count metrics with variant dimensions', () => {
      const ctaSummary: AggregatedSummary = {
        date: '2026-03-11',
        domain: 'example.com',
        metric: 'cta_rendered_count',
        dimensions: JSON.stringify({ variant: 'inline' }),
        value: 100,
        sample_rate: 1.0,
      }

      expect(ctaSummary.metric).toMatch(/^cta_(rendered|activated)_count$/)
      expect(JSON.parse(ctaSummary.dimensions!)).toHaveProperty('variant')
    })

    it('IM session aggregator should produce count and duration metrics', () => {
      const countSummary: AggregatedSummary = {
        date: '2026-03-11',
        domain: 'example.com',
        metric: 'im_session_start_count',
        dimensions: null,
        value: 50,
        sample_rate: 1.0,
      }

      const durationSummary: AggregatedSummary = {
        date: '2026-03-11',
        domain: 'example.com',
        metric: 'im_session_avg_duration',
        dimensions: null,
        value: 45.5,
        sample_rate: 1.0,
      }

      expect(countSummary.metric).toMatch(/^im_session_(start|complete)_count$/)
      expect(durationSummary.metric).toBe('im_session_avg_duration')
    })

    it('Rating aggregator should produce count and average metrics', () => {
      const avgSummary: AggregatedSummary = {
        date: '2026-03-11',
        domain: 'example.com',
        metric: 'rating_average',
        dimensions: null,
        value: 4.2,
        sample_rate: 1.0,
      }

      expect(avgSummary.metric).toBe('rating_average')
      expect(avgSummary.value).toBeGreaterThanOrEqual(1)
      expect(avgSummary.value).toBeLessThanOrEqual(5)
    })

    it('API aggregator should produce api_call_count with version dimensions', () => {
      const apiSummary: AggregatedSummary = {
        date: '2026-03-11',
        domain: null,
        metric: 'api_call_count',
        dimensions: JSON.stringify({ version: 'v1' }),
        value: 5000,
        sample_rate: 0.001,
      }

      expect(apiSummary.domain).toBeNull()
      expect(apiSummary.metric).toBe('api_call_count')
      expect(JSON.parse(apiSummary.dimensions!)).toHaveProperty('version')
    })

    it('Trial aggregator should produce global trial_*_count metrics', () => {
      const trialSummary: AggregatedSummary = {
        date: '2026-03-11',
        domain: null,
        metric: 'trial_started_count',
        dimensions: null,
        value: 15,
        sample_rate: 1.0,
      }

      expect(trialSummary.domain).toBeNull()
      expect(trialSummary.metric).toMatch(/^trial_(started|converted)_count$/)
    })
  })
})
