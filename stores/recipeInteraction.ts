import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export interface Timer {
  id: string
  label: string
  duration: number
  remaining: number
  isActive: boolean
  stepIndex?: number
}

export interface RecipeProgress {
  recipeId: string | number
  currentStep: number
  checkedIngredients: Set<string>
  checkedStepIngredients: Map<number, Set<string>>
  activeTimers: Timer[]
  imageHeight: number
  isImageCollapsed: boolean
  startedAt: string
  lastUpdated: string
}

export const useRecipeInteractionStore = defineStore('recipeInteraction', () => {
  // Store multiple recipe progresses keyed by recipe ID
  const recipeProgresses = ref<Map<string | number, RecipeProgress>>(new Map())
  
  // Current active recipe ID
  const currentRecipeId = ref<string | number | null>(null)
  
  // Get current recipe progress
  const currentProgress = computed(() => {
    if (!currentRecipeId.value) return null
    return recipeProgresses.value.get(currentRecipeId.value) || null
  })
  
  // Initialize or get recipe progress
  function initializeRecipe(recipeId: string | number) {
    currentRecipeId.value = recipeId
    
    if (!recipeProgresses.value.has(recipeId)) {
      const newProgress: RecipeProgress = {
        recipeId,
        currentStep: 0,
        checkedIngredients: new Set(),
        checkedStepIngredients: new Map(),
        activeTimers: [],
        imageHeight: 25, // Default 25% height
        isImageCollapsed: false,
        startedAt: new Date().toISOString(),
        lastUpdated: new Date().toISOString()
      }
      recipeProgresses.value.set(recipeId, newProgress)
    }
    
    return recipeProgresses.value.get(recipeId)!
  }
  
  // Update current step
  function setCurrentStep(step: number) {
    if (!currentRecipeId.value || !currentProgress.value) return
    
    const progress = recipeProgresses.value.get(currentRecipeId.value)!
    progress.currentStep = step
    progress.lastUpdated = new Date().toISOString()
  }
  
  // Toggle ingredient checked state
  function toggleIngredient(ingredientId: string) {
    if (!currentRecipeId.value || !currentProgress.value) return
    
    const progress = recipeProgresses.value.get(currentRecipeId.value)!
    if (progress.checkedIngredients.has(ingredientId)) {
      progress.checkedIngredients.delete(ingredientId)
    } else {
      progress.checkedIngredients.add(ingredientId)
    }
    progress.lastUpdated = new Date().toISOString()
  }
  
  // Toggle step-specific ingredient
  function toggleStepIngredient(stepIndex: number, ingredientId: string) {
    if (!currentRecipeId.value || !currentProgress.value) return
    
    const progress = recipeProgresses.value.get(currentRecipeId.value)!
    if (!progress.checkedStepIngredients.has(stepIndex)) {
      progress.checkedStepIngredients.set(stepIndex, new Set())
    }
    
    const stepIngredients = progress.checkedStepIngredients.get(stepIndex)!
    if (stepIngredients.has(ingredientId)) {
      stepIngredients.delete(ingredientId)
    } else {
      stepIngredients.add(ingredientId)
    }
    progress.lastUpdated = new Date().toISOString()
  }
  
  // Check if ingredient is checked
  function isIngredientChecked(ingredientId: string): boolean {
    if (!currentProgress.value) return false
    return currentProgress.value.checkedIngredients.has(ingredientId)
  }
  
  // Check if step ingredient is checked
  function isStepIngredientChecked(stepIndex: number, ingredientId: string): boolean {
    if (!currentProgress.value) return false
    const stepIngredients = currentProgress.value.checkedStepIngredients.get(stepIndex)
    return stepIngredients ? stepIngredients.has(ingredientId) : false
  }
  
  // Add timer
  function addTimer(timer: Omit<Timer, 'id'> & { id?: string }) {
    if (!currentRecipeId.value || !currentProgress.value) return
    
    const progress = recipeProgresses.value.get(currentRecipeId.value)!
    const newTimer: Timer = {
      ...timer,
      id: timer.id || `timer-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`
    }
    progress.activeTimers.push(newTimer)
    progress.lastUpdated = new Date().toISOString()
    return newTimer
  }
  
  // Update timer
  function updateTimer(timerId: string, updates: Partial<Timer>) {
    if (!currentRecipeId.value || !currentProgress.value) return
    
    const progress = recipeProgresses.value.get(currentRecipeId.value)!
    const timerIndex = progress.activeTimers.findIndex(t => t.id === timerId)
    if (timerIndex !== -1) {
      progress.activeTimers[timerIndex] = {
        ...progress.activeTimers[timerIndex],
        ...updates
      }
      progress.lastUpdated = new Date().toISOString()
    }
  }
  
  // Remove timer
  function removeTimer(timerId: string) {
    if (!currentRecipeId.value || !currentProgress.value) return
    
    const progress = recipeProgresses.value.get(currentRecipeId.value)!
    progress.activeTimers = progress.activeTimers.filter(t => t.id !== timerId)
    progress.lastUpdated = new Date().toISOString()
  }
  
  // Clear all timers
  function clearTimers() {
    if (!currentRecipeId.value || !currentProgress.value) return
    
    const progress = recipeProgresses.value.get(currentRecipeId.value)!
    progress.activeTimers = []
    progress.lastUpdated = new Date().toISOString()
  }
  
  // Clear duplicate timers (keep only the latest ones by ID)
  function clearDuplicateTimers() {
    if (!currentRecipeId.value || !currentProgress.value) return
    
    const progress = recipeProgresses.value.get(currentRecipeId.value)!
    const uniqueTimers = new Map<string, Timer>()
    
    progress.activeTimers.forEach(timer => {
      uniqueTimers.set(timer.id, timer)
    })
    
    progress.activeTimers = Array.from(uniqueTimers.values())
    progress.lastUpdated = new Date().toISOString()
  }
  
  // Update image state
  function setImageState(height: number, isCollapsed: boolean) {
    if (!currentRecipeId.value || !currentProgress.value) return
    
    const progress = recipeProgresses.value.get(currentRecipeId.value)!
    progress.imageHeight = height
    progress.isImageCollapsed = isCollapsed
    progress.lastUpdated = new Date().toISOString()
  }
  
  // Reset recipe progress
  function resetRecipe(recipeId?: string | number) {
    const id = recipeId || currentRecipeId.value
    if (!id) return
    
    recipeProgresses.value.delete(id)
    if (currentRecipeId.value === id) {
      initializeRecipe(id)
    }
  }
  
  // Clear all progress
  function clearAllProgress() {
    recipeProgresses.value.clear()
    currentRecipeId.value = null
  }
  
  // Get all recipe progresses (for persistence/debugging)
  function getAllProgresses() {
    const result: Record<string, any> = {}
    recipeProgresses.value.forEach((progress, id) => {
      result[String(id)] = {
        ...progress,
        checkedIngredients: Array.from(progress.checkedIngredients),
        checkedStepIngredients: Object.fromEntries(
          Array.from(progress.checkedStepIngredients.entries()).map(
            ([step, ingredients]) => [step, Array.from(ingredients)]
          )
        )
      }
    })
    return result
  }
  
  // Load progresses from storage (for persistence)
  function loadProgresses(data: Record<string, any>) {
    recipeProgresses.value.clear()
    
    Object.entries(data).forEach(([id, progress]) => {
      const restoredProgress: RecipeProgress = {
        ...progress,
        checkedIngredients: new Set(progress.checkedIngredients || []),
        checkedStepIngredients: new Map(
          Object.entries(progress.checkedStepIngredients || {}).map(
            ([step, ingredients]) => [Number(step), new Set(ingredients as string[])]
          )
        )
      }
      recipeProgresses.value.set(id, restoredProgress)
    })
  }
  
  return {
    // State
    currentRecipeId,
    currentProgress,
    recipeProgresses,
    
    // Actions
    initializeRecipe,
    setCurrentStep,
    toggleIngredient,
    toggleStepIngredient,
    isIngredientChecked,
    isStepIngredientChecked,
    addTimer,
    updateTimer,
    removeTimer,
    clearTimers,
    clearDuplicateTimers,
    setImageState,
    resetRecipe,
    clearAllProgress,
    getAllProgresses,
    loadProgresses
  }
})