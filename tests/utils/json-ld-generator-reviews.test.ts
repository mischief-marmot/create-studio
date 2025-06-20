import { describe, it, expect } from 'vitest'
import { generateRecipeJsonLd } from '~/utils/json-ld-generator'
import type { RecipeFormData } from '~/types/schemas'

describe('JSON-LD Generator - Review Schema', () => {
  const baseRecipeFormData: RecipeFormData = {
    name: 'Test Recipe',
    description: 'A test recipe',
    author: 'Test Chef',
    authorType: 'Person',
    ingredients: [],
    instructions: []
  }

  describe('createReviews function', () => {
    it('should generate reviews with Person authors', () => {
      const formData: RecipeFormData = {
        ...baseRecipeFormData,
        reviews: [
          {
            author: 'John Doe',
            authorType: 'Person',
            rating: 5,
            reviewText: 'Absolutely delicious! My family loved it.',
            reviewTitle: 'Amazing Recipe',
            datePublished: '2024-01-15'
          },
          {
            author: 'Jane Smith',
            authorType: 'Person',
            rating: 4,
            reviewText: 'Great recipe, easy to follow instructions.'
          }
        ]
      }

      const result = generateRecipeJsonLd(formData)

      expect(result.review).toBeDefined()
      expect(result.review).toHaveLength(2)

      // First review
      expect(result.review![0]).toEqual({
        '@type': 'Review',
        author: {
          '@type': 'Person',
          name: 'John Doe'
        },
        reviewBody: 'Absolutely delicious! My family loved it.',
        reviewRating: {
          '@type': 'Rating',
          ratingValue: 5,
          bestRating: 5,
          worstRating: 1
        },
        name: 'Amazing Recipe',
        datePublished: '2024-01-15'
      })

      // Second review
      expect(result.review![1]).toEqual({
        '@type': 'Review',
        author: {
          '@type': 'Person',
          name: 'Jane Smith'
        },
        reviewBody: 'Great recipe, easy to follow instructions.',
        reviewRating: {
          '@type': 'Rating',
          ratingValue: 4,
          bestRating: 5,
          worstRating: 1
        }
      })
    })

    it('should generate reviews with Organization authors', () => {
      const formData: RecipeFormData = {
        ...baseRecipeFormData,
        reviews: [
          {
            author: 'Food Network',
            authorType: 'Organization',
            rating: 5,
            reviewText: 'Featured recipe of the month!',
            reviewTitle: 'Editor\'s Choice'
          }
        ]
      }

      const result = generateRecipeJsonLd(formData)

      expect(result.review).toBeDefined()
      expect(result.review).toHaveLength(1)
      expect(result.review![0]).toEqual({
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
    })

    it('should handle reviews with different rating values', () => {
      const formData: RecipeFormData = {
        ...baseRecipeFormData,
        reviews: [
          {
            author: 'Reviewer 1',
            authorType: 'Person',
            rating: 1,
            reviewText: 'Needs improvement'
          },
          {
            author: 'Reviewer 2',
            authorType: 'Person',
            rating: 3,
            reviewText: 'Average recipe'
          },
          {
            author: 'Reviewer 3',
            authorType: 'Person',
            rating: 5,
            reviewText: 'Perfect!'
          }
        ]
      }

      const result = generateRecipeJsonLd(formData)

      expect(result.review).toHaveLength(3)
      expect(result.review![0].reviewRating.ratingValue).toBe(1)
      expect(result.review![1].reviewRating.ratingValue).toBe(3)
      expect(result.review![2].reviewRating.ratingValue).toBe(5)

      // Check that all ratings have consistent bestRating and worstRating
      result.review!.forEach(review => {
        expect(review.reviewRating.bestRating).toBe(5)
        expect(review.reviewRating.worstRating).toBe(1)
      })
    })

    it('should handle optional fields correctly', () => {
      const formData: RecipeFormData = {
        ...baseRecipeFormData,
        reviews: [
          {
            author: 'Minimal Reviewer',
            authorType: 'Person',
            rating: 4,
            reviewText: 'Good recipe'
            // No reviewTitle or datePublished
          }
        ]
      }

      const result = generateRecipeJsonLd(formData)

      expect(result.review![0]).toEqual({
        '@type': 'Review',
        author: {
          '@type': 'Person',
          name: 'Minimal Reviewer'
        },
        reviewBody: 'Good recipe',
        reviewRating: {
          '@type': 'Rating',
          ratingValue: 4,
          bestRating: 5,
          worstRating: 1
        }
      })

      // Ensure optional fields are not present
      expect(result.review![0]).not.toHaveProperty('name')
      expect(result.review![0]).not.toHaveProperty('datePublished')
    })

    it('should not include review field when no reviews are provided', () => {
      const formData: RecipeFormData = {
        ...baseRecipeFormData,
        reviews: undefined
      }

      const result = generateRecipeJsonLd(formData)
      expect(result.review).toBeUndefined()
    })

    it('should not include review field when reviews array is empty', () => {
      const formData: RecipeFormData = {
        ...baseRecipeFormData,
        reviews: []
      }

      const result = generateRecipeJsonLd(formData)
      expect(result.review).toBeUndefined()
    })

    it('should handle multiple reviews with mixed Person and Organization authors', () => {
      const formData: RecipeFormData = {
        ...baseRecipeFormData,
        reviews: [
          {
            author: 'Home Cook',
            authorType: 'Person',
            rating: 5,
            reviewText: 'Love this recipe!',
            datePublished: '2024-01-10'
          },
          {
            author: 'Culinary Institute',
            authorType: 'Organization',
            rating: 4,
            reviewText: 'Well-structured recipe with clear instructions.',
            reviewTitle: 'Professional Review'
          },
          {
            author: 'Food Blogger',
            authorType: 'Person',
            rating: 5,
            reviewText: 'Featured this on my blog - readers love it!',
            reviewTitle: 'Blog Feature',
            datePublished: '2024-01-20'
          }
        ]
      }

      const result = generateRecipeJsonLd(formData)

      expect(result.review).toHaveLength(3)
      
      // Verify mixed author types
      expect(result.review![0].author['@type']).toBe('Person')
      expect(result.review![1].author['@type']).toBe('Organization')
      expect(result.review![2].author['@type']).toBe('Person')

      // Verify all have required fields
      result.review!.forEach(review => {
        expect(review['@type']).toBe('Review')
        expect(review.author.name).toBeDefined()
        expect(review.reviewBody).toBeDefined()
        expect(review.reviewRating.ratingValue).toBeGreaterThanOrEqual(1)
        expect(review.reviewRating.ratingValue).toBeLessThanOrEqual(5)
      })
    })

    it('should handle edge case rating values', () => {
      const formData: RecipeFormData = {
        ...baseRecipeFormData,
        reviews: [
          {
            author: 'Edge Tester',
            authorType: 'Person',
            rating: 0, // Edge case: 0 rating
            reviewText: 'Testing edge case'
          }
        ]
      }

      const result = generateRecipeJsonLd(formData)

      expect(result.review![0].reviewRating.ratingValue).toBe(0)
      expect(result.review![0].reviewRating.bestRating).toBe(5)
      expect(result.review![0].reviewRating.worstRating).toBe(1)
    })

    it('should preserve special characters in review text and titles', () => {
      const formData: RecipeFormData = {
        ...baseRecipeFormData,
        reviews: [
          {
            author: 'Special Chars User',
            authorType: 'Person',
            rating: 5,
            reviewText: 'Amazing recipe! The flavor is perfectly balanced & the texture is sublime. 5★★★★★!',
            reviewTitle: 'Perfect Recipe ★★★★★'
          }
        ]
      }

      const result = generateRecipeJsonLd(formData)

      expect(result.review![0].reviewBody).toBe('Amazing recipe! The flavor is perfectly balanced & the texture is sublime. 5★★★★★!')
      expect(result.review![0].name).toBe('Perfect Recipe ★★★★★')
    })
  })

  describe('Recipe JSON-LD generation with reviews', () => {
    it('should integrate reviews into complete recipe schema', () => {
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
        ingredients: [
          '2 cups all-purpose flour'
        ],
        instructions: [
          { step: 'Mix ingredients' }
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
        ]
      }

      const result = generateRecipeJsonLd(formData)

      // Verify the recipe has all expected fields including reviews
      expect(result['@type']).toBe('Recipe')
      expect(result.name).toBe('Chocolate Chip Cookies')
      expect(result.author.name).toBe('Baker Jane')
      expect(result.recipeIngredient).toHaveLength(1)
      expect(result.recipeIngredient).toEqual(['2 cups all-purpose flour'])
      expect(result.recipeInstructions).toHaveLength(1)
      expect(result.review).toHaveLength(1)
      expect(result.review![0].author.name).toBe('Cookie Lover')
      expect(result.recipeYield).toEqual(['24', '24 cookies'])
      // Should not have old properties
      expect(result).not.toHaveProperty('supply')
    })
  })
})