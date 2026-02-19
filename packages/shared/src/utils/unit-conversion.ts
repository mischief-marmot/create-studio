/**
 * Shared unit conversion utilities
 *
 * Ported from wordpress/plugins/create/client/src/UnitConversion/utils.js
 * Used by both the card-level UnitConversionWidget and InteractiveExperience.
 */

export const US_CUSTOMARY = 'us_customary' as const
export const METRIC = 'metric' as const

export type MeasurementSystem = typeof US_CUSTOMARY | typeof METRIC

/**
 * Countries that use US customary measurement system
 * Based on ISO 3166-1 alpha-2 country codes
 */
export const US_CUSTOMARY_COUNTRIES = ['US', 'LR', 'MM']

/**
 * Unit conversion config as emitted by the WordPress plugin
 * (data-unit-conversions or data-cs-config.unitConversion)
 */
export interface UnitConversionConfig {
  enabled: boolean
  default_system: 'auto' | 'us_customary' | 'metric'
  source_system: MeasurementSystem
  label: string
  conversions: Record<string, {
    amount: string
    unit: string
    max_amount?: string | null
  }>
}

/**
 * Consolidated config from data-cs-config attribute
 */
export interface CSConfig {
  servingsAdjustment?: {
    enabled: boolean
    label: string
    defaultMultiplier?: number
  }
  unitConversion?: UnitConversionConfig
}

/**
 * Extract country code from a locale string (e.g., "en-US" -> "US")
 */
function getCountryFromLocale(locale: string): string | null {
  if (!locale) return null
  const parts = locale.split('-')
  if (parts.length >= 2) {
    return parts[parts.length - 1].toUpperCase()
  }
  return null
}

/**
 * Detect measurement system from browser locale
 */
export function detectSystemFromLocale(): MeasurementSystem {
  if (typeof navigator === 'undefined') return METRIC

  const locales = navigator.languages || [navigator.language]
  for (const locale of locales) {
    const country = getCountryFromLocale(locale)
    if (country && US_CUSTOMARY_COUNTRIES.includes(country)) {
      return US_CUSTOMARY
    }
    if (country) {
      return METRIC
    }
  }
  return METRIC
}

/**
 * Determine the initial measurement system based on priority:
 * 1. Saved preference (from SharedStorageManager)
 * 2. Browser locale detection
 * 3. default_system from card data
 *
 * @param defaultSystem - "auto", "us_customary", or "metric" from card config
 * @param savedPreference - Previously saved preference from SharedStorageManager
 */
export function getInitialSystem(
  defaultSystem: string | undefined,
  savedPreference?: 'metric' | 'imperial' | undefined
): MeasurementSystem {
  // 1. Check saved preference (SharedStorageManager uses "imperial" → map to "us_customary")
  if (savedPreference) {
    return savedPreference === 'imperial' ? US_CUSTOMARY : METRIC
  }

  // 2. Check browser locale when default is "auto" or missing
  if (!defaultSystem || defaultSystem === 'auto') {
    return detectSystemFromLocale()
  }

  // 3. Use configured default
  return defaultSystem === 'us_customary' ? US_CUSTOMARY : METRIC
}

/**
 * Map between SharedStorageManager preference format and MeasurementSystem
 */
export function systemToPreference(system: MeasurementSystem): 'metric' | 'imperial' {
  return system === US_CUSTOMARY ? 'imperial' : 'metric'
}

export function preferenceToSystem(pref: 'metric' | 'imperial' | undefined): MeasurementSystem | null {
  if (!pref) return null
  return pref === 'imperial' ? US_CUSTOMARY : METRIC
}

/**
 * Legacy localStorage key used by the Preact UnitConversion widget
 */
export const LEGACY_STORAGE_KEY = 'mv_create_unit_preference'

/**
 * Migrate legacy unit preference from old localStorage key to SharedStorageManager.
 * Reads from the legacy key, returns the value, and deletes the legacy key.
 */
export function migrateLegacyUnitPreference(): MeasurementSystem | null {
  if (typeof localStorage === 'undefined') return null

  try {
    const value = localStorage.getItem(LEGACY_STORAGE_KEY)
    if (value === US_CUSTOMARY || value === METRIC) {
      localStorage.removeItem(LEGACY_STORAGE_KEY)
      return value as MeasurementSystem
    }
  } catch {
    // Silent fail
  }
  return null
}
