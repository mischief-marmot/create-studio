import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { resolveSiteUrl, normalizeSiteUrl } from '../../server/utils/url'

describe('resolveSiteUrl', () => {
  const originalFetch = globalThis.fetch

  beforeEach(() => {
    globalThis.fetch = vi.fn() as any
  })

  afterEach(() => {
    globalThis.fetch = originalFetch
  })

  it('returns the input URL when fetch lands at the same URL', async () => {
    ;(globalThis.fetch as any).mockResolvedValue({
      url: 'https://example.com',
      ok: true,
    })

    const result = await resolveSiteUrl('https://example.com')
    expect(result).toBe('https://example.com')
  })

  it('returns the redirected URL when fetch follows a redirect chain', async () => {
    ;(globalThis.fetch as any).mockResolvedValue({
      url: 'https://www.slimmingeats.com/blog/',
      ok: true,
    })

    const result = await resolveSiteUrl('https://slimmingeats.com')
    expect(result).toBe('https://www.slimmingeats.com/blog')
  })

  it('upgrades http to https via the redirect chain', async () => {
    ;(globalThis.fetch as any).mockResolvedValue({
      url: 'https://www.example.com/',
      ok: true,
    })

    const result = await resolveSiteUrl('https://example.com')
    expect(result).toBe('https://www.example.com')
  })

  it('falls back to the input URL on fetch failure', async () => {
    ;(globalThis.fetch as any).mockRejectedValue(new Error('Network error'))

    const result = await resolveSiteUrl('https://example.com')
    expect(result).toBe('https://example.com')
  })

  it('falls back to the input URL on AbortError (timeout)', async () => {
    const abortError = new Error('aborted')
    abortError.name = 'AbortError'
    ;(globalThis.fetch as any).mockRejectedValue(abortError)

    const result = await resolveSiteUrl('https://example.com')
    expect(result).toBe('https://example.com')
  })

  it('falls back to the input URL when response.url normalizes to invalid', async () => {
    ;(globalThis.fetch as any).mockResolvedValue({
      url: 'http://10.0.0.1/',
      ok: true,
    })

    const result = await resolveSiteUrl('https://example.com')
    expect(result).toBe('https://example.com')
  })

  it('returns the redirected URL even when it lands on an unrelated host (no WP-detection in Phase 1)', async () => {
    ;(globalThis.fetch as any).mockResolvedValue({
      url: 'https://parking.example.net/sale',
      ok: true,
    })

    const result = await resolveSiteUrl('https://example.com')
    expect(result).toBe('https://parking.example.net/sale')
  })

  it('passes allowedDomains through to normalization', async () => {
    ;(globalThis.fetch as any).mockResolvedValue({
      url: 'http://my.local/blog',
      ok: true,
    })

    const result = await resolveSiteUrl('http://my.local', {
      allowedDomains: ['.local'],
    })
    expect(result).toBe('http://my.local/blog')
  })

  it('uses redirect: follow on the underlying fetch', async () => {
    ;(globalThis.fetch as any).mockResolvedValue({
      url: 'https://example.com',
      ok: true,
    })

    await resolveSiteUrl('https://example.com')

    expect(globalThis.fetch).toHaveBeenCalledWith(
      'https://example.com',
      expect.objectContaining({ redirect: 'follow' }),
    )
  })

  it('aborts after the configured timeout', async () => {
    let signal: AbortSignal | undefined
    ;(globalThis.fetch as any).mockImplementation((_url: string, init: any) => {
      signal = init.signal
      return new Promise((_resolve, reject) => {
        signal!.addEventListener('abort', () => {
          const err = new Error('aborted')
          err.name = 'AbortError'
          reject(err)
        })
      })
    })

    const result = await resolveSiteUrl('https://example.com', { timeoutMs: 5 })

    expect(result).toBe('https://example.com')
    expect(signal?.aborted).toBe(true)
  })
})

describe('normalizeSiteUrl (sanity check for resolveSiteUrl)', () => {
  it('still strips trailing slash', () => {
    expect(normalizeSiteUrl('https://example.com/')).toBe('https://example.com')
  })

  it('preserves subdirectory path', () => {
    expect(normalizeSiteUrl('https://www.slimmingeats.com/blog/')).toBe(
      'https://www.slimmingeats.com/blog',
    )
  })
})
