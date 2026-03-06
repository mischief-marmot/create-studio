/**
 * Returns whether the user's country requires explicit consent for analytics.
 * Reads the value injected by the server plugin (geo-consent.ts) during SSR.
 * Defaults to true (consent required) if unavailable.
 */
export function useGeoConsent(): { consentRequired: boolean } {
  if (import.meta.server) {
    return { consentRequired: true }
  }
  const consentRequired = (window as any).__CONSENT_REQUIRED__ ?? true
  return { consentRequired }
}
