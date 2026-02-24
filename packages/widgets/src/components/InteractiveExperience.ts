/**
 * Theme resolution logic for InteractiveExperience.vue
 * Exported as a standalone module so tests can import without Vue overhead.
 */

export const THEME_FALLBACK = 'carousel'

const VALID_THEMES = ['carousel', 'split', 'cinematic'] as const
type ValidTheme = typeof VALID_THEMES[number]

/**
 * Resolves which theme component name to use based on desktop/mobile theme props
 * and whether the current viewport is mobile.
 *
 * - On desktop (isMobile=false): use themeDesktop if valid, else fallback to 'carousel'
 * - On mobile (isMobile=true): use themeMobile if valid, else themeDesktop if valid, else 'carousel'
 */
export function resolveThemeComponent(
  themeDesktop?: string,
  themeMobile?: string,
  isMobile?: boolean
): string {
  const isValidTheme = (t: string | undefined): t is ValidTheme =>
    t !== undefined && (VALID_THEMES as readonly string[]).includes(t)

  if (isMobile) {
    // On mobile: prefer themeMobile if valid, then themeDesktop if valid, then fallback
    if (isValidTheme(themeMobile)) return themeMobile
    if (isValidTheme(themeDesktop)) return themeDesktop
    return THEME_FALLBACK
  } else {
    // On desktop: use themeDesktop if valid, then fallback
    if (isValidTheme(themeDesktop)) return themeDesktop
    return THEME_FALLBACK
  }
}
