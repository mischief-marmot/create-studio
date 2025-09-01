import { useRecipeInteractionStore } from '~/stores/recipeInteraction'
import { useIframeStorage } from '~/composables/useIframeStorage'

export default defineNuxtPlugin(async (nuxtApp) => {
  // Only run on client side
  if (import.meta.client) {
    const { isInIframe, requestStorageAccess, testLocalStorage } = useIframeStorage()
    
    // If in iframe, request storage access first
    if (isInIframe()) {
      await requestStorageAccess()
    }
    
    // Test if localStorage is available
    const storageAvailable = testLocalStorage()
    if (!storageAvailable) {
      return
    }
    
    // Load persisted state
    const recipeStore = useRecipeInteractionStore()
    
    // Load from localStorage
    const storedData = localStorage.getItem('recipe-interaction')
    if (storedData) {
      try {
        const parsed = JSON.parse(storedData)
        recipeStore.loadProgresses(parsed)
      } catch (error) {
      }
    }
    
    // Save to localStorage whenever state changes
    recipeStore.$subscribe((mutation, state) => {
      if (testLocalStorage()) {
        const dataToStore = recipeStore.getAllProgresses()
        localStorage.setItem('recipe-interaction', JSON.stringify(dataToStore))
      }
    })
  }
})