import { describe, it, expect } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import StructuredDataPreview from '~/components/preview/StructuredDataPreview.vue'
import type { Recipe, HowTo, FAQ, ItemList } from '~/types/schemas'

describe('StructuredDataPreview', () => {
  const sampleRecipe: Recipe = {
    '@context': 'https://schema.org',
    '@type': 'Recipe',
    name: 'Chocolate Chip Cookies',
    description: 'Delicious homemade cookies perfect for any occasion',
    image: ['https://example.com/cookies.jpg'],
    author: {
      '@type': 'Person',
      name: 'Jane Baker'
    },
    prepTime: 'PT15M',
    cookTime: 'PT10M',
    totalTime: 'PT25M',
    recipeYield: ['24', '24 cookies'],
    recipeIngredient: [
      '2 cups all-purpose flour',
      '1 cup granulated sugar'
    ],
    recipeInstructions: [
      { '@type': 'HowToStep', text: 'Mix dry ingredients in a large bowl' },
      { '@type': 'HowToStep', text: 'Add wet ingredients and mix until combined' }
    ]
  }

  const sampleHowTo: HowTo = {
    '@context': 'https://schema.org',
    '@type': 'HowTo',
    name: 'How to Change a Tire',
    description: 'Step-by-step guide for changing a flat tire',
    totalTime: 'PT30M',
    supply: [
      { '@type': 'HowToSupply', name: 'Spare tire', quantity: 1 }
    ],
    tool: [
      { '@type': 'HowToTool', name: 'Jack', requiredQuantity: 1 }
    ],
    step: [
      { '@type': 'HowToStep', text: 'Park on level ground and engage parking brake' },
      { '@type': 'HowToStep', text: 'Remove lug nuts and wheel' }
    ]
  }

  it('should render Recipe preview correctly', async () => {
    const wrapper = await mountSuspended(StructuredDataPreview, {
      props: {
        schema: sampleRecipe,
        theme: 'default'
      }
    })

    expect(wrapper.find('[data-testid="preview-container"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="recipe-title"]').text()).toBe('Chocolate Chip Cookies')
    expect(wrapper.find('[data-testid="recipe-description"]').text()).toBe('Delicious homemade cookies perfect for any occasion')
    expect(wrapper.find('[data-testid="recipe-author"]').text()).toContain('Jane Baker')
    expect(wrapper.find('[data-testid="recipe-prep-time"]').text()).toContain('15 min')
    expect(wrapper.find('[data-testid="recipe-cook-time"]').text()).toContain('10 min')
    expect(wrapper.find('[data-testid="recipe-total-time"]').text()).toContain('25 min')
  })

  it('should render ingredients list', async () => {
    const wrapper = await mountSuspended(StructuredDataPreview, {
      props: {
        schema: sampleRecipe,
        theme: 'default'
      }
    })

    const ingredients = wrapper.findAll('[data-testid="ingredient-item"]')
    expect(ingredients).toHaveLength(2)
    expect(ingredients[0].text()).toBe('2 cups all-purpose flour')
    expect(ingredients[1].text()).toBe('1 cup granulated sugar')
  })

  it('should render instructions list', async () => {
    const wrapper = await mountSuspended(StructuredDataPreview, {
      props: {
        schema: sampleRecipe,
        theme: 'default'
      }
    })

    const instructions = wrapper.findAll('[data-testid="instruction-item"]')
    expect(instructions).toHaveLength(2)
    expect(instructions[0].text()).toContain('Mix dry ingredients in a large bowl')
    expect(instructions[1].text()).toContain('Add wet ingredients and mix until combined')
  })

  it('should render HowTo preview correctly', async () => {
    const wrapper = await mountSuspended(StructuredDataPreview, {
      props: {
        schema: sampleHowTo,
        theme: 'default'
      }
    })

    expect(wrapper.find('[data-testid="howto-title"]').text()).toBe('How to Change a Tire')
    expect(wrapper.find('[data-testid="howto-description"]').text()).toBe('Step-by-step guide for changing a flat tire')
    expect(wrapper.find('[data-testid="howto-total-time"]').text()).toContain('30 min')
  })

  it('should render supplies and tools for HowTo', async () => {
    const wrapper = await mountSuspended(StructuredDataPreview, {
      props: {
        schema: sampleHowTo,
        theme: 'default'
      }
    })

    const supplies = wrapper.findAll('[data-testid="supply-item"]')
    expect(supplies).toHaveLength(1)
    expect(supplies[0].text()).toContain('Spare tire')

    const tools = wrapper.findAll('[data-testid="tool-item"]')
    expect(tools).toHaveLength(1)
    expect(tools[0].text()).toContain('Jack')
  })

  it('should render FAQ preview correctly', async () => {
    const faq: FAQ = {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: [
        {
          '@type': 'Question',
          name: 'How long does it take?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'About 30 minutes for most people'
          }
        }
      ]
    }

    const wrapper = await mountSuspended(StructuredDataPreview, {
      props: {
        schema: faq,
        theme: 'default'
      }
    })

    expect(wrapper.find('[data-testid="faq-question"]').text()).toBe('How long does it take?')
    expect(wrapper.find('[data-testid="faq-answer"]').text()).toBe('About 30 minutes for most people')
  })

  it('should render ItemList preview correctly', async () => {
    const itemList: ItemList = {
      '@context': 'https://schema.org',
      '@type': 'ItemList',
      name: 'Best Cooking Tools',
      itemListElement: [
        {
          '@type': 'ListItem',
          position: 1,
          name: 'Chef Knife',
          description: 'Essential for food prep'
        },
        {
          '@type': 'ListItem',
          position: 2,
          name: 'Cutting Board',
          description: 'Protects counters'
        }
      ]
    }

    const wrapper = await mountSuspended(StructuredDataPreview, {
      props: {
        schema: itemList,
        theme: 'default'
      }
    })

    expect(wrapper.find('[data-testid="list-title"]').text()).toBe('Best Cooking Tools')
    
    const listItems = wrapper.findAll('[data-testid="list-item"]')
    expect(listItems).toHaveLength(2)
    expect(listItems[0].text()).toContain('Chef Knife')
    expect(listItems[1].text()).toContain('Cutting Board')
  })

  it('should apply different themes', async () => {
    const wrapper = await mountSuspended(StructuredDataPreview, {
      props: {
        schema: sampleRecipe,
        theme: 'modern'
      }
    })

    expect(wrapper.find('[data-testid="preview-container"]').classes()).toContain('theme-modern')
  })

  it('should show JSON-LD tab', async () => {
    const wrapper = await mountSuspended(StructuredDataPreview, {
      props: {
        schema: sampleRecipe,
        showJsonLd: true
      }
    })

    expect(wrapper.find('[data-testid="json-ld-tab"]').exists()).toBe(true)
    
    await wrapper.find('[data-testid="json-ld-tab"]').trigger('click')
    expect(wrapper.find('[data-testid="json-ld-content"]').exists()).toBe(true)
  })

  it('should validate JSON-LD and show validation status', async () => {
    const wrapper = await mountSuspended(StructuredDataPreview, {
      props: {
        schema: sampleRecipe,
        showValidation: true
      }
    })

    expect(wrapper.find('[data-testid="validation-status"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="validation-status"]').classes()).toContain('success')
  })

  it('should show validation errors for invalid schema', async () => {
    const invalidRecipe = {
      '@context': 'https://schema.org',
      '@type': 'Recipe'
      // Missing required fields
    } as any

    const wrapper = await mountSuspended(StructuredDataPreview, {
      props: {
        schema: invalidRecipe,
        showValidation: true
      }
    })

    expect(wrapper.find('[data-testid="validation-status"]').classes()).toContain('error')
    
    // Switch to validation tab to see errors
    await wrapper.find('[data-testid="validation-tab"]').trigger('click')
    await wrapper.vm.$nextTick()
    
    expect(wrapper.find('[data-testid="validation-errors"]').exists()).toBe(true)
  })

  it('should update preview when schema changes', async () => {
    const wrapper = await mountSuspended(StructuredDataPreview, {
      props: {
        schema: sampleRecipe
      }
    })

    expect(wrapper.find('[data-testid="recipe-title"]').text()).toBe('Chocolate Chip Cookies')

    const updatedRecipe = { ...sampleRecipe, name: 'Updated Cookie Recipe' }
    await wrapper.setProps({ schema: updatedRecipe })

    expect(wrapper.find('[data-testid="recipe-title"]').text()).toBe('Updated Cookie Recipe')
  })

  it('should emit events for user interactions', async () => {
    const wrapper = await mountSuspended(StructuredDataPreview, {
      props: {
        schema: sampleRecipe,
        interactive: true
      }
    })

    await wrapper.find('[data-testid="recipe-title"]').trigger('click')
    expect(wrapper.emitted('title-click')).toBeTruthy()

    if (wrapper.find('[data-testid="ingredient-item"]').exists()) {
      await wrapper.find('[data-testid="ingredient-item"]').trigger('click')
      expect(wrapper.emitted('ingredient-click')).toBeTruthy()
    }
  })

  it('should format durations correctly', async () => {
    const wrapper = await mountSuspended(StructuredDataPreview, {
      props: {
        schema: sampleRecipe
      }
    })

    expect(wrapper.find('[data-testid="recipe-prep-time"]').text()).toContain('15 min')
    expect(wrapper.find('[data-testid="recipe-cook-time"]').text()).toContain('10 min')
    expect(wrapper.find('[data-testid="recipe-total-time"]').text()).toContain('25 min')
  })

  it('should handle missing optional fields gracefully', async () => {
    const minimalRecipe: Recipe = {
      '@context': 'https://schema.org',
      '@type': 'Recipe',
      name: 'Simple Recipe',
      description: 'A basic recipe',
      image: 'test.jpg',
      author: { '@type': 'Person', name: 'Test' },
      supply: [],
      recipeInstructions: []
    }

    const wrapper = await mountSuspended(StructuredDataPreview, {
      props: {
        schema: minimalRecipe
      }
    })

    expect(wrapper.find('[data-testid="recipe-title"]').text()).toBe('Simple Recipe')
    expect(wrapper.find('[data-testid="recipe-prep-time"]').exists()).toBe(false)
    expect(wrapper.find('[data-testid="recipe-cook-time"]').exists()).toBe(false)
  })
})