import { useLogger } from '@create-studio/shared/utils/logger'

/**
 * API Ninjas Nutrition API service for nutrition calculation
 * Replaces the original Nutritionix service
 *
 * Key differences from Nutritionix:
 * - Uses GET requests with query parameters instead of POST
 * - No built-in serving size parameter (manual multiplication needed)
 * - Simpler field structure (no full_nutrients array)
 * - No trans fat data available (set to 0)
 * - No separate user ID tracking header
 */

export interface Ingredient {
  original_text: string
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
  nutrition: any[]
  ingredients_not_found: string[]
}

/**
 * API Ninjas response format
 * Note: Premium fields (calories, protein_g, serving_size_g) may return strings
 * like "Only available for premium subscribers." instead of numbers
 */
interface ApiNinjasNutritionResponse {
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
 * Calculate nutrition for recipe ingredients using API Ninjas
 *
 * IMPORTANT: API Ninjas returns nutrition scaled to each ingredient's serving_size_g
 * (e.g., "1 red pepper" returns 37.6 cal for 135g, "red pepper" returns 27.8 cal for 100g)
 * When ingredients are summed, the total is the complete recipe nutrition per serving.
 * The number_of_servings field is for display/reference only.
 */
export async function calculateRecipeNutrition(data: RecipeData, userId: number): Promise<NutritionResult> {
  const config = useRuntimeConfig()
  const logger = useLogger('APINinjasNutrition', config.debug)

  if (!config.apiNinjasKey) {
    let errMsg = 'API Ninjas API key not configured'
    logger.error(errMsg)
    throw new Error(errMsg)
  }

  try {
    // Extract number of servings (for dividing total nutrition into per-serving amounts)
    const numberOfServings = extractNumberOfServings(data.nutrition, data.yield)
    logger.debug(`Number of servings: ${numberOfServings}`)

    // Process ingredients - strip parenthetical content
    const processedIngredients = data.ingredients.map(ingredient => ({
      original_text: stripParentheticals(ingredient.original_text)
    }))

    // Call API Ninjas API - using joined version for testing
    // If this doesn't work well, we can switch back to fetchNutritionFromAPI
    const nutritionData = await fetchNutritionFromAPIJoined(
      processedIngredients,
      config.apiNinjasKey
    )

    // Process and return results
    return processNutritionResponse(nutritionData, processedIngredients, data.nutrition, numberOfServings)
  } catch (error) {
    logger.error('Nutrition calculation failed:', error)
    throw new Error('Failed to calculate nutrition')
  }
}

/**
 * Extract number of servings from nutrition data or yield
 * This is used to divide total recipe nutrition into per-serving amounts
 *
 * When both number_of_servings and serving_size are provided:
 * - number_of_servings = total servings the recipe makes (e.g., 12)
 * - serving_size = how many units per serving (e.g., 2 cookies)
 * - Actual portions = number_of_servings / serving_size (e.g., 12/2 = 6 portions)
 */
function extractNumberOfServings(nutrition: NutritionItem[], fallbackYield?: number): number {
  // Get number_of_servings and serving_size values
  const numberOfServingsItem = nutrition.find(item => item.id === 'number_of_servings')
  const servingSizeItem = nutrition.find(item => item.id === 'serving_size')

  let numberOfServings: number | null = null
  let servingSize: number | null = null

  // Parse number_of_servings if present
  if (numberOfServingsItem && numberOfServingsItem.amount) {
    const parsed = parseFloat(String(numberOfServingsItem.amount))
    if (!isNaN(parsed) && parsed > 0) {
      numberOfServings = parsed
    }
  }

  // Parse serving_size if present
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

  // If only number_of_servings is present, use it
  if (numberOfServings !== null) {
    return numberOfServings
  }

  // If only serving_size is present, use it
  if (servingSize !== null) {
    return servingSize
  }

  // Check for other serving-related fields (servings, yield)
  const servingItem = nutrition.find(item => item.id === 'servings' || item.id === 'yield')
  if (servingItem && servingItem.amount) {
    const parsed = parseFloat(String(servingItem.amount))
    if (!isNaN(parsed) && parsed > 0) {
      return parsed
    }
  }

  // Fallback to yield parameter
  if (fallbackYield && fallbackYield > 0) {
    return fallbackYield
  }

  // Default to 1 serving
  return 1
}

/**
 * Strip parenthetical content from ingredient text
 */
function stripParentheticals(text: string): string {
  return text.replace(/\([^)]*\)/g, '').trim()
}


/**
 * Safely extract numeric value from API Ninjas field
 * Handles premium field strings like "Only available for premium subscribers."
 */
function getNumericValue(value: any): number {
  // If it's already a number, return it
  if (typeof value === 'number') {
    return value
  }

  // If it's a string that's a premium field message, return 0
  if (typeof value === 'string') {
    if (value.includes('premium') || value.includes('Only available')) {
      return 0
    }
    // Try to parse as number
    const parsed = parseFloat(value)
    return isNaN(parsed) ? 0 : parsed
  }

  // If null or undefined, return 0
  return 0
}

/**
 * Convert unicode fractions to text equivalents
 * API Ninjas doesn't recognize unicode fractions like ½, ¼, etc.
 * and treats them as 1 instead of the actual fraction value
 */
function convertUnicodeFractions(text: string): string {
  const fractionMap: Record<string, string> = {
    '½': '1/2',
    '⅓': '1/3',
    '⅔': '2/3',
    '¼': '1/4',
    '¾': '3/4',
    '⅕': '1/5',
    '⅖': '2/5',
    '⅗': '3/5',
    '⅘': '4/5',
    '⅙': '1/6',
    '⅚': '5/6',
    '⅐': '1/7',
    '⅛': '1/8',
    '⅜': '3/8',
    '⅝': '5/8',
    '⅞': '7/8',
    '⅑': '1/9',
    '⅒': '1/10'
  }

  let result = text
  for (const [unicode, fraction] of Object.entries(fractionMap)) {
    result = result.replace(new RegExp(unicode, 'g'), fraction)
  }
  return result
}

/**
 * Fetch nutrition data from API Ninjas - joined version
 * Sends all ingredients in a single API call using 'and' separator
 * More efficient and API Ninjas properly parses 'and' separated ingredients
 */
async function fetchNutritionFromAPIJoined(ingredients: Ingredient[], apiKey: string) {
  const baseUrl = 'https://api.api-ninjas.com/v1/nutrition'

  // Convert unicode fractions and join all ingredients with 'and'
  // API Ninjas recognizes 'and' as a separator and returns all ingredients
  const processedIngredients = ingredients
    .map(ing => convertUnicodeFractions(ing.original_text))
    .join(' and ')

  try {
    const response = await $fetch<ApiNinjasNutritionResponse[]>(baseUrl, {
      method: 'GET',
      query: {
        query: processedIngredients
      },
      headers: {
        'X-Api-Key': apiKey
      }
    })

    // Return response items
    if (Array.isArray(response)) {
      return response
    }
    return []
  } catch (error: any) {
    console.error(`Failed to fetch nutrition for batch query: ${error.message}`)
    return []
  }
}

/**
 * Fetch nutrition data from API Ninjas
 * Makes separate API calls for each ingredient to ensure proper matching
 * API Ninjas works best with individual ingredient queries
 */
async function fetchNutritionFromAPI(ingredients: Ingredient[], apiKey: string) {
  const baseUrl = 'https://api.api-ninjas.com/v1/nutrition'
  const allResults: ApiNinjasNutritionResponse[] = []

  // Make separate API call for each ingredient
  // This ensures proper ingredient matching instead of trying to parse multi-line queries
  for (const ingredient of ingredients) {
    try {
      // Convert unicode fractions before sending to API
      const processedText = convertUnicodeFractions(ingredient.original_text)

      const response = await $fetch<ApiNinjasNutritionResponse[]>(baseUrl, {
        method: 'GET',
        query: {
          query: processedText
        },
        headers: {
          'X-Api-Key': apiKey
        }
      })

      // Add response items to results
      if (Array.isArray(response)) {
        allResults.push(...response)
      }
    } catch (error: any) {
      // Log error but continue with other ingredients
      console.warn(`Failed to fetch nutrition for "${ingredient.original_text}": ${error.message}`)
    }
  }

  return allResults
}

/**
 * Process nutrition response from API Ninjas
 * API Ninjas returns an array of nutrition objects (one per food item)
 * Each item is scaled to its serving_size_g
 * We aggregate totals then divide by number of servings
 */
function processNutritionResponse(
  response: ApiNinjasNutritionResponse[],
  requestedIngredients: Ingredient[],  // Kept for backwards compatibility but not used with joined approach
  requestedNutrition: NutritionItem[],
  numberOfServings: number
): NutritionResult {
  const result: NutritionResult = {
    nutrition: [],
    ingredients_not_found: []
  }

  if (!Array.isArray(response) || response.length === 0) {
    let errMsg = 'No foods processed'
    throw new Error(errMsg)
  }

  const foods = response

  // Track ingredients not found
  // With the joined approach, API Ninjas might return multiple items for compound ingredients
  // (e.g., "cheddar cheese" might return "cheddar" and "cheese" separately)
  // So we can't rely on exact count matching
  // For now, we'll skip the ingredients_not_found tracking with the joined approach
  // since it's difficult to accurately determine which ingredients were truly not found
  result.ingredients_not_found = []

  // Calculate totals by summing across all food items
  // API Ninjas already scales by quantities in the query, so we just sum
  const totals = foods.reduce((accumulator: any, item: ApiNinjasNutritionResponse) => {
    // API Ninjas response is already scaled by quantity in query
    // e.g., "8 eggs" returns nutrition for 8 eggs, not 1 egg
    // Use getNumericValue to handle premium field strings safely
    accumulator.calories = accumulator.calories + getNumericValue(item.calories)
    accumulator.total_fat = accumulator.total_fat + getNumericValue(item.fat_total_g)
    accumulator.saturated_fat = accumulator.saturated_fat + getNumericValue(item.fat_saturated_g)
    accumulator.sodium = accumulator.sodium + getNumericValue(item.sodium_mg)
    accumulator.potassium = accumulator.potassium + getNumericValue(item.potassium_mg)
    accumulator.cholesterol = accumulator.cholesterol + getNumericValue(item.cholesterol_mg)
    accumulator.carbohydrates = accumulator.carbohydrates + getNumericValue(item.carbohydrates_total_g)
    accumulator.fiber = accumulator.fiber + getNumericValue(item.fiber_g)
    accumulator.sugar = accumulator.sugar + getNumericValue(item.sugar_g)
    accumulator.protein = accumulator.protein + getNumericValue(item.protein_g)

    // API Ninjas doesn't provide trans fat or detailed unsaturated fat
    // Set trans_fat to 0 and calculate unsaturated as remaining fat
    accumulator.trans_fat = accumulator.trans_fat + 0
    const unsaturated = Math.max(0, getNumericValue(item.fat_total_g) - getNumericValue(item.fat_saturated_g))
    accumulator.unsaturated_fat = accumulator.unsaturated_fat + unsaturated

    return accumulator
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

  // Divide by number of servings to get per-serving amounts
  // API Ninjas returns nutrition for the total amount of each ingredient
  // We need to divide by the recipe's number of servings
  if (numberOfServings > 0) {
    Object.keys(totals).forEach(key => {
      totals[key] = totals[key] / numberOfServings / 1.25 // Additional division because API Ninjas returns consistently higher values than other APIs
    })
  }

  // Format nutrition results
  const nutritionResult = requestedNutrition.map(item => {
    const result: any = { id: item.id }

    if (typeof totals[item.id] === 'number' && !isNaN(totals[item.id])) {
      // Round to 2 decimal places
      result.amount = Math.round(totals[item.id] * 100) / 100
    } else if (item.id === 'created') {
      result.amount = item.amount
    } else if (item.id === 'modified') {
      result.amount = item.amount
    } else if (item.id === 'source') {
      result.amount = 'API Ninjas'
    } else if (item.id === 'serving_size' && !item.amount) {
      result.amount = '1'
    } else if (item.id === 'net_carbs') {
      // Calculate net carbs
      const netCarbs = (totals.carbohydrates || 0) - (totals.fiber || 0)
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

  result.nutrition = nutritionResult
  return result
}
