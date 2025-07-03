import type { NutritionInformation } from '~/types/schemas'

/**
 * Legacy nutrition format from Create by Mediavine
 * This matches the format expected by the original Nutritionix integration
 */
export interface LegacyNutritionItem {
  id: string
  amount: string
  unit?: string
}

/**
 * API Ninjas nutrition response format
 */
export interface APINinjasNutrientResponse {
  name: string
  calories: number
  serving_size_g: number
  fat_total_g: number
  fat_saturated_g: number
  protein_g: number
  sodium_mg: number
  potassium_mg: number
  cholesterol_mg: number
  carbohydrates_total_g: number
  fiber_g: number
  sugar_g: number
}

/**
 * Recipe data structure for nutrition calculation
 */
export interface RecipeNutritionData {
  ingredients: string[]
  servings: number
}

/**
 * Result from nutrition calculation
 */
export interface NutritionCalculationResult {
  nutrition: LegacyNutritionItem[] | NutritionInformation
  ingredientsNotFound: string[]
  ingredientsProcessed: string[]
}

/**
 * Calculate nutrition information for a recipe using API Ninjas
 * @param data Recipe data with ingredients and servings
 * @param schemaFormat Whether to return Schema.org format instead of legacy Mediavine format
 * @returns Nutrition calculation result
 */
export async function calculateNutrition(
  data: RecipeNutritionData,
  schemaFormat: boolean = false
): Promise<NutritionCalculationResult> {
  try {
    const response = await $fetch<{ nutrition: LegacyNutritionItem[], ingredientsNotFound: string[], ingredientsProcessed: string[] }>('/api/nutrition/calculate', {
      method: 'POST',
      body: {
        ingredients: data.ingredients,
        servings: data.servings
      }
    })

    if (schemaFormat) {
      // Convert legacy format to Schema.org format
      const schemaOrgNutrition = convertLegacyToSchemaOrg(response.nutrition)
      return {
        ...response,
        nutrition: schemaOrgNutrition
      }
    }

    return response
  } catch (error) {
    console.error('Nutrition calculation failed:', error)
    throw error
  }
}

/**
 * Convert legacy Mediavine format to Schema.org NutritionInformation
 * This allows getting Schema.org format when needed
 */
export function convertLegacyToSchemaOrg(legacyNutrition: LegacyNutritionItem[]): NutritionInformation {
  const getValue = (id: string): string => {
    const item = legacyNutrition.find(n => n.id === id)
    return item?.amount || '0'
  }

  const getValueWithUnit = (id: string, unit: string): string => {
    const item = legacyNutrition.find(n => n.id === id)
    if (!item?.amount || item.amount === '0') return '0' + unit
    return item.amount + unit
  }

  return {
    '@type': 'NutritionInformation',
    calories: getValue('calories'),
    carbohydrateContent: getValueWithUnit('carbohydrates', 'g'),
    cholesterolContent: getValueWithUnit('cholesterol', 'mg'),
    fatContent: getValueWithUnit('total_fat', 'g'),
    fiberContent: getValueWithUnit('fiber', 'g'),
    proteinContent: getValueWithUnit('protein', 'g'),
    saturatedFatContent: getValueWithUnit('saturated_fat', 'g'),
    servingSize: getValue('serving_size') + ' serving',
    sodiumContent: getValueWithUnit('sodium', 'mg'),
    sugarContent: getValueWithUnit('sugar', 'g'),
    transFatContent: getValueWithUnit('trans_fat', 'g'),
    unsaturatedFatContent: getValueWithUnit('unsaturated_fat', 'g')
  }
}

/**
 * Convert Schema.org NutritionInformation to legacy Mediavine format
 * This maintains compatibility with existing integrations
 */
