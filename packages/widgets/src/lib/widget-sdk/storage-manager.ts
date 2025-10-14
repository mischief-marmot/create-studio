export interface UserPreferences {
  modalSize?: 'small' | 'medium' | 'large'
  theme?: 'light' | 'dark' | 'auto'
  dismissedAlerts?: string[]
  units?: 'metric' | 'imperial'
  language?: string
  customizations?: Record<string, any>
  completedSteps?: Record<string, string[]>
}

export class StorageManager {
  private storageKey: string
  private preferences: UserPreferences = {}

  constructor(prefix: string = 'create-studio') {
    this.storageKey = `${prefix}-preferences`
  }

  async init(): Promise<void> {
    try {
      this.loadPreferences()
    } catch (error) {
      console.warn('Failed to load user preferences:', error)
      this.preferences = {}
    }
  }

  private loadPreferences(): void {
    const stored = localStorage.getItem(this.storageKey)
    if (stored) {
      try {
        this.preferences = JSON.parse(stored)
      } catch (error) {
        console.warn('Invalid preferences data, resetting:', error)
        this.preferences = {}
      }
    }
  }

  private savePreferences(): void {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(this.preferences))
    } catch (error) {
      console.warn('Failed to save preferences:', error)
    }
  }

  getPreferences(): UserPreferences {
    return { ...this.preferences }
  }

  updatePreferences(updates: Partial<UserPreferences>): void {
    this.preferences = { ...this.preferences, ...updates }
    this.savePreferences()
  }

  getPreference<K extends keyof UserPreferences>(key: K): UserPreferences[K] {
    return this.preferences[key]
  }

  setPreference<K extends keyof UserPreferences>(key: K, value: UserPreferences[K]): void {
    this.preferences[key] = value
    this.savePreferences()
  }

  isDismissed(alertId: string): boolean {
    return this.preferences.dismissedAlerts?.includes(alertId) || false
  }

  dismissAlert(alertId: string): void {
    const dismissed = this.preferences.dismissedAlerts || []
    if (!dismissed.includes(alertId)) {
      this.updatePreferences({
        dismissedAlerts: [...dismissed, alertId]
      })
    }
  }

  getCompletedSteps(recipeId: string): string[] {
    return this.preferences.completedSteps?.[recipeId] || []
  }

  setCompletedSteps(recipeId: string, steps: string[]): void {
    const completedSteps = this.preferences.completedSteps || {}
    completedSteps[recipeId] = steps
    this.updatePreferences({ completedSteps })
  }

  clearAll(): void {
    localStorage.removeItem(this.storageKey)
    this.preferences = {}
  }
}