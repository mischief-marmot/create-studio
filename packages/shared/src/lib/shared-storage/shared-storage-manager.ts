import { createCreationKey, parseCreationKey, normalizeDomain } from '../../utils/domain'

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
  checkedSupplies: string[]
  checkedStepSupplies: Record<number, string[]>
  activeTimers: Timer[]
  imageHeight: number
  isImageCollapsed: boolean
  showStepSupplies: boolean
  servingsMultiplier: number
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
    this.setupStorageSync()
  }

  /**
   * Setup cross-window storage synchronization
   * Listens for storage events (same-origin) and postMessage (cross-origin)
   */
  private setupStorageSync(): void {
    if (typeof window === 'undefined') return


    // Same-origin sync via storage event
    window.addEventListener('storage', (event) => {


      if (event.key === SharedStorageManager.STORAGE_KEY && event.newValue) {
        try {
          const newStorage = JSON.parse(event.newValue)
          this.storage = {
            id: newStorage.id || this.storage.id,
            preferences: newStorage.preferences || {},
            state: newStorage.state || {}
          }
        } catch (error) {
        }
      }
    })

    // Cross-origin sync via postMessage
    window.addEventListener('message', (event) => {

      // Handle storage sync messages
      if (event.data?.type === 'CREATE_STUDIO_STORAGE_SYNC' && event.data?.storage) {
        try {
          this.storage = {
            id: event.data.storage.id || this.storage.id,
            preferences: event.data.storage.preferences || {},
            state: event.data.storage.state || {}
          }
        } catch (error) {
        }
      }

      // Handle storage request messages
      if (event.data?.type === 'CREATE_STUDIO_STORAGE_REQUEST') {
        this.broadcastStorage(event.source as Window)
      }
    })

    // If we're in an iframe, request initial storage from parent
    if (window.parent !== window) {
      window.parent.postMessage({
        type: 'CREATE_STUDIO_STORAGE_REQUEST'
      }, '*')
    }
  }

  /**
   * Broadcast storage to other windows (parent or iframes)
   */
  private broadcastStorage(target?: Window): void {
    const message = {
      type: 'CREATE_STUDIO_STORAGE_SYNC',
      storage: this.storage
    }

    if (target) {
      // Send to specific window
      target.postMessage(message, '*')
    } else {
      // Send to parent if we're in iframe
      if (window.parent !== window) {
        window.parent.postMessage(message, '*')
      }

      // Send to all iframes
      const iframes = document.querySelectorAll('iframe')
      iframes.forEach(iframe => {
        if (iframe.contentWindow) {
          iframe.contentWindow.postMessage(message, '*')
        }
      })
    }
  }

  /**
   * Initialize storage manager with a specific creation
   */
  initializeCreation(domain: string, creationId: string | number): string {
    const creationKey = createCreationKey(domain, creationId)
    this.currentCreationKey = creationKey

    if (!this.storage.state[creationKey]) {
      // Create new creation state
      this.storage.state[creationKey] = {
        creationKey,
        currentStep: 0,
        checkedSupplies: [],
        checkedStepSupplies: {},
        activeTimers: [],
        imageHeight: 25,
        isImageCollapsed: false,
        showStepSupplies: false,
        servingsMultiplier: 1,
        startedAt: new Date().toISOString(),
        lastUpdated: new Date().toISOString(),
        hasInteracted: false
      }
      this.saveStorage()
    } else {
      // Migrate existing creation state if needed
      const state = this.storage.state[creationKey]
      let needsUpdate = false
      
      // Add missing servingsMultiplier property
      if (state.servingsMultiplier === undefined) {
        state.servingsMultiplier = 1
        needsUpdate = true
      }
      
      // Add any other missing properties here in the future
      // if (state.newProperty === undefined) {
      //   state.newProperty = defaultValue
      //   needsUpdate = true
      // }
      
      if (needsUpdate) {
        state.lastUpdated = new Date().toISOString()
        this.saveStorage()
      }
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
        checkedSupplies: [],
        checkedStepSupplies: {},
        activeTimers: [],
        imageHeight: 25,
        isImageCollapsed: false,
        showStepSupplies: false,
        servingsMultiplier: 1,
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

  toggleSupply(supplyId: string): void {
    const state = this.getCurrentCreationState()
    if (!state) return

    const checked = [...state.checkedSupplies]
    const index = checked.indexOf(supplyId)
    
    if (index > -1) {
      checked.splice(index, 1)
    } else {
      checked.push(supplyId)
    }

    this.updateCreationState({ checkedSupplies: checked })
  }

  toggleStepSupply(stepIndex: number, supplyId: string): void {
    const state = this.getCurrentCreationState()
    if (!state) return

    const stepSupplies = { ...state.checkedStepSupplies }
    if (!stepSupplies[stepIndex]) {
      stepSupplies[stepIndex] = []
    }

    const supplies = [...stepSupplies[stepIndex]]
    const index = supplies.indexOf(supplyId)
    
    if (index > -1) {
      supplies.splice(index, 1)
    } else {
      supplies.push(supplyId)
    }

    stepSupplies[stepIndex] = supplies
    this.updateCreationState({ checkedStepSupplies: stepSupplies })
  }

  isSupplyChecked(supplyId: string): boolean {
    const state = this.getCurrentCreationState()
    return state ? state.checkedSupplies.includes(supplyId) : false
  }

  isStepSupplyChecked(stepIndex: number, supplyId: string): boolean {
    const state = this.getCurrentCreationState()
    if (!state) return false
    const stepSupplies = state.checkedStepSupplies[stepIndex]
    return stepSupplies ? stepSupplies.includes(supplyId) : false
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

  toggleStepSuppliesVisibility(): void {
    const state = this.getCurrentCreationState()
    if (!state) return
    
    this.updateCreationState({ 
      showStepSupplies: !state.showStepSupplies 
    })
  }

  /**
   * Servings multiplier management
   */
  getServingsMultiplier(creationKey?: string): number {
    const key = creationKey || this.currentCreationKey
    if (!key) return 1
    
    const state = this.storage.state[key]
    return state ? state.servingsMultiplier : 1
  }

  /**
   * Request servings multiplier from parent window (for iframe usage)
   * Optimized to avoid long waits when not in an active iframe
   */
  async requestServingsMultiplierFromParent(creationKey: string): Promise<number> {
    return new Promise((resolve) => {
      if (typeof window === 'undefined' || window === window.top) {
        resolve(this.getServingsMultiplier(creationKey))
        return
      }

      // Check if we're actually in an iframe with a different origin parent
      // If document.referrer is empty or same-origin, parent is unlikely to have data
      const isSameOrigin = window.parent.location.href.includes(window.location.hostname) ||
                          window.parent === window.top
      const hasValidParent = window.parent && window.parent !== window && !isSameOrigin

      if (!hasValidParent) {
        // Not in a valid cross-origin iframe, resolve immediately
        resolve(this.getServingsMultiplier(creationKey))
        return
      }

      const messageId = Math.random().toString(36).substr(2, 9)
      let resolved = false

      const handleMessage = (event: MessageEvent) => {
        if (event.data.type === 'SERVINGS_MULTIPLIER_RESPONSE' && event.data.messageId === messageId) {
          window.removeEventListener('message', handleMessage)
          if (!resolved) {
            resolved = true
            resolve(event.data.multiplier || 1)
          }
        }
      }

      window.addEventListener('message', handleMessage)

      // Request servings multiplier from parent
      window.parent.postMessage({
        type: 'REQUEST_SERVINGS_MULTIPLIER',
        messageId,
        creationKey
      }, '*')

      // Reduced timeout from 1000ms to 200ms for faster fallback
      setTimeout(() => {
        window.removeEventListener('message', handleMessage)
        if (!resolved) {
          resolved = true
          resolve(1)
        }
      }, 200)
    })
  }

  setServingsMultiplier(creationKey: string, multiplier: number): void {
    const oldCurrentKey = this.currentCreationKey
    
    // Temporarily set current creation to update the correct state
    this.currentCreationKey = creationKey
    this.updateCreationState({ servingsMultiplier: multiplier })
    
    // Restore original current creation
    this.currentCreationKey = oldCurrentKey
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
      // Silent fail for storage loading
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

      // Broadcast changes to other windows (cross-origin support)
      this.broadcastStorage()
    } catch (error) {
      // Silent fail for storage saving
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