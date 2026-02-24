import { describe, it, expect, vi } from 'vitest'
import { ref } from 'vue'
import { resolveThemeComponent, THEME_FALLBACK } from '../InteractiveExperience'

/**
 * Tests for the theme resolution logic in the InteractiveExperience wrapper.
 * We test the exported helper function rather than mounting the component
 * to keep these fast and dependency-free.
 */

describe('resolveThemeComponent', () => {
  describe('fallback behavior', () => {
    it('falls back to "carousel" when no theme props are given', () => {
      const result = resolveThemeComponent(undefined, undefined, false)
      expect(result).toBe('carousel')
    })

    it('THEME_FALLBACK constant is "carousel"', () => {
      expect(THEME_FALLBACK).toBe('carousel')
    })

    it('falls back to "carousel" for unknown desktop theme', () => {
      const result = resolveThemeComponent('unknown-theme' as any, undefined, false)
      expect(result).toBe('carousel')
    })

    it('falls back to "carousel" for unknown mobile theme', () => {
      const result = resolveThemeComponent(undefined, 'unknown-theme' as any, true)
      expect(result).toBe('carousel')
    })
  })

  describe('desktop resolution (isMobile=false)', () => {
    it('returns "carousel" for themeDesktop="carousel"', () => {
      expect(resolveThemeComponent('carousel', undefined, false)).toBe('carousel')
    })

    it('returns "split" for themeDesktop="split"', () => {
      expect(resolveThemeComponent('split', undefined, false)).toBe('split')
    })

    it('returns "cinematic" for themeDesktop="cinematic"', () => {
      expect(resolveThemeComponent('cinematic', undefined, false)).toBe('cinematic')
    })

    it('uses desktop theme even if mobile theme is different, on desktop', () => {
      expect(resolveThemeComponent('split', 'carousel', false)).toBe('split')
    })
  })

  describe('mobile resolution (isMobile=true)', () => {
    it('returns "carousel" when themeMobile="carousel" on mobile', () => {
      expect(resolveThemeComponent('cinematic', 'carousel', true)).toBe('carousel')
    })

    it('returns "split" for themeMobile="split" on mobile', () => {
      expect(resolveThemeComponent('carousel', 'split', true)).toBe('split')
    })

    it('returns "cinematic" for themeMobile="cinematic" on mobile', () => {
      expect(resolveThemeComponent('carousel', 'cinematic', true)).toBe('cinematic')
    })

    it('falls back to desktop theme when no mobile theme set on mobile', () => {
      // No mobile override → use desktop theme
      expect(resolveThemeComponent('split', undefined, true)).toBe('split')
    })

    it('falls back to "carousel" when neither desktop nor mobile theme set on mobile', () => {
      expect(resolveThemeComponent(undefined, undefined, true)).toBe('carousel')
    })
  })

  describe('valid theme names', () => {
    const validThemes = ['carousel', 'split', 'cinematic'] as const

    for (const theme of validThemes) {
      it(`accepts "${theme}" as a valid theme`, () => {
        const desktop = resolveThemeComponent(theme, undefined, false)
        expect(validThemes).toContain(desktop)
        const mobile = resolveThemeComponent(undefined, theme, true)
        expect(validThemes).toContain(mobile)
      })
    }
  })
})
