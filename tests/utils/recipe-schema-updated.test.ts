import { describe, it, expect } from 'vitest'
import { generateRecipeJsonLd, validateJsonLd } from '~/utils/json-ld-generator'
import type { RecipeFormData } from '~/types/schemas'

describe('Updated Recipe Schema - JSON-LD Generator', () => {
  const baseRecipeFormData: RecipeFormData = {
    name: 'Test Recipe',
    description: 'A test recipe for the updated schema',
    author: 'Test Chef',
    authorType: 'Person',
    ingredients: [],
    instructions: []
  }

  describe('Standard Schema.org Recipe format', () => {
    it('should generate recipe with recipeIngredient array instead of supply objects', () => {
      const formData: RecipeFormData = {
        ...baseRecipeFormData,
        ingredients: [
          '2 cups all-purpose flour',
          '1 teaspoon salt',
          '1/2 cup water'
        ],
        instructions: [
          { step: 'Mix ingredients together' }
        ]
      }

      const result = generateRecipeJsonLd(formData)

      expect(result['@type']).toBe('Recipe')
      expect(result.recipeIngredient).toEqual([
        '2 cups all-purpose flour',
        '1 teaspoon salt',
        '1/2 cup water'
      ])
      expect(result).not.toHaveProperty('supply')
    })

    it('should generate recipe with HowToSection grouped instructions', () => {
      const formData: RecipeFormData = {
        ...baseRecipeFormData,
        ingredients: ['2 cups flour'],
        instructions: [
          { section: 'Prep Work', step: 'Preheat oven to 350°F' },
          { section: 'Prep Work', step: 'Grease baking pan' },
          { section: 'Mix Batter', step: 'Combine dry ingredients' },
          { section: 'Mix Batter', step: 'Add wet ingredients' },
          { step: 'Bake for 30 minutes' } // No section - should be ungrouped
        ]
      }

      const result = generateRecipeJsonLd(formData)

      expect(result.recipeInstructions).toHaveLength(3) // 2 sections + 1 ungrouped step
      
      // Find the sections
      const prepSection = result.recipeInstructions.find(
        item => item['@type'] === 'HowToSection' && item.name === 'Prep Work'
      )
      const mixSection = result.recipeInstructions.find(
        item => item['@type'] === 'HowToSection' && item.name === 'Mix Batter'
      )
      const ungroupedStep = result.recipeInstructions.find(
        item => item['@type'] === 'HowToStep'
      )

      expect(prepSection).toBeDefined()
      expect(prepSection!.itemListElement).toHaveLength(2)
      expect(prepSection!.itemListElement[0].text).toBe('Preheat oven to 350°F')

      expect(mixSection).toBeDefined()
      expect(mixSection!.itemListElement).toHaveLength(2)
      expect(mixSection!.itemListElement[0].text).toBe('Combine dry ingredients')

      expect(ungroupedStep).toBeDefined()
      expect(ungroupedStep!.text).toBe('Bake for 30 minutes')
    })

    it('should generate recipeYield in array format', () => {
      const formData: RecipeFormData = {
        ...baseRecipeFormData,
        ingredients: ['1 cup flour'],
        instructions: [{ step: 'Mix' }],
        yield: '12',
        yieldDescription: '12 servings'
      }

      const result = generateRecipeJsonLd(formData)

      expect(result.recipeYield).toEqual(['12', '12 servings'])
    })

    it('should generate recipeYield with single value when description matches yield', () => {
      const formData: RecipeFormData = {
        ...baseRecipeFormData,
        ingredients: ['1 cup flour'],
        instructions: [{ step: 'Mix' }],
        yield: '4',
        yieldDescription: '4' // Same as yield
      }

      const result = generateRecipeJsonLd(formData)

      expect(result.recipeYield).toEqual(['4'])
    })

    it('should handle image as string array format', () => {
      const formData: RecipeFormData = {
        ...baseRecipeFormData,
        ingredients: ['1 cup flour'],
        instructions: [{ step: 'Mix' }],
        image: 'https://example.com/recipe.jpg'
      }

      const result = generateRecipeJsonLd(formData)

      expect(result.image).toEqual(['https://example.com/recipe.jpg'])
    })

    it('should not include tools in Recipe JSON-LD (Schema.org standard)', () => {
      const formData: RecipeFormData = {
        ...baseRecipeFormData,
        ingredients: ['1 cup flour'],
        instructions: [{ step: 'Mix' }]
      }

      const result = generateRecipeJsonLd(formData)

      expect(result).not.toHaveProperty('tool')
      expect(result).not.toHaveProperty('supply')
    })

    it('should generate complex recipe matching Schema.org example format', () => {
      const formData: RecipeFormData = {
        name: 'Chocolate Chip Cookies',
        description: 'Classic homemade chocolate chip cookies',
        author: 'Baker Jane',
        authorType: 'Person',
        authorUrl: 'https://bakerjane.com',
        prepTime: '15',
        cookTime: '12',
        yield: '24',
        yieldDescription: '24 cookies',
        category: ['Dessert', 'Cookies'],
        cuisine: ['American'],
        image: 'https://example.com/cookies.jpg',
        ingredients: [
          '2 1/4 cups all-purpose flour',
          '1 teaspoon baking soda',
          '1 teaspoon salt',
          '1 cup butter, softened',
          '3/4 cup granulated sugar',
          '2 large eggs',
          '2 teaspoons vanilla extract',
          '2 cups chocolate chips'
        ],
        instructions: [
          { section: 'Prep', step: 'Preheat oven to 375°F' },
          { section: 'Prep', step: 'Line baking sheets with parchment paper' },
          { section: 'Mix Dough', step: 'Cream butter and sugars until fluffy' },
          { section: 'Mix Dough', step: 'Beat in eggs and vanilla' },
          { section: 'Mix Dough', step: 'Gradually mix in flour mixture' },
          { section: 'Mix Dough', step: 'Stir in chocolate chips' },
          { section: 'Bake', step: 'Drop rounded spoonfuls onto baking sheets' },
          { section: 'Bake', step: 'Bake 9-11 minutes until golden brown' },
          { step: 'Cool on baking sheets for 2 minutes before removing' }
        ],
        reviews: [
          {
            author: 'Cookie Lover',
            authorType: 'Person',
            rating: 5,
            reviewText: 'Best cookies ever!',
            reviewTitle: 'Amazing!',
            datePublished: '2024-01-15'
          }
        ],
        nutrition: {
          servingSize: '1 cookie',
          calories: '150 kcal',
          fatContent: '7 g',
          carbohydrateContent: '21 g',
          proteinContent: '2 g'
        },
        keywords: 'chocolate chip cookies, homemade, dessert'
      }

      const result = generateRecipeJsonLd(formData)

      // Verify Schema.org standard format
      expect(result['@context']).toBe('https://schema.org')
      expect(result['@type']).toBe('Recipe')
      expect(result.name).toBe('Chocolate Chip Cookies')
      expect(result.description).toBe('Classic homemade chocolate chip cookies')
      expect(result.author).toEqual({
        '@type': 'Person',
        name: 'Baker Jane',
        url: 'https://bakerjane.com'
      })
      
      // Verify ingredients format
      expect(result.recipeIngredient).toHaveLength(8)
      expect(result.recipeIngredient[0]).toBe('2 1/4 cups all-purpose flour')
      
      // Verify instructions format with sections
      expect(result.recipeInstructions).toHaveLength(4) // 3 sections + 1 ungrouped
      const prepSection = result.recipeInstructions.find(
        item => item['@type'] === 'HowToSection' && item.name === 'Prep'
      )
      expect(prepSection!.itemListElement).toHaveLength(2)
      
      // Verify yield format
      expect(result.recipeYield).toEqual(['24', '24 cookies'])
      
      // Verify other properties
      expect(result.recipeCategory).toEqual(['Dessert', 'Cookies'])
      expect(result.recipeCuisine).toEqual(['American'])
      expect(result.prepTime).toBe('PT15M')
      expect(result.cookTime).toBe('PT12M')
      expect(result.totalTime).toBe('PT27M')
      expect(result.image).toEqual(['https://example.com/cookies.jpg'])
      expect(result.review).toHaveLength(1)
      expect(result.nutrition!.servingSize).toBe('1 cookie')
      expect(result.keywords).toBe('chocolate chip cookies, homemade, dessert')
    })
  })

  describe('Validation for updated Recipe schema', () => {
    it('should validate recipe with new required fields', () => {
      const validRecipe = generateRecipeJsonLd({
        ...baseRecipeFormData,
        ingredients: ['1 cup flour'],
        instructions: [{ step: 'Mix ingredients' }]
      })

      const validation = validateJsonLd(validRecipe)
      expect(validation.isValid).toBe(true)
      expect(validation.errors).toHaveLength(0)
    })

    it('should fail validation when recipeIngredient is missing', () => {
      const invalidRecipe = {
        '@context': 'https://schema.org' as const,
        '@type': 'Recipe' as const,
        name: 'Test Recipe',
        description: 'Test description',
        author: { '@type': 'Person' as const, name: 'Test Author' },
        recipeInstructions: [{ '@type': 'HowToStep' as const, text: 'Mix' }]
        // Missing recipeIngredient
      }

      const validation = validateJsonLd(invalidRecipe)
      expect(validation.isValid).toBe(false)
      expect(validation.errors).toContain('Missing required field: recipeIngredient')
    })

    it('should fail validation when recipeInstructions is missing', () => {
      const invalidRecipe = {
        '@context': 'https://schema.org' as const,
        '@type': 'Recipe' as const,
        name: 'Test Recipe',
        description: 'Test description',
        author: { '@type': 'Person' as const, name: 'Test Author' },
        recipeIngredient: ['1 cup flour']
        // Missing recipeInstructions
      }

      const validation = validateJsonLd(invalidRecipe)
      expect(validation.isValid).toBe(false)
      expect(validation.errors).toContain('Missing required field: recipeInstructions')
    })

    it('should fail validation when recipeIngredient is empty array', () => {
      const invalidRecipe = {
        '@context': 'https://schema.org' as const,
        '@type': 'Recipe' as const,
        name: 'Test Recipe',
        description: 'Test description',
        author: { '@type': 'Person' as const, name: 'Test Author' },
        recipeIngredient: [], // Empty array
        recipeInstructions: [{ '@type': 'HowToStep' as const, text: 'Mix' }]
      }

      const validation = validateJsonLd(invalidRecipe)
      expect(validation.isValid).toBe(false)
      expect(validation.errors).toContain('recipeIngredient must be a non-empty array')
    })
  })

  describe('Edge cases and optional fields', () => {
    it('should handle recipe with no sections (all ungrouped steps)', () => {
      const formData: RecipeFormData = {
        ...baseRecipeFormData,
        ingredients: ['1 cup flour'],
        instructions: [
          { step: 'Step 1' },
          { step: 'Step 2' },
          { step: 'Step 3' }
        ]
      }

      const result = generateRecipeJsonLd(formData)

      expect(result.recipeInstructions).toHaveLength(3)
      result.recipeInstructions.forEach(instruction => {
        expect(instruction['@type']).toBe('HowToStep')
      })
    })

    it('should handle recipe with only yield but no description', () => {
      const formData: RecipeFormData = {
        ...baseRecipeFormData,
        ingredients: ['1 cup flour'],
        instructions: [{ step: 'Mix' }],
        yield: '6'
        // No yieldDescription
      }

      const result = generateRecipeJsonLd(formData)

      expect(result.recipeYield).toEqual(['6'])
    })

    it('should handle recipe with no image', () => {
      const formData: RecipeFormData = {
        ...baseRecipeFormData,
        ingredients: ['1 cup flour'],
        instructions: [{ step: 'Mix' }]
        // No image
      }

      const result = generateRecipeJsonLd(formData)

      expect(result).not.toHaveProperty('image')
    })

    it('should handle instruction steps with names and images', () => {
      const formData: RecipeFormData = {
        ...baseRecipeFormData,
        ingredients: ['1 cup flour'],
        instructions: [
          { 
            section: 'Prep',
            name: 'Preheat Oven',
            step: 'Preheat your oven to 350°F',
            image: 'oven.jpg'
          }
        ]
      }

      const result = generateRecipeJsonLd(formData)

      const prepSection = result.recipeInstructions.find(
        item => item['@type'] === 'HowToSection' && item.name === 'Prep'
      )
      expect(prepSection!.itemListElement[0]).toEqual({
        '@type': 'HowToStep',
        name: 'Preheat Oven',
        text: 'Preheat your oven to 350°F',
        image: {
          '@type': 'ImageObject',
          url: 'oven.jpg'
        }
      })
    })
  })
})