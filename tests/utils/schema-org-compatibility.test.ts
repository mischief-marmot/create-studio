import { describe, it, expect } from 'vitest'
import { generateRecipeJsonLd } from '~/utils/json-ld-generator'
import type { RecipeFormData } from '~/types/schemas'

describe('Schema.org Compatibility Test', () => {
  it('should generate Recipe JSON-LD that matches Schema.org standard format', () => {
    const formData: RecipeFormData = {
      name: 'Soft & Fluffy Dairy-Free Vegan Dinner Rolls Recipe',
      description: 'Please the vegans and dairy-free eaters without disappointing the carnivores. These soft, fluffy, buttery, and melt-in-your-mouth dinner rolls are total crowd-pleasers - no eggs or dairy needed.',
      author: 'Kitchen Treaty',
      authorType: 'Organization',
      prepTime: '110',
      cookTime: '20',
      yield: '20',
      yieldDescription: '20 rolls',
      cuisine: ['American'],
      ingredients: [
        '6 tablespoons + 2 tablespoons vegan butter (divided; I use Earth Balance)',
        '2 cups unsweetened soy milk',
        '1/2 cup water',
        '2 1/4 teaspoons active dry yeast (one packet) (not instant)',
        '1/3 cup granulated sugar',
        '1 1/2 teaspoons salt',
        '5-6 cups all-purpose flour',
        '2-3 teaspoons canola oil (for greasing the pans only - not for the dough!)'
      ],
      instructions: [
        {
          section: 'Make the Dough',
          step: 'Add 6 tablespoons of Earth Balance to a small sauce pan. Set on your stovetop over very low heat, until melted. Add the soy milk and water. Continue heating until the temperature hits about 115 degrees (it will cool off a bit when you add it to the bowl of your stand mixer).'
        },
        {
          section: 'Make the Dough',
          step: 'Pour warmed butter and milk mixture into the bowl of your stand mixer. Add the sugar and stir to combine.'
        },
        {
          section: 'Let the Dough Rise',
          step: 'Rub a little neutral oil (I use canola) in a large bowl and transfer dough to the bowl. A bit will probably stick to your hands but that\'s okay! Let rise until doubled in size, 30 minutes to 1 hour.'
        },
        {
          section: 'Cut the Dough into Rolls',
          step: 'Using a bench scraper or large knife, cut dough into quarters and then cut each quarter into 5 pieces roughly the same size. Don\'t worry if they\'re not exactly equal.'
        },
        {
          section: 'Brush with Butter and Bake',
          step: 'Bake until golden and a thermometer inserted into the center of the rolls registers at about 195 degrees Fahrenheit, 25 to 35 minutes.'
        }
      ],
      reviews: [
        {
          author: 'Tricia',
          authorType: 'Person',
          rating: 5,
          reviewText: 'Bless you for sharing this recipe!!! And your tips about not adding too much flour and expecting the dough to be on the wet side were so helpful.',
          datePublished: '2021-11-27'
        },
        {
          author: 'Food Network',
          authorType: 'Organization',
          rating: 5,
          reviewText: 'Featured recipe of the month!',
          reviewTitle: 'Editor\'s Choice'
        }
      ],
      nutrition: {
        servingSize: '1 roll',
        calories: '175 kcal',
        sugarContent: '4 g',
        sodiumContent: '221 mg',
        fatContent: '5 g',
        saturatedFatContent: '1 g',
        carbohydrateContent: '28 g',
        fiberContent: '1 g',
        proteinContent: '4 g'
      },
      keywords: 'vegan, dairy-free, dinner rolls'
    }

    const result = generateRecipeJsonLd(formData)

    // Verify Schema.org standard structure
    expect(result['@context']).toBe('https://schema.org')
    expect(result['@type']).toBe('Recipe')
    expect(result.name).toBe('Soft & Fluffy Dairy-Free Vegan Dinner Rolls Recipe')
    expect(result.description).toContain('Please the vegans and dairy-free eaters')
    
    // Verify author structure
    expect(result.author).toEqual({
      '@type': 'Organization',
      name: 'Kitchen Treaty'
    })
    
    // Verify time formats (ISO 8601) - our implementation converts to more readable format
    expect(result.prepTime).toBe('PT1H50M') // 110 minutes = 1 hour 50 minutes
    expect(result.cookTime).toBe('PT20M')   // 20 minutes = PT20M
    expect(result.totalTime).toBe('PT2H10M') // 110 + 20 = 130 minutes = 2 hours 10 minutes
    
    // Verify yield format (array)
    expect(result.recipeYield).toEqual(['20', '20 rolls'])
    
    // Verify cuisine format (array)
    expect(result.recipeCuisine).toEqual(['American'])
    
    // Verify ingredients format (string array)
    expect(result.recipeIngredient).toHaveLength(8)
    expect(result.recipeIngredient[0]).toBe('6 tablespoons + 2 tablespoons vegan butter (divided; I use Earth Balance)')
    expect(result.recipeIngredient[7]).toBe('2-3 teaspoons canola oil (for greasing the pans only - not for the dough!)')
    
    // Verify instructions with HowToSection grouping
    expect(result.recipeInstructions).toHaveLength(4) // 4 sections (all steps are grouped)
    
    // Find specific sections
    const doughSection = result.recipeInstructions.find(
      item => item['@type'] === 'HowToSection' && item.name === 'Make the Dough'
    )
    const riseSection = result.recipeInstructions.find(
      item => item['@type'] === 'HowToSection' && item.name === 'Let the Dough Rise'
    )
    const cutSection = result.recipeInstructions.find(
      item => item['@type'] === 'HowToSection' && item.name === 'Cut the Dough into Rolls'
    )
    const bakeSection = result.recipeInstructions.find(
      item => item['@type'] === 'HowToSection' && item.name === 'Brush with Butter and Bake'
    )
    
    expect(doughSection).toBeDefined()
    expect(doughSection!.itemListElement).toHaveLength(2)
    expect(doughSection!.itemListElement[0].text).toContain('Add 6 tablespoons of Earth Balance')
    
    expect(riseSection).toBeDefined()
    expect(riseSection!.itemListElement).toHaveLength(1)
    
    expect(cutSection).toBeDefined()
    expect(cutSection!.itemListElement).toHaveLength(1)
    
    expect(bakeSection).toBeDefined()
    expect(bakeSection!.itemListElement).toHaveLength(1)
    
    // Verify reviews format (array of Review objects)
    expect(result.review).toHaveLength(2)
    expect(result.review![0]).toEqual({
      '@type': 'Review',
      author: {
        '@type': 'Person',
        name: 'Tricia'
      },
      reviewBody: 'Bless you for sharing this recipe!!! And your tips about not adding too much flour and expecting the dough to be on the wet side were so helpful.',
      reviewRating: {
        '@type': 'Rating',
        ratingValue: 5,
        bestRating: 5,
        worstRating: 1
      },
      datePublished: '2021-11-27'
    })
    
    expect(result.review![1]).toEqual({
      '@type': 'Review',
      author: {
        '@type': 'Organization',
        name: 'Food Network'
      },
      reviewBody: 'Featured recipe of the month!',
      reviewRating: {
        '@type': 'Rating',
        ratingValue: 5,
        bestRating: 5,
        worstRating: 1
      },
      name: 'Editor\'s Choice'
    })
    
    // Verify nutrition format
    expect(result.nutrition).toEqual({
      '@type': 'NutritionInformation',
      servingSize: '1 roll',
      calories: '175 kcal',
      sugarContent: '4 g',
      sodiumContent: '221 mg',
      fatContent: '5 g',
      saturatedFatContent: '1 g',
      carbohydrateContent: '28 g',
      fiberContent: '1 g',
      proteinContent: '4 g'
    })
    
    // Verify keywords format
    expect(result.keywords).toBe('vegan, dairy-free, dinner rolls')
    
    // Verify no old properties exist
    expect(result).not.toHaveProperty('supply')
    expect(result).not.toHaveProperty('tool')
    expect(result).not.toHaveProperty('servings')
    
    // Verify image format (should be array when present)
    if (result.image) {
      expect(Array.isArray(result.image)).toBe(true)
    }
  })
  
  it('should validate the generated Recipe schema', () => {
    const formData: RecipeFormData = {
      name: 'Test Recipe',
      description: 'A test recipe',
      author: 'Test Chef',
      authorType: 'Person',
      ingredients: ['1 cup flour', '1 tsp salt'],
      instructions: [
        { section: 'Prep', step: 'Preheat oven' },
        { step: 'Mix ingredients' }
      ]
    }

    const result = generateRecipeJsonLd(formData)
    
    // Should have all required fields for Schema.org Recipe
    expect(result['@context']).toBeDefined()
    expect(result['@type']).toBeDefined()
    expect(result.name).toBeDefined()
    expect(result.description).toBeDefined()
    expect(result.author).toBeDefined()
    expect(result.recipeIngredient).toBeDefined()
    expect(result.recipeInstructions).toBeDefined()
    
    // Should match expected types
    expect(Array.isArray(result.recipeIngredient)).toBe(true)
    expect(Array.isArray(result.recipeInstructions)).toBe(true)
    expect(result.recipeIngredient.length).toBeGreaterThan(0)
    expect(result.recipeInstructions.length).toBeGreaterThan(0)
  })
})