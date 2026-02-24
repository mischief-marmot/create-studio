import { describe, it, expect } from 'vitest'
import { ref, computed } from 'vue'
import { useInteractiveIngredients } from '../useInteractiveIngredients'
import type { HowTo } from '@create-studio/shared'

const makeCreation = (overrides: Partial<HowTo> = {}): HowTo => ({
  '@type': 'Recipe',
  name: 'Test Recipe',
  step: [],
  recipeIngredient: ['1 cup flour', '2 eggs', '1/2 cup sugar'],
  ...overrides,
} as unknown as HowTo)

describe('useInteractiveIngredients', () => {
  describe('suppliesLabel', () => {
    it('returns "Ingredients" for Recipe type', () => {
      const creation = computed(() => makeCreation({ '@type': 'Recipe' }))
      const servingsMultiplier = computed(() => 1)
      const resolvedUnitConversionConfig = computed(() => null)
      const activeUnitSystem = ref(null)
      const { suppliesLabel } = useInteractiveIngredients({
        creation, servingsMultiplier, resolvedUnitConversionConfig, activeUnitSystem,
      })
      expect(suppliesLabel.value).toBe('Ingredients')
    })

    it('returns "Supplies" for HowTo type', () => {
      const creation = computed(() => makeCreation({ '@type': 'HowTo' }))
      const servingsMultiplier = computed(() => 1)
      const resolvedUnitConversionConfig = computed(() => null)
      const activeUnitSystem = ref(null)
      const { suppliesLabel } = useInteractiveIngredients({
        creation, servingsMultiplier, resolvedUnitConversionConfig, activeUnitSystem,
      })
      expect(suppliesLabel.value).toBe('Supplies')
    })

    it('returns "Supplies" when creation is null', () => {
      const creation = computed(() => null)
      const servingsMultiplier = computed(() => 1)
      const resolvedUnitConversionConfig = computed(() => null)
      const activeUnitSystem = ref(null)
      const { suppliesLabel } = useInteractiveIngredients({
        creation, servingsMultiplier, resolvedUnitConversionConfig, activeUnitSystem,
      })
      expect(suppliesLabel.value).toBe('Supplies')
    })
  })

  describe('adjustedIngredients', () => {
    it('returns empty array when creation is null', () => {
      const creation = computed(() => null)
      const servingsMultiplier = computed(() => 1)
      const resolvedUnitConversionConfig = computed(() => null)
      const activeUnitSystem = ref(null)
      const { adjustedIngredients } = useInteractiveIngredients({
        creation, servingsMultiplier, resolvedUnitConversionConfig, activeUnitSystem,
      })
      expect(adjustedIngredients.value).toEqual([])
    })

    it('returns empty array when creation has no recipeIngredient', () => {
      const creation = computed(() => makeCreation({ recipeIngredient: undefined }))
      const servingsMultiplier = computed(() => 1)
      const resolvedUnitConversionConfig = computed(() => null)
      const activeUnitSystem = ref(null)
      const { adjustedIngredients } = useInteractiveIngredients({
        creation, servingsMultiplier, resolvedUnitConversionConfig, activeUnitSystem,
      })
      expect(adjustedIngredients.value).toEqual([])
    })

    it('returns raw ingredients when multiplier is 1 and no unit config', () => {
      const ingredients = ['1 cup flour', '2 eggs']
      const creation = computed(() => makeCreation({ recipeIngredient: ingredients }))
      const servingsMultiplier = computed(() => 1)
      const resolvedUnitConversionConfig = computed(() => null)
      const activeUnitSystem = ref(null)
      const { adjustedIngredients } = useInteractiveIngredients({
        creation, servingsMultiplier, resolvedUnitConversionConfig, activeUnitSystem,
      })
      expect(adjustedIngredients.value).toEqual(ingredients)
    })
  })

  describe('adjustedIngredientsGroups', () => {
    it('returns null when creation has no groups', () => {
      const creation = computed(() => makeCreation({ recipeIngredientGroups: undefined }))
      const servingsMultiplier = computed(() => 1)
      const resolvedUnitConversionConfig = computed(() => null)
      const activeUnitSystem = ref(null)
      const { adjustedIngredientsGroups } = useInteractiveIngredients({
        creation, servingsMultiplier, resolvedUnitConversionConfig, activeUnitSystem,
      })
      expect(adjustedIngredientsGroups.value).toBeNull()
    })

    it('returns raw groups when multiplier is 1 and no unit config', () => {
      const groups = { 'Group A': ['1 cup flour'], 'Group B': ['2 eggs'] }
      const creation = computed(() => makeCreation({ recipeIngredientGroups: groups as any }))
      const servingsMultiplier = computed(() => 1)
      const resolvedUnitConversionConfig = computed(() => null)
      const activeUnitSystem = ref(null)
      const { adjustedIngredientsGroups } = useInteractiveIngredients({
        creation, servingsMultiplier, resolvedUnitConversionConfig, activeUnitSystem,
      })
      expect(adjustedIngredientsGroups.value).toEqual(groups)
    })
  })

  describe('adjustedYield', () => {
    it('returns undefined when creation has no yield', () => {
      const creation = computed(() => makeCreation({ yield: undefined }))
      const servingsMultiplier = computed(() => 1)
      const resolvedUnitConversionConfig = computed(() => null)
      const activeUnitSystem = ref(null)
      const { adjustedYield } = useInteractiveIngredients({
        creation, servingsMultiplier, resolvedUnitConversionConfig, activeUnitSystem,
      })
      expect(adjustedYield.value).toBeUndefined()
    })

    it('returns raw yield when multiplier is 1', () => {
      const creation = computed(() => makeCreation({ yield: '8 servings' }))
      const servingsMultiplier = computed(() => 1)
      const resolvedUnitConversionConfig = computed(() => null)
      const activeUnitSystem = ref(null)
      const { adjustedYield } = useInteractiveIngredients({
        creation, servingsMultiplier, resolvedUnitConversionConfig, activeUnitSystem,
      })
      expect(adjustedYield.value).toBe('8 servings')
    })

    it('scales numeric yield when multiplier changes', () => {
      const creation = computed(() => makeCreation({ yield: '8 servings' }))
      const multiplier = ref(2)
      const servingsMultiplier = computed(() => multiplier.value)
      const resolvedUnitConversionConfig = computed(() => null)
      const activeUnitSystem = ref(null)
      const { adjustedYield } = useInteractiveIngredients({
        creation, servingsMultiplier, resolvedUnitConversionConfig, activeUnitSystem,
      })
      expect(adjustedYield.value).toBe('16 servings')
    })

    it('handles yield with prefix like "Yield: 4"', () => {
      const creation = computed(() => makeCreation({ yield: 'Yield: 4' }))
      const multiplier = ref(3)
      const servingsMultiplier = computed(() => multiplier.value)
      const resolvedUnitConversionConfig = computed(() => null)
      const activeUnitSystem = ref(null)
      const { adjustedYield } = useInteractiveIngredients({
        creation, servingsMultiplier, resolvedUnitConversionConfig, activeUnitSystem,
      })
      expect(adjustedYield.value).toBe('Yield: 12')
    })

    it('formats whole numbers without decimals', () => {
      const creation = computed(() => makeCreation({ yield: '3 cookies' }))
      const multiplier = ref(4)
      const servingsMultiplier = computed(() => multiplier.value)
      const resolvedUnitConversionConfig = computed(() => null)
      const activeUnitSystem = ref(null)
      const { adjustedYield } = useInteractiveIngredients({
        creation, servingsMultiplier, resolvedUnitConversionConfig, activeUnitSystem,
      })
      expect(adjustedYield.value).toBe('12 cookies')
    })

    it('formats decimal yields with 1 decimal place', () => {
      const creation = computed(() => makeCreation({ yield: '3 servings' }))
      const multiplier = ref(1.5)
      const servingsMultiplier = computed(() => multiplier.value)
      const resolvedUnitConversionConfig = computed(() => null)
      const activeUnitSystem = ref(null)
      const { adjustedYield } = useInteractiveIngredients({
        creation, servingsMultiplier, resolvedUnitConversionConfig, activeUnitSystem,
      })
      expect(adjustedYield.value).toBe('4.5 servings')
    })
  })
})
