import { createRecipeKey, parseRecipeKey, normalizeDomain } from '~/utils/domain'

/**
 * Timer interface for recipe interactions
 */
export interface Timer {
  id: string
  label: string
  duration: number
  remaining: number
  isActive: boolean
  stepIndex?: number
}

/**
 * Recipe-specific state stored per recipe key
 */
export interface RecipeState {
  recipeKey: string
  currentStep: number
  checkedIngredients: string[]
  checkedStepIngredients: Record<number, string[]>
  activeTimers: Timer[]
  imageHeight: number
  isImageCollapsed: boolean
  showStepIngredients: boolean
  startedAt: string
  lastUpdated: string
  hasInteracted: boolean
}

/**
 * User preferences (global across all recipes)
 */
export interface UserPreferences {
  modalSize?: 'small' | 'medium' | 'large'
  theme?: 'light' | 'dark' | 'auto'
  dismissedAlerts?: string[]
  units?: 'metric' | 'imperial'
  language?: string
  customizations?: Record<string, any>
}

/**
 * Complete storage structure for create-studio localStorage key
 */
export interface CreateStudioStorage {
  preferences: UserPreferences
  state: Record<string, RecipeState>
}

/**
 * Shared storage manager for both widget and interactive mode
 * Uses unified localStorage with create-studio key
 */
export class SharedStorageManager {
  private static readonly STORAGE_KEY = 'create-studio'
  private storage: CreateStudioStorage
  private currentRecipeKey: string | null = null

  constructor() {
    this.storage = this.loadStorage()
  }

  /**
   * Initialize storage manager with a specific recipe
   */
  initializeRecipe(domain: string, creationId: string | number): string {
    const recipeKey = createRecipeKey(domain, creationId)
    this.currentRecipeKey = recipeKey

    if (!this.storage.state[recipeKey]) {
      this.storage.state[recipeKey] = {
        recipeKey,
        currentStep: 0,
        checkedIngredients: [],
        checkedStepIngredients: {},
        activeTimers: [],
        imageHeight: 25,
        isImageCollapsed: false,
        showStepIngredients: false,
        startedAt: new Date().toISOString(),
        lastUpdated: new Date().toISOString(),
        hasInteracted: false
      }
      this.saveStorage()
    }

    return recipeKey
  }

  /**
   * Set the current active recipe by key
   */
  setCurrentRecipe(recipeKey: string): boolean {
    const parsed = parseRecipeKey(recipeKey)
    if (!parsed) return false

    this.currentRecipeKey = recipeKey
    
    // Initialize if doesn't exist
    if (!this.storage.state[recipeKey]) {
      this.storage.state[recipeKey] = {
        recipeKey,
        currentStep: 0,
        checkedIngredients: [],
        checkedStepIngredients: {},
        activeTimers: [],
        imageHeight: 25,
        isImageCollapsed: false,
        showStepIngredients: false,
        startedAt: new Date().toISOString(),
        lastUpdated: new Date().toISOString(),
        hasInteracted: false
      }
      this.saveStorage()
    }

    return true
  }

  /**
   * Get current recipe state
   */
  getCurrentRecipeState(): RecipeState | null {
    if (!this.currentRecipeKey) return null
    return this.storage.state[this.currentRecipeKey] || null
  }

  /**
   * Get recipe state by key
   */
  getRecipeState(recipeKey: string): RecipeState | null {
    return this.storage.state[recipeKey] || null
  }

  /**
   * Update current recipe state
   */
  updateRecipeState(updates: Partial<Omit<RecipeState, 'recipeKey' | 'startedAt'>>): void {
    if (!this.currentRecipeKey) return

    const current = this.storage.state[this.currentRecipeKey]
    if (!current) return

    this.storage.state[this.currentRecipeKey] = {
      ...current,
      ...updates,
      lastUpdated: new Date().toISOString(),
      hasInteracted: true
    }

    this.saveStorage()
  }

  /**
   * Recipe interaction methods
   */
  setCurrentStep(step: number): void {
    this.updateRecipeState({ currentStep: step })
  }

  toggleIngredient(ingredientId: string): void {
    const state = this.getCurrentRecipeState()
    if (!state) return

    const checked = [...state.checkedIngredients]
    const index = checked.indexOf(ingredientId)
    
    if (index > -1) {
      checked.splice(index, 1)
    } else {
      checked.push(ingredientId)
    }

    this.updateRecipeState({ checkedIngredients: checked })
  }

