import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { resolveSiteUrl, normalizeSiteUrl } from '../../server/utils/url'

/** Build a minimal Response-like for the resolveSiteUrl HEAD path. */
function mockResponse(status: number, location?: string) {
  const headers = new Map<string, string>()
  if (location) headers.set('location', location)
  return {
    status,
    headers: { get: (k: string) => headers.get(k.toLowerCase()) ?? null },
  }
}

describe('resolveSiteUrl', () => {
  const originalFetch = globalThis.fetch

  beforeEach(() => {
    globalThis.fetch = vi.fn() as any
  })

  afterEach(() => {
    globalThis.fetch = originalFetch
  })

  it('returns the input URL when fetch lands at the same URL with no redirect', async () => {
    ;(globalThis.fetch as any).mockResolvedValueOnce(mockResponse(200))

    const result = await resolveSiteUrl('https://example.com')
    expect(result).toBe('https://example.com')
  })

  it('returns the redirected URL when fetch follows a redirect chain', async () => {
    ;(globalThis.fetch as any)
      .mockResolvedValueOnce(mockResponse(301, 'https://www.slimmingeats.com/blog/'))
      .mockResolvedValueOnce(mockResponse(200))

    const result = await resolveSiteUrl('https://slimmingeats.com')
    expect(result).toBe('https://www.slimmingeats.com/blog')
  })

  it('upgrades http to https via the redirect chain', async () => {
    ;(globalThis.fetch as any)
      .mockResolvedValueOnce(mockResponse(301, 'http://www.example.com/'))
      .mockResolvedValueOnce(mockResponse(301, 'https://www.example.com/'))
      .mockResolvedValueOnce(mockResponse(200))

    const result = await resolveSiteUrl('https://example.com')
    expect(result).toBe('https://www.example.com')
  })

  it('falls back to the input URL on fetch failure', async () => {
    ;(globalThis.fetch as any).mockRejectedValueOnce(new Error('Network error'))

    const result = await resolveSiteUrl('https://example.com')
    expect(result).toBe('https://example.com')
  })

  it('falls back to the input URL on AbortError (timeout)', async () => {
    const abortError = new Error('aborted')
    abortError.name = 'AbortError'
    ;(globalThis.fetch as any).mockRejectedValueOnce(abortError)

    const result = await resolveSiteUrl('https://example.com')
    expect(result).toBe('https://example.com')
  })

  it('refuses to follow a redirect to a private IP (SSRF defense)', async () => {
    ;(globalThis.fetch as any).mockResolvedValueOnce(
      mockResponse(301, 'http://10.0.0.1/internal'),
    )

    const result = await resolveSiteUrl('https://example.com')
    expect(result).toBe('https://example.com')
    expect(globalThis.fetch).toHaveBeenCalledTimes(1)
  })

  it('refuses to follow a redirect to the cloud metadata endpoint', async () => {
    ;(globalThis.fetch as any).mockResolvedValueOnce(
      mockResponse(302, 'http://169.254.169.254/latest/meta-data/'),
    )

    const result = await resolveSiteUrl('https://example.com')
    expect(result).toBe('https://example.com')
    expect(globalThis.fetch).toHaveBeenCalledTimes(1)
  })

  it('refuses to follow a redirect to a non-http(s) scheme', async () => {
    ;(globalThis.fetch as any).mockResolvedValueOnce(
      mockResponse(301, 'file:///etc/passwd'),
    )

    const result = await resolveSiteUrl('https://example.com')
    expect(result).toBe('https://example.com')
  })

  it('falls back to the input URL when redirect cap is exceeded', async () => {
    ;(globalThis.fetch as any).mockResolvedValue(
      mockResponse(301, 'https://example.com/'),
    )

    const result = await resolveSiteUrl('https://example.com')
    expect(result).toBe('https://example.com')
  })

  it('falls back to the input URL when the final URL fails normalization', async () => {
    ;(globalThis.fetch as any).mockResolvedValueOnce(mockResponse(200))

    const result = await resolveSiteUrl('not-a-url')
    expect(result).toBe('not-a-url')
  })

  // TODO Phase 2: validate the final hostname is the same site (or a known
  // alias) — Phase 1 trusts whatever the redirect chain lands on.
  it('returns the redirected URL even when it lands on an unrelated host (no host-equality check in Phase 1)', async () => {
    ;(globalThis.fetch as any)
      .mockResolvedValueOnce(mockResponse(301, 'https://parking.example.net/sale'))
      .mockResolvedValueOnce(mockResponse(200))

    const result = await resolveSiteUrl('https://example.com')
    expect(result).toBe('https://parking.example.net/sale')
  })

  it('passes allowedDomains through to normalization', async () => {
    ;(globalThis.fetch as any)
      .mockResolvedValueOnce(mockResponse(301, 'http://my.local/blog'))
      .mockResolvedValueOnce(mockResponse(200))

    const result = await resolveSiteUrl('http://my.local', {
      allowedDomains: ['.local'],
    })
    expect(result).toBe('http://my.local/blog')
  })

  it('uses HEAD with redirect: manual on the underlying fetch', async () => {
    ;(globalThis.fetch as any).mockResolvedValueOnce(mockResponse(200))

    await resolveSiteUrl('https://example.com')

    expect(globalThis.fetch).toHaveBeenCalledWith(
      'https://example.com',
      expect.objectContaining({ method: 'HEAD', redirect: 'manual' }),
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

  it('handles a 3xx with no Location header by treating it as terminal', async () => {
    ;(globalThis.fetch as any).mockResolvedValueOnce(mockResponse(304))

    const result = await resolveSiteUrl('https://example.com')
    expect(result).toBe('https://example.com')
  })

  it('resolves relative redirect Location against the current URL', async () => {
    ;(globalThis.fetch as any)
      .mockResolvedValueOnce(mockResponse(301, '/blog'))
      .mockResolvedValueOnce(mockResponse(200))

    const result = await resolveSiteUrl('https://www.example.com')
    expect(result).toBe('https://www.example.com/blog')
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
