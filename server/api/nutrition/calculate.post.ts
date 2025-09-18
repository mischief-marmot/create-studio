import { 
  calculateNutritionFromAPINinjasData, 
  type LegacyNutritionItem,
  type APINinjasNutrientResponse 
} from '#shared/utils/nutrition-calculator'

interface NutritionRequest {
  ingredients: string[];
  servings?: number;
}

interface NutritionCalculationResult {
  nutrition: LegacyNutritionItem[];
  ingredientsNotFound: string[];
  ingredientsProcessed: string[];
}

export default defineEventHandler(
  async (event): Promise<NutritionCalculationResult> => {
    try {
      const body = await readBody<NutritionRequest>(event);

      if (
        !body.ingredients ||
        !Array.isArray(body.ingredients) ||
        body.ingredients.length === 0
      ) {
        throw createError({
          statusCode: 400,
          statusMessage: "Invalid request: ingredients array is required",
        });
      }

      const runtimeConfig = useRuntimeConfig();
      const apiKey = runtimeConfig.apiNinjasKey;

      if (!apiKey) {
        throw createError({
          statusCode: 500,
          statusMessage:
            "API configuration error: API_NINJAS_KEY not configured",
        });
      }

      const servings = body.servings || 1;
      const ingredientsNotFound: string[] = [];
      const ingredientsProcessed: string[] = [];
      const nutritionData: APINinjasNutrientResponse[] = [];

      // Process each ingredient with API Ninjas
      for (const ingredient of body.ingredients) {
        if (!ingredient.trim()) continue;

        try {
          const response = await $fetch<APINinjasNutrientResponse[]>(
            "https://api.api-ninjas.com/v1/nutrition",
            {
              query: { query: ingredient.trim() },
              headers: {
                "X-Api-Key": apiKey,
              },
            }
          );

          if (response && response.length > 0) {
            nutritionData.push(...response);
            ingredientsProcessed.push(ingredient);
          } else {
            ingredientsNotFound.push(ingredient);
          }
        } catch (error) {
          console.error(`Error processing ingredient "${ingredient}":`, error);
          ingredientsNotFound.push(ingredient);
        }
      }

      // Use the nutrition calculator utility to process the data
      const nutrition = calculateNutritionFromAPINinjasData(nutritionData, servings);

      return {
        nutrition,
        ingredientsNotFound,
        ingredientsProcessed,
      };
    } catch (error: any) {
      console.error("Nutrition calculation error:", error);

      if (error?.statusCode) {
        throw error;
      }

      throw createError({
        statusCode: 500,
        statusMessage: "Failed to calculate nutrition information",
      });
    }
  }
);
