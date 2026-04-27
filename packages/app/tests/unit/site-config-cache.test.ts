import { describe, it, expect } from 'vitest'
import {
  buildSiteConfigCacheUrl,
  buildSiteConfigCacheKey,
  shouldPurgeOnSubscriptionUpdate,
} from '../../server/utils/site-config-cache'

/**
 * The cache key shape is load-bearing for invalidation: GET, POST, and
 * purgeSiteConfigCache must all produce byte-identical Request keys, or
 * cache.delete() silently misses the entry the GET handler wrote and
 * visitors keep seeing stale config until the 10-min TTL expires.
 */
describe('buildSiteConfigCacheUrl', () => {
  const ROOT = 'https://create.studio'

  it('produces a /api/v2/site-config/<base64> URL', () => {
    expect(buildSiteConfigCacheUrl(ROOT, 'https://www.example.com/blog')).toBe(
      `${ROOT}/api/v2/site-config/${btoa('https://www.example.com/blog')}`,
    )
  })

  it('matches the encoding the GET route uses (atob round-trip)', () => {
    const siteUrl = 'https://www.slimmingeats.com/blog'
    const url = buildSiteConfigCacheUrl(ROOT, siteUrl)
    const siteKey = url.split('/').pop()!
    expect(atob(siteKey)).toBe(siteUrl)
  })

  it('produces different keys for http vs https variants', () => {
    expect(buildSiteConfigCacheUrl(ROOT, 'https://example.com')).not.toBe(
      buildSiteConfigCacheUrl(ROOT, 'http://example.com'),
    )
  })

  it('produces different keys for paths that differ only in subdirectory', () => {
    expect(buildSiteConfigCacheUrl(ROOT, 'https://example.com')).not.toBe(
      buildSiteConfigCacheUrl(ROOT, 'https://example.com/blog'),
    )
  })

  it('honors the rootUrl parameter (preview vs production)', () => {
    const prod = buildSiteConfigCacheUrl(
      'https://create.studio',
      'https://example.com',
    )
    const preview = buildSiteConfigCacheUrl(
      'https://preview.create.studio',
      'https://example.com',
    )
    expect(prod).not.toBe(preview)
    expect(prod).toMatch(/^https:\/\/create\.studio\//)
    expect(preview).toMatch(/^https:\/\/preview\.create\.studio\//)
  })
})

describe('buildSiteConfigCacheKey', () => {
  const ROOT = 'https://create.studio'

  it('returns a Request whose URL matches buildSiteConfigCacheUrl', () => {
    const siteUrl = 'https://example.com/blog'
    const key = buildSiteConfigCacheKey(ROOT, siteUrl)
    expect(key).toBeInstanceOf(Request)
    expect(key.url).toBe(buildSiteConfigCacheUrl(ROOT, siteUrl))
  })

  it('returns a GET Request (cache.match in CF only matches on GET keys)', () => {
    const key = buildSiteConfigCacheKey(ROOT, 'https://example.com')
    expect(key.method).toBe('GET')
  })
})

/**
 * The predicate gates whether SubscriptionRepository.update bothers paying
 * for a cache purge. tier and status are the only columns getActiveTier
 * (and therefore buildSiteConfig) reads from a subscription row; period
 * dates, metadata, customer/sub IDs, and trial_extensions don't affect
 * the cached response.
 *
 * If buildSiteConfig ever starts reading another subscription column, this
 * predicate must be widened in lockstep — these tests pin the contract.
 */
describe('shouldPurgeOnSubscriptionUpdate', () => {
  it('fires on tier change', () => {
    expect(shouldPurgeOnSubscriptionUpdate({ tier: 'pro' })).toBe(true)
  })

  it('fires on status change', () => {
    expect(shouldPurgeOnSubscriptionUpdate({ status: 'active' })).toBe(true)
  })

  it('fires when both tier and status are present', () => {
    expect(shouldPurgeOnSubscriptionUpdate({ tier: 'free', status: 'canceled' })).toBe(true)
  })

  it('does NOT fire on period_end-only update (Stripe period rollover)', () => {
    expect(shouldPurgeOnSubscriptionUpdate({ current_period_end: '2026-05-01' })).toBe(false)
  })

  it('does NOT fire on stripe_subscription_id-only update', () => {
    expect(shouldPurgeOnSubscriptionUpdate({ stripe_subscription_id: 'sub_123' })).toBe(false)
  })

  it('does NOT fire on trial_extensions-only update (extension recorded but tier unchanged)', () => {
    expect(shouldPurgeOnSubscriptionUpdate({ trial_extensions: { day1: '2026-04-28' } })).toBe(false)
  })

  it('does NOT fire on metadata-only update', () => {
    expect(shouldPurgeOnSubscriptionUpdate({ metadata: { trial_cohort: 'a' } })).toBe(false)
  })

  it('does NOT fire on empty patch', () => {
    expect(shouldPurgeOnSubscriptionUpdate({})).toBe(false)
  })

  it('treats explicitly-undefined fields as present (in-operator semantics)', () => {
    // 'tier' in updates returns true even if updates.tier === undefined.
    // Worth pinning — this is the same drift trap the admin handler avoids
    // by using `'X' in body`, and we rely on the same semantics here.
    expect(shouldPurgeOnSubscriptionUpdate({ tier: undefined as any })).toBe(true)
  })
})
