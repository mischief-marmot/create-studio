import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import Index from './index.vue'

describe('Welcome Page', () => {
  it('should render the welcome heading', () => {
    const wrapper = mount(Index)
    const heading = wrapper.find('h1')
    expect(heading.exists()).toBe(true)
    expect(heading.text()).toBe('Welcome to the Nuxt Starter')
  })

  it('should have a description paragraph', () => {
    const wrapper = mount(Index)
    const description = wrapper.find('p')
    expect(description.exists()).toBe(true)
    expect(description.text()).toContain('modern web applications')
  })

  it('should have a get started button', () => {
    const wrapper = mount(Index)
    const button = wrapper.find('button')
    expect(button.exists()).toBe(true)
    expect(button.text()).toBe('Get Started')
    expect(button.classes()).toContain('btn')
    expect(button.classes()).toContain('btn-primary')
  })

  it('should use DaisyUI hero component', () => {
    const wrapper = mount(Index)
    const hero = wrapper.find('.hero')
    expect(hero.exists()).toBe(true)
    expect(hero.find('.hero-content').exists()).toBe(true)
  })

  it('should have proper styling classes', () => {
    const wrapper = mount(Index)
    const hero = wrapper.find('.hero')
    expect(hero.classes()).toContain('min-h-screen')
    expect(hero.classes()).toContain('bg-base-200')
  })
})