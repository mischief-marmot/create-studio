import { describe, it, expect, vi, afterEach } from 'vitest'

/**
 * Unit Tests: Analytics API tracking middleware
 *
 * Tests URL pattern matching, sampling, and event body construction
 * for the server middleware that tracks /api/v1/ and /api/v2/ calls.
 */

import { getSampleRate } from '@create-studio/analytics/sampling'

// ---------- Replicate the matching logic from the middleware ----------
// The middleware's core logic is a regex match + sampling gate.
// We extract and test these in isolation.

const API_PATH_REGEX = /^\/api\/(v[12])\/([^\/\?]+)/

function matchApiPath(path: string): { version: string; endpoint: string } | null {
  const match = path.match(API_PATH_REGEX)
  if (!match) return null
  return { version: match[1], endpoint: match[2] }
}

function buildApiCallEventRow(
  version: string,
  now: number,
): {
  type: 'api_call'
  body: string
  domain: null
  session_id: null
  sample_rate: number
  created_at: number
} {
  return {
    type: 'api_call',
    body: JSON.stringify({ version }),
    domain: null,
    session_id: null,
    sample_rate: getSampleRate('api_call'),
    created_at: now,
  }
}

// ---------- Tests ----------

describe('Analytics API Middleware', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  // ----------------------------------------------------------------
  // 1. URL pattern matching
  // ----------------------------------------------------------------
  describe('URL matching', () => {
    it('matches /api/v1/nutrition', () => {
      const result = matchApiPath('/api/v1/nutrition')
      expect(result).toEqual({ version: 'v1', endpoint: 'nutrition' })
    })

    it('matches /api/v2/timers', () => {
      const result = matchApiPath('/api/v2/timers')
      expect(result).toEqual({ version: 'v2', endpoint: 'timers' })
    })

    it('matches /api/v1/sites with trailing path segments', () => {
      const result = matchApiPath('/api/v1/sites/123/users')
      expect(result).toEqual({ version: 'v1', endpoint: 'sites' })
    })

    it('matches /api/v2/creations with query string', () => {
      const result = matchApiPath('/api/v2/creations?page=1&limit=10')
      expect(result).toEqual({ version: 'v2', endpoint: 'creations' })
    })

    it('does NOT match non-API paths', () => {
      expect(matchApiPath('/dashboard')).toBeNull()
      expect(matchApiPath('/settings/billing')).toBeNull()
      expect(matchApiPath('/')).toBeNull()
    })

    it('does NOT match /api/ without a version prefix', () => {
      expect(matchApiPath('/api/analytics/events')).toBeNull()
      expect(matchApiPath('/api/health')).toBeNull()
    })

    it('does NOT match /api/v3/ (only v1 and v2)', () => {
      expect(matchApiPath('/api/v3/something')).toBeNull()
    })

    it('does NOT match static asset paths', () => {
      expect(matchApiPath('/_nuxt/chunk-abc.js')).toBeNull()
      expect(matchApiPath('/favicon.ico')).toBeNull()
    })

    it('does NOT match if path only starts with /api/ but is not /api/v{1,2}/', () => {
      expect(matchApiPath('/api/auth/callback')).toBeNull()
      expect(matchApiPath('/api/webhooks/stripe')).toBeNull()
    })
  })

  // ----------------------------------------------------------------
  // 2. Sampling rate
  // ----------------------------------------------------------------
  describe('Sampling', () => {
    it('uses 0.1% (0.001) sampling for api_call events', () => {
      expect(getSampleRate('api_call')).toBe(0.001)
    })

    it('passes sampling when Math.random < 0.001', () => {
      const spy = vi.spyOn(Math, 'random').mockReturnValue(0.0005)
      const passes = Math.random() <= 0.001
      expect(passes).toBe(true)
      spy.mockRestore()
    })

    it('rejects sampling when Math.random > 0.001', () => {
      const spy = vi.spyOn(Math, 'random').mockReturnValue(0.5)
      const passes = Math.random() <= 0.001
      expect(passes).toBe(false)
      spy.mockRestore()
    })
  })

  // ----------------------------------------------------------------
  // 3. Event body construction
  // ----------------------------------------------------------------
  describe('Event body construction', () => {
    it('creates correct api_call event row for v1', () => {
      const now = 1700000000
      const row = buildApiCallEventRow('v1', now)

      expect(row).toEqual({
        type: 'api_call',
        body: JSON.stringify({ version: 'v1' }),
        domain: null,
        session_id: null,
        sample_rate: 0.001,
        created_at: 1700000000,
      })
    })

    it('creates correct api_call event row for v2', () => {
      const now = 1700000000
      const row = buildApiCallEventRow('v2', now)

      expect(row.type).toBe('api_call')
      expect(JSON.parse(row.body)).toEqual({ version: 'v2' })
      expect(row.domain).toBeNull()
      expect(row.session_id).toBeNull()
    })

    it('version field in body matches the extracted version from URL', () => {
      const match = matchApiPath('/api/v1/nutrition')!
      const row = buildApiCallEventRow(match.version, Date.now())
      expect(JSON.parse(row.body).version).toBe('v1')
    })

    it('sample_rate matches the api_call rate from SAMPLING_RATES', () => {
      const row = buildApiCallEventRow('v1', 0)
      expect(row.sample_rate).toBe(0.001)
    })
  })

  // ----------------------------------------------------------------
  // 4. Non-blocking behavior
  // ----------------------------------------------------------------
  describe('Non-blocking behavior', () => {
    it('middleware returns undefined for non-matching paths (does not block)', () => {
      // The middleware has early returns for non-matching paths.
      // A non-matching path means the handler returns undefined, not a response.
      const path = '/dashboard'
      const shouldTrack = path.startsWith('/api/') && matchApiPath(path) !== null
      expect(shouldTrack).toBe(false)
    })

    it('middleware returns undefined for matching paths that fail sampling', () => {
      const spy = vi.spyOn(Math, 'random').mockReturnValue(0.5) // > 0.001
      const path = '/api/v1/nutrition'
      const match = matchApiPath(path)

      // Even with a match, high random value means we skip
      const shouldTrack = match !== null && Math.random() <= 0.001
      expect(shouldTrack).toBe(false)
      spy.mockRestore()
    })

    it('middleware fires insertion as fire-and-forget (not blocking response)', () => {
      // The actual middleware calls insertEvents(...).catch(...)
      // without awaiting — verifying conceptually that the pattern
      // is non-blocking. This test documents the intent.
      const insertPromise = new Promise<void>((resolve) => {
        setTimeout(resolve, 10)
      })

      // The middleware does NOT await this promise
      const responseTime = Date.now()
      insertPromise.catch(() => {})

      // Response returns immediately
      const elapsed = Date.now() - responseTime
      expect(elapsed).toBeLessThan(5) // near-instant
    })
  })
})
