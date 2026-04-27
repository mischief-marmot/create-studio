import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
  resolveSiteUrl,
  normalizeSiteUrl,
  getApexDomain,
  buildApexHostMatchPatterns,
} from '../../server/utils/url'

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

  it('refuses to fetch when the initial URL hostname is a private IP (defense in depth)', async () => {
    const result = await resolveSiteUrl('http://10.0.0.1/')
    expect(result).toBe('http://10.0.0.1/')
    expect(globalThis.fetch).not.toHaveBeenCalled()
  })

  it('refuses to fetch when the initial URL is a non-http(s) scheme', async () => {
    const result = await resolveSiteUrl('file:///etc/passwd')
    expect(result).toBe('file:///etc/passwd')
    expect(globalThis.fetch).not.toHaveBeenCalled()
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

  it('refuses a redirect that lands on a different apex (no parked-domain hijack)', async () => {
    ;(globalThis.fetch as any)
      .mockResolvedValueOnce(mockResponse(301, 'https://parking.example.net/sale'))
      .mockResolvedValueOnce(mockResponse(200))

    const result = await resolveSiteUrl('https://example.com')
    expect(result).toBe('https://example.com')
  })

  it('accepts a redirect that stays on the same apex (apex → www → /path)', async () => {
    ;(globalThis.fetch as any)
      .mockResolvedValueOnce(mockResponse(301, 'https://www.example.com/blog/'))
      .mockResolvedValueOnce(mockResponse(200))

    const result = await resolveSiteUrl('https://example.com')
    expect(result).toBe('https://www.example.com/blog')
  })

  it('accepts a redirect that goes through an off-apex intermediate but lands back on the input apex', async () => {
    // URL shorteners / staging hops are common; only the terminal apex matters.
    ;(globalThis.fetch as any)
      .mockResolvedValueOnce(mockResponse(301, 'https://shortlink.io/abc'))
      .mockResolvedValueOnce(mockResponse(301, 'https://example.com/blog'))
      .mockResolvedValueOnce(mockResponse(200))

    const result = await resolveSiteUrl('https://example.com')
    expect(result).toBe('https://example.com/blog')
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

describe('getApexDomain', () => {
  it('strips the www. prefix', () => {
    expect(getApexDomain('https://www.slimmingeats.com/blog')).toBe('slimmingeats.com')
  })

  it('returns the host as-is when no www. prefix', () => {
    expect(getApexDomain('https://slimmingeats.com')).toBe('slimmingeats.com')
  })

  it('lowercases the hostname', () => {
    expect(getApexDomain('https://WWW.Example.COM')).toBe('example.com')
  })

  it('preserves non-www subdomains', () => {
    expect(getApexDomain('https://blog.example.com')).toBe('blog.example.com')
  })

  it('ignores path, query, and fragment', () => {
    expect(getApexDomain('https://example.com/blog?x=1#y')).toBe('example.com')
  })

  it('returns null for an invalid URL', () => {
    expect(getApexDomain('not a url')).toBeNull()
  })

  it('returns null for an empty string', () => {
    expect(getApexDomain('')).toBeNull()
  })

  // The apex feeds straight into a SQL LIKE pattern in buildSiteConfig.
  // Any char that LIKE treats as a metacharacter (`_`, `%`) — even though
  // the WHATWG URL parser allows it in hostnames — would let an
  // attacker-crafted siteKey match unrelated rows. Reject up front.
  it('returns null when the apex contains an underscore (anti-injection)', () => {
    // new URL() accepts `_` in hostnames per WHATWG URL, but real
    // HTTP-serving domains don't have it. Reject so it can't reach the
    // LIKE pattern as a single-char wildcard. We reject any `_` in the
    // returned apex — including inside subdomains — for the same reason.
    expect(getApexDomain('https://example_com')).toBeNull()
    expect(getApexDomain('https://www.example_com')).toBeNull()
    expect(getApexDomain('https://blog_one.example.com')).toBeNull()
  })
})

/**
 * Pattern shape the buildSiteConfig apex fallback uses for SQL LIKE matching.
 * The anchoring on `/` is load-bearing: without it, `LIKE 'https://example.com%'`
 * would match `https://example.com.evil.com/...`, letting an attacker-controlled
 * site's row be returned for a victim domain's apex query.
 */
describe('buildApexHostMatchPatterns', () => {
  const patterns = buildApexHostMatchPatterns('example.com')

  it('produces exact patterns for apex + www over http and https', () => {
    expect(patterns.exact).toEqual([
      'https://example.com',
      'http://example.com',
      'https://www.example.com',
      'http://www.example.com',
    ])
  })

  it('produces prefix patterns terminated with / (so LIKE only extends into path)', () => {
    expect(patterns.prefix).toEqual([
      'https://example.com/',
      'http://example.com/',
      'https://www.example.com/',
      'http://www.example.com/',
    ])
  })

  // Each prefix pattern terminates with /; SQL LIKE 'pattern%' is equivalent
  // to JS startsWith(pattern). These tests pin the spoof-prevention guarantee.
  it('a path-suffix URL on the apex matches its prefix pattern', () => {
    expect('https://example.com/blog'.startsWith(patterns.prefix[0])).toBe(true)
  })

  it('a path-suffix URL on www.apex matches its prefix pattern', () => {
    expect('https://www.example.com/blog'.startsWith(patterns.prefix[2])).toBe(true)
  })

  it('a same-prefix-different-host URL does NOT match the prefix pattern (anti-spoof)', () => {
    // `example.com.evil.com` starts with `example.com.` (note the dot, not /)
    expect('https://example.com.evil.com/path'.startsWith(patterns.prefix[0])).toBe(false)
  })

  it('a same-prefix-different-host URL is not equal to the exact pattern (anti-spoof)', () => {
    // exact is used with SQL eq(), i.e. full-string equality — not prefix.
    expect('https://example.com.evil.com/path').not.toBe(patterns.exact[0])
  })

  it('a longer-hostname spoof on www variant does NOT match', () => {
    expect('https://www.example.com.evil.com/path'.startsWith(patterns.prefix[2])).toBe(false)
  })

  it('an unrelated subdomain does NOT match (only apex and www)', () => {
    expect('https://blog.example.com'.startsWith(patterns.prefix[0])).toBe(false)
    expect('https://blog.example.com'.startsWith(patterns.exact[0])).toBe(false)
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
