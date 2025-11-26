/**
 * Client-side plugin for initializing Google Analytics with consent trigger
 * Uses @nuxt/scripts useScriptTriggerConsent for GDPR-compliant loading
 *
 * The script only loads when the user grants analytics consent through the
 * consent store. Uses a computed ref to reactively track consent state.
 *
 * In development mode, uses mock mode (trigger: 'manual') to avoid loading
 * the real GA script while still allowing the API to be tested.
 */

import { useConsentStore } from '~/stores/consent'

export default defineNuxtPlugin({
  name: 'consent-analytics',
  // Run after Pinia persist plugin so localStorage state is restored
  dependsOn: ['pinia-persist'],
  setup() {
    const consentStore = useConsentStore()

    // Get GA ID from runtime config
    const config = useRuntimeConfig()
    const gaId = config.public.scripts?.googleAnalytics?.id

    // In development, use mock mode - don't load the real GA script
    if (import.meta.dev) {
      useScriptGoogleAnalytics({
        id: gaId || 'G-MOCK-DEV',
        scriptOptions: {
          trigger: 'manual',
          skipValidation: true,
        },
      })
      return
    }

    // In production, only initialize GA if we have an ID configured
    if (!gaId) {
      return
    }

    // Create a computed ref that resolves to true when analytics consent is granted
    // useScriptTriggerConsent accepts a reactive ref as the consent option
    const analyticsConsent = computed(() => consentStore.analytics === true)

    // Create the consent trigger - script will only load when analyticsConsent becomes true
    const consentTrigger = useScriptTriggerConsent({
      consent: analyticsConsent,
    })

    // Initialize Google Analytics with the consent trigger
    // The script won't load until the user grants consent
    useScriptGoogleAnalytics({
      id: gaId,
      scriptOptions: {
        trigger: consentTrigger,
      },
    })
  },
})