  toggleStepIngredient(stepIndex: number, ingredientId: string): void {
    const state = this.getCurrentRecipeState()
    if (!state) return

    const stepIngredients = { ...state.checkedStepIngredients }
    if (!stepIngredients[stepIndex]) {
      stepIngredients[stepIndex] = []
    }

    const ingredients = [...stepIngredients[stepIndex]]
    const index = ingredients.indexOf(ingredientId)
    
    if (index > -1) {
      ingredients.splice(index, 1)
    } else {
      ingredients.push(ingredientId)
    }

    stepIngredients[stepIndex] = ingredients
    this.updateRecipeState({ checkedStepIngredients: stepIngredients })
  }

  isIngredientChecked(ingredientId: string): boolean {
    const state = this.getCurrentRecipeState()
    return state ? state.checkedIngredients.includes(ingredientId) : false
  }

  isStepIngredientChecked(stepIndex: number, ingredientId: string): boolean {
    const state = this.getCurrentRecipeState()
    if (!state) return false
    const stepIngredients = state.checkedStepIngredients[stepIndex]
    return stepIngredients ? stepIngredients.includes(ingredientId) : false
  }

  /**
   * Timer management
   */
  addTimer(timer: Omit<Timer, 'id'> & { id?: string }): Timer | null {
    const state = this.getCurrentRecipeState()
    if (!state) return null

    const newTimer: Timer = {
      ...timer,
      id: timer.id || `timer-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`
    }

    const timers = [...state.activeTimers, newTimer]
    this.updateRecipeState({ activeTimers: timers })
    
    return newTimer
  }

  updateTimer(timerId: string, updates: Partial<Timer>): void {
    const state = this.getCurrentRecipeState()
    if (!state) return

    const timers = state.activeTimers.map(timer =>
      timer.id === timerId ? { ...timer, ...updates } : timer
    )

    this.updateRecipeState({ activeTimers: timers })
  }

  removeTimer(timerId: string): void {
    const state = this.getCurrentRecipeState()
    if (!state) return

    const timers = state.activeTimers.filter(timer => timer.id !== timerId)
    this.updateRecipeState({ activeTimers: timers })
  }

  clearTimers(): void {
    this.updateRecipeState({ activeTimers: [] })
  }

  /**
   * Image state management
   */
  setImageState(height: number, isCollapsed: boolean): void {
    this.updateRecipeState({ 
      imageHeight: height, 
      isImageCollapsed: isCollapsed 
    })
  }

  toggleStepIngredientsVisibility(): void {
    const state = this.getCurrentRecipeState()
    if (!state) return
    
    this.updateRecipeState({ 
      showStepIngredients: !state.showStepIngredients 
    })
  }

  /**
   * User preferences management
   */
  getPreferences(): UserPreferences {
    return { ...this.storage.preferences }
  }

  updatePreferences(updates: Partial<UserPreferences>): void {
    this.storage.preferences = { ...this.storage.preferences, ...updates }
    this.saveStorage()
  }

  getPreference<K extends keyof UserPreferences>(key: K): UserPreferences[K] {
    return this.storage.preferences[key]
  }

  setPreference<K extends keyof UserPreferences>(key: K, value: UserPreferences[K]): void {
    this.storage.preferences[key] = value
    this.saveStorage()
  }

  /**
   * Alert management
   */
  isDismissed(alertId: string): boolean {
    return this.storage.preferences.dismissedAlerts?.includes(alertId) || false
  }

  dismissAlert(alertId: string): void {
    const dismissed = this.storage.preferences.dismissedAlerts || []
    if (!dismissed.includes(alertId)) {
      this.updatePreferences({
        dismissedAlerts: [...dismissed, alertId]
      })
    }
  }

  /**
   * Recipe management
   */
  resetRecipe(recipeKey?: string): void {
    const key = recipeKey || this.currentRecipeKey
    if (!key) return

    delete this.storage.state[key]
    this.saveStorage()

    if (this.currentRecipeKey === key) {
      this.currentRecipeKey = null
    }
  }

  clearAllState(): void {
    this.storage.state = {}
    this.saveStorage()
    this.currentRecipeKey = null
  }

  clearAll(): void {
    this.storage = {
      preferences: {},
      state: {}
    }
    this.saveStorage()
    this.currentRecipeKey = null
  }

  /**
   * Migration and utility methods
   */
  migrateFromLegacyStorage(): void {
    // Check if we're in a browser environment
    if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
      return
    }

    try {
      // Migrate from old recipe-interaction store (Pinia store)
      const legacyData = localStorage.getItem('recipe-interaction')
      if (legacyData) {
        const parsed = JSON.parse(legacyData)
        
        // Convert legacy recipe progress data to new format
        Object.entries(parsed).forEach(([legacyId, legacyProgress]: [string, any]) => {
          if (legacyProgress && typeof legacyProgress === 'object') {
            try {
              // Try to create a recipe key from current URL and legacy ID
              // For migration, we'll use the current domain since we don't have the original domain
              const currentDomain = typeof window !== 'undefined' 
                ? normalizeDomain(window.location.origin)
                : 'localhost'
              
              const recipeKey = createRecipeKey(currentDomain, legacyId)
              
              // Convert legacy progress to new format
              const migratedProgress: RecipeState = {
                recipeKey,
                currentStep: legacyProgress.currentStep || 0,
                checkedIngredients: Array.isArray(legacyProgress.checkedIngredients) 
                  ? legacyProgress.checkedIngredients 
                  : [],
                checkedStepIngredients: this.convertLegacyStepIngredients(legacyProgress.checkedStepIngredients),
                activeTimers: Array.isArray(legacyProgress.activeTimers) 
                  ? legacyProgress.activeTimers 
                  : [],
                imageHeight: legacyProgress.imageHeight || 25,
                isImageCollapsed: legacyProgress.isImageCollapsed || false,
                showStepIngredients: legacyProgress.showStepIngredients || false,
                startedAt: legacyProgress.startedAt || new Date().toISOString(),
                lastUpdated: legacyProgress.lastUpdated || new Date().toISOString(),
                hasInteracted: true // If there's legacy data, user has interacted
              }
              
              // Only migrate if we don't already have data for this recipe key
              if (!this.storage.state[recipeKey]) {
                this.storage.state[recipeKey] = migratedProgress
              }
            } catch (error) {
              console.warn('Failed to migrate individual recipe progress:', error)
            }
          }
        })
        
        // Save migrated data and remove legacy data
        this.saveStorage()
        localStorage.removeItem('recipe-interaction')
      }

      // Migrate from old create-studio-preferences (Widget StorageManager)
      const legacyPrefs = localStorage.getItem('create-studio-preferences')
      if (legacyPrefs) {
        const parsed = JSON.parse(legacyPrefs)
        this.storage.preferences = { ...this.storage.preferences, ...parsed }
        localStorage.removeItem('create-studio-preferences')
        this.saveStorage()
      }
    } catch (error) {
      console.warn('Failed to migrate legacy storage:', error)
    }
  }
  
  /**
   * Convert legacy step ingredients format (Map serialized as object) to new format
   */
  private convertLegacyStepIngredients(legacyStepIngredients: any): Record<number, string[]> {
    if (!legacyStepIngredients || typeof legacyStepIngredients !== 'object') {
      return {}
    }
    
    const result: Record<number, string[]> = {}
    
    // Handle both Map-like format and plain object format
    Object.entries(legacyStepIngredients).forEach(([stepKey, ingredients]) => {
      const stepIndex = parseInt(stepKey)
      if (!isNaN(stepIndex) && Array.isArray(ingredients)) {
        result[stepIndex] = ingredients
      }
    })
    
    return result
  }

  /**
   * Storage persistence
   */
  private loadStorage(): CreateStudioStorage {
    // Check if we're in a browser environment
    if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
      return {
        preferences: {},
        state: {}
      }
    }

    try {
      const stored = localStorage.getItem(SharedStorageManager.STORAGE_KEY)
      if (stored) {
        const parsed = JSON.parse(stored)
        return {
          preferences: parsed.preferences || {},
          state: parsed.state || {}
        }
      }
    } catch (error) {
      console.warn('Failed to load shared storage:', error)
    }

    return {
      preferences: {},
      state: {}
    }
  }

  private saveStorage(): void {
    // Check if we're in a browser environment
    if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
      return
    }

    try {
      localStorage.setItem(
        SharedStorageManager.STORAGE_KEY, 
        JSON.stringify(this.storage)
      )
    } catch (error) {
      console.warn('Failed to save shared storage:', error)
    }
  }

  /**
   * Debug and utility methods
   */
  getAllRecipeStates(): Record<string, RecipeState> {
    return { ...this.storage.state }
  }

  getCurrentRecipeKey(): string | null {
    return this.currentRecipeKey
  }

  exportData(): CreateStudioStorage {
    return JSON.parse(JSON.stringify(this.storage))
  }

  importData(data: CreateStudioStorage): void {
    this.storage = {
      preferences: data.preferences || {},
      state: data.state || {}
    }
    this.saveStorage()
  }
}