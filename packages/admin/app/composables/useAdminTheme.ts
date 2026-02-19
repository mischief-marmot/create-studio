/**
 * Theme management composable for admin with system preference detection
 * Mirrors the main app's useTheme composable
 */

export const useAdminTheme = () => {
  const currentTheme = ref<'light' | 'dark'>('light')

  const initializeTheme = () => {
    if (import.meta.client) {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
      const themePreference = localStorage.getItem('admin-theme-preference') // 'system', 'light', 'dark'
      const savedTheme = localStorage.getItem('admin-theme') as 'light' | 'dark' | null

      let theme: 'light' | 'dark'

      if (themePreference === 'system' || !themePreference) {
        theme = prefersDark ? 'dark' : 'light'
      } else {
        theme = savedTheme || (prefersDark ? 'dark' : 'light')
      }

      setTheme(theme, false)

      // Listen for system theme changes
      window.matchMedia('(prefers-color-scheme: dark)')
        .addEventListener('change', (e) => {
          const currentPreference = localStorage.getItem('admin-theme-preference')
          if (currentPreference === 'system' || !currentPreference) {
            setTheme(e.matches ? 'dark' : 'light', false)
          }
        })
    }
  }

  const setTheme = (theme: 'light' | 'dark', updatePreference: boolean = true) => {
    if (import.meta.client) {
      currentTheme.value = theme
      document.documentElement.setAttribute('data-theme', theme)
      localStorage.setItem('admin-theme', theme)

      if (updatePreference) {
        localStorage.setItem('admin-theme-preference', theme)
      }
    }
  }

  const toggleTheme = () => {
    const newTheme = currentTheme.value === 'light' ? 'dark' : 'light'
    setTheme(newTheme)
  }

  return {
    currentTheme: readonly(currentTheme),
    initializeTheme,
    toggleTheme,
  }
}
