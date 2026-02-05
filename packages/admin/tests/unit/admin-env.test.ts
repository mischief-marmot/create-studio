import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { H3Event } from 'h3'
import {
  getAdminEnvironment,
  setAdminEnvironment,
  useAdminEnv,
  type AdminEnvironment,
} from '../../server/utils/admin-env'

// Mock h3 functions
vi.mock('h3', () => ({
  getCookie: vi.fn(),
  setCookie: vi.fn(),
}))

import { getCookie, setCookie } from 'h3'

/**
 * Create a mock H3Event for testing
 */
function createMockEvent(options: {
  cookie?: string
  cloudflareEnv?: Record<string, unknown>
}): H3Event {
  const event = {
    context: {
      cloudflare: options.cloudflareEnv !== undefined
        ? { env: options.cloudflareEnv }
        : undefined,
    },
  } as unknown as H3Event

  // Set up getCookie mock to return the specified cookie value
  if (options.cookie !== undefined) {
    vi.mocked(getCookie).mockReturnValue(options.cookie)
  } else {
    vi.mocked(getCookie).mockReturnValue(undefined)
  }

  return event
}

/**
 * Create mock Cloudflare bindings for testing
 */
function createMockCloudflareEnv(options?: {
  includePreview?: boolean
  includeAdminDb?: boolean
}) {
  const env: Record<string, unknown> = {
    DB: { name: 'production-db' },
    BLOB: { name: 'production-blob' },
    KV: { name: 'production-kv' },
    CACHE: { name: 'production-cache' },
  }

  if (options?.includePreview) {
    env.DB_PREVIEW = { name: 'preview-db' }
    env.BLOB_PREVIEW = { name: 'preview-blob' }
    env.KV_PREVIEW = { name: 'preview-kv' }
    env.CACHE_PREVIEW = { name: 'preview-cache' }
  }

  if (options?.includeAdminDb) {
    env.DB_ADMIN = { name: 'admin-db' }
  }

  return env
}

describe('admin-env utilities', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('getAdminEnvironment', () => {
    it('returns production when no cookie is set', () => {
      const event = createMockEvent({})

      const result = getAdminEnvironment(event)

      expect(result).toBe('production')
      expect(getCookie).toHaveBeenCalledWith(event, 'admin_environment')
    })

    it('returns production when cookie is set to production', () => {
      const event = createMockEvent({ cookie: 'production' })

      const result = getAdminEnvironment(event)

      expect(result).toBe('production')
    })

    it('returns preview when cookie is set to preview', () => {
      const event = createMockEvent({ cookie: 'preview' })

      const result = getAdminEnvironment(event)

      expect(result).toBe('preview')
    })

    it('returns production for invalid cookie value staging', () => {
      const event = createMockEvent({ cookie: 'staging' })

      const result = getAdminEnvironment(event)

      expect(result).toBe('production')
    })

    it('returns production for empty string cookie value', () => {
      const event = createMockEvent({ cookie: '' })

      const result = getAdminEnvironment(event)

      expect(result).toBe('production')
    })

    it('returns production for invalid cookie value development', () => {
      const event = createMockEvent({ cookie: 'development' })

      const result = getAdminEnvironment(event)

      expect(result).toBe('production')
    })

    it('returns production for random invalid cookie value', () => {
      const event = createMockEvent({ cookie: 'invalid-value-12345' })

      const result = getAdminEnvironment(event)

      expect(result).toBe('production')
    })
  })

  describe('setAdminEnvironment', () => {
    it('sets cookie with correct name admin_environment', () => {
      const event = createMockEvent({})

      setAdminEnvironment(event, 'production')

      expect(setCookie).toHaveBeenCalledWith(
        event,
        'admin_environment',
        'production',
        expect.objectContaining({
          httpOnly: true,
          secure: true,
          sameSite: 'strict',
          path: '/',
        })
      )
    })

    it('sets production environment correctly', () => {
      const event = createMockEvent({})

      setAdminEnvironment(event, 'production')

      expect(setCookie).toHaveBeenCalledWith(
        event,
        'admin_environment',
        'production',
        expect.any(Object)
      )
    })

    it('sets preview environment correctly', () => {
      const event = createMockEvent({})

      setAdminEnvironment(event, 'preview')

      expect(setCookie).toHaveBeenCalledWith(
        event,
        'admin_environment',
        'preview',
        expect.any(Object)
      )
    })

    it('sets cookie with appropriate security options', () => {
      const event = createMockEvent({})

      setAdminEnvironment(event, 'production')

      expect(setCookie).toHaveBeenCalledWith(
        event,
        'admin_environment',
        'production',
        expect.objectContaining({
          httpOnly: true,
          secure: true,
          sameSite: 'strict',
          path: '/',
          maxAge: 60 * 60 * 24 * 30, // 30 days
        })
      )
    })
  })

  describe('useAdminEnv', () => {
    describe('production environment', () => {
      it('returns production bindings when environment is production', () => {
        const cloudflareEnv = createMockCloudflareEnv({ includePreview: true, includeAdminDb: true })
        const event = createMockEvent({
          cookie: 'production',
          cloudflareEnv,
        })

        const result = useAdminEnv(event)

        expect(result.environment).toBe('production')
        expect(result.isLocal).toBe(false)
        expect(result.db).toEqual({ name: 'production-db' })
        expect(result.adminDb).toEqual({ name: 'admin-db' })
        expect(result.blob).toEqual({ name: 'production-blob' })
        expect(result.kv).toEqual({ name: 'production-kv' })
        expect(result.cache).toEqual({ name: 'production-cache' })
      })

      it('returns production bindings when no cookie is set', () => {
        const cloudflareEnv = createMockCloudflareEnv({ includePreview: true, includeAdminDb: true })
        const event = createMockEvent({
          cloudflareEnv,
        })

        const result = useAdminEnv(event)

        expect(result.environment).toBe('production')
        expect(result.isLocal).toBe(false)
        expect(result.db).toEqual({ name: 'production-db' })
        expect(result.adminDb).toEqual({ name: 'admin-db' })
      })

      it('returns null for adminDb when DB_ADMIN binding is not available', () => {
        const cloudflareEnv = createMockCloudflareEnv({ includePreview: true, includeAdminDb: false })
        const event = createMockEvent({
          cookie: 'production',
          cloudflareEnv,
        })

        const result = useAdminEnv(event)

        expect(result.environment).toBe('production')
        expect(result.isLocal).toBe(false)
        expect(result.db).toEqual({ name: 'production-db' })
        expect(result.adminDb).toBeNull()
      })
    })

    describe('preview environment', () => {
      it('returns preview bindings when environment is preview', () => {
        const cloudflareEnv = createMockCloudflareEnv({ includePreview: true, includeAdminDb: true })
        const event = createMockEvent({
          cookie: 'preview',
          cloudflareEnv,
        })

        const result = useAdminEnv(event)

        expect(result.environment).toBe('preview')
        expect(result.isLocal).toBe(false)
        expect(result.db).toEqual({ name: 'preview-db' })
        // Admin DB is shared across environments (no preview version)
        expect(result.adminDb).toEqual({ name: 'admin-db' })
        expect(result.blob).toEqual({ name: 'preview-blob' })
        expect(result.kv).toEqual({ name: 'preview-kv' })
        expect(result.cache).toEqual({ name: 'preview-cache' })
      })

      it('falls back to production bindings when preview bindings are not available', () => {
        const cloudflareEnv = createMockCloudflareEnv({ includePreview: false, includeAdminDb: true })
        const event = createMockEvent({
          cookie: 'preview',
          cloudflareEnv,
        })

        const result = useAdminEnv(event)

        expect(result.environment).toBe('preview')
        expect(result.isLocal).toBe(false)
        // Should fall back to production bindings
        expect(result.db).toEqual({ name: 'production-db' })
        expect(result.adminDb).toEqual({ name: 'admin-db' })
        expect(result.blob).toEqual({ name: 'production-blob' })
        expect(result.kv).toEqual({ name: 'production-kv' })
        expect(result.cache).toEqual({ name: 'production-cache' })
      })
    })

    describe('local development', () => {
      it('handles missing cloudflare context and returns isLocal: true', () => {
        const event = createMockEvent({
          cookie: 'production',
          cloudflareEnv: undefined,
        })
        // Override context to not have cloudflare
        event.context = {}

        const result = useAdminEnv(event)

        expect(result.isLocal).toBe(true)
        expect(result.environment).toBe('production')
        expect(result.db).toBeUndefined()
        expect(result.adminDb).toBeNull()
        expect(result.blob).toBeUndefined()
        expect(result.kv).toBeUndefined()
        expect(result.cache).toBeUndefined()
      })

      it('handles missing cloudflare.env and returns isLocal: true', () => {
        const event = createMockEvent({
          cookie: 'preview',
        })
        // Set up context with cloudflare but no env
        event.context = { cloudflare: {} }

        const result = useAdminEnv(event)

        expect(result.isLocal).toBe(true)
        // In local mode, environment is always 'production' regardless of cookie
        expect(result.environment).toBe('production')
      })

      it('returns production environment in local mode regardless of cookie', () => {
        const event = createMockEvent({
          cookie: 'preview',
        })
        event.context = {}

        const result = useAdminEnv(event)

        // In local mode, environment is always 'production' (only production available in dev)
        expect(result.environment).toBe('production')
        expect(result.isLocal).toBe(true)
      })
    })

    describe('environment string in result', () => {
      it('returns production string when environment is production', () => {
        const cloudflareEnv = createMockCloudflareEnv()
        const event = createMockEvent({
          cookie: 'production',
          cloudflareEnv,
        })

        const result = useAdminEnv(event)

        expect(result.environment).toBe('production')
      })

      it('returns preview string when environment is preview', () => {
        const cloudflareEnv = createMockCloudflareEnv({ includePreview: true })
        const event = createMockEvent({
          cookie: 'preview',
          cloudflareEnv,
        })

        const result = useAdminEnv(event)

        expect(result.environment).toBe('preview')
      })
    })
  })
})
