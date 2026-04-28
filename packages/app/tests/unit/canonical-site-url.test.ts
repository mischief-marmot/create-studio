import { describe, it, expect, vi } from 'vitest'
import { resolveCanonicalSiteUrl } from '../../server/utils/canonical-site-url'

/** Tests the pure orchestration; the wrapping findCanonicalSiteUrl that does
 *  the actual Drizzle calls is integration-territory and not covered here. */
describe('resolveCanonicalSiteUrl', () => {
  it('returns the exact-match URL and skips the apex query', async () => {
    const exact = vi.fn(async () => ({ url: 'https://example.com/blog' }))
    const apex = vi.fn(async () => ({ url: 'should-not-be-called' }))

    const result = await resolveCanonicalSiteUrl('https://example.com/blog', exact, apex)

    expect(result).toBe('https://example.com/blog')
    expect(exact).toHaveBeenCalledWith('https://example.com/blog')
    expect(apex).not.toHaveBeenCalled()
  })

  it('falls back to apex query when exact misses', async () => {
    const exact = vi.fn(async () => null)
    const apex = vi.fn(async () => ({ url: 'https://www.slimmingeats.com/blog' }))

    const result = await resolveCanonicalSiteUrl('https://slimmingeats.com', exact, apex)

    expect(result).toBe('https://www.slimmingeats.com/blog')
    expect(exact).toHaveBeenCalledWith('https://slimmingeats.com')
    expect(apex).toHaveBeenCalledWith('slimmingeats.com')
  })

  it('returns null when both exact and apex miss', async () => {
    const exact = vi.fn(async () => null)
    const apex = vi.fn(async () => null)

    const result = await resolveCanonicalSiteUrl('https://unknown.com', exact, apex)

    expect(result).toBeNull()
    expect(exact).toHaveBeenCalledTimes(1)
    expect(apex).toHaveBeenCalledTimes(1)
  })

  it('returns null and skips apex query when input is unparseable', async () => {
    // getApexDomain returns null for non-DNS-clean inputs (anti-injection).
    const exact = vi.fn(async () => null)
    const apex = vi.fn(async () => ({ url: 'should-not-be-called' }))

    const result = await resolveCanonicalSiteUrl('not a url', exact, apex)

    expect(result).toBeNull()
    expect(exact).toHaveBeenCalledTimes(1)
    expect(apex).not.toHaveBeenCalled()
  })

  it('returns null when exact returns a row but with null url', async () => {
    // Sites.url is nullable in the schema; defend against that edge.
    const exact = vi.fn(async () => ({ url: null }))
    const apex = vi.fn(async () => ({ url: 'https://www.example.com/blog' }))

    const result = await resolveCanonicalSiteUrl('https://example.com', exact, apex)

    // Falls through to apex since exact returned null url.
    expect(result).toBe('https://www.example.com/blog')
    expect(apex).toHaveBeenCalled()
  })

  it('passes the apex (www. stripped) to the apex query, not the full host', async () => {
    const exact = vi.fn(async () => null)
    const apex = vi.fn(async () => null)

    await resolveCanonicalSiteUrl('https://www.example.com', exact, apex)

    expect(apex).toHaveBeenCalledWith('example.com')
  })

  it('rejects an apex with LIKE metacharacters before reaching the apex query', async () => {
    // getApexDomain refuses non-DNS chars (anti SQL-LIKE-injection).
    const exact = vi.fn(async () => null)
    const apex = vi.fn(async () => ({ url: 'should-not-be-called' }))

    const result = await resolveCanonicalSiteUrl('https://example_com', exact, apex)

    expect(result).toBeNull()
    expect(apex).not.toHaveBeenCalled()
  })
})
