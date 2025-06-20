import { describe, it, expect } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import ThemeSelector from '~/components/form/ThemeSelector.vue'

describe('ThemeSelector', () => {
  const themes = [
    { id: 'default', name: 'Default', description: 'Clean and simple' },
    { id: 'modern', name: 'Modern', description: 'Bold and colorful' },
    { id: 'minimal', name: 'Minimal', description: 'Less is more' },
    { id: 'elegant', name: 'Elegant', description: 'Sophisticated style' }
  ]

  it('should render theme options', async () => {
    const wrapper = await mountSuspended(ThemeSelector, {
      props: {
        modelValue: 'default',
        themes
      }
    })

    expect(wrapper.find('[data-testid="theme-selector"]').exists()).toBe(true)
    expect(wrapper.findAll('[data-theme-option]')).toHaveLength(4)
  })

  it('should show current selected theme', async () => {
    const wrapper = await mountSuspended(ThemeSelector, {
      props: {
        modelValue: 'modern',
        themes
      }
    })

    const modernOption = wrapper.find('[data-testid="theme-option-modern"]')
    expect(modernOption.classes()).toContain('selected')
  })

  it('should emit theme change when option is clicked', async () => {
    const wrapper = await mountSuspended(ThemeSelector, {
      props: {
        modelValue: 'default',
        themes
      }
    })

    await wrapper.find('[data-testid="theme-option-minimal"]').trigger('click')
    
    expect(wrapper.emitted('update:modelValue')).toBeTruthy()
    expect(wrapper.emitted('update:modelValue')![0][0]).toBe('minimal')
  })

  it('should show theme previews', async () => {
    const wrapper = await mountSuspended(ThemeSelector, {
      props: {
        modelValue: 'default',
        themes,
        showPreviews: true
      }
    })

    expect(wrapper.find('[data-testid="theme-preview-default"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="theme-preview-modern"]').exists()).toBe(true)
  })

  it('should render in compact mode', async () => {
    const wrapper = await mountSuspended(ThemeSelector, {
      props: {
        modelValue: 'default',
        themes,
        compact: true
      }
    })

    expect(wrapper.find('[data-testid="theme-selector"]').classes()).toContain('compact')
  })

  it('should show theme names and descriptions', async () => {
    const wrapper = await mountSuspended(ThemeSelector, {
      props: {
        modelValue: 'default',
        themes
      }
    })

    const defaultOption = wrapper.find('[data-testid="theme-option-default"]')
    expect(defaultOption.text()).toContain('Default')
    expect(defaultOption.text()).toContain('Clean and simple')
  })

  it('should handle custom theme configuration', async () => {
    const customTheme = {
      id: 'custom',
      name: 'Custom Theme',
      description: 'My custom theme',
      colors: {
        primary: '#ff6b6b',
        secondary: '#4ecdc4'
      }
    }

    const wrapper = await mountSuspended(ThemeSelector, {
      props: {
        modelValue: 'custom',
        themes: [...themes, customTheme],
        allowCustom: true
      }
    })

    expect(wrapper.find('[data-testid="theme-option-custom"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="custom-theme-button"]').exists()).toBe(true)
  })

  it('should emit theme-change event with theme data', async () => {
    const wrapper = await mountSuspended(ThemeSelector, {
      props: {
        modelValue: 'default',
        themes
      }
    })

    await wrapper.find('[data-testid="theme-option-elegant"]').trigger('click')
    
    expect(wrapper.emitted('theme-change')).toBeTruthy()
    const emittedTheme = wrapper.emitted('theme-change')![0][0]
    expect(emittedTheme).toEqual(themes[3])
  })

  it('should support keyboard navigation', async () => {
    const wrapper = await mountSuspended(ThemeSelector, {
      props: {
        modelValue: 'default',
        themes
      }
    })

    const selector = wrapper.find('[data-testid="theme-selector"]')
    
    await selector.trigger('keydown', { key: 'ArrowDown' })
    await selector.trigger('keydown', { key: 'Enter' })
    
    expect(wrapper.emitted('update:modelValue')).toBeTruthy()
  })

  it('should show theme labels when provided', async () => {
    const wrapper = await mountSuspended(ThemeSelector, {
      props: {
        modelValue: 'default',
        themes,
        showLabels: true
      }
    })

    expect(wrapper.find('[data-testid="theme-label"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="theme-label"]').text()).toBe('Theme')
  })

  it('should disable theme selection when disabled', async () => {
    const wrapper = await mountSuspended(ThemeSelector, {
      props: {
        modelValue: 'default',
        themes,
        disabled: true
      }
    })

    expect(wrapper.find('[data-testid="theme-selector"]').classes()).toContain('disabled')
    
    await wrapper.find('[data-testid="theme-option-modern"]').trigger('click')
    expect(wrapper.emitted('update:modelValue')).toBeFalsy()
  })
})