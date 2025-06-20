import { describe, it, expect } from 'vitest'
import type {
  Recipe,
  HowTo,
  FAQ,
  ItemList,
  RecipeFormData,
  HowToFormData,
  FAQFormData,
  ListFormData
} from '~/types/schemas'

// Import the generators we'll create
import {
  generateRecipeJsonLd,
  generateHowToJsonLd,
  generateFAQJsonLd,
  generateListJsonLd,
  validateJsonLd,
  formatDuration,
  formatImageObject
} from '~/utils/json-ld-generator'

describe('JSON-LD Generator Utilities', () => {
  describe('Recipe Generator', () => {
    it('should generate valid Recipe JSON-LD from form data', () => {
      const formData: RecipeFormData = {
        name: 'Chocolate Chip Cookies',
        description: 'Delicious homemade cookies',
        image: 'https://example.com/cookies.jpg',
        author: 'John Doe',
        authorType: 'Person',
        authorUrl: 'https://johndoe.com',
        prepTime: '15',
        cookTime: '10',
        yield: '24',
        yieldDescription: '24 cookies',
        category: ['Dessert'],
        cuisine: ['American'],
        ingredients: [
          '2 cups all-purpose flour',
          '1 cup granulated sugar'
        ],
        instructions: [
          { name: 'Mix', step: 'Combine dry ingredients', image: 'step1.jpg' },
          { step: 'Bake for 10 minutes' }
        ],
        keywords: 'cookies, dessert, baking'
      }

      const result = generateRecipeJsonLd(formData)

      expect(result['@context']).toBe('https://schema.org')
      expect(result['@type']).toBe('Recipe')
      expect(result.name).toBe('Chocolate Chip Cookies')
      expect(result.description).toBe('Delicious homemade cookies')
      expect(result.author).toEqual({
        '@type': 'Person',
        name: 'John Doe',
        url: 'https://johndoe.com'
      })
      expect(result.prepTime).toBe('PT15M')
      expect(result.cookTime).toBe('PT10M')
      expect(result.totalTime).toBe('PT25M')
      expect(result.recipeYield).toEqual(['24', '24 cookies'])
      expect(result.recipeCategory).toEqual(['Dessert'])
      expect(result.recipeCuisine).toEqual(['American'])
      expect(result.recipeIngredient).toHaveLength(2)
      expect(result.recipeIngredient).toEqual([
        '2 cups all-purpose flour',
        '1 cup granulated sugar'
      ])
      expect(result.recipeInstructions).toHaveLength(2)
      expect(result.keywords).toBe('cookies, dessert, baking')
      // Should not have old properties
      expect(result).not.toHaveProperty('supply')
      expect(result).not.toHaveProperty('tool')
    })

    it('should generate minimal Recipe JSON-LD', () => {
      const formData: RecipeFormData = {
        name: 'Simple Recipe',
        description: 'A simple recipe',
        author: 'Jane Doe',
        authorType: 'Person',
        ingredients: [
          '1 cup ingredient'
        ],
        instructions: [
          { step: 'Do something' }
        ]
      }

      const result = generateRecipeJsonLd(formData)

      expect(result.name).toBe('Simple Recipe')
      expect(result.recipeIngredient).toHaveLength(1)
      expect(result.recipeIngredient).toEqual(['1 cup ingredient'])
      expect(result.recipeInstructions).toHaveLength(1)
      expect(result.prepTime).toBeUndefined()
      expect(result.cookTime).toBeUndefined()
      expect(result.totalTime).toBeUndefined()
      expect(result).not.toHaveProperty('supply')
    })
  })

  describe('HowTo Generator', () => {
    it('should generate valid HowTo JSON-LD from form data', () => {
      const formData: HowToFormData = {
        name: 'How to Change a Tire',
        description: 'Step-by-step guide to changing a car tire',
        image: 'https://example.com/tire.jpg',
        estimatedCost: 50,
        currency: 'USD',
        supplies: [
          { name: 'Spare tire', quantity: 1 },
          { name: 'Lug nuts', quantity: 5 }
        ],
        tools: [
          { name: 'Jack', quantity: 1 },
          { name: 'Lug wrench', quantity: 1 }
        ],
        steps: [
          { name: 'Setup', instruction: 'Park on level ground', image: 'step1.jpg' },
          { instruction: 'Loosen lug nuts' }
        ],
        totalTime: '30'
      }

      const result = generateHowToJsonLd(formData)

      expect(result['@context']).toBe('https://schema.org')
      expect(result['@type']).toBe('HowTo')
      expect(result.name).toBe('How to Change a Tire')
      expect(result.estimatedCost).toEqual({
        '@type': 'MonetaryAmount',
        currency: 'USD',
        value: 50
      })
      expect(result.supply).toHaveLength(2)
      expect(result.tool).toHaveLength(2)
      expect(result.step).toHaveLength(2)
      expect(result.totalTime).toBe('PT30M')
    })
  })

  describe('FAQ Generator', () => {
    it('should generate valid FAQ JSON-LD from form data', () => {
      const formData: FAQFormData = {
        name: 'Cooking FAQ',
        description: 'Common cooking questions',
        questions: [
          {
            question: 'How long should I cook pasta?',
            answer: 'Cook pasta for 8-12 minutes, depending on the type'
          },
          {
            question: 'What temperature for baking?',
            answer: 'Most cookies bake at 350°F (175°C)'
          }
        ]
      }

      const result = generateFAQJsonLd(formData)

      expect(result['@context']).toBe('https://schema.org')
      expect(result['@type']).toBe('FAQPage')
      expect(result.name).toBe('Cooking FAQ')
      expect(result.description).toBe('Common cooking questions')
      expect(result.mainEntity).toHaveLength(2)
      expect(result.mainEntity[0]['@type']).toBe('Question')
      expect(result.mainEntity[0].acceptedAnswer['@type']).toBe('Answer')
    })
  })

  describe('List Generator', () => {
    it('should generate valid ItemList JSON-LD from form data', () => {
      const formData: ListFormData = {
        name: 'Best Cooking Tools',
        description: 'Essential tools for every kitchen',
        itemListOrder: 'ascending',
        items: [
          { name: 'Chef\'s Knife', description: 'Essential for prep' },
          { name: 'Cutting Board', description: 'Protects counters', url: 'https://example.com/board' }
        ]
      }

      const result = generateListJsonLd(formData)

      expect(result['@context']).toBe('https://schema.org')
      expect(result['@type']).toBe('ItemList')
      expect(result.name).toBe('Best Cooking Tools')
      expect(result.numberOfItems).toBe(2)
      expect(result.itemListOrder).toBe('ascending')
      expect(result.itemListElement).toHaveLength(2)
      expect(result.itemListElement[0].position).toBe(1)
      expect(result.itemListElement[1].position).toBe(2)
    })
  })

  describe('Utility Functions', () => {
    describe('formatDuration', () => {
      it('should format minutes to ISO 8601 duration', () => {
        expect(formatDuration(15)).toBe('PT15M')
        expect(formatDuration(90)).toBe('PT1H30M')
        expect(formatDuration(0)).toBe('PT0M')
      })

      it('should return undefined for invalid input', () => {
        expect(formatDuration(undefined)).toBeUndefined()
        expect(formatDuration('')).toBeUndefined()
        expect(formatDuration('invalid')).toBeUndefined()
      })
    })

    describe('formatImageObject', () => {
      it('should create ImageObject from string URL', () => {
        const result = formatImageObject('https://example.com/image.jpg')
        expect(result).toEqual({
          '@type': 'ImageObject',
          url: 'https://example.com/image.jpg'
        })
      })

      it('should return string URL as-is', () => {
        const result = formatImageObject('https://example.com/image.jpg', false)
        expect(result).toBe('https://example.com/image.jpg')
      })

      it('should handle File objects', () => {
        const file = new File([''], 'test.jpg', { type: 'image/jpeg' })
        const result = formatImageObject(file)
        expect(result).toEqual({
          '@type': 'ImageObject',
          url: 'test.jpg'
        })
      })
    })

    describe('validateJsonLd', () => {
      it('should validate complete Recipe schema', () => {
        const recipe: Recipe = {
          '@context': 'https://schema.org',
          '@type': 'Recipe',
          name: 'Test Recipe',
          description: 'Test',
          image: ['test.jpg'],
          author: { '@type': 'Person', name: 'Test' },
          recipeIngredient: ['1 cup test ingredient'],
          recipeInstructions: [{ '@type': 'HowToStep', text: 'Test step' }]
        }

        const result = validateJsonLd(recipe)
        expect(result.isValid).toBe(true)
        expect(result.errors).toEqual([])
      })

      it('should detect missing required fields', () => {
        const invalidRecipe = {
          '@context': 'https://schema.org',
          '@type': 'Recipe'
          // Missing required fields
        } as any

        const result = validateJsonLd(invalidRecipe)
        expect(result.isValid).toBe(false)
        expect(result.errors).toContain('Missing required field: name')
      })

      it('should detect invalid duration format', () => {
        const recipe: Recipe = {
          '@context': 'https://schema.org',
          '@type': 'Recipe',
          name: 'Test Recipe',
          description: 'Test',
          image: 'test.jpg',
          author: { '@type': 'Person', name: 'Test' },
          supply: [],
          recipeInstructions: [],
          prepTime: 'invalid-duration' // Invalid format
        }

        const result = validateJsonLd(recipe)
        expect(result.isValid).toBe(false)
        expect(result.errors).toContain('Invalid duration format: prepTime')
      })
    })
  })
})