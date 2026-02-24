/**
 * Pure helper functions for building widget config objects in entry.ts.
 * Extracted to be testable without needing DOM or SDK mocks.
 */

const DEFAULT_THEME = 'carousel'

export interface SiteConfigSnapshot {
  showInteractiveMode?: boolean
  buttonText?: string
  renderMode?: 'iframe' | 'in-dom'
  subscriptionTier?: string
  themeDesktop?: string
  themeMobile?: string
  features?: Record<string, boolean>
  [key: string]: any
}

export interface BuildInteractiveModeConfigParams {
  creationId: string
  siteUrl: string
  embedUrl: string
  buttonText?: string
  unitConversionConfig?: any
  siteConfig: SiteConfigSnapshot
}

/**
 * Builds the config object passed to sdkInstance.mount() for an interactive
 * mode widget. Centralising this makes it easy to test theme forwarding.
 */
export function buildInteractiveModeConfig(params: BuildInteractiveModeConfigParams) {
  const { creationId, siteUrl, embedUrl, buttonText, unitConversionConfig, siteConfig } = params

  return {
    creationId,
    buttonText: buttonText || siteConfig.buttonText || 'Try Interactive Mode!',
    siteUrl,
    embedUrl,
    themeDesktop: siteConfig.themeDesktop || DEFAULT_THEME,
    themeMobile: siteConfig.themeMobile || DEFAULT_THEME,
    unitConversion: unitConversionConfig,
  }
}
