import { createCreationKey, parseCreationKey, normalizeDomain } from '~/utils/domain'

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
 * Creation-specific state stored per creation key
 */
export interface CreationState {
  creationKey: string
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
  id: string
  preferences: UserPreferences
  state: Record<string, CreationState>
}

/**
 * Shared storage manager for both widget and interactive mode
 * Uses unified localStorage with create-studio key
 */
export class SharedStorageManager {
  private static readonly STORAGE_KEY = 'create-studio'
  private storage: CreateStudioStorage
  private currentCreationKey: string | null = null

  constructor() {
    this.storage = this.loadStorage()
  }

  /**
   * Initialize storage manager with a specific creation
   */
  initializeCreation(domain: string, creationId: string | number): string {
    const creationKey = createCreationKey(domain, creationId)
    this.currentCreationKey = creationKey

    if (!this.storage.state[creationKey]) {
      this.storage.state[creationKey] = {
        creationKey,
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

    return creationKey
  }

  /**
   * Set the current active creation by key
   */
  setCurrentCreation(creationKey: string): boolean {
    const parsed = parseCreationKey(creationKey)
    if (!parsed) return false

    this.currentCreationKey = creationKey
    
    // Initialize if doesn't exist
    if (!this.storage.state[creationKey]) {
      this.storage.state[creationKey] = {
        creationKey,
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
   * Get current creation state
   */
  getCurrentCreationState(): CreationState | null {
    if (!this.currentCreationKey) return null
    return this.storage.state[this.currentCreationKey] || null
  }

  /**
   * Get creation state by key
   */
  getCreationState(creationKey: string): CreationState | null {
    return this.storage.state[creationKey] || null
  }

  /**
   * Update current creation state
   */
  updateCreationState(updates: Partial<Omit<CreationState, 'creationKey' | 'startedAt'>>): void {
    if (!this.currentCreationKey) return

    const current = this.storage.state[this.currentCreationKey]
    if (!current) return

    this.storage.state[this.currentCreationKey] = {
      ...current,
      ...updates,
      lastUpdated: new Date().toISOString(),
      hasInteracted: true
    }

    this.saveStorage()
  }

  /**
   * Creation interaction methods
   */
  setCurrentStep(step: number): void {
    this.updateCreationState({ currentStep: step })
  }

  toggleIngredient(ingredientId: string): void {
    const state = this.getCurrentCreationState()
    if (!state) return

    const checked = [...state.checkedIngredients]
    const index = checked.indexOf(ingredientId)
    
    if (index > -1) {
      checked.splice(index, 1)
    } else {
      checked.push(ingredientId)
    }

    this.updateCreationState({ checkedIngredients: checked })
  }

  toggleStepIngredient(stepIndex: number, ingredientId: string): void {
    const state = this.getCurrentCreationState()
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
    this.updateCreationState({ checkedStepIngredients: stepIngredients })
  }

  isIngredientChecked(ingredientId: string): boolean {
    const state = this.getCurrentCreationState()
    return state ? state.checkedIngredients.includes(ingredientId) : false
  }

  isStepIngredientChecked(stepIndex: number, ingredientId: string): boolean {
    const state = this.getCurrentCreationState()
    if (!state) return false
    const stepIngredients = state.checkedStepIngredients[stepIndex]
    return stepIngredients ? stepIngredients.includes(ingredientId) : false
  }

  /**
   * Timer management
   */
  addTimer(timer: Omit<Timer, 'id'> & { id?: string }): Timer | null {
    const state = this.getCurrentCreationState()
    if (!state) return null

    const newTimer: Timer = {
      ...timer,
      id: timer.id || `timer-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`
    }

    const timers = [...state.activeTimers, newTimer]
    this.updateCreationState({ activeTimers: timers })
    
    return newTimer
  }

  updateTimer(timerId: string, updates: Partial<Timer>): void {
    const state = this.getCurrentCreationState()
    if (!state) return

    const timers = state.activeTimers.map(timer =>
      timer.id === timerId ? { ...timer, ...updates } : timer
    )

    this.updateCreationState({ activeTimers: timers })
  }

  removeTimer(timerId: string): void {
    const state = this.getCurrentCreationState()
    if (!state) return

    const timers = state.activeTimers.filter(timer => timer.id !== timerId)
    this.updateCreationState({ activeTimers: timers })
  }

  clearTimers(): void {
    this.updateCreationState({ activeTimers: [] })
  }

  /**
   * Image state management
   */
  setImageState(height: number, isCollapsed: boolean): void {
    this.updateCreationState({ 
      imageHeight: height, 
      isImageCollapsed: isCollapsed 
    })
  }

  toggleStepIngredientsVisibility(): void {
    const state = this.getCurrentCreationState()
    if (!state) return
    
    this.updateCreationState({ 
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
   * Creation management
   */
  resetCreation(creationKey?: string): void {
    const key = creationKey || this.currentCreationKey
    if (!key) return

    delete this.storage.state[key]
    this.saveStorage()

    if (this.currentCreationKey === key) {
      this.currentCreationKey = null
    }
  }

  clearAllState(): void {
    this.storage.state = {}
    this.saveStorage()
    this.currentCreationKey = null
  }

  clearAll(): void {
    this.storage = {
      id: '',
      preferences: {},
      state: {}
    }
    this.saveStorage()
    this.currentCreationKey = null
  }


  /**
   * Storage persistence
   */
  private loadStorage(): CreateStudioStorage {
    // Check if we're in a browser environment
    if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
      return {
        id: this.generateUUID(),
        preferences: {},
        state: {}
      }
    }

    try {
      const stored = localStorage.getItem(SharedStorageManager.STORAGE_KEY)
      if (stored) {
        const parsed = JSON.parse(stored)
        return {
          id: parsed.id || this.generateUUID(),
          preferences: parsed.preferences || {},
          state: parsed.state || {}
        }
      }
    } catch (error) {
      console.warn('Failed to load shared storage:', error)
    }

    return {
      id: this.generateUUID(),
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
   * Generate a UUID for storage identification
   */
  private generateUUID(): string {
    if (typeof window !== 'undefined' && window.crypto && window.crypto.randomUUID) {
      return window.crypto.randomUUID()
    }
    // Fallback for environments without crypto.randomUUID
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0
      const v = c === 'x' ? r : (r & 0x3 | 0x8)
      return v.toString(16)
    })
  }

  /**
   * Debug and utility methods
   */
  getAllCreationStates(): Record<string, CreationState> {
    return { ...this.storage.state }
  }

  getCurrentCreationKey(): string | null {
    return this.currentCreationKey
  }

  getStorageId(): string {
    return this.storage.id
  }

  exportData(): CreateStudioStorage {
    return JSON.parse(JSON.stringify(this.storage))
  }

  importData(data: CreateStudioStorage): void {
    this.storage = {
      id: data.id || this.generateUUID(),
      preferences: data.preferences || {},
      state: data.state || {}
    }
    this.saveStorage()
  }
}