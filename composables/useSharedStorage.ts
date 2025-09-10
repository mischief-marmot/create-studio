import { SharedStorageManager } from '~/lib/shared-storage/shared-storage-manager'
import { createRecipeKey, normalizeDomain } from '~/utils/domain'

/**
 * Composable for using shared storage in Nuxt applications
 * Provides reactive access to recipe state and preferences
 */
export const useSharedStorage = () => {
  const storageManager = new SharedStorageManager()

  /**
   * Initialize a recipe with domain and creation ID
   */
  const initializeRecipe = (domain: string, creationId: string | number) => {
    return storageManager.initializeRecipe(domain, creationId)
  }

  /**
   * Initialize recipe from URL components
   */
  const initializeRecipeFromUrl = (siteUrl: string, creationId: string | number) => {
    const domain = normalizeDomain(siteUrl)
    return storageManager.initializeRecipe(domain, creationId)
  }

  /**
   * Create a recipe key from domain and creation ID
   */
  const getRecipeKey = (domain: string, creationId: string | number) => {
    return createRecipeKey(domain, creationId)
  }

  /**
   * Get current recipe state (reactive)
   */
  const getCurrentRecipeState = () => {
    return computed(() => storageManager.getCurrentRecipeState())
  }

  /**
   * Get specific recipe state by key
   */
  const getRecipeState = (recipeKey: string) => {
    return computed(() => storageManager.getRecipeState(recipeKey))
  }

  /**
   * Get user preferences (reactive)
   */
  const getPreferences = () => {
    return computed(() => storageManager.getPreferences())
  }

  /**
   * Check if user has interacted with a specific recipe
   */
  const hasInteracted = (recipeKey: string) => {
    return computed(() => {
      const state = storageManager.getRecipeState(recipeKey)
      return state?.hasInteracted || false
    })
  }

  /**
   * Run migration from legacy storage
   */
  const migrate = () => {
    storageManager.migrateFromLegacyStorage()
  }

  return {
    // Storage manager instance
    storageManager,

    // Initialization methods
    initializeRecipe,
    initializeRecipeFromUrl,
    getRecipeKey,

    // Reactive state getters
    getCurrentRecipeState,
    getRecipeState,
    getPreferences,
    hasInteracted,

    // Utility methods
    migrate
  }
}