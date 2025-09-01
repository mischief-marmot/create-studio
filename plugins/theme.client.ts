export default defineNuxtPlugin(() => {
  const { initializeTheme } = useTheme()
  
  // Initialize theme based on system preference or saved preference
  initializeTheme()
})