import { describe, it, expect } from 'vitest'
import type { SiteSettings } from '../../server/db/schema'

/**
 * Tests for interactive mode theme settings.
 * These cover the new theme fields added to SiteSettings (Phase 7).
 */

type ThemeName = 'carousel' | 'split' | 'cinematic'

describe('Interactive Theme Settings', () => {
  describe('SiteSettings type — theme fields', () => {
    it('accepts interactive_mode_theme_desktop as undefined (default)', () => {
      const settings: SiteSettings = {}
      expect(settings.interactive_mode_theme_desktop).toBeUndefined()
    })

    it('accepts interactive_mode_theme_desktop = "carousel"', () => {
      const settings: SiteSettings = { interactive_mode_theme_desktop: 'carousel' }
      expect(settings.interactive_mode_theme_desktop).toBe('carousel')
    })

    it('accepts interactive_mode_theme_desktop = "split"', () => {
      const settings: SiteSettings = { interactive_mode_theme_desktop: 'split' }
      expect(settings.interactive_mode_theme_desktop).toBe('split')
    })

    it('accepts interactive_mode_theme_desktop = "cinematic"', () => {
      const settings: SiteSettings = { interactive_mode_theme_desktop: 'cinematic' }
      expect(settings.interactive_mode_theme_desktop).toBe('cinematic')
    })

    it('accepts interactive_mode_theme_mobile = "carousel"', () => {
      const settings: SiteSettings = { interactive_mode_theme_mobile: 'carousel' }
      expect(settings.interactive_mode_theme_mobile).toBe('carousel')
    })

    it('accepts interactive_mode_theme_mobile = "split"', () => {
      const settings: SiteSettings = { interactive_mode_theme_mobile: 'split' }
      expect(settings.interactive_mode_theme_mobile).toBe('split')
    })

    it('accepts interactive_mode_theme_mobile = "cinematic"', () => {
      const settings: SiteSettings = { interactive_mode_theme_mobile: 'cinematic' }
      expect(settings.interactive_mode_theme_mobile).toBe('cinematic')
    })

    it('accepts both theme fields together', () => {
      const settings: SiteSettings = {
        interactive_mode_theme_desktop: 'split',
        interactive_mode_theme_mobile: 'carousel',
      }
      expect(settings.interactive_mode_theme_desktop).toBe('split')
      expect(settings.interactive_mode_theme_mobile).toBe('carousel')
    })

    it('preserves existing settings when adding theme fields', () => {
      const settings: SiteSettings = {
        interactive_mode_enabled: true,
        interactive_mode_button_text: 'Cook with me!',
        interactive_mode_theme_desktop: 'cinematic',
        interactive_mode_theme_mobile: 'split',
      }
      expect(settings.interactive_mode_enabled).toBe(true)
      expect(settings.interactive_mode_button_text).toBe('Cook with me!')
      expect(settings.interactive_mode_theme_desktop).toBe('cinematic')
      expect(settings.interactive_mode_theme_mobile).toBe('split')
    })

    it('allows null theme fields (representing "use default")', () => {
      const settings: SiteSettings = {
        interactive_mode_theme_desktop: null,
        interactive_mode_theme_mobile: null,
      }
      expect(settings.interactive_mode_theme_desktop).toBeNull()
      expect(settings.interactive_mode_theme_mobile).toBeNull()
    })
  })

  describe('theme settings merge behavior', () => {
    it('merges theme settings into existing settings', () => {
      const existing: SiteSettings = {
        interactive_mode_enabled: true,
        interactive_mode_theme_desktop: 'carousel',
      }
      const update: Partial<SiteSettings> = {
        interactive_mode_theme_desktop: 'split',
        interactive_mode_theme_mobile: 'cinematic',
      }
      const merged = { ...existing, ...update }
      expect(merged.interactive_mode_enabled).toBe(true)
      expect(merged.interactive_mode_theme_desktop).toBe('split')
      expect(merged.interactive_mode_theme_mobile).toBe('cinematic')
    })

    it('can reset theme to null (back to default)', () => {
      const existing: SiteSettings = {
        interactive_mode_theme_desktop: 'split',
      }
      const update: Partial<SiteSettings> = {
        interactive_mode_theme_desktop: null,
      }
      const merged = { ...existing, ...update }
      expect(merged.interactive_mode_theme_desktop).toBeNull()
    })
  })

  describe('site-config response shape', () => {
    /**
     * Tests that the config object returned by /api/v2/site-config
     * includes the expected theme fields when a site has theme settings.
     */

    it('config object includes themeDesktop and themeMobile fields', () => {
      // Simulate what site-config should return for a Pro site with custom themes
      const config = buildSiteConfig({
        themeDesktop: 'split',
        themeMobile: 'carousel',
      })
      expect(config).toHaveProperty('themeDesktop', 'split')
      expect(config).toHaveProperty('themeMobile', 'carousel')
    })

    it('config includes themeDesktop defaulting to "carousel" when not set', () => {
      const config = buildSiteConfig({})
      expect(config.themeDesktop).toBe('carousel')
    })

    it('config includes themeMobile defaulting to "carousel" when not set', () => {
      const config = buildSiteConfig({})
      expect(config.themeMobile).toBe('carousel')
    })

    it('config passes through valid theme names unchanged', () => {
      const themes: ThemeName[] = ['carousel', 'split', 'cinematic']
      for (const theme of themes) {
        const config = buildSiteConfig({ themeDesktop: theme, themeMobile: theme })
        expect(config.themeDesktop).toBe(theme)
        expect(config.themeMobile).toBe(theme)
      }
    })
  })
})

/**
 * Helper: builds a config object as site-config.post.ts should return it,
 * given overrides from SiteSettings.
 * This mirrors the logic that will be added to the endpoint.
 */
function buildSiteConfig(settings: {
  themeDesktop?: string | null
  themeMobile?: string | null
}) {
  const VALID_THEMES = new Set(['carousel', 'split', 'cinematic'])
  const DEFAULT_THEME = 'carousel'

  const themeDesktop =
    settings.themeDesktop && VALID_THEMES.has(settings.themeDesktop)
      ? settings.themeDesktop
      : DEFAULT_THEME

  const themeMobile =
    settings.themeMobile && VALID_THEMES.has(settings.themeMobile)
      ? settings.themeMobile
      : DEFAULT_THEME

  return {
    themeDesktop,
    themeMobile,
  }
}
