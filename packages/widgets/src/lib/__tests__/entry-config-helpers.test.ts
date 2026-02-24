import { describe, it, expect } from 'vitest'
import { buildInteractiveModeConfig } from '../entry-helpers'

describe('buildInteractiveModeConfig', () => {
  it('forwards themeDesktop from siteConfig into the widget config', () => {
    const config = buildInteractiveModeConfig({
      creationId: '1',
      siteUrl: 'https://example.com',
      embedUrl: 'https://create.studio',
      siteConfig: { themeDesktop: 'split', themeMobile: 'carousel', buttonText: 'Go' },
    })
    expect(config.themeDesktop).toBe('split')
  })

  it('forwards themeMobile from siteConfig into the widget config', () => {
    const config = buildInteractiveModeConfig({
      creationId: '1',
      siteUrl: 'https://example.com',
      embedUrl: 'https://create.studio',
      siteConfig: { themeDesktop: 'carousel', themeMobile: 'cinematic', buttonText: 'Go' },
    })
    expect(config.themeMobile).toBe('cinematic')
  })

  it('defaults both themes to "carousel" when siteConfig omits them', () => {
    const config = buildInteractiveModeConfig({
      creationId: '1',
      siteUrl: 'https://example.com',
      embedUrl: 'https://create.studio',
      siteConfig: { buttonText: 'Go' },
    })
    expect(config.themeDesktop).toBe('carousel')
    expect(config.themeMobile).toBe('carousel')
  })
})
