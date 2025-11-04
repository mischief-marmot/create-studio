import { useLogger } from '@create-studio/shared/utils/logger'

/**
 * API Ninjas Nutrition Item API service
 * Uses the /v1/nutritionitem endpoint for more accurate portion-based nutrition
 *
 * Key advantages:
 * - Explicit quantity parameter for precise portioning
 * - Individual ingredient queries for better accuracy
 * - Native support for unicode fractions (½, ¼, ¾, etc.)
 * - Returns single object instead of array
 * - Supports pre-populated item/amount properties
 */

export interface Ingredient {
  original_text: string
  item?: string  // Pre-populated ingredient name (e.g., "flour")
  amount?: string  // Pre-populated quantity with unit (e.g., "1 cup")
}

export interface NutritionItem {
  id: string
  amount: string | number | undefined
}

export interface RecipeData {
  title: string
  yield?: number
  ingredients: Ingredient[]
  nutrition: NutritionItem[]
}

export interface NutritionResult {
  nutrition: any[]  // Per-serving nutrition values
  totalNutrition: any[]  // Total recipe nutrition (before dividing by servings)
  ingredients_not_found: string[]
}

/**
 * API Ninjas /v1/nutritionitem response format
 * Returns single object with nutrition data for specified quantity
 */
interface ApiNinjasNutritionItemResponse {
  name: string
  calories?: number | string
  serving_size_g?: number | string
  fat_total_g: number
  fat_saturated_g: number
  protein_g?: number | string
  sodium_mg: number
  potassium_mg: number
  cholesterol_mg: number
  carbohydrates_total_g: number
  fiber_g: number
  sugar_g: number
}

/**
 * Parsed ingredient with quantity and item separated
 */
interface ParsedIngredient {
  original_text: string
  quantity: string
  item: string
  parsed_successfully: boolean
}

/**
 * Parse ingredient text to extract quantity and item
 * Examples:
 *   "1 cup flour" → { quantity: "1 cup", item: "flour" }
 *   "2 tablespoons olive oil" → { quantity: "2 tablespoons", item: "olive oil" }
 *   "1¼ cups cottage cheese" → { quantity: "1¼ cups", item: "cottage cheese" }
 *   "scant ½ teaspoon salt" → { quantity: "scant ½ teaspoon", item: "salt" }
 *   "6 large eggs" → { quantity: "6", item: "large eggs" }
 *   "15 oz. can dark red kidney beans" → { quantity: "15 oz", item: "dark red kidney beans" }
 */
function parseIngredientQuantity(ingredientText: string): ParsedIngredient {
  const original = ingredientText.trim()

  // Common measurement units (excluding size descriptors like small/medium/large)
  const units = [
    'cup', 'cups',
    'tablespoon', 'tablespoons', 'tbsp', 'tbs', 'T',
    'teaspoon', 'teaspoons', 'tsp',
    'ounce', 'ounces', 'oz', 'oz.',
    'pound', 'pounds', 'lb', 'lbs', 'lb.',
    'gram', 'grams', 'g',
    'kilogram', 'kilograms', 'kg',
    'liter', 'liters', 'l',
    'milliliter', 'milliliters', 'ml',
    'can', 'cans',
    'container', 'containers',
    'box', 'boxes',
    'package', 'packages',
    'bunch', 'bunches',
    'clove', 'cloves',
    'sprig', 'sprigs',
    'slice', 'slices',
    'piece', 'pieces',
    'whole'
  ]

  // Quantity modifiers (scant, heaping, etc.)
  const modifiers = ['scant', 'heaping', 'generous', 'rounded', 'level', 'packed']
  const modifierPattern = `(?:${modifiers.join('|')}\\s+)?`

  // Pattern parts:
  // 1. Optional modifier (scant, heaping, etc.)
  // 2. Number with optional unicode fraction (1¼, 2½, etc.) OR standalone unicode fraction
  // 3. Optional regular fraction (1/2, 3/4, etc.) OR mixed number (1 1/2)
  // 4. Optional unit
  // 5. Rest is the item
  const quantityPattern = new RegExp(
    `^${modifierPattern}` +  // Optional modifier
    `([0-9]+[½⅓⅔¼¾⅕⅖⅗⅘⅙⅚⅐⅛⅜⅝⅞⅑⅒]?|[½⅓⅔¼¾⅕⅖⅗⅘⅙⅚⅐⅛⅜⅝⅞⅑⅒])` +  // Number with optional unicode fraction OR standalone unicode fraction
    `(?:\\s+[0-9]+/[0-9]+)?` +  // Optional regular fraction (for "1 1/2" style)
    `(?:\\s*\\/\\s*[0-9]+)?` +  // Optional regular fraction (for "1/2" style)
    `(?:\\.?[0-9]+)?` +  // Optional decimal part
    `\\s*` +
    `(${units.join('|')})?` +  // Optional unit
    `\\.?\\s+` +  // Separator
    `(.+)$`,  // Item name
    'i'
  )

  const match = original.match(quantityPattern)

  if (match) {
    const fullMatch = match[0]
    const item = match[3].trim()

    // Build quantity string - extract everything before the item
    const quantityPart = fullMatch.substring(0, fullMatch.lastIndexOf(item)).trim()

    return {
      original_text: original,
      quantity: quantityPart,
      item,
      parsed_successfully: true
    }
  }

  // If no quantity detected, mark as failed parsing
  // These ingredients will be skipped during nutrition calculation
  // (e.g., "salt to taste", "garnish with herbs")
  return {
    original_text: original,
    quantity: '', // Placeholder (won't be used since parsed_successfully = false)
    item: original,
    parsed_successfully: false
  }
}

/**
 * Strip parenthetical content from ingredient text
 */
function stripParentheticals(text: string): string {
  return text.replace(/\([^)]*\)/g, '').trim()
}

/**
 * Safely extract numeric value from API response
 */
function getNumericValue(value: any): number {
  if (typeof value === 'number') {
    return value
  }

  if (typeof value === 'string') {
    if (value.includes('premium') || value.includes('Only available')) {
      return 0
    }
    const parsed = parseFloat(value)
    return isNaN(parsed) ? 0 : parsed
  }

  return 0
}

/**
 * Fetch nutrition data for a single ingredient using /v1/nutritionitem
 */
async function fetchNutritionForIngredient(
  query: string,
  quantity: string,
  apiKey: string
): Promise<ApiNinjasNutritionItemResponse | null> {
  const baseUrl = 'https://api.api-ninjas.com/v1/nutritionitem'
  const logger = useLogger('APINinjasNutritionItem', useRuntimeConfig().debug)

  try {

    const response = await $fetch<ApiNinjasNutritionItemResponse>(baseUrl, {
      method: 'GET',
      query: {
        query,
        quantity
      },
      headers: {
        'X-Api-Key': apiKey
      }
    })

    return response
  } catch (error: any) {
    logger.warn(`Failed to fetch nutrition for "${quantity} ${query}": ${error.message}`)
    return null
  }
}

/**
 * Extract number of servings from nutrition data or yield
 */
function extractNumberOfServings(nutrition: NutritionItem[], fallbackYield?: number): number {
  const numberOfServingsItem = nutrition.find(item => item.id === 'number_of_servings')
  const servingSizeItem = nutrition.find(item => item.id === 'serving_size')

  let numberOfServings: number | null = null
  let servingSize: number | null = null

  if (numberOfServingsItem && numberOfServingsItem.amount) {
    const parsed = parseFloat(String(numberOfServingsItem.amount))
    if (!isNaN(parsed) && parsed > 0) {
      numberOfServings = parsed
    }
  }

  if (servingSizeItem && servingSizeItem.amount) {
    const parsed = parseFloat(String(servingSizeItem.amount))
    if (!isNaN(parsed) && parsed > 0) {
      servingSize = parsed
    }
  }

  // If both are present, divide number_of_servings by serving_size
  if (numberOfServings !== null && servingSize !== null) {
    return numberOfServings / servingSize
  }

  if (numberOfServings !== null) {
    return numberOfServings
  }

  if (servingSize !== null) {
    return servingSize
  }

  // Check for other serving-related fields
  const servingItem = nutrition.find(item => item.id === 'servings' || item.id === 'yield')
  if (servingItem && servingItem.amount) {
    const parsed = parseFloat(String(servingItem.amount))
    if (!isNaN(parsed) && parsed > 0) {
      return parsed
    }
  }

  if (fallbackYield && fallbackYield > 0) {
    return fallbackYield
  }

  return 1
}

/**
 * Calculate recipe nutrition using /v1/nutritionitem endpoint
 * Makes parallel requests for each ingredient with its specific quantity
 */
export async function calculateRecipeNutritionWithItems(
  data: RecipeData,
  userId: number
): Promise<NutritionResult> {
  const config = useRuntimeConfig()
  const logger = useLogger('APINinjasNutritionItem', config.debug)

  if (!config.apiNinjasKey) {
    logger.error('API Ninjas API key not configured')
    throw new Error('API Ninjas API key not configured')
  }

  try {
    // Extract number of servings
    const numberOfServings = extractNumberOfServings(data.nutrition, data.yield)

    // Process and parse all ingredients
    // Prioritize pre-populated item/amount if available, otherwise parse original_text
    const processedIngredients = data.ingredients.map(ingredient => {
      // If item and amount are already provided, use them directly
      if (ingredient.item && ingredient.amount) {
        return {
          original_text: ingredient.original_text,
          quantity: ingredient.amount,
          item: ingredient.item,
          parsed_successfully: true
        }
      }

      // Otherwise, parse from original_text
      // Note: No need to convert unicode fractions - API Ninjas handles them natively now
      const cleaned = stripParentheticals(ingredient.original_text)
      return parseIngredientQuantity(cleaned)
    })


    // Separate successfully parsed ingredients from those that failed
    const successfullyParsed = processedIngredients.filter(parsed => parsed.parsed_successfully)
    const failedToParse = processedIngredients.filter(parsed => !parsed.parsed_successfully)

    // Track ingredients that were skipped due to parsing failure
    const ingredientsNotFound: string[] = failedToParse.map(parsed => parsed.original_text)

    // Only fetch nutrition for successfully parsed ingredients
    if (successfullyParsed.length === 0) {
      logger.warn('No ingredients could be parsed successfully')
      throw new Error('No ingredients could be parsed with valid quantities')
    }

    const nutritionPromises = successfullyParsed.map(parsed =>
      fetchNutritionForIngredient(parsed.item, parsed.quantity, config.apiNinjasKey)
    )

    const nutritionResults = await Promise.all(nutritionPromises)

    // Track ingredients not found by API (separate from parse failures)
    const validResults: ApiNinjasNutritionItemResponse[] = []

    nutritionResults.forEach((result, index) => {
      if (result === null) {
        ingredientsNotFound.push(successfullyParsed[index].original_text)
      } else {
        validResults.push(result)
      }
    })

    if (validResults.length === 0) {
      throw new Error('No nutrition data found for any ingredients')
    }

    // Calculate totals by summing all ingredients
    // API Ninjas already scales by the quantity parameter
    const totals = validResults.reduce((acc, item) => {
      acc.calories += getNumericValue(item.calories)
      acc.total_fat += getNumericValue(item.fat_total_g)
      acc.saturated_fat += getNumericValue(item.fat_saturated_g)
      acc.sodium += getNumericValue(item.sodium_mg)
      acc.potassium += getNumericValue(item.potassium_mg)
      acc.cholesterol += getNumericValue(item.cholesterol_mg)
      acc.carbohydrates += getNumericValue(item.carbohydrates_total_g)
      acc.fiber += getNumericValue(item.fiber_g)
      acc.sugar += getNumericValue(item.sugar_g)
      acc.protein += getNumericValue(item.protein_g)

      // Calculate unsaturated fat
      const unsaturated = Math.max(0, getNumericValue(item.fat_total_g) - getNumericValue(item.fat_saturated_g))
      acc.unsaturated_fat += unsaturated
      acc.trans_fat += 0 // API Ninjas doesn't provide trans fat

      return acc
    }, {
      calories: 0,
      total_fat: 0,
      saturated_fat: 0,
      trans_fat: 0,
      unsaturated_fat: 0,
      sodium: 0,
      potassium: 0,
      cholesterol: 0,
      carbohydrates: 0,
      fiber: 0,
      sugar: 0,
      protein: 0
    })

    // Save total nutrition values before dividing by servings
    const totalNutritionValues = { ...totals }

    // Divide by number of servings to get per-serving amounts
    const perServingTotals = { ...totals }
    if (numberOfServings > 0) {
      (Object.keys(perServingTotals) as Array<keyof typeof perServingTotals>).forEach(key => {
        perServingTotals[key] = perServingTotals[key] / numberOfServings
      })
    }


    // Helper function to format nutrition values
    const formatNutritionValues = (values: any) => {
      return data.nutrition.map(item => {
        const result: any = { id: item.id }

        if (typeof values[item.id] === 'number' && !isNaN(values[item.id])) {
          result.amount = Math.round(values[item.id] * 100) / 100
        } else if (item.id === 'calculated') {
          result.amount = new Date().toISOString()
        } else if (item.id === 'created') {
          result.amount = item.amount
        } else if (item.id === 'modified') {
          result.amount = item.amount
        } else if (item.id === 'source') {
          result.amount = 'API Ninjas Nutrition'
        } else if (item.id === 'serving_size' && !item.amount) {
          result.amount = '1'
        } else if (item.id === 'net_carbs') {
          const netCarbs = (values.carbohydrates || 0) - (values.fiber || 0)
          result.amount = Math.round(netCarbs * 100) / 100
        } else if (item.id === 'display_zeros') {
          result.amount = '1'
        } else if (!item.amount) {
          result.amount = '0'
        } else {
          result.amount = item.amount
        }

        return result
      })
    }

    // Format both per-serving and total nutrition
    const nutritionResult = formatNutritionValues(perServingTotals)
    const totalNutritionResult = formatNutritionValues(totalNutritionValues)

    return {
      nutrition: nutritionResult,
      totalNutrition: totalNutritionResult,
      ingredients_not_found: ingredientsNotFound
    }
  } catch (error) {
    logger.error('Nutrition calculation failed:', error)
    throw new Error('Failed to calculate nutrition')
  }
}
