/**
 * Theme management composable for DaisyUI themes with system preference detection
 */

export const useTheme = () => {
  const currentTheme = ref<string>('light')
  
  const initializeTheme = () => {
    if (import.meta.client) {
      // Check system preference
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
      const themePreference = localStorage.getItem('themePreference') // 'system', 'light', 'dark'
      const savedTheme = localStorage.getItem('theme')
      
      let theme: string
      
      if (themePreference === 'system' || !themePreference) {
        // Follow system preference
        theme = prefersDark ? 'dark' : 'light'
      } else {
        // Use manually selected theme
        theme = savedTheme || (prefersDark ? 'dark' : 'light')
      }
      
      setTheme(theme, false) // Don't update preference on initialization
      
      // Listen for system theme changes
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
      mediaQuery.addEventListener('change', (e) => {
        const currentPreference = localStorage.getItem('themePreference')
        // Auto-switch if following system preference
        if (currentPreference === 'system' || !currentPreference) {
          setTheme(e.matches ? 'dark' : 'light', false) // Don't update preference
        }
      })
    }
  }
  
  const setTheme = (theme: string, updatePreference: boolean = true) => {
    if (import.meta.client) {
      currentTheme.value = theme
      document.documentElement.setAttribute('data-theme', theme)
      localStorage.setItem('theme', theme)
      
      // Update preference tracking when manually setting theme
      if (updatePreference) {
        localStorage.setItem('themePreference', theme)
      }
    }
  }
  
  const toggleTheme = () => {
    const newTheme = currentTheme.value === 'light' ? 'dark' : 'light'
    setTheme(newTheme) // This will mark as manual preference
  }
  
  const resetToSystem = () => {
    if (import.meta.client) {
      localStorage.setItem('themePreference', 'system')
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
      setTheme(prefersDark ? 'dark' : 'light', false) // Don't update preference since we're setting to system
    }
  }
  
  const followSystemTheme = () => {
    resetToSystem()
  }
  
  return {
    currentTheme: readonly(currentTheme),
    initializeTheme,
    setTheme,
    toggleTheme,
    resetToSystem,
    followSystemTheme
  }
}