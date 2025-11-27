import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { SharedStorageManager } from '../../src/lib/shared-storage/shared-storage-manager'

describe('SharedStorageManager', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear()
  })

  afterEach(() => {
    localStorage.clear()
  })

  describe('Merge Storage', () => {
    it('should add new creation state that does not exist locally', () => {
      const manager = new SharedStorageManager()

      // Initialize a local creation
      const localKey = manager.initializeCreation('localhost', '25')
      manager.setCurrentStep(2)

      // Create incoming storage with a new creation
      const incomingStorage = {
        id: 'test-id',
        preferences: {},
        state: {
          'new-creation-key': {
            creationKey: 'new-creation-key',
            currentStep: 5,
            checkedSupplies: [],
            checkedStepSupplies: {},
            activeTimers: [],
            imageHeight: 25,
            isImageCollapsed: false,
            showStepSupplies: false,
            servingsMultiplier: 1,
            startedAt: new Date().toISOString(),
            lastUpdated: new Date().toISOString(),
            hasInteracted: true
          }
        }
      }

      // Simulate merging incoming storage (this is what happens during cross-window sync)
      manager['mergeStorage'](incomingStorage)

      // Should have both local and incoming creations
      const allStates = manager.getAllCreationStates()
      expect(allStates[localKey]).toBeDefined()
      expect(allStates['new-creation-key']).toBeDefined()
      expect(allStates['new-creation-key'].currentStep).toBe(5)
    })

    it('should keep newer state when incoming is older', () => {
      const manager = new SharedStorageManager()

      // Initialize local creation with recent timestamp
      const localKey = manager.initializeCreation('localhost', '25')
      const now = new Date()
      const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000)

      // Manually set a newer state with step 5
      manager['storage'].state[localKey] = {
        ...manager['storage'].state[localKey],
        currentStep: 5,
        lastUpdated: now.toISOString()
      }

      // Create incoming storage with older timestamp
      const incomingStorage = {
        id: 'test-id',
        preferences: {},
        state: {
          [localKey]: {
            creationKey: localKey,
            currentStep: 2, // Older step
            checkedSupplies: [],
            checkedStepSupplies: {},
            activeTimers: [],
            imageHeight: 25,
            isImageCollapsed: false,
            showStepSupplies: false,
            servingsMultiplier: 1,
            startedAt: new Date().toISOString(),
            lastUpdated: oneHourAgo.toISOString(),
            hasInteracted: true
          }
        }
      }

      manager['mergeStorage'](incomingStorage)

      // Should keep the newer state
      const state = manager.getCreationState(localKey)
      expect(state?.currentStep).toBe(5)
    })

    it('should take newer state when incoming is newer', () => {
      const manager = new SharedStorageManager()

      // Initialize local creation with old timestamp
      const localKey = manager.initializeCreation('localhost', '25')
      const oneHourAgo = new Date(new Date().getTime() - 60 * 60 * 1000)

      // Manually set an older state
      manager['storage'].state[localKey] = {
        ...manager['storage'].state[localKey],
        currentStep: 2,
        lastUpdated: oneHourAgo.toISOString()
      }

      // Create incoming storage with newer timestamp
      const now = new Date()
      const incomingStorage = {
        id: 'test-id',
        preferences: {},
        state: {
          [localKey]: {
            creationKey: localKey,
            currentStep: 7, // Newer step
            checkedSupplies: ['item1'],
            checkedStepSupplies: {},
            activeTimers: [],
            imageHeight: 30,
            isImageCollapsed: false,
            showStepSupplies: false,
            servingsMultiplier: 1,
            startedAt: new Date().toISOString(),
            lastUpdated: now.toISOString(),
            hasInteracted: true
          }
        }
      }

      manager['mergeStorage'](incomingStorage)

      // Should take the newer state
      const state = manager.getCreationState(localKey)
      expect(state?.currentStep).toBe(7)
      expect(state?.checkedSupplies).toEqual(['item1'])
      expect(state?.imageHeight).toBe(30)
    })

    it('should merge preferences when syncing storage', () => {
      const manager = new SharedStorageManager()

      // Set local preference
      manager.setPreference('units', 'metric')

      // Create incoming storage with different preferences
      const incomingStorage = {
        id: 'test-id',
        preferences: {
          theme: 'dark',
          language: 'fr'
        },
        state: {}
      }

      manager['mergeStorage'](incomingStorage)

      // Should have merged preferences
      const prefs = manager.getPreferences()
      expect(prefs.units).toBe('metric') // Local preference preserved
      expect(prefs.theme).toBe('dark') // Incoming preference added
      expect(prefs.language).toBe('fr') // Incoming preference added
    })

    it('should handle empty incoming state gracefully', () => {
      const manager = new SharedStorageManager()

      const localKey = manager.initializeCreation('localhost', '25')
      manager.setCurrentStep(3)

      // Incoming with no state
      const incomingStorage = {
        id: 'test-id',
        preferences: {},
        state: {}
      }

      manager['mergeStorage'](incomingStorage)

      // Local state should be preserved
      const state = manager.getCreationState(localKey)
      expect(state?.currentStep).toBe(3)
    })

    it('should preserve local ID when merging', () => {
      const manager = new SharedStorageManager()
      const localId = manager.getStorageId()

      // Incoming storage with different ID
      const incomingStorage = {
        id: 'different-id',
        preferences: {},
        state: {}
      }

      manager['mergeStorage'](incomingStorage)

      // Local ID should be preserved
      expect(manager.getStorageId()).toBe(localId)
    })
  })

  describe('Creation State Management', () => {
    it('should initialize and persist creation state', () => {
      const manager = new SharedStorageManager()

      const key = manager.initializeCreation('localhost', '25')
      manager.setCurrentStep(3)

      // Create new manager instance to simulate page reload
      const manager2 = new SharedStorageManager()
      const state = manager2.getCreationState(key)

      expect(state?.currentStep).toBe(3)
      expect(state?.hasInteracted).toBe(true)
    })

    it('should timestamp updates when setting current step', () => {
      const manager = new SharedStorageManager()

      const key = manager.initializeCreation('localhost', '25')
      const beforeUpdate = new Date().toISOString()
      manager.setCurrentStep(2)
      const afterUpdate = new Date().toISOString()

      const state = manager.getCreationState(key)
      expect(state?.lastUpdated).toBeDefined()
      expect(state?.lastUpdated! >= beforeUpdate).toBe(true)
      expect(state?.lastUpdated! <= afterUpdate).toBe(true)
    })

    it('should set hasInteracted to true when updating state', () => {
      const manager = new SharedStorageManager()

      const key = manager.initializeCreation('localhost', '25')
      const initialState = manager.getCreationState(key)
      expect(initialState?.hasInteracted).toBe(false)

      manager.setCurrentStep(1)
      const updatedState = manager.getCreationState(key)
      expect(updatedState?.hasInteracted).toBe(true)
    })
  })

  describe('Multiple Creation Management', () => {
    it('should handle multiple independent creations', () => {
      const manager = new SharedStorageManager()

      const key1 = manager.initializeCreation('localhost', '25')
      const key2 = manager.initializeCreation('localhost', '26')

      manager.setCurrentCreation(key1)
      manager.setCurrentStep(3)

      manager.setCurrentCreation(key2)
      manager.setCurrentStep(5)

      expect(manager.getCreationState(key1)?.currentStep).toBe(3)
      expect(manager.getCreationState(key2)?.currentStep).toBe(5)
    })

    it('should preserve other creations when merging new data', () => {
      const manager = new SharedStorageManager()

      const key1 = manager.initializeCreation('localhost', '25')
      const key2 = manager.initializeCreation('localhost', '26')

      manager.setCurrentCreation(key1)
      manager.setCurrentStep(2)

      manager.setCurrentCreation(key2)
      manager.setCurrentStep(4)

      // Get the old timestamp and create a newer one
      const oldState = manager.getCreationState(key1)
      const olderTime = new Date(oldState?.lastUpdated || 0)
      const newerTime = new Date(olderTime.getTime() + 10000) // 10 seconds later

      // Merge new data for key1 with different step and newer timestamp
      const incomingStorage = {
        id: 'test-id',
        preferences: {},
        state: {
          [key1]: {
            creationKey: key1,
            currentStep: 8,
            checkedSupplies: [],
            checkedStepSupplies: {},
            activeTimers: [],
            imageHeight: 25,
            isImageCollapsed: false,
            showStepSupplies: false,
            servingsMultiplier: 1,
            startedAt: new Date().toISOString(),
            lastUpdated: newerTime.toISOString(),
            hasInteracted: true
          }
        }
      }

      manager['mergeStorage'](incomingStorage)

      // Both should be updated correctly
      expect(manager.getCreationState(key1)?.currentStep).toBe(8)
      expect(manager.getCreationState(key2)?.currentStep).toBe(4)
    })
  })
})
