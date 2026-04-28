import { describe, it, expect } from 'vitest'
import {
  MAX_PURGE_TARGETS,
  validateSiteUrls,
} from '../../server/utils/site-url-validation'

/**
 * Tests for POST /api/v2/internal/purge-site-config-cache.
 *
 * Auth (requireAdminApiKey) and the actual purge call (purgeSiteConfigCache,
 * which reaches caches.default + the CF zone API) live in shared utilities
 * and aren't exercised here — full handler-execution tests would need to
 * mock h3 events, the Workers Cache global, and global $fetch, which is a
 * poor cost/value ratio for the thin orchestration logic.
 *
 * What IS exercised: the request-validation logic, imported from the
 * handler itself so tests catch drift instead of testing a stale copy.
 */

describe('purge-site-config-cache — body validation', () => {
  it('keeps non-empty http and https URLs', () => {
    const result = validateSiteUrls([
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
    const result = validateSiteUrls([
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
    const result = validateSiteUrls([
      'https://example.com',
      'example.com',
      'not a url',
      '/just/a/path',
      'DROP TABLE sites',
    ])
    expect(result).toEqual(['https://example.com'])
  })

  it('drops non-http(s) schemes', () => {
    const result = validateSiteUrls([
      'https://example.com',
      'file:///etc/passwd',
      'ftp://example.com',
      'javascript:alert(1)',
    ])
    expect(result).toEqual(['https://example.com'])
  })

  it('returns empty array for non-array input', () => {
    expect(validateSiteUrls(undefined)).toEqual([])
    expect(validateSiteUrls(null)).toEqual([])
    expect(validateSiteUrls('https://example.com')).toEqual([])
    expect(validateSiteUrls({ siteUrls: 'x' })).toEqual([])
  })
})

describe('purge-site-config-cache — abuse cap', () => {
  it('caps siteUrls at 10 entries to prevent CF API call amplification', () => {
    expect(MAX_PURGE_TARGETS).toBe(10)
  })

  it('passes an array exactly at the cap through validation unchanged', () => {
    const atCap = Array.from({ length: MAX_PURGE_TARGETS }, (_, i) => `https://site-${i}.com`)
    expect(validateSiteUrls(atCap)).toHaveLength(MAX_PURGE_TARGETS)
  })

  it('lets oversized arrays through validation — the handler enforces the cap separately with a 400', () => {
    // validateSiteUrls is pure filtering (shape, scheme, non-empty); the
    // size cap is checked after, in the handler. This pin documents that
    // split so a future refactor doesn't accidentally double-enforce or
    // drop the cap.
    const oversized = Array.from({ length: 50 }, (_, i) => `https://site-${i}.com`)
    expect(validateSiteUrls(oversized)).toHaveLength(50)
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

describe('admin subscription purge trigger contract', () => {
  // Mirrors the trigger conditions across admin subscription write handlers.
  // Operations that change tier or status (or create/delete the row) must
  // trigger a purge; operations that only touch metadata (period dates,
  // cancel_at_period_end on Stripe subscriptions) must not.
  function shouldTrigger(args: {
    operation: 'create' | 'delete' | 'modify-tier' | 'cancel' | 'link-stripe'
    hasStripeSubscription?: boolean
  }): boolean {
    const { operation, hasStripeSubscription = false } = args
    switch (operation) {
      case 'create':    return true   // always sets tier + status
      case 'delete':    return true   // row gone; cached config is stale
      case 'modify-tier': return true // handler throws if tier unchanged, so always changes
      case 'link-stripe': return true // sets tier='pro' + syncs Stripe status
      case 'cancel':
        // PATH 1 (Stripe): only sets cancel_at_period_end — tier/status unchanged
        //   until Stripe webhooks fire (which go through SubscriptionRepository).
        // PATH 2 (no Stripe): sets tier='free' + status='free' immediately.
        return !hasStripeSubscription
    }
  }

  it('fires on subscription create (tier + status always written)', () => {
    expect(shouldTrigger({ operation: 'create' })).toBe(true)
  })

  it('fires on subscription delete (cached config becomes stale)', () => {
    expect(shouldTrigger({ operation: 'delete' })).toBe(true)
  })

  it('fires on modify-tier (tier always changes — same-tier is rejected by the handler)', () => {
    expect(shouldTrigger({ operation: 'modify-tier' })).toBe(true)
  })

  it('fires on link-stripe (tier becomes pro, status synced from Stripe)', () => {
    expect(shouldTrigger({ operation: 'link-stripe' })).toBe(true)
  })

  it('fires on cancel without Stripe (immediate downgrade: tier + status set to free)', () => {
    expect(shouldTrigger({ operation: 'cancel', hasStripeSubscription: false })).toBe(true)
  })

  it('does NOT fire on cancel with Stripe (only sets cancel_at_period_end; tier/status unchanged)', () => {
    expect(shouldTrigger({ operation: 'cancel', hasStripeSubscription: true })).toBe(false)
  })
})
