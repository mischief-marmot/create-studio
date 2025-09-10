import { SharedStorageManager } from '~/lib/shared-storage/shared-storage-manager'
import { createCreationKey, normalizeDomain } from '~/utils/domain'

/**
 * Composable for using shared storage in Nuxt applications
 * Provides reactive access to creation state and preferences
 */
export const useSharedStorage = () => {
  const storageManager = new SharedStorageManager()

  /**
   * Initialize a creation with domain and creation ID
   */
  const initializeCreation = (domain: string, creationId: string | number) => {
    return storageManager.initializeCreation(domain, creationId)
  }

  /**
   * Initialize creation from URL components
   */
  const initializeCreationFromUrl = (siteUrl: string, creationId: string | number) => {
    const domain = normalizeDomain(siteUrl)
    return storageManager.initializeCreation(domain, creationId)
  }

  /**
   * Create a creation key from domain and creation ID
   */
  const getCreationKey = (domain: string, creationId: string | number) => {
    return createCreationKey(domain, creationId)
  }

  /**
   * Get current creation state (reactive)
   */
  const getCurrentCreationState = () => {
    return computed(() => storageManager.getCurrentCreationState())
  }

  /**
   * Get specific creation state by key
   */
  const getCreationState = (creationKey: string) => {
    return computed(() => storageManager.getCreationState(creationKey))
  }

  /**
   * Get user preferences (reactive)
   */
  const getPreferences = () => {
    return computed(() => storageManager.getPreferences())
  }

  /**
   * Check if user has interacted with a specific creation
   */
  const hasInteracted = (creationKey: string) => {
    return computed(() => {
      const state = storageManager.getCreationState(creationKey)
      return state?.hasInteracted || false
    })
  }

  // Migration removed - no legacy support needed

  return {
    // Storage manager instance
    storageManager,

    // Initialization methods
    initializeCreation,
    initializeCreationFromUrl,
    getCreationKey,

    // Reactive state getters
    getCurrentCreationState,
    getCreationState,
    getPreferences,
    hasInteracted
  }
}