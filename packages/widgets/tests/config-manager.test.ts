import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { ConfigManager } from '../src/lib/widget-sdk/config-manager'

/**
 * The site-config response carries the canonical Sites.url alongside the
 * gating config. ConfigManager.loadSiteConfig promotes that into baseConfig
 * so SDK getSiteUrl() returns the canonical form for every downstream
 * WP-REST call. Tests below pin that behavior across realistic and edge
 * shapes the server might return.
 */
describe('ConfigManager.loadSiteConfig — siteUrl promotion', () => {
  const originalFetch = globalThis.fetch

  beforeEach(() => {
    globalThis.fetch = vi.fn() as any
  })

  afterEach(() => {
    globalThis.fetch = originalFetch
  })

  function mockResponse(body: any) {
    return Promise.resolve({
      ok: true,
      json: () => Promise.resolve(body),
    } as any)
  }

  it('promotes a canonical siteUrl returned by the server', async () => {
    const cm = new ConfigManager({ siteUrl: 'https://slimmingeats.com' })
    ;(globalThis.fetch as any).mockReturnValueOnce(mockResponse({
      success: true,
      config: { showInteractiveMode: true, features: [] },
      siteUrl: 'https://www.slimmingeats.com/blog',
    }))

    await cm.loadSiteConfig()

    expect(cm.getBaseConfig().siteUrl).toBe('https://www.slimmingeats.com/blog')
  })

  it('keeps the input siteUrl when the response omits siteUrl', async () => {
    const cm = new ConfigManager({ siteUrl: 'https://example.com' })
    ;(globalThis.fetch as any).mockReturnValueOnce(mockResponse({
      success: true,
      config: { showInteractiveMode: true, features: [] },
    }))

    await cm.loadSiteConfig()

    expect(cm.getBaseConfig().siteUrl).toBe('https://example.com')
  })

  it('keeps the input siteUrl when the response returns an empty siteUrl', async () => {
    // Defensive: an empty string would otherwise overwrite a usable value.
    const cm = new ConfigManager({ siteUrl: 'https://example.com' })
    ;(globalThis.fetch as any).mockReturnValueOnce(mockResponse({
      success: true,
      config: { showInteractiveMode: true, features: [] },
      siteUrl: '',
    }))

    await cm.loadSiteConfig()

    expect(cm.getBaseConfig().siteUrl).toBe('https://example.com')
  })

  it('keeps the input siteUrl when the response returns a non-string siteUrl', async () => {
    const cm = new ConfigManager({ siteUrl: 'https://example.com' })
    ;(globalThis.fetch as any).mockReturnValueOnce(mockResponse({
      success: true,
      config: { showInteractiveMode: true, features: [] },
      siteUrl: 42,
    }))

    await cm.loadSiteConfig()

    expect(cm.getBaseConfig().siteUrl).toBe('https://example.com')
  })

  it('keeps the input siteUrl when the request fails (defaults path)', async () => {
    const cm = new ConfigManager({ siteUrl: 'https://example.com' })
    ;(globalThis.fetch as any).mockRejectedValueOnce(new Error('network'))

    await cm.loadSiteConfig()

    expect(cm.getBaseConfig().siteUrl).toBe('https://example.com')
  })
})
