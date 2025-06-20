import { describe, it, expect } from 'vitest'
import type {
  Recipe,
  HowTo,
  FAQ,
  ItemList,
  Supply,
  Tool,
  Step,
  StructuredDataSchema
} from '~/types/schemas'

describe('Schema Types', () => {
  describe('Shared Components', () => {
    it('should create valid Supply with required fields', () => {
      const supply: Supply = {
        '@type': 'HowToSupply',
        name: 'Flour'
      }
      
      expect(supply['@type']).toBe('HowToSupply')
      expect(supply.name).toBe('Flour')
    })

    it('should create valid Supply with optional fields', () => {
      const supply: Supply = {
        '@type': 'HowToSupply',
        name: 'Flour',
        quantity: 2,
        unit: 'cups'
      }
      
      expect(supply.quantity).toBe(2)
      expect(supply.unit).toBe('cups')
    })

    it('should create valid Tool', () => {
      const tool: Tool = {
        '@type': 'HowToTool',
        name: 'Mixing bowl',
        requiredQuantity: 1
      }
      
      expect(tool['@type']).toBe('HowToTool')
      expect(tool.name).toBe('Mixing bowl')
      expect(tool.requiredQuantity).toBe(1)
    })

    it('should create valid Step', () => {
      const step: Step = {
        '@type': 'HowToStep',
        name: 'Mix ingredients',
        text: 'Combine all dry ingredients in a large bowl'
      }
      
      expect(step['@type']).toBe('HowToStep')
      expect(step.name).toBe('Mix ingredients')
      expect(step.text).toBe('Combine all dry ingredients in a large bowl')
    })
  })

  describe('Recipe Schema', () => {
    it('should create valid minimal Recipe', () => {
      const recipe: Recipe = {
        '@context': 'https://schema.org',
        '@type': 'Recipe',
        name: 'Chocolate Chip Cookies',
        description: 'Delicious homemade cookies',
        image: 'https://example.com/cookies.jpg',
        author: {
          '@type': 'Person',
          name: 'John Doe'
        },
        supply: [
          {
            '@type': 'HowToSupply',
            name: 'Flour',
            quantity: 2,
            unit: 'cups'
          }
        ],
        recipeInstructions: [
          {
            '@type': 'HowToStep',
            text: 'Mix all ingredients'
          }
        ]
      }
      
      expect(recipe['@context']).toBe('https://schema.org')
      expect(recipe['@type']).toBe('Recipe')
      expect(recipe.name).toBe('Chocolate Chip Cookies')
      expect(recipe.supply).toHaveLength(1)
      expect(recipe.recipeInstructions).toHaveLength(1)
    })

    it('should create Recipe with all optional fields', () => {
      const recipe: Recipe = {
        '@context': 'https://schema.org',
        '@type': 'Recipe',
        name: 'Chocolate Chip Cookies',
        description: 'Delicious homemade cookies',
        image: 'https://example.com/cookies.jpg',
        author: {
          '@type': 'Person',
          name: 'John Doe'
        },
        datePublished: '2025-06-20',
        prepTime: 'PT15M',
        cookTime: 'PT10M',
        totalTime: 'PT25M',
        recipeCategory: ['Dessert'],
        recipeCuisine: ['American'],
        recipeYield: 24,
        supply: [
          {
            '@type': 'HowToSupply',
            name: 'Flour',
            quantity: 2,
            unit: 'cups'
          }
        ],
        tool: [
          {
            '@type': 'HowToTool',
            name: 'Mixing bowl'
          }
        ],
        recipeInstructions: [
          {
            '@type': 'HowToStep',
            text: 'Mix all ingredients'
          }
        ],
        keywords: 'cookies, dessert, baking'
      }
      
      expect(recipe.prepTime).toBe('PT15M')
      expect(recipe.cookTime).toBe('PT10M')
      expect(recipe.totalTime).toBe('PT25M')
      expect(recipe.recipeCategory).toEqual(['Dessert'])
      expect(recipe.recipeCuisine).toEqual(['American'])
      expect(recipe.recipeYield).toBe(24)
      expect(recipe.tool).toHaveLength(1)
      expect(recipe.keywords).toBe('cookies, dessert, baking')
    })
  })

  describe('HowTo Schema', () => {
    it('should create valid minimal HowTo', () => {
      const howTo: HowTo = {
        '@context': 'https://schema.org',
        '@type': 'HowTo',
        name: 'How to Change a Tire',
        description: 'Step-by-step guide to changing a car tire',
        step: [
          {
            '@type': 'HowToStep',
            text: 'Park on level ground'
          }
        ]
      }
      
      expect(howTo['@context']).toBe('https://schema.org')
      expect(howTo['@type']).toBe('HowTo')
      expect(howTo.name).toBe('How to Change a Tire')
      expect(howTo.step).toHaveLength(1)
    })

    it('should create HowTo with shared components', () => {
      const howTo: HowTo = {
        '@context': 'https://schema.org',
        '@type': 'HowTo',
        name: 'How to Change a Tire',
        description: 'Step-by-step guide to changing a car tire',
        supply: [
          {
            '@type': 'HowToSupply',
            name: 'Spare tire',
            quantity: 1
          }
        ],
        tool: [
          {
            '@type': 'HowToTool',
            name: 'Jack',
            requiredQuantity: 1
          }
        ],
        step: [
          {
            '@type': 'HowToStep',
            name: 'Setup',
            text: 'Park on level ground and engage parking brake'
          }
        ],
        totalTime: 'PT30M'
      }
      
      expect(howTo.supply).toHaveLength(1)
      expect(howTo.tool).toHaveLength(1)
      expect(howTo.totalTime).toBe('PT30M')
      expect(howTo.supply![0].name).toBe('Spare tire')
      expect(howTo.tool![0].name).toBe('Jack')
    })
  })

  describe('FAQ Schema', () => {
    it('should create valid FAQ', () => {
      const faq: FAQ = {
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        name: 'Cooking FAQ',
        description: 'Frequently asked questions about cooking',
        mainEntity: [
          {
            '@type': 'Question',
            name: 'How long should I cook pasta?',
            acceptedAnswer: {
              '@type': 'Answer',
              text: 'Cook pasta for 8-12 minutes, depending on the type'
            }
          }
        ]
      }
      
      expect(faq['@context']).toBe('https://schema.org')
      expect(faq['@type']).toBe('FAQPage')
      expect(faq.mainEntity).toHaveLength(1)
      expect(faq.mainEntity[0]['@type']).toBe('Question')
      expect(faq.mainEntity[0].acceptedAnswer['@type']).toBe('Answer')
    })

    it('should create minimal FAQ', () => {
      const faq: FAQ = {
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: [
          {
            '@type': 'Question',
            name: 'What is Schema.org?',
            acceptedAnswer: {
              '@type': 'Answer',
              text: 'Schema.org is a collaborative vocabulary for structured data'
            }
          }
        ]
      }
      
      expect(faq.mainEntity).toHaveLength(1)
      expect(faq.name).toBeUndefined()
      expect(faq.description).toBeUndefined()
    })
  })

  describe('ItemList Schema', () => {
    it('should create valid ItemList', () => {
      const list: ItemList = {
        '@context': 'https://schema.org',
        '@type': 'ItemList',
        name: 'Best Cooking Tools',
        description: 'A curated list of essential cooking tools',
        numberOfItems: 3,
        itemListOrder: 'ascending',
        itemListElement: [
          {
            '@type': 'ListItem',
            position: 1,
            name: 'Chef\'s Knife',
            description: 'Essential for food preparation'
          },
          {
            '@type': 'ListItem',
            position: 2,
            name: 'Cutting Board',
            description: 'Protects countertops and knives'
          },
          {
            '@type': 'ListItem',
            position: 3,
            name: 'Cast Iron Skillet',
            description: 'Versatile cooking pan'
          }
        ]
      }
      
      expect(list['@context']).toBe('https://schema.org')
      expect(list['@type']).toBe('ItemList')
      expect(list.name).toBe('Best Cooking Tools')
      expect(list.numberOfItems).toBe(3)
      expect(list.itemListOrder).toBe('ascending')
      expect(list.itemListElement).toHaveLength(3)
      expect(list.itemListElement[0].position).toBe(1)
      expect(list.itemListElement[0]['@type']).toBe('ListItem')
    })

    it('should create minimal ItemList', () => {
      const list: ItemList = {
        '@context': 'https://schema.org',
        '@type': 'ItemList',
        name: 'Simple List',
        itemListElement: [
          {
            '@type': 'ListItem',
            position: 1,
            name: 'Item 1'
          }
        ]
      }
      
      expect(list.itemListElement).toHaveLength(1)
      expect(list.description).toBeUndefined()
      expect(list.numberOfItems).toBeUndefined()
      expect(list.itemListOrder).toBeUndefined()
    })
  })

  describe('Union Type', () => {
    it('should accept all schema types in union', () => {
      const schemas: StructuredDataSchema[] = [
        {
          '@context': 'https://schema.org',
          '@type': 'Recipe',
          name: 'Test Recipe',
          description: 'Test',
          image: 'test.jpg',
          author: { '@type': 'Person', name: 'Test' },
          supply: [],
          recipeInstructions: []
        },
        {
          '@context': 'https://schema.org',
          '@type': 'HowTo',
          name: 'Test HowTo',
          description: 'Test',
          step: []
        },
        {
          '@context': 'https://schema.org',
          '@type': 'FAQPage',
          mainEntity: []
        },
        {
          '@context': 'https://schema.org',
          '@type': 'ItemList',
          name: 'Test List',
          itemListElement: []
        }
      ]
      
      expect(schemas).toHaveLength(4)
      expect(schemas[0]['@type']).toBe('Recipe')
      expect(schemas[1]['@type']).toBe('HowTo')
      expect(schemas[2]['@type']).toBe('FAQPage')
      expect(schemas[3]['@type']).toBe('ItemList')
    })
  })
})