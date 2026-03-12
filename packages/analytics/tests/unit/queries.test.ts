import { describe, it, expect, vi, beforeEach } from 'vitest'
import { insertEvents, queryEvents, purgeEventsBefore } from '../../queries/events'
import { incrementCounter, getCounter, getCounters } from '../../queries/counters'
import { upsertDailySummary, querySummaries, queryTimeSeries, queryDomainBreakdown, queryDimensionBreakdown } from '../../queries/summaries'

/**
 * These tests verify the query functions' logic and argument handling by using
 * a mock database that mimics the Drizzle D1 API's builder chain pattern.
 *
 * Since the actual query functions use Drizzle ORM's query builder, we create
 * a chain mock that captures the method calls and verifies the functions
 * interact with the builder correctly.
 */

// Build a chainable mock that records calls and returns itself
function createChainMock(terminalValue: any = []) {
  const chain: Record<string, any> = {}
  const calls: Record<string, any[]> = {}

  const methods = ['select', 'from', 'where', 'orderBy', 'limit', 'groupBy', 'insert', 'values', 'onConflictDoUpdate', 'delete', 'set']
  for (const method of methods) {
    calls[method] = []
    chain[method] = vi.fn((...args: any[]) => {
      calls[method].push(args)
      return chain
    })
  }

  // Make the chain thenable so `await` resolves to terminalValue
  chain.then = (resolve: (v: any) => any) => resolve(terminalValue)

  return { chain, calls }
}

function createMockDb(terminalValue: any = []) {
  const { chain, calls } = createChainMock(terminalValue)

  const db = {
    select: vi.fn((...args: any[]) => {
      calls.select.push(args)
      return chain
    }),
    insert: vi.fn((...args: any[]) => {
      calls.insert.push(args)
      return chain
    }),
    delete: vi.fn((...args: any[]) => {
      calls.delete.push(args)
      return chain
    }),
    _calls: calls,
    _chain: chain,
  }

  return db as any
}

describe('queries/events', () => {
  describe('insertEvents()', () => {
    it('should call db.insert().values() with the provided rows', async () => {
      const db = createMockDb()
      const rows = [
        { type: 'cta_rendered' as const, body: '{}', sample_rate: 1.0, created_at: 100 },
        { type: 'page_view' as const, body: '{}', sample_rate: 0.1, created_at: 101 },
      ]

      await insertEvents(db, rows)

      expect(db.insert).toHaveBeenCalledTimes(1)
      expect(db._chain.values).toHaveBeenCalledWith(rows)
    })

    it('should not call db.insert when rows is empty', async () => {
      const db = createMockDb()

      await insertEvents(db, [])

      expect(db.insert).not.toHaveBeenCalled()
    })
  })

  describe('queryEvents()', () => {
    it('should call db.select().from(events) with no filters by default', async () => {
      const db = createMockDb([])

      await queryEvents(db)

      expect(db.select).toHaveBeenCalledTimes(1)
      expect(db._chain.from).toHaveBeenCalledTimes(1)
      expect(db._chain.where).toHaveBeenCalledTimes(1)
      expect(db._chain.orderBy).toHaveBeenCalledTimes(1)
    })

    it('should apply limit when specified', async () => {
      const db = createMockDb([])

      await queryEvents(db, { limit: 50 })

      expect(db._chain.limit).toHaveBeenCalledWith(50)
    })

    it('should not apply limit when not specified', async () => {
      const db = createMockDb([])

      await queryEvents(db, {})

      expect(db._chain.limit).not.toHaveBeenCalled()
    })
  })

  describe('purgeEventsBefore()', () => {
    it('should call db.delete with a timestamp filter', async () => {
      const db = createMockDb()

      await purgeEventsBefore(db, 1710000000)

      expect(db.delete).toHaveBeenCalledTimes(1)
      expect(db._chain.where).toHaveBeenCalledTimes(1)
    })
  })
})

describe('queries/counters', () => {
  describe('incrementCounter()', () => {
    it('should call db.insert().values().onConflictDoUpdate()', async () => {
      const db = createMockDb()

      await incrementCounter(db, 'cta_rendered:example.com', 1)

      expect(db.insert).toHaveBeenCalledTimes(1)
      expect(db._chain.values).toHaveBeenCalledTimes(1)
      expect(db._chain.onConflictDoUpdate).toHaveBeenCalledTimes(1)
    })

    it('should default amount to 1', async () => {
      const db = createMockDb()

      await incrementCounter(db, 'some_key')

      expect(db.insert).toHaveBeenCalledTimes(1)
      // Verify values was called with amount=1
      const valuesCall = db._chain.values.mock.calls[0][0]
      expect(valuesCall.value).toBe(1)
    })

    it('should use the provided amount', async () => {
      const db = createMockDb()

      await incrementCounter(db, 'some_key', 5)

      const valuesCall = db._chain.values.mock.calls[0][0]
      expect(valuesCall.value).toBe(5)
    })

    it('should set updated_at to current time in seconds', async () => {
      const db = createMockDb()
      const before = Math.floor(Date.now() / 1000)

      await incrementCounter(db, 'some_key')

      const after = Math.floor(Date.now() / 1000)
      const valuesCall = db._chain.values.mock.calls[0][0]
      expect(valuesCall.updated_at).toBeGreaterThanOrEqual(before)
      expect(valuesCall.updated_at).toBeLessThanOrEqual(after)
    })
  })

  describe('getCounter()', () => {
    it('should return the first matching row', async () => {
      const mockRow = { id: 1, key: 'test', value: 42, updated_at: 100 }
      const db = createMockDb([mockRow])

      const result = await getCounter(db, 'test')

      expect(result).toEqual(mockRow)
    })

    it('should return null when no row matches', async () => {
      const db = createMockDb([])

      const result = await getCounter(db, 'nonexistent')

      expect(result).toBeNull()
    })
  })

  describe('getCounters()', () => {
    it('should query with LIKE prefix pattern', async () => {
      const db = createMockDb([])

      await getCounters(db, 'cta_rendered:')

      expect(db.select).toHaveBeenCalledTimes(1)
      expect(db._chain.where).toHaveBeenCalledTimes(1)
    })
  })
})

describe('queries/summaries', () => {
  describe('upsertDailySummary()', () => {
    it('should call db.insert().values().onConflictDoUpdate()', async () => {
      const db = createMockDb()

      await upsertDailySummary(db, {
        date: '2026-03-11',
        metric: 'cta_rendered_count',
        value: 42,
        sample_rate: 1.0,
      })

      expect(db.insert).toHaveBeenCalledTimes(1)
      expect(db._chain.values).toHaveBeenCalledTimes(1)
      expect(db._chain.onConflictDoUpdate).toHaveBeenCalledTimes(1)
    })

    it('should default domain and dimensions to null', async () => {
      const db = createMockDb()

      await upsertDailySummary(db, {
        date: '2026-03-11',
        metric: 'cta_rendered_count',
        value: 42,
        sample_rate: 1.0,
      })

      const valuesCall = db._chain.values.mock.calls[0][0]
      expect(valuesCall.domain).toBeNull()
      expect(valuesCall.dimensions).toBeNull()
    })

    it('should pass through domain and dimensions when provided', async () => {
      const db = createMockDb()

      await upsertDailySummary(db, {
        date: '2026-03-11',
        domain: 'example.com',
        metric: 'cta_rendered_count',
        dimensions: '{"variant":"inline"}',
        value: 42,
        sample_rate: 1.0,
      })

      const valuesCall = db._chain.values.mock.calls[0][0]
      expect(valuesCall.domain).toBe('example.com')
      expect(valuesCall.dimensions).toBe('{"variant":"inline"}')
    })
  })

  describe('querySummaries()', () => {
    it('should query with no filters by default', async () => {
      const db = createMockDb([])

      await querySummaries(db)

      expect(db.select).toHaveBeenCalledTimes(1)
      expect(db._chain.orderBy).toHaveBeenCalledTimes(1)
    })

    it('should apply limit when specified', async () => {
      const db = createMockDb([])

      await querySummaries(db, { limit: 10 })

      expect(db._chain.limit).toHaveBeenCalledWith(10)
    })

    it('should not apply limit when not specified', async () => {
      const db = createMockDb([])

      await querySummaries(db, { metric: 'cta_rendered_count' })

      expect(db._chain.limit).not.toHaveBeenCalled()
    })
  })

  describe('queryTimeSeries()', () => {
    it('should query with metric and date range', async () => {
      const db = createMockDb([])

      await queryTimeSeries(db, 'cta_rendered_count', '2026-03-01', '2026-03-11')

      expect(db.select).toHaveBeenCalledTimes(1)
      expect(db._chain.from).toHaveBeenCalledTimes(1)
      expect(db._chain.where).toHaveBeenCalledTimes(1)
      expect(db._chain.orderBy).toHaveBeenCalledTimes(1)
    })
  })

  describe('queryDomainBreakdown()', () => {
    it('should query with groupBy on domain', async () => {
      const db = createMockDb([])

      await queryDomainBreakdown(db, 'cta_rendered_count', '2026-03-01', '2026-03-11')

      expect(db.select).toHaveBeenCalledTimes(1)
      expect(db._chain.groupBy).toHaveBeenCalledTimes(1)
      expect(db._chain.orderBy).toHaveBeenCalledTimes(1)
    })
  })

  describe('queryDimensionBreakdown()', () => {
    it('should query with groupBy on a dimension key', async () => {
      const db = createMockDb([])

      await queryDimensionBreakdown(db, 'cta_rendered_count', 'variant', '2026-03-01', '2026-03-11')

      expect(db.select).toHaveBeenCalledTimes(1)
      expect(db._chain.groupBy).toHaveBeenCalledTimes(1)
      expect(db._chain.orderBy).toHaveBeenCalledTimes(1)
    })
  })
})
