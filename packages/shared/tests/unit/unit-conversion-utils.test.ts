import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
  detectSystemFromLocale,
  getInitialSystem,
  systemToPreference,
  preferenceToSystem,
  migrateLegacyUnitPreference,
  US_CUSTOMARY,
  METRIC,
  LEGACY_STORAGE_KEY,
  US_CUSTOMARY_COUNTRIES
} from '../../src/utils/unit-conversion'

describe('unit-conversion utils', () => {

  describe('detectSystemFromLocale', () => {
    const originalNavigator = globalThis.navigator

    afterEach(() => {
      Object.defineProperty(globalThis, 'navigator', { value: originalNavigator, writable: true })
    })

    it('returns us_customary for en-US locale', () => {
      Object.defineProperty(globalThis, 'navigator', {
        value: { languages: ['en-US'], language: 'en-US' },
        writable: true
      })
      expect(detectSystemFromLocale()).toBe(US_CUSTOMARY)
    })

    it('returns metric for en-GB locale', () => {
      Object.defineProperty(globalThis, 'navigator', {
        value: { languages: ['en-GB'], language: 'en-GB' },
        writable: true
      })
      expect(detectSystemFromLocale()).toBe(METRIC)
    })

    it('returns metric for de-DE locale', () => {
      Object.defineProperty(globalThis, 'navigator', {
        value: { languages: ['de-DE'], language: 'de-DE' },
        writable: true
      })
      expect(detectSystemFromLocale()).toBe(METRIC)
    })

    it('returns us_customary for LR (Liberia) locale', () => {
      Object.defineProperty(globalThis, 'navigator', {
        value: { languages: ['en-LR'], language: 'en-LR' },
        writable: true
      })
      expect(detectSystemFromLocale()).toBe(US_CUSTOMARY)
    })

    it('returns metric when no country code in locale', () => {
      Object.defineProperty(globalThis, 'navigator', {
        value: { languages: ['en'], language: 'en' },
        writable: true
      })
      expect(detectSystemFromLocale()).toBe(METRIC)
    })
  })

  describe('getInitialSystem', () => {
    it('returns saved preference when present (imperial → us_customary)', () => {
      expect(getInitialSystem('auto', 'imperial')).toBe(US_CUSTOMARY)
    })

    it('returns saved preference when present (metric → metric)', () => {
      expect(getInitialSystem('auto', 'metric')).toBe(METRIC)
    })

    it('detects locale when default is auto and no saved preference', () => {
      // This test depends on the test runner's locale; just verify it returns a valid system
      const result = getInitialSystem('auto')
      expect([US_CUSTOMARY, METRIC]).toContain(result)
    })

    it('returns configured default when not auto', () => {
      expect(getInitialSystem('us_customary')).toBe(US_CUSTOMARY)
      expect(getInitialSystem('metric')).toBe(METRIC)
    })

    it('falls back to locale detection when defaultSystem is undefined', () => {
      const result = getInitialSystem(undefined)
      expect([US_CUSTOMARY, METRIC]).toContain(result)
    })
  })

  describe('systemToPreference / preferenceToSystem', () => {
    it('maps us_customary to imperial', () => {
      expect(systemToPreference(US_CUSTOMARY)).toBe('imperial')
    })

    it('maps metric to metric', () => {
      expect(systemToPreference(METRIC)).toBe('metric')
    })

    it('maps imperial back to us_customary', () => {
      expect(preferenceToSystem('imperial')).toBe(US_CUSTOMARY)
    })

    it('maps metric back to metric', () => {
      expect(preferenceToSystem('metric')).toBe(METRIC)
    })

    it('returns null for undefined', () => {
      expect(preferenceToSystem(undefined)).toBeNull()
    })
  })

  describe('migrateLegacyUnitPreference', () => {
    beforeEach(() => {
      localStorage.clear()
    })

    afterEach(() => {
      localStorage.clear()
    })

    it('migrates us_customary value and removes legacy key', () => {
      localStorage.setItem(LEGACY_STORAGE_KEY, 'us_customary')
      const result = migrateLegacyUnitPreference()
      expect(result).toBe(US_CUSTOMARY)
      expect(localStorage.getItem(LEGACY_STORAGE_KEY)).toBeNull()
    })

    it('migrates metric value and removes legacy key', () => {
      localStorage.setItem(LEGACY_STORAGE_KEY, 'metric')
      const result = migrateLegacyUnitPreference()
      expect(result).toBe(METRIC)
      expect(localStorage.getItem(LEGACY_STORAGE_KEY)).toBeNull()
    })

    it('returns null when no legacy key exists', () => {
      expect(migrateLegacyUnitPreference()).toBeNull()
    })

    it('returns null for invalid legacy value', () => {
      localStorage.setItem(LEGACY_STORAGE_KEY, 'invalid')
      expect(migrateLegacyUnitPreference()).toBeNull()
    })
  })

  describe('US_CUSTOMARY_COUNTRIES', () => {
    it('includes US, LR, and MM', () => {
      expect(US_CUSTOMARY_COUNTRIES).toContain('US')
      expect(US_CUSTOMARY_COUNTRIES).toContain('LR')
      expect(US_CUSTOMARY_COUNTRIES).toContain('MM')
      expect(US_CUSTOMARY_COUNTRIES).toHaveLength(3)
    })
  })
})
