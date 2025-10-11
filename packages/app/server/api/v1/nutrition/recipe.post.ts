/**
 * POST /api/v1/nutrition/recipe
 * Calculate recipe nutrition using Nutritionix API
 *
 * Maintains compatibility with original Express API
 * Includes rate limiting (15 requests per 5 minutes per user)
 */

import { useLogger } from '@create-studio/shared/utils/logger'
import { verifyJWT } from '~~/server/utils/auth'
import { calculateRecipeNutrition } from '~~/server/utils/nutritionix'
import { sendErrorResponse } from '~~/server/utils/errors'
import { rateLimitMiddleware } from '~~/server/utils/rateLimiter'

export default defineEventHandler(async (event) => {
  const { debug } = useRuntimeConfig()
  const logger = useLogger('NutritionCalculation', debug)

  try {
    // Verify JWT token and get user info
    const user = await verifyJWT(event)

    // Apply rate limiting (15 requests per 5 minutes per user)
    await rateLimitMiddleware(event, {
      maxRequests: 15,
      windowMs: 5 * 60 * 1000, // 5 minutes
      keyPrefix: 'nutrition',
      getKey: () => `${user.email}-nutrition`
    })

    const body = await readBody(event)

    // Validate required fields
    if (!body.title) {
      setResponseStatus(event, 400)
      return { error: 'Recipe title is required' }
    }

    if (!body.ingredients || !Array.isArray(body.ingredients) || body.ingredients.length === 0) {
      setResponseStatus(event, 400)
      return { error: 'Recipe ingredients are required' }
    }

    if (!body.nutrition || !Array.isArray(body.nutrition)) {
      setResponseStatus(event, 400)
      return { error: 'Nutrition fields are required' }
    }

    // Extract serving size logic from original controller
    let recipeYield = 1
    let inboundYield = 1

    if (body.yield) {
      inboundYield = parseInt(body.yield, 10)
      if (typeof inboundYield === 'number' && !isNaN(inboundYield)) {
        recipeYield = inboundYield
      }
    }

    // Check for number_of_servings in nutrition array
    const numberOfServings = body.nutrition.filter((field: any) => field.id === 'number_of_servings')
    if (numberOfServings[0] && numberOfServings[0].amount) {
      const servings = parseInt(numberOfServings[0].amount, 10)
      if (!isNaN(servings)) {
        recipeYield = servings
      }
    }

    // Prepare recipe data for nutrition calculation
    const recipeData = {
      title: body.title,
      yield: recipeYield,
      ingredients: body.ingredients.map((ingredient: any) => ({
        original_text: ingredient.original_text || ''
      })),
      nutrition: body.nutrition
    }
    logger.debug('Recipe data', recipeData)

    // Calculate nutrition using our service
    const nutritionResult = await calculateRecipeNutrition(recipeData, user.id)
    logger.debug('Nutrition result', nutritionResult)

    // Format response to match original API
    const response: any = {}

    if (nutritionResult.nutrition) {
      response.nutrition = nutritionResult.nutrition
    }

    if (nutritionResult.ingredients_not_found && nutritionResult.ingredients_not_found.length > 0) {
      response.ingredientsNotFound = nutritionResult.ingredients_not_found
    }

    // Return in original format
    setResponseStatus(event, 200)
    return {
      data: response
    }

  } catch (error) {
    console.error('Nutrition calculation error:', error)

    // Handle Axios errors (from Nutritionix API)
    if ((error as any)?.isAxiosError) {
      const axiosError = error as any
      setResponseStatus(event, 400)
      return {
        status: 400,
        message: axiosError.response?.data?.message || 'Nutrition API error'
      }
    }

    return sendErrorResponse(event, error)
  }
})