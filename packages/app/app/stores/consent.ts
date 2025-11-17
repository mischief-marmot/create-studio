/**
 * Consent store for managing user consent preferences
 * Tracks analytics and marketing consent, persists to localStorage
 * Integrates with @nuxt/scripts for conditional script loading
 */

import { defineStore } from 'pinia'
import { useStorage } from '@vueuse/core'
import { useAuthFetch } from '~/composables/useAuthFetch'
import { deleteAnalyticsCookies as deleteAnalyticsCookiesUtil } from '~/utils/cookies'

export interface ConsentState {
  analytics: boolean | null // null = not asked, true/false = answered
  marketing: boolean | null // null = not asked, true/false = answered
  lastUpdated: string | null // ISO timestamp
  bannerDismissed: boolean
  showCustomizeModal: boolean
}

export const useConsentStore = defineStore('consent', {
  state: (): ConsentState => ({
    analytics: null,
    marketing: null,
    lastUpdated: null,
    bannerDismissed: false,
    showCustomizeModal: false,
  }),

  getters: {
    hasConsented: (state) => {
      return state.analytics !== null || state.marketing !== null
    },
    shouldShowBanner: (state) => {
      return !state.bannerDismissed && (state.analytics === null || state.marketing === null)
    },
    consentLevel: (state) => {
      return {
        analytics: state.analytics,
        marketing: state.marketing,
      }
    },
  },

  actions: {
    /**
     * Accept all consent options
     */
    acceptAll() {
      this.setConsent({
        analytics: true,
        marketing: true,
      })
    },

    /**
     * Reject all consent options
     */
    rejectAll() {
      this.setConsent({
        analytics: false,
        marketing: false,
      })
    },

    /**
     * Set specific consent preferences
     */
    setConsent(preferences: Partial<Omit<ConsentState, 'lastUpdated' | 'bannerDismissed'>>) {
      if (preferences.analytics !== undefined) {
        this.analytics = preferences.analytics
      }
      if (preferences.marketing !== undefined) {
        this.marketing = preferences.marketing
      }
      this.lastUpdated = new Date().toISOString()
      this.bannerDismissed = true
    },

    /**
     * Dismiss the banner without setting consent
     */
    dismissBanner() {
      this.bannerDismissed = true
    },

    /**
     * Open the customize modal
     */
    openCustomizeModal() {
      this.bannerDismissed = false
      this.showCustomizeModal = true
    },

    /**
     * Reset consent to ask again
     */
    resetConsent() {
      this.analytics = null
      this.marketing = null
      this.bannerDismissed = false
      this.lastUpdated = null
    },

    /**
     * Delete analytics cookies using utility function
     */
    deleteAnalyticsCookies() {
      if (process.client) {
        deleteAnalyticsCookiesUtil()
      }
    },

    /**
     * Sync consent to database for authenticated users (optional)
     * Throws error if sync fails, allowing caller to handle it
     */
    async syncToDatabase() {
      try {
        const { loggedIn } = useUserSession()
        if (loggedIn.value) {
          await useAuthFetch('/api/v2/users/consent', {
            method: 'POST',
            body: {
              analytics: this.analytics,
              marketing: this.marketing,
            },
          })
        }
      } catch (error) {
        console.error('Failed to sync consent to database:', error)
        // Re-throw error so component can handle it and provide user feedback
        throw error
      }
    },
  },

  persist: true,
})
