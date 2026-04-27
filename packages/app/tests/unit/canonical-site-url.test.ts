import { describe, it, expect } from 'vitest'
import { getApexDomain, buildApexHostMatchPatterns } from '../../server/utils/url'

/**
 * findCanonicalSiteUrl combines an exact-URL lookup with an apex-fallback
 * LIKE search. The full handler can't be unit-tested without mocking the
 * Drizzle global `db`, but the lookup logic is built from two pure helpers
 * (getApexDomain + buildApexHostMatchPatterns) that ARE unit-tested
 * individually. This file pins the contract: which input URLs would reach
 * each lookup branch, and that the apex variants stay anchored.
 *
 * Drift hazard: if a future change widens or tightens the fallback patterns,
 * the corresponding tests in url.test.ts catch it. These tests document
 * the fetch-creation use case so future readers know why the helper exists.
 */
describe('findCanonicalSiteUrl — input shape contract', () => {
  it('a request from the widget at apex would trigger the apex fallback', () => {
    // Widget computes site_url as `${protocol}//${normalizeDomain(siteUrl)}`,
    // which strips www. and any path. So fetch-creation often receives a
    // bare-apex URL like https://slimmingeats.com.
    const widgetSiteUrl = 'https://slimmingeats.com'
    expect(getApexDomain(widgetSiteUrl)).toBe('slimmingeats.com')
  })

  it('a request matching Sites.url exactly would skip the fallback', () => {
    // When Sites.url is stored exactly as the widget computes (no /blog
    // subdir, no www.), exact-match returns the row and the apex fallback
    // never fires.
    const url = 'https://example.com'
    expect(getApexDomain(url)).toBe('example.com')
  })

  it('apex fallback for slimmingeats.com would match the stored /blog row', () => {
    // Stored row: https://www.slimmingeats.com/blog
    // Widget request: https://slimmingeats.com
    // Expected: prefix pattern `https://www.slimmingeats.com/` matches.
    const patterns = buildApexHostMatchPatterns('slimmingeats.com')
    const stored = 'https://www.slimmingeats.com/blog'
    const matched = patterns.prefix.some(p => stored.startsWith(p))
    expect(matched).toBe(true)
  })

  it('apex fallback would NOT match a different apex with the same prefix', () => {
    // Anti-spoof: a row at https://slimmingeats.com.evil.com/blog must not
    // be returned for a slimmingeats.com query.
    const patterns = buildApexHostMatchPatterns('slimmingeats.com')
    const spoofed = 'https://slimmingeats.com.evil.com/blog'
    const matched = patterns.prefix.some(p => spoofed.startsWith(p))
    expect(matched).toBe(false)
  })

  it('returns null path for an unparseable input', () => {
    // findCanonicalSiteUrl should return null when getApexDomain returns
    // null (i.e. URL parse failure or non-DNS chars).
    expect(getApexDomain('not a url')).toBeNull()
    expect(getApexDomain('https://example_com')).toBeNull()
  })
})