export function convertToLegacyFormat(nutrition: NutritionInformation): LegacyNutritionItem[] {
  const parseValue = (value?: string): string => {
    if (!value) return '0'
    // Extract numeric value from strings like "10g" or "150mg"
    const numericValue = parseFloat(value.replace(/[^\d.]/g, ''))
    return isNaN(numericValue) ? '0' : numericValue.toString()
  }

  return [
    { id: 'calories', amount: parseValue(nutrition.calories) },
    { id: 'total_fat', amount: parseValue(nutrition.fatContent), unit: 'g' },
    { id: 'sodium', amount: parseValue(nutrition.sodiumContent), unit: 'mg' },
    { id: 'saturated_fat', amount: parseValue(nutrition.saturatedFatContent), unit: 'g' },
    { id: 'cholesterol', amount: parseValue(nutrition.cholesterolContent), unit: 'mg' },
    { id: 'carbohydrates', amount: parseValue(nutrition.carbohydrateContent), unit: 'g' },
    { id: 'fiber', amount: parseValue(nutrition.fiberContent), unit: 'g' },
    { id: 'sugar', amount: parseValue(nutrition.sugarContent), unit: 'g' },
    { id: 'protein', amount: parseValue(nutrition.proteinContent), unit: 'g' },
    { id: 'trans_fat', amount: '0', unit: 'g' }, // API Ninjas doesn't provide trans fat
    { id: 'unsaturated_fat', amount: '0', unit: 'g' }, // Calculated or estimated
    { id: 'calculated', amount: new Date().toISOString().slice(0, 19).replace('T', ' ') },
    { id: 'source', amount: 'API Ninjas' },
    { id: 'serving_size', amount: '1' }
  ]
}

/**
 * Normalize ingredient strings for better API Ninjas matching
 * @param ingredients Raw ingredient strings
 * @returns Normalized ingredient strings
 */
export function normalizeIngredients(ingredients: string[]): string[] {
  return ingredients.map(ingredient => {
    // Remove common prefixes and clean up formatting
    return ingredient
      .trim()
      .replace(/^[\d\s/]*\.*\s*/, '') // Remove leading numbers, fractions, and dots
      .replace(/^(cups?|cup|tsp|tbsp|teaspoons?|tablespoons?|oz|ounces?|lbs?|pounds?|grams?|kg)\s+/i, '') // Remove measurement units
      .replace(/\([^)]*\)/g, '') // Remove parenthetical notes
      .replace(/,.*$/, '') // Remove everything after first comma
      .trim()
  }).filter(ingredient => ingredient.length > 0)
}

/**
 * Estimate nutrition for ingredients that weren't found
 * This provides fallback values to avoid empty nutrition panels
 */
export function estimateNutritionForMissing(
  missingIngredients: string[]
): Partial<NutritionInformation> {
  // Simple estimation based on common ingredient categories
  const estimatedCalories = missingIngredients.length * 20 // Rough estimate
  
  return {
    calories: estimatedCalories.toString(),
    carbohydrateContent: '2g',
    fatContent: '0.5g',
    proteinContent: '1g',
    sodiumContent: '5mg'
  }
}

/**
 * Merge nutrition information from multiple sources
 */
export function mergeNutritionData(
  primary: NutritionInformation,
  estimated: Partial<NutritionInformation>
): NutritionInformation {
  const merge = (primaryValue?: string, estimatedValue?: string): string => {
    if (primaryValue && primaryValue !== '0') return primaryValue
    return estimatedValue || '0'
  }

  return {
    '@type': 'NutritionInformation',
    calories: merge(primary.calories, estimated.calories),
    carbohydrateContent: merge(primary.carbohydrateContent, estimated.carbohydrateContent),
    cholesterolContent: merge(primary.cholesterolContent, estimated.cholesterolContent),
    fatContent: merge(primary.fatContent, estimated.fatContent),
    fiberContent: merge(primary.fiberContent, estimated.fiberContent),
    proteinContent: merge(primary.proteinContent, estimated.proteinContent),
    saturatedFatContent: merge(primary.saturatedFatContent, estimated.saturatedFatContent),
    servingSize: primary.servingSize || estimated.servingSize || '1 serving',
    sodiumContent: merge(primary.sodiumContent, estimated.sodiumContent),
    sugarContent: merge(primary.sugarContent, estimated.sugarContent),
    transFatContent: primary.transFatContent || estimated.transFatContent,
    unsaturatedFatContent: primary.unsaturatedFatContent || estimated.unsaturatedFatContent
  }
}

/**
 * Calculate nutrition totals from API Ninjas responses and convert to legacy format
 * 
 * This function uses a dynamic approach to:
 * 1. Sum nutrition values across all ingredients
 * 2. Calculate per-serving amounts
 * 3. Map to legacy Mediavine format
 * 
 * @param nutritionData Array of API Ninjas nutrition responses
 * @param servings Number of servings to divide totals by
 * @returns Legacy nutrition format array
 */
export function calculateNutritionFromAPINinjasData(
  nutritionData: APINinjasNutrientResponse[],
  servings: number = 1
): LegacyNutritionItem[] {
  // Define which fields to sum from API Ninjas response
  // This makes it easy to add/remove fields without changing the reduction logic
  const fieldsToSum = [
    'calories',
    'fat_total_g',
    'fat_saturated_g',
    'protein_g',
    'sodium_mg',
    'cholesterol_mg',
    'carbohydrates_total_g',
    'fiber_g',
    'sugar_g'
  ] as const

  // Calculate totals dynamically
  const totals = nutritionData.reduce((acc, item) => {
    // Sum all defined fields
    fieldsToSum.forEach(field => {
      acc[field] = (acc[field] || 0) + (item[field] || 0)
    })
    
    // Calculate unsaturated fat (special case)
    acc.fat_unsaturated_g = (acc.fat_unsaturated_g || 0) + 
      ((item.fat_total_g || 0) - (item.fat_saturated_g || 0))
    
    return acc
  }, {} as Record<string, number>)

  // Normalize to per serving
  const perServing: Record<string, number> = {}
  
  // Process each total
  Object.entries(totals).forEach(([key, value]) => {
    if (key === 'calories') {
      // Calories are rounded to whole numbers
      perServing[key] = Math.round(value / servings)
    } else {
      // All other values are rounded to 2 decimal places
      perServing[key] = Math.round((value / servings) * 100) / 100
    }
  })

  // Define mapping from API Ninjas fields to legacy format
  const nutritionMapping: Array<{
    id: string
    sourceField?: string
    unit?: string
    defaultValue?: string
  }> = [
    { id: 'calories', sourceField: 'calories' },
    { id: 'total_fat', sourceField: 'fat_total_g', unit: 'g' },
    { id: 'sodium', sourceField: 'sodium_mg', unit: 'mg' },
    { id: 'saturated_fat', sourceField: 'fat_saturated_g', unit: 'g' },
    { id: 'unsaturated_fat', sourceField: 'fat_unsaturated_g', unit: 'g' },
    { id: 'cholesterol', sourceField: 'cholesterol_mg', unit: 'mg' },
    { id: 'carbohydrates', sourceField: 'carbohydrates_total_g', unit: 'g' },
    { id: 'fiber', sourceField: 'fiber_g', unit: 'g' },
    { id: 'sugar', sourceField: 'sugar_g', unit: 'g' },
    { id: 'protein', sourceField: 'protein_g', unit: 'g' },
    { id: 'trans_fat', defaultValue: '0', unit: 'g' }, // API Ninjas doesn't provide trans fat
    { id: 'calculated', defaultValue: new Date().toISOString().slice(0, 19).replace('T', ' ') },
    { id: 'source', defaultValue: 'API Ninjas' },
    { id: 'serving_size', defaultValue: '1' }
  ]

  // Convert to legacy format using mapping
  return nutritionMapping.map(({ id, sourceField, unit, defaultValue }) => {
    const item: LegacyNutritionItem = {
      id,
      amount: sourceField 
        ? (perServing[sourceField] || 0).toString()
        : defaultValue || '0'
    }
    
    if (unit) {
      item.unit = unit
    }
    
    return item
  })
}