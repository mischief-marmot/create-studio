/**
 * Countries where explicit cookie consent is required before loading analytics.
 * Includes: EU/EEA (GDPR), UK (UK GDPR), Switzerland (FADP), Brazil (LGPD),
 * South Africa (POPIA), South Korea (PIPA), Japan (APPI).
 * XX and T1 are Cloudflare codes for unknown/Tor — treated as consent-required.
 */
export const CONSENT_REQUIRED_COUNTRIES = new Set([
  // EU member states (27)
  'AT', 'BE', 'BG', 'HR', 'CY', 'CZ', 'DK', 'EE', 'FI', 'FR',
  'DE', 'GR', 'HU', 'IE', 'IT', 'LV', 'LT', 'LU', 'MT', 'NL',
  'PL', 'PT', 'RO', 'SK', 'SI', 'ES', 'SE',
  // EEA (non-EU)
  'IS', 'LI', 'NO',
  // UK
  'GB',
  // Switzerland
  'CH',
  // Brazil (LGPD)
  'BR',
  // South Africa (POPIA)
  'ZA',
  // South Korea (PIPA)
  'KR',
  // Japan (APPI)
  'JP',
  // Unknown / Tor (Cloudflare special codes)
  'XX', 'T1',
])

export function isConsentRequired(countryCode: string | null | undefined): boolean {
  if (!countryCode) return true
  return CONSENT_REQUIRED_COUNTRIES.has(countryCode.toUpperCase())
}
