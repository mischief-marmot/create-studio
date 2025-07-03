import { describe, it, expect, vi, beforeEach } from 'vitest'
import { 
  calculateNutrition, 
  convertToLegacyFormat, 
  convertLegacyToSchemaOrg, 
  normalizeIngredients, 
  calculateNutritionFromAPINinjasData,
  type LegacyNutritionItem,
  type APINinjasNutrientResponse 
} from '~/utils/nutrition-calculator'
import type { NutritionInformation } from '~/types/schemas'

// Mock $fetch for testing
const mockFetch = vi.fn()
vi.stubGlobal('$fetch', mockFetch)

describe('Nutrition API Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('calculateNutrition', () => {
    it('should calculate nutrition for a simple recipe (legacy format by default)', async () => {
      const mockResponse = {
        nutrition: [
          { id: 'calories', amount: '250' },
          { id: 'total_fat', amount: '10', unit: 'g' },
          { id: 'sodium', amount: '400', unit: 'mg' },
          { id: 'saturated_fat', amount: '2', unit: 'g' },
          { id: 'cholesterol', amount: '0', unit: 'mg' },
          { id: 'carbohydrates', amount: '30', unit: 'g' },
          { id: 'fiber', amount: '5', unit: 'g' },
          { id: 'sugar', amount: '8', unit: 'g' },
          { id: 'protein', amount: '15', unit: 'g' },
          { id: 'trans_fat', amount: '0', unit: 'g' },
          { id: 'unsaturated_fat', amount: '0', unit: 'g' },
          { id: 'source', amount: 'API Ninjas' },
          { id: 'serving_size', amount: '1' }
        ] as LegacyNutritionItem[],
        ingredientsNotFound: [],
        ingredientsProcessed: ['2 cups flour', '1 cup sugar', '1 egg']
      }

      mockFetch.mockResolvedValue(mockResponse)

      const result = await calculateNutrition({
        ingredients: ['2 cups flour', '1 cup sugar', '1 egg'],
        servings: 4
      })

      expect(Array.isArray(result.nutrition)).toBe(true)
      const legacyNutrition = result.nutrition as LegacyNutritionItem[]
      expect(legacyNutrition.find(item => item.id === 'calories')?.amount).toBe('250')
      expect(legacyNutrition.find(item => item.id === 'source')?.amount).toBe('API Ninjas')
      expect(result.ingredientsNotFound).toEqual([])
      expect(result.ingredientsProcessed).toEqual(['2 cups flour', '1 cup sugar', '1 egg'])
    })

    it('should handle ingredients not found', async () => {
      const mockResponse = {
        nutrition: [
          { id: 'calories', amount: '150' },
          { id: 'carbohydrates', amount: '20', unit: 'g' },
          { id: 'total_fat', amount: '5', unit: 'g' },
          { id: 'protein', amount: '8', unit: 'g' },
          { id: 'source', amount: 'API Ninjas' }
        ] as LegacyNutritionItem[],
        ingredientsNotFound: ['exotic spice blend'],
        ingredientsProcessed: ['2 cups flour']
      }

      mockFetch.mockResolvedValue(mockResponse)

      const result = await calculateNutrition({
        ingredients: ['2 cups flour', 'exotic spice blend'],
        servings: 2
      })

      expect(result.ingredientsNotFound).toContain('exotic spice blend')
      expect(result.ingredientsProcessed).toContain('2 cups flour')
    })

    it('should return Schema.org format when explicitly requested', async () => {
      const mockResponse = {
        nutrition: [
          { id: 'calories', amount: '250' },
          { id: 'total_fat', amount: '10', unit: 'g' },
          { id: 'carbohydrates', amount: '30', unit: 'g' },
          { id: 'protein', amount: '15', unit: 'g' },
          { id: 'sodium', amount: '400', unit: 'mg' },
          { id: 'source', amount: 'API Ninjas' }
        ] as LegacyNutritionItem[],
        ingredientsNotFound: [],
        ingredientsProcessed: ['ingredient1']
      }

      mockFetch.mockResolvedValue(mockResponse)

      const result = await calculateNutrition({
        ingredients: ['ingredient1'],
        servings: 1
      }, true) // Request Schema.org format

      expect(result.nutrition).toHaveProperty('@type', 'NutritionInformation')
      const schemaNutrition = result.nutrition as NutritionInformation
      expect(schemaNutrition.calories).toBe('250')
      expect(schemaNutrition.fatContent).toBe('10g')
      expect(schemaNutrition.carbohydrateContent).toBe('30g')
    })

    it('should handle API errors gracefully', async () => {
      mockFetch.mockRejectedValue(new Error('API Error'))

      await expect(calculateNutrition({
        ingredients: ['ingredient1'],
        servings: 1
      })).rejects.toThrow('API Error')
    })
  })

  describe('convertLegacyToSchemaOrg', () => {
    it('should convert legacy format to Schema.org format', () => {
      const legacyNutrition: LegacyNutritionItem[] = [
        { id: 'calories', amount: '250' },
        { id: 'total_fat', amount: '10', unit: 'g' },
        { id: 'carbohydrates', amount: '30', unit: 'g' },
        { id: 'protein', amount: '15', unit: 'g' },
        { id: 'sodium', amount: '400', unit: 'mg' },
        { id: 'fiber', amount: '5', unit: 'g' },
        { id: 'sugar', amount: '8', unit: 'g' },
        { id: 'cholesterol', amount: '25', unit: 'mg' },
        { id: 'saturated_fat', amount: '2', unit: 'g' },
        { id: 'serving_size', amount: '1' }
      ]

      const schemaFormat = convertLegacyToSchemaOrg(legacyNutrition)

      expect(schemaFormat).toEqual({
        '@type': 'NutritionInformation',
        calories: '250',
        carbohydrateContent: '30g',
        cholesterolContent: '25mg',
        fatContent: '10g',
        fiberContent: '5g',
        proteinContent: '15g',
        saturatedFatContent: '2g',
        servingSize: '1 serving',
        sodiumContent: '400mg',
        sugarContent: '8g',
        transFatContent: '0g',
        unsaturatedFatContent: '0g'
      })
    })

    it('should handle missing values in legacy format', () => {
      const incompleteLegacy: LegacyNutritionItem[] = [
        { id: 'calories', amount: '200' }
      ]

      const schemaFormat = convertLegacyToSchemaOrg(incompleteLegacy)
      
      expect(schemaFormat.calories).toBe('200')
      expect(schemaFormat.fatContent).toBe('0g')
      expect(schemaFormat.proteinContent).toBe('0g')
    })
  })

  describe('convertToLegacyFormat', () => {
    it('should convert Schema.org format to legacy Mediavine format', () => {
      const schemaOrgNutrition: NutritionInformation = {
        '@type': 'NutritionInformation',
        calories: '250',
        carbohydrateContent: '30g',
        fatContent: '10g',
        proteinContent: '15g',
        sodiumContent: '400mg',
        fiberContent: '5g',
        sugarContent: '8g',
        cholesterolContent: '25mg',
        saturatedFatContent: '2g',
        servingSize: '1 serving'
      }

      const legacyFormat = convertToLegacyFormat(schemaOrgNutrition)

      expect(legacyFormat).toEqual(expect.arrayContaining([
        { id: 'calories', amount: '250' },
        { id: 'total_fat', amount: '10', unit: 'g' },
        { id: 'sodium', amount: '400', unit: 'mg' },
        { id: 'saturated_fat', amount: '2', unit: 'g' },
        { id: 'cholesterol', amount: '25', unit: 'mg' },
        { id: 'carbohydrates', amount: '30', unit: 'g' },
        { id: 'fiber', amount: '5', unit: 'g' },
        { id: 'sugar', amount: '8', unit: 'g' },
        { id: 'protein', amount: '15', unit: 'g' },
        { id: 'source', amount: 'API Ninjas' },
        { id: 'serving_size', amount: '1' }
      ]))
    })

    it('should handle missing nutrition values', () => {
      const incompleteNutrition: NutritionInformation = {
        '@type': 'NutritionInformation',
        calories: '200'
      }

      const legacyFormat = convertToLegacyFormat(incompleteNutrition)
      
      expect(legacyFormat.find(item => item.id === 'calories')?.amount).toBe('200')
      expect(legacyFormat.find(item => item.id === 'total_fat')?.amount).toBe('0')
      expect(legacyFormat.find(item => item.id === 'protein')?.amount).toBe('0')
    })

    it('should parse numeric values from unit strings', () => {
      const nutritionWithUnits: NutritionInformation = {
        '@type': 'NutritionInformation',
        calories: '250 kcal',
        fatContent: '10.5g',
        sodiumContent: '400mg',
        proteinContent: '15.25g'
      }

      const legacyFormat = convertToLegacyFormat(nutritionWithUnits)
      
      expect(legacyFormat.find(item => item.id === 'calories')?.amount).toBe('250')
      expect(legacyFormat.find(item => item.id === 'total_fat')?.amount).toBe('10.5')
      expect(legacyFormat.find(item => item.id === 'sodium')?.amount).toBe('400')
      expect(legacyFormat.find(item => item.id === 'protein')?.amount).toBe('15.25')
    })
  })

  describe('normalizeIngredients', () => {
    it('should normalize ingredient strings for better API matching', () => {
      const rawIngredients = [
        '2 cups all-purpose flour',
        '1 tsp vanilla extract (pure)',
        '3 large eggs, beaten',
        '1/2 cup butter, melted',
        '   ',
        '1. Salt to taste'
      ]

      const normalized = normalizeIngredients(rawIngredients)

      expect(normalized).toEqual([
        'all-purpose flour',
        'vanilla extract',
        'large eggs',
        'butter',
        'Salt to taste'
      ])
    })

    it('should handle empty and malformed ingredients', () => {
      const rawIngredients = [
        '',
        '   ',
        '2 cups flour',
        null as any,
        undefined as any,
        'salt'
      ]

      const normalized = normalizeIngredients(rawIngredients.filter(Boolean))

      expect(normalized).toEqual([
        'flour',
        'salt'
      ])
    })

    it('should remove parenthetical notes and descriptions', () => {
      const rawIngredients = [
        '2 cups flour (sifted)',
        '1 cup sugar (granulated, white)',
        '3 eggs (room temperature)',
        'vanilla extract (pure vanilla, not imitation)'
      ]

      const normalized = normalizeIngredients(rawIngredients)

      expect(normalized).toEqual([
        'flour',
        'sugar',
        'eggs',
        'vanilla extract'
      ])
    })
  })

  describe('calculateNutritionFromAPINinjasData', () => {
    it('should calculate nutrition totals from API Ninjas data', () => {
      const apiNinjasData: APINinjasNutrientResponse[] = [
        {
          name: 'flour',
          calories: 455,
          serving_size_g: 125,
          fat_total_g: 1.2,
          fat_saturated_g: 0.2,
          protein_g: 13,
          sodium_mg: 2,
          potassium_mg: 134,
          cholesterol_mg: 0,
          carbohydrates_total_g: 95,
          fiber_g: 3.4,
          sugar_g: 0.3
        },
        {
          name: 'sugar',
          calories: 387,
          serving_size_g: 100,
          fat_total_g: 0,
          fat_saturated_g: 0,
          protein_g: 0,
          sodium_mg: 1,
          potassium_mg: 2,
          cholesterol_mg: 0,
          carbohydrates_total_g: 100,
          fiber_g: 0,
          sugar_g: 100
        }
      ]

      const result = calculateNutritionFromAPINinjasData(apiNinjasData, 12)

      expect(result).toEqual(expect.arrayContaining([
        { id: 'calories', amount: '70' },
        { id: 'total_fat', amount: '0.1', unit: 'g' },
        { id: 'carbohydrates', amount: '16.25', unit: 'g' },
        { id: 'protein', amount: '1.08', unit: 'g' },
        { id: 'source', amount: 'API Ninjas' }
      ]))
    })

    it('should handle empty nutrition data', () => {
      const result = calculateNutritionFromAPINinjasData([], 1)

      expect(result).toEqual(expect.arrayContaining([
        { id: 'calories', amount: '0' },
        { id: 'total_fat', amount: '0', unit: 'g' },
        { id: 'protein', amount: '0', unit: 'g' }
      ]))
    })

    it('should calculate unsaturated fat correctly', () => {
      const apiNinjasData: APINinjasNutrientResponse[] = [
        {
          name: 'olive oil',
          calories: 884,
          serving_size_g: 100,
          fat_total_g: 100,
          fat_saturated_g: 14,
          protein_g: 0,
          sodium_mg: 2,
          potassium_mg: 1,
          cholesterol_mg: 0,
          carbohydrates_total_g: 0,
          fiber_g: 0,
          sugar_g: 0
        }
      ]

      const result = calculateNutritionFromAPINinjasData(apiNinjasData, 10)
      const unsaturatedFat = result.find(item => item.id === 'unsaturated_fat')
      
      expect(unsaturatedFat?.amount).toBe('8.6') // 10g total - 1.4g saturated = 8.6g unsaturated
    })
  })

  describe('Sample Recipe Test Cases', () => {
    it('should handle a chocolate chip cookie recipe', async () => {
      const mockResponse = {
        nutrition: [
          { id: 'calories', amount: '320' },
          { id: 'carbohydrates', amount: '45', unit: 'g' },
          { id: 'total_fat', amount: '14', unit: 'g' },
          { id: 'protein', amount: '4', unit: 'g' },
          { id: 'sodium', amount: '200', unit: 'mg' },
          { id: 'fiber', amount: '2', unit: 'g' },
          { id: 'sugar', amount: '25', unit: 'g' },
          { id: 'source', amount: 'API Ninjas' },
          { id: 'serving_size', amount: '1' }
        ] as LegacyNutritionItem[],
        ingredientsNotFound: [],
        ingredientsProcessed: [
          '2 cups all-purpose flour',
          '1 cup brown sugar',
          '1/2 cup butter',
          '2 eggs',
          '1 cup chocolate chips'
        ]
      }

      mockFetch.mockResolvedValue(mockResponse)

      const result = await calculateNutrition({
        ingredients: [
          '2 cups all-purpose flour',
          '1 cup brown sugar',
          '1/2 cup butter',
          '2 eggs',
          '1 cup chocolate chips'
        ],
        servings: 24
      })

      expect(Array.isArray(result.nutrition)).toBe(true)
      expect(result.ingredientsProcessed).toHaveLength(5)
      expect(result.ingredientsNotFound).toHaveLength(0)
    })

    it('should handle a pasta recipe with some unknown ingredients', async () => {
      const mockResponse = {
        nutrition: [
          { id: 'calories', amount: '400' },
          { id: 'carbohydrates', amount: '60', unit: 'g' },
          { id: 'total_fat', amount: '12', unit: 'g' },
          { id: 'protein', amount: '16', unit: 'g' },
          { id: 'sodium', amount: '800', unit: 'mg' },
          { id: 'source', amount: 'API Ninjas' }
        ] as LegacyNutritionItem[],
        ingredientsNotFound: ['artisanal truffle oil'],
        ingredientsProcessed: [
          '1 lb pasta',
          '2 cups tomato sauce',
          '1 cup parmesan cheese'
        ]
      }

      mockFetch.mockResolvedValue(mockResponse)

      const result = await calculateNutrition({
        ingredients: [
          '1 lb pasta (penne)',
          '2 cups tomato sauce',
          '1 cup parmesan cheese (grated)',
          '2 tbsp artisanal truffle oil'
        ],
        servings: 6
      })

      expect(result.ingredientsNotFound).toContain('artisanal truffle oil')
      expect(result.ingredientsProcessed).toHaveLength(3)
    })
  })
})