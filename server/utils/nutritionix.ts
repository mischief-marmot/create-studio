import axios from 'axios'


const config = useRuntimeConfig()
const logger = useLogger('NutritioniX', config.debug)

/**
 * Nutritionix API service for nutrition calculation
 * Maintains compatibility with the original NIX service
 */

export interface Ingredient {
  original_text: string
}

export interface NutritionItem {
  id: string
  amount: string | number
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
 * Calculate nutrition for recipe ingredients
 */
export async function calculateRecipeNutrition(data: RecipeData, userId: number): Promise<NutritionResult> {
  if (!config.nixId || !config.nixKey) {
    let errMsg = 'Nutritionix API credentials not configured'
    logger.error(errMsg)
    throw new Error(errMsg)
  }

  try {
    // Extract serving size from nutrition array or use yield
    const servingSize = extractServingSize(data.nutrition, data.yield)

    // Process ingredients - strip parenthetical content
    const processedIngredients = data.ingredients.map(ingredient => ({
      original_text: stripParentheticals(ingredient.original_text)
    }))

    // Call Nutritionix API with num_servings parameter
    const nutritionData = await fetchNutritionFromAPI(
      processedIngredients,
      servingSize,
      userId,
      config.nixId,
      config.nixKey
    )

    // Process and return results
    return processNutritionResponse(nutritionData, processedIngredients, data.nutrition)
  } catch (error) {
    logger.error('Nutrition calculation failed:', error)
    throw new Error('Failed to calculate nutrition')
  }
}

/**
 * Extract serving size from nutrition data or yield
 */
function extractServingSize(nutrition: NutritionItem[], fallbackYield?: number): number {
  // Look for number_of_servings first (this is what the original API uses)
  const numberOfServingsItem = nutrition.find(item => item.id === 'number_of_servings')
  if (numberOfServingsItem && numberOfServingsItem.amount) {
    const parsed = parseInt(String(numberOfServingsItem.amount))
    if (!isNaN(parsed) && parsed > 0) {
      return parsed
    }
  }

  // Then check for other serving-related fields
  const servingItem = nutrition.find(item =>
    item.id === 'servings' || item.id === 'serving_size' || item.id === 'yield'
  )

  if (servingItem && servingItem.amount) {
    const parsed = parseInt(String(servingItem.amount))
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
 * Fetch nutrition data from Nutritionix API
 */
async function fetchNutritionFromAPI(ingredients: Ingredient[], servings: number, userId: number, appId: string, appKey: string) {
  const url = 'https://trackapi.nutritionix.com/v2/natural/nutrients'

  const requestBody = {
    query: ingredients.map(ing => ing.original_text).join('\n'),
    num_servings: servings
  }

  const response = await axios.post(url, requestBody, {
    headers: {
      'x-app-id': appId,
      'x-app-key': appKey,
      'x-remote-user-id': String(userId),
      'Content-Type': 'application/json'
    }
  })

  return response.data
}

/**
 * Process nutrition response from API
 */
function processNutritionResponse(
  response: any,
  requestedIngredients: Ingredient[],
  requestedNutrition: NutritionItem[]
): NutritionResult {
  const result: NutritionResult = {
    nutrition: [],
    ingredients_not_found: []
  }

  if (!response.foods) {
    let errMsg = 'No foods processed'
    logger.error(errMsg)
    throw new Error(errMsg)
  }

  const foods = response.foods

  // Track ingredients not found (matching original logic)
  const responseFoodNames = foods.map((food: any) => food.food_name?.toLowerCase())
  if (requestedIngredients.length !== foods.length) {
    result.ingredients_not_found = requestedIngredients.reduce((acc: string[], ingredient) => {
      if (!responseFoodNames.includes(ingredient.original_text.toLowerCase())) {
        acc.push(ingredient.original_text)
      }
      return acc
    }, [])
  }

  // Calculate totals (num_servings already applied by API)
  const totals = foods.reduce((accumulator: any, item: any) => {
    accumulator.calories = accumulator.calories + (item.nf_calories || 0)
    accumulator.total_fat = accumulator.total_fat + (item.nf_total_fat || 0)
    accumulator.sodium = accumulator.sodium + (item.nf_sodium || 0)
    accumulator.saturated_fat = accumulator.saturated_fat + (item.nf_saturated_fat || 0)
    accumulator.cholesterol = accumulator.cholesterol + (item.nf_cholesterol || 0)
    accumulator.carbohydrates = accumulator.carbohydrates + (item.nf_total_carbohydrate || 0)
    accumulator.fiber = accumulator.fiber + (item.nf_dietary_fiber || 0)
    accumulator.sugar = accumulator.sugar + (item.nf_sugars || 0)
    accumulator.protein = accumulator.protein + (item.nf_protein || 0)

    // Process full_nutrients array for trans fat and unsaturated fats
    if (item.full_nutrients) {
      item.full_nutrients.forEach((nutrient: any) => {
        if (nutrient.attr_id === 605) { // Trans fat
          accumulator.trans_fat = accumulator.trans_fat + nutrient.value
        }
        if (nutrient.attr_id === 645) { // Monounsaturated fat
          accumulator.unsaturated_fat = accumulator.unsaturated_fat + nutrient.value
        }
        if (nutrient.attr_id === 646) { // Polyunsaturated fat
          accumulator.unsaturated_fat = accumulator.unsaturated_fat + nutrient.value
        }
      })
    }

    return accumulator
  }, {
    calories: 0,
    total_fat: 0,
    sodium: 0,
    saturated_fat: 0,
    cholesterol: 0,
    carbohydrates: 0,
    fiber: 0,
    protein: 0,
    sugar: 0,
    trans_fat: 0,
    unsaturated_fat: 0
  })

  // Format nutrition results (matching original normalizeOutput)
  const nutritionResult = requestedNutrition.map(item => {
    const result: any = { id: item.id }

    if (typeof totals[item.id] === 'number') {
      result.amount = Math.round(totals[item.id] * 100) / 100
    } else if (item.id === 'calculated') {
      result.amount = new Date().toISOString().slice(0, 19).replace('T', ' ')
    } else if (item.id === 'source') {
      result.amount = 'Nutritionix'
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

