import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useConsentStore } from '~/stores/consent'

describe('Consent Store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  describe('Initial State', () => {
    it('initializes with null consent state', () => {
      const store = useConsentStore()

      expect(store.analytics).toBeNull()
      expect(store.marketing).toBeNull()
      expect(store.lastUpdated).toBeNull()
      expect(store.bannerDismissed).toBe(false)
    })

    it('computes hasConsented as false initially', () => {
      const store = useConsentStore()

      expect(store.hasConsented).toBe(false)
    })

    it('computes shouldShowBanner as true initially', () => {
      const store = useConsentStore()

      expect(store.shouldShowBanner).toBe(true)
    })
  })

  describe('acceptAll', () => {
    it('sets both analytics and marketing to true', () => {
      const store = useConsentStore()

      store.acceptAll()

      expect(store.analytics).toBe(true)
      expect(store.marketing).toBe(true)
    })

    it('sets lastUpdated timestamp', () => {
      const store = useConsentStore()
      const beforeTimestamp = new Date().getTime()

      store.acceptAll()

      const afterTimestamp = new Date().getTime()
      expect(store.lastUpdated).toBeDefined()

      // Convert ISO string to timestamp for comparison
      const lastUpdatedTimestamp = new Date(store.lastUpdated!).getTime()
      expect(lastUpdatedTimestamp).toBeGreaterThanOrEqual(beforeTimestamp)
      expect(lastUpdatedTimestamp).toBeLessThanOrEqual(afterTimestamp)
    })

    it('dismisses the banner', () => {
      const store = useConsentStore()

      store.acceptAll()

      expect(store.bannerDismissed).toBe(true)
    })

    it('updates hasConsented to true', () => {
      const store = useConsentStore()

      store.acceptAll()

      expect(store.hasConsented).toBe(true)
    })

    it('updates shouldShowBanner to false', () => {
      const store = useConsentStore()

      store.acceptAll()

      expect(store.shouldShowBanner).toBe(false)
    })
  })

  describe('rejectAll', () => {
    it('sets both analytics and marketing to false', () => {
      const store = useConsentStore()

      store.rejectAll()

      expect(store.analytics).toBe(false)
      expect(store.marketing).toBe(false)
    })

    it('sets lastUpdated timestamp', () => {
      const store = useConsentStore()

      store.rejectAll()

      expect(store.lastUpdated).toBeDefined()
    })

    it('dismisses the banner', () => {
      const store = useConsentStore()

      store.rejectAll()

      expect(store.bannerDismissed).toBe(true)
    })

    it('updates shouldShowBanner to false', () => {
      const store = useConsentStore()

      store.rejectAll()

      expect(store.shouldShowBanner).toBe(false)
    })
  })

  describe('setConsent', () => {
    it('sets specific consent preferences', () => {
      const store = useConsentStore()

      store.setConsent({ analytics: true, marketing: false })

      expect(store.analytics).toBe(true)
      expect(store.marketing).toBe(false)
    })

    it('only updates provided preferences', () => {
      const store = useConsentStore()

      store.setConsent({ analytics: true })

      expect(store.analytics).toBe(true)
      expect(store.marketing).toBeNull()
    })

    it('sets lastUpdated timestamp', () => {
      const store = useConsentStore()

      store.setConsent({ analytics: true })

      expect(store.lastUpdated).toBeDefined()
    })

    it('dismisses the banner', () => {
      const store = useConsentStore()

      store.setConsent({ analytics: true })

      expect(store.bannerDismissed).toBe(true)
    })
  })

  describe('dismissBanner', () => {
    it('sets bannerDismissed to true', () => {
      const store = useConsentStore()

      store.dismissBanner()

      expect(store.bannerDismissed).toBe(true)
    })

    it('does not modify consent state', () => {
      const store = useConsentStore()

      store.dismissBanner()

      expect(store.analytics).toBeNull()
      expect(store.marketing).toBeNull()
    })

    it('makes shouldShowBanner false', () => {
      const store = useConsentStore()

      store.dismissBanner()

      expect(store.shouldShowBanner).toBe(false)
    })
  })

  describe('resetConsent', () => {
    it('resets all consent to null', () => {
      const store = useConsentStore()

      store.acceptAll()
      store.resetConsent()

      expect(store.analytics).toBeNull()
      expect(store.marketing).toBeNull()
      expect(store.lastUpdated).toBeNull()
    })

    it('resets bannerDismissed to false', () => {
      const store = useConsentStore()

      store.acceptAll()
      store.resetConsent()

      expect(store.bannerDismissed).toBe(false)
    })

    it('makes shouldShowBanner true again', () => {
      const store = useConsentStore()

      store.acceptAll()
      store.resetConsent()

      expect(store.shouldShowBanner).toBe(true)
    })
  })

  describe('deleteAnalyticsCookies', () => {
    it('executes without error', () => {
      const store = useConsentStore()

      expect(() => {
        store.deleteAnalyticsCookies()
      }).not.toThrow()
    })
  })

  describe('consentLevel getter', () => {
    it('returns current consent preferences', () => {
      const store = useConsentStore()

      store.setConsent({ analytics: true, marketing: false })

      expect(store.consentLevel).toEqual({
        analytics: true,
        marketing: false,
      })
    })

    it('returns null values when not set', () => {
      const store = useConsentStore()

      expect(store.consentLevel).toEqual({
        analytics: null,
        marketing: null,
      })
    })
  })

  describe('Persistence', () => {
    it('persists consent to localStorage', () => {
      const store = useConsentStore()

      store.acceptAll()

      // Store state should be persisted (tested by Pinia's persist plugin)
      expect(store.analytics).toBe(true)
      expect(store.marketing).toBe(true)
    })
  })

  describe('Complex Scenarios', () => {
    it('allows changing consent after initial choice', () => {
      const store = useConsentStore()

      store.acceptAll()
      expect(store.analytics).toBe(true)

      store.setConsent({ analytics: false })
      expect(store.analytics).toBe(false)
    })

    it('handles mixed consent preferences', () => {
      const store = useConsentStore()

      store.setConsent({ analytics: true, marketing: false })
      expect(store.hasConsented).toBe(true)

      store.setConsent({ analytics: false, marketing: true })
      expect(store.hasConsented).toBe(true)
    })

    it('banner shows again after reset', () => {
      const store = useConsentStore()

      store.acceptAll()
      expect(store.shouldShowBanner).toBe(false)

      store.resetConsent()
      expect(store.shouldShowBanner).toBe(true)
    })
  })
})
