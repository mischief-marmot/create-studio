/**
 * Handles storage access in iframe contexts
 */

export const useIframeStorage = () => {
  const isInIframe = () => {
    return typeof window !== 'undefined' && window !== window.top
  }

  const requestStorageAccess = async (): Promise<boolean> => {
    if (!isInIframe()) {
      return true // Not in iframe, storage should work normally
    }

    // Check if Storage Access API is supported
    if ('requestStorageAccess' in document) {
      try {
        // Check if we already have access
        const hasAccess = await document.hasStorageAccess()
        if (hasAccess) {
          console.log('Storage access already granted')
          return true
        }

        // Request storage access
        await document.requestStorageAccess()
        console.log('Storage access granted')
        return true
      } catch (error) {
        console.warn('Storage access denied:', error)
        return false
      }
    } else {
      console.warn('Storage Access API not supported')
      return false
    }
  }

  const testLocalStorage = (): boolean => {
    try {
      const test = '__storage_test__'
      localStorage.setItem(test, test)
      localStorage.removeItem(test)
      return true
    } catch {
      return false
    }
  }

  return {
    isInIframe,
    requestStorageAccess,
    testLocalStorage
  }
}