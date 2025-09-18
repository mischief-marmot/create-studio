import { useIframeStorage } from '~/composables/useIframeStorage'
import { SharedStorageManager } from '#shared/lib/shared-storage/shared-storage-manager'

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
    
  }
})