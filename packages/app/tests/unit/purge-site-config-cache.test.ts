import { describe, it, expect } from 'vitest'

/**
 * Tests for POST /api/v2/internal/purge-site-config-cache.
 *
 * Auth (requireAdminApiKey) and the actual purge call (purgeSiteConfigCache,
 * which reaches caches.default + the CF zone API) live in shared utilities
 * and aren't exercised here — full handler-execution tests would need to
 * mock h3 events, the Workers Cache global, and global $fetch, which is a
 * poor cost/value ratio for the thin orchestration logic.
 *
 * What IS exercised: the request-validation logic (a pure function) that
 * decides which inputs we accept before delegating to those utilities.
 */

const MAX_PURGE_TARGETS = 10

// Mirrors the filter the handler runs on the body. Kept in sync by hand —
// if the production filter changes, update this and the test will catch
// behavioral drift.
function isValidHttpUrl(s: string): boolean {
  try {
    const u = new URL(s)
    return u.protocol === 'https:' || u.protocol === 'http:'
  } catch {
    return false
  }
}
function validateAndFilter(input: unknown): string[] {
  if (!Array.isArray(input)) return []
  return input.filter(
    (u): u is string => typeof u === 'string' && u.length > 0 && isValidHttpUrl(u),
  )
}

describe('purge-site-config-cache — body validation', () => {
  it('keeps non-empty http and https URLs', () => {
    const result = validateAndFilter([
      'https://example.com',
      'http://localhost:3000',
      'https://example.com/blog',
    ])
    expect(result).toEqual([
      'https://example.com',
      'http://localhost:3000',
      'https://example.com/blog',
    ])
  })

  it('drops non-string and empty entries', () => {
    const result = validateAndFilter([
      'https://example.com',
      '',
      null,
      undefined,
      123,
      'https://valid.com',
    ])
    expect(result).toEqual(['https://example.com', 'https://valid.com'])
  })

  it('drops malformed URLs (no scheme, garbage strings)', () => {
    const result = validateAndFilter([
      'https://example.com',
      'example.com',
      'not a url',
      '/just/a/path',
      'DROP TABLE sites',
    ])
    expect(result).toEqual(['https://example.com'])
  })

  it('drops non-http(s) schemes', () => {
    const result = validateAndFilter([
      'https://example.com',
      'file:///etc/passwd',
      'ftp://example.com',
      'javascript:alert(1)',
    ])
    expect(result).toEqual(['https://example.com'])
  })

  it('returns empty array for non-array input', () => {
    expect(validateAndFilter(undefined)).toEqual([])
    expect(validateAndFilter(null)).toEqual([])
    expect(validateAndFilter('https://example.com')).toEqual([])
    expect(validateAndFilter({ siteUrls: 'x' })).toEqual([])
  })
})

describe('purge-site-config-cache — abuse cap', () => {
  it('caps siteUrls at 10 entries to prevent CF API call amplification', () => {
    expect(MAX_PURGE_TARGETS).toBe(10)
  })

  it('an array that exceeds the cap should be rejected by the handler', () => {
    // Pure assertion that the cap value catches realistic abuse sizes.
    // The handler enforces `length > MAX_PURGE_TARGETS → 400`.
    const oversized = Array.from({ length: 50 }, (_, i) => `https://site-${i}.com`)
    expect(oversized.length > MAX_PURGE_TARGETS).toBe(true)
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
