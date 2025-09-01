/**
 * Theme management composable for DaisyUI themes with system preference detection
 */

export const useTheme = () => {
  const currentTheme = ref<string>('light')
  
  const initializeTheme = () => {
    if (import.meta.client) {
      // Check system preference
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
      const savedTheme = localStorage.getItem('theme')
      
      let theme: string
      
      if (savedTheme) {
        // Use saved theme if available
        theme = savedTheme
      } else {
        // Use system preference
        theme = prefersDark ? 'dark' : 'light'
      }
      
      setTheme(theme)
      
      // Listen for system theme changes
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
      mediaQuery.addEventListener('change', (e) => {
        // Only auto-switch if no theme is manually saved
        if (!localStorage.getItem('theme')) {
          setTheme(e.matches ? 'dark' : 'light')
        }
      })
    }
  }
  
  const setTheme = (theme: string) => {
    if (import.meta.client) {
      currentTheme.value = theme
      document.documentElement.setAttribute('data-theme', theme)
      localStorage.setItem('theme', theme)
    }
  }
  
  const toggleTheme = () => {
    const newTheme = currentTheme.value === 'light' ? 'dark' : 'light'
    setTheme(newTheme)
  }
  
  const resetToSystem = () => {
    if (import.meta.client) {
      localStorage.removeItem('theme')
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
      setTheme(prefersDark ? 'dark' : 'light')
    }
  }
  
  return {
    currentTheme: readonly(currentTheme),
    initializeTheme,
    setTheme,
    toggleTheme,
    resetToSystem
  }
}