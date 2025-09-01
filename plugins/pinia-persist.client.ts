import { useRecipeInteractionStore } from '~/stores/recipeInteraction'
import { useIframeStorage } from '~/composables/useIframeStorage'

export default defineNuxtPlugin(async (nuxtApp) => {
  // Only run on client side
  if (import.meta.client) {
    const { isInIframe, requestStorageAccess, testLocalStorage } = useIframeStorage()
    
    // If in iframe, request storage access first
    if (isInIframe()) {
      console.log('App running in iframe, requesting storage access...')
      await requestStorageAccess()
    }
    
    // Test if localStorage is available
    const storageAvailable = testLocalStorage()
    if (!storageAvailable) {
      console.warn('localStorage not available - recipe progress will not persist')
      return
    }
    
    // Load persisted state
    const recipeStore = useRecipeInteractionStore()
    
    // Load from localStorage
    const storedData = localStorage.getItem('recipe-interaction')
    if (storedData) {
      try {
        const parsed = JSON.parse(storedData)
        console.log('Loading persisted data:', parsed) // Debug log
        recipeStore.loadProgresses(parsed)
      } catch (error) {
        console.error('Failed to load recipe interaction data:', error)
      }
    }
    
    // Save to localStorage whenever state changes
    recipeStore.$subscribe((mutation, state) => {
      if (testLocalStorage()) {
        const dataToStore = recipeStore.getAllProgresses()
        console.log('Saving to localStorage:', dataToStore) // Debug log
        localStorage.setItem('recipe-interaction', JSON.stringify(dataToStore))
      }
    })
  }
})