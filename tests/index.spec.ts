import { describe, it, expect } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import Index from '../pages/index.vue'

describe('Landing Page', () => {
  it('should render the recipe cards heading', async () => {
    const wrapper = await mountSuspended(Index)
    const heading = wrapper.find('h1')
    expect(heading.exists()).toBe(true)
    expect(heading.text()).toContain('Recipe Cards')
  })

  it('should have a description about structured data', async () => {
    const wrapper = await mountSuspended(Index)
    const description = wrapper.find('p')
    expect(description.exists()).toBe(true)
    expect(description.text()).toContain('JSON-LD')
  })

  it('should have navigation with auth buttons', async () => {
    const wrapper = await mountSuspended(Index)
    const navbar = wrapper.find('.navbar')
    expect(navbar.exists()).toBe(true)
    // Should show Sign In and Sign Up when not authenticated
    expect(wrapper.text()).toContain('Sign In')
    expect(wrapper.text()).toContain('Sign Up')
  })

  it('should use DaisyUI hero component', async () => {
    const wrapper = await mountSuspended(Index)
    const hero = wrapper.find('.hero')
    expect(hero.exists()).toBe(true)
    expect(hero.find('.hero-content').exists()).toBe(true)
  })

  it('should have features section', async () => {
    const wrapper = await mountSuspended(Index)
    const featuresSection = wrapper.find('#features')
    expect(featuresSection.exists()).toBe(true)
    expect(wrapper.text()).toContain('Everything You Need')
  })
})