import { describe, it, expect } from 'vitest'
import {
  buildSiteConfigCacheUrl,
  buildSiteConfigCacheKey,
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
