/**
 * Client-side plugin for managing consent and triggering scripts
 * Integrates with @nuxt/scripts consent system
 */

export default defineNuxtPlugin((nuxtApp) => {
  // Defer watchers to after Pinia is fully ready
  if (process.client) {
    nuxtApp.hook('app:created', async () => {
      const { useConsentStore } = await import('~/stores/consent')
      const consentStore = useConsentStore()

      // Trigger consent for scripts based on stored preferences
      watch(
        () => consentStore.analytics,
        (analytics) => {
          if (analytics === true) {
            triggerGoogleAnalytics(nuxtApp)
          }
        },
        { immediate: true },
      )

      // Watch marketing consent for future use
      watch(() => consentStore.marketing, (marketing) => {
        // Handle marketing scripts/cookies here when needed
        if (marketing === true) {
          // Future: trigger marketing scripts
        }
      })
    })
  }
})

/**
 * Trigger Google Analytics based on consent
 */
function triggerGoogleAnalytics(nuxtApp: any) {
  try {
    // Use the @nuxt/scripts consent trigger
    const { useScriptTriggerConsent } = nuxtApp
    if (useScriptTriggerConsent) {
      useScriptTriggerConsent('analytics')
    }
  } catch (error) {
    console.error('Failed to trigger Google Analytics:', error)
  }
}
