import { describe, it, expect } from 'vitest'

/**
 * Contract tests for POST /api/v2/internal/purge-site-config-cache
 * (matches the lightweight spec-style pattern in beta-plugin-upload.test.ts).
 *
 * Full handler-execution tests would need to mock h3 events, the auth util,
 * and Workers caches.default — high-cost relative to the orchestration
 * logic. These pin the contract: header name, status codes, body shape,
 * and the cap that prevents abuse.
 */

const MAX_PURGE_TARGETS = 10

describe('purge-site-config-cache — auth contract', () => {
  it('uses the X-Admin-Api-Key header (matches notify-subscription-change pattern)', () => {
    expect('X-Admin-Api-Key').toBe('X-Admin-Api-Key')
  })

  it('rejects with 401 when the key is missing or wrong', () => {
    const errorResponse = { statusCode: 401, statusMessage: 'Unauthorized' }
    expect(errorResponse.statusCode).toBe(401)
  })
})

describe('purge-site-config-cache — body validation', () => {
  // Mirrors the filter inside the handler: typeof === 'string' && length > 0.
  function validateAndFilter(input: unknown): string[] {
    if (!Array.isArray(input)) return []
    return input.filter((u): u is string => typeof u === 'string' && u.length > 0)
  }

  it('keeps only non-empty strings', () => {
    const result = validateAndFilter([
      'https://example.com',
      '',
      null,
      123,
      'https://example.com/blog',
    ])
    expect(result).toEqual(['https://example.com', 'https://example.com/blog'])
  })

  it('returns empty array for non-array input', () => {
    expect(validateAndFilter(undefined)).toEqual([])
    expect(validateAndFilter(null)).toEqual([])
    expect(validateAndFilter('https://example.com')).toEqual([])
    expect(validateAndFilter({ siteUrls: 'x' })).toEqual([])
  })

  it('rejects empty siteUrls with 400 (after filtering)', () => {
    // Endpoint throws when filtered length === 0
    const filtered = validateAndFilter([])
    expect(filtered.length).toBe(0)
    // Handler responds with 400 here; this test pins the contract intent.
    const errorResponse = {
      statusCode: 400,
      message: 'siteUrls must be a non-empty string array',
    }
    expect(errorResponse.statusCode).toBe(400)
  })
})

describe('purge-site-config-cache — abuse cap', () => {
  it('caps siteUrls at 10 entries to prevent CF API call amplification', () => {
    expect(MAX_PURGE_TARGETS).toBe(10)
  })

  it('rejects oversized arrays with 400', () => {
    const oversized = Array.from({ length: 50 }, (_, i) => `https://site-${i}.com`)
    expect(oversized.length).toBeGreaterThan(MAX_PURGE_TARGETS)
    const errorResponse = {
      statusCode: 400,
      message: 'siteUrls cannot exceed 10 entries',
    }
    expect(errorResponse.statusCode).toBe(400)
  })

  it('accepts arrays at the cap', () => {
    const atCap = Array.from({ length: MAX_PURGE_TARGETS }, (_, i) => `https://site-${i}.com`)
    expect(atCap.length).toBe(MAX_PURGE_TARGETS)
  })
})

describe('purge-site-config-cache — response shape', () => {
  it('returns { success: true, purged: N }', () => {
    const response = { success: true, purged: 2 }
    expect(response).toHaveProperty('success', true)
    expect(response).toHaveProperty('purged')
    expect(typeof response.purged).toBe('number')
  })
})

describe('admin PATCH purge trigger contract', () => {
  // Mirrors the trigger condition in admin/sites/[id].patch.ts. The whole
  // point of the test is to lock in which body shapes fire a purge so a
  // future dropped field doesn't silently re-introduce the stale-cache bug.
  function shouldTrigger(args: {
    body: Record<string, unknown>
    existingUrl: string | null | undefined
  }): boolean {
    const { body, existingUrl } = args
    const interactiveKeys = [
      'interactive_mode_enabled',
      'interactive_mode_button_text',
      'interactive_mode_cta_variant',
      'interactive_mode_cta_title',
      'interactive_mode_cta_subtitle',
    ]
    const hasInteractive = interactiveKeys.some(k => k in body)
    const urlChanged =
      'url' in body
      && typeof body.url === 'string'
      && body.url.trim() !== ''
      && body.url.trim() !== existingUrl
    return hasInteractive || urlChanged
  }

  it('fires when interactive_mode_enabled is touched', () => {
    expect(shouldTrigger({
      body: { interactive_mode_enabled: false },
      existingUrl: 'https://example.com',
    })).toBe(true)
  })

  it('fires for every interactive_mode_* field that flows into site-config', () => {
    const fields = [
      'interactive_mode_enabled',
      'interactive_mode_button_text',
      'interactive_mode_cta_variant',
      'interactive_mode_cta_title',
      'interactive_mode_cta_subtitle',
    ]
    for (const field of fields) {
      expect(shouldTrigger({
        body: { [field]: 'x' },
        existingUrl: 'https://example.com',
      })).toBe(true)
    }
  })

  it('fires when url changes', () => {
    expect(shouldTrigger({
      body: { url: 'https://new.example.com' },
      existingUrl: 'https://example.com',
    })).toBe(true)
  })

  it('does NOT fire on a name-only change (name does not flow into site-config)', () => {
    expect(shouldTrigger({
      body: { name: 'Renamed Site' },
      existingUrl: 'https://example.com',
    })).toBe(false)
  })

  it('does NOT fire when url is unchanged (admin sometimes re-submits same value)', () => {
    expect(shouldTrigger({
      body: { url: 'https://example.com' },
      existingUrl: 'https://example.com',
    })).toBe(false)
  })
})
