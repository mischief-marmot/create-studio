import { computed } from 'vue'
import type { ComputedRef, Ref } from 'vue'
import type { HowTo } from '@create-studio/shared'
import { transformIngredientValue } from '@create-studio/shared/utils/ingredient-pipeline'
import { type UnitConversionConfig, type MeasurementSystem } from '@create-studio/shared/utils/unit-conversion'

interface Options {
  creation: ComputedRef<HowTo | null>
  servingsMultiplier: ComputedRef<number>
  resolvedUnitConversionConfig: ComputedRef<UnitConversionConfig | null>
  activeUnitSystem: Ref<MeasurementSystem | null>
}

export function useInteractiveIngredients({
  creation,
  servingsMultiplier,
  resolvedUnitConversionConfig,
  activeUnitSystem,
}: Options) {
  const suppliesLabel = computed(() => {
    return creation.value?.['@type'] === 'Recipe' ? 'Ingredients' : 'Supplies'
  })

  const adjustedIngredients = computed(() => {
    if (!creation.value?.recipeIngredient) return []

    const unitConfig = resolvedUnitConversionConfig.value
    const targetSystem = activeUnitSystem.value
    const multiplier = servingsMultiplier.value

    if (multiplier === 1 && (!unitConfig || !targetSystem || targetSystem === unitConfig.source_system)) {
      return creation.value.recipeIngredient
    }

    return creation.value.recipeIngredient.map((ingredient, idx) => {
      const ingredientId = String(idx)
      return transformIngredientValue(ingredient, ingredientId, unitConfig, targetSystem, multiplier)
    })
  })

  const adjustedIngredientsGroups = computed(() => {
    if (!creation.value?.recipeIngredientGroups) return null

    const unitConfig = resolvedUnitConversionConfig.value
    const targetSystem = activeUnitSystem.value
    const multiplier = servingsMultiplier.value

    if (multiplier === 1 && (!unitConfig || !targetSystem || targetSystem === unitConfig.source_system)) {
      return creation.value.recipeIngredientGroups
    }

    const adjusted: Record<string, (string | { original_text: string; link?: string; nofollow?: boolean })[]> = {}
    let idx = 0
    for (const [groupName, ingredients] of Object.entries(creation.value.recipeIngredientGroups)) {
      adjusted[groupName] = ingredients.map((ingredient) => {
        const ingredientId = String(idx++)
        return transformIngredientValue(ingredient, ingredientId, unitConfig, targetSystem, multiplier)
      })
    }
    return adjusted
  })

  const adjustedYield = computed(() => {
    if (!creation.value?.yield || servingsMultiplier.value === 1) {
      return creation.value?.yield
    }

    const originalYield = creation.value.yield

    let yieldMatch = originalYield.match(/^(\d+(?:\.\d+)?)\s*(.*)$/)

    if (!yieldMatch) {
      yieldMatch = originalYield.match(/^(.*?):\s*(\d+(?:\.\d+)?)\s*(.*)$/)
      if (yieldMatch) {
        const prefix = yieldMatch[1]
        const originalNumber = parseFloat(yieldMatch[2])
        const unit = yieldMatch[3]
        const newNumber = originalNumber * servingsMultiplier.value

        const formattedNumber = newNumber % 1 === 0 ? newNumber.toString() : newNumber.toFixed(1)

        return `${prefix}: ${formattedNumber} ${unit}`.trim()
      }
    }

    if (yieldMatch) {
      const originalNumber = parseFloat(yieldMatch[1])
      const unit = yieldMatch[2]
      const newNumber = originalNumber * servingsMultiplier.value

      const formattedNumber = newNumber % 1 === 0 ? newNumber.toString() : newNumber.toFixed(1)

      return `${formattedNumber} ${unit}`.trim()
    }

    return originalYield
  })

  return {
    suppliesLabel,
    adjustedIngredients,
    adjustedIngredientsGroups,
    adjustedYield,
  }
}
