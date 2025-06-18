import { describe, it, expect } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import AppButton from '~/components/AppButton.vue'

describe('AppButton Component', () => {
  it('renders slot content', async () => {
    const wrapper = await mountSuspended(AppButton, {
      slots: {
        default: () => 'Click me'
      }
    })
    expect(wrapper.text()).toBe('Click me')
  })

  it('applies correct variant classes', async () => {
    const wrapper = await mountSuspended(AppButton, {
      props: {
        variant: 'secondary'
      },
      slots: {
        default: () => 'Click me'
      }
    })
    
    expect(wrapper.classes()).toContain('btn')
    expect(wrapper.classes()).toContain('btn-secondary')
  })

  it('applies correct size classes', async () => {
    const wrapperSm = await mountSuspended(AppButton, {
      props: { size: 'sm' }
    })
    expect(wrapperSm.classes()).toContain('btn-sm')

    const wrapperLg = await mountSuspended(AppButton, {
      props: { size: 'lg' }
    })
    expect(wrapperLg.classes()).toContain('btn-lg')
  })

  it('emits click event when clicked', async () => {
    const wrapper = await mountSuspended(AppButton)
    
    await wrapper.trigger('click')
    
    expect(wrapper.emitted('click')).toBeTruthy()
    expect(wrapper.emitted('click')?.length).toBe(1)
  })

  it('does not emit click when disabled', async () => {
    const wrapper = await mountSuspended(AppButton, {
      props: {
        disabled: true
      }
    })
    
    await wrapper.trigger('click')
    
    expect(wrapper.emitted('click')).toBeFalsy()
  })

  it('has disabled attribute when disabled prop is true', async () => {
    const wrapper = await mountSuspended(AppButton, {
      props: {
        disabled: true
      }
    })
    
    expect(wrapper.attributes('disabled')).toBeDefined()
  })

  it('combines multiple props correctly', async () => {
    const wrapper = await mountSuspended(AppButton, {
      props: {
        variant: 'accent',
        size: 'lg',
        disabled: false
      },
      slots: {
        default: () => 'Large Accent Button'
      }
    })
    
    expect(wrapper.text()).toBe('Large Accent Button')
    expect(wrapper.classes()).toContain('btn')
    expect(wrapper.classes()).toContain('btn-accent')
    expect(wrapper.classes()).toContain('btn-lg')
    expect(wrapper.attributes('disabled')).toBeUndefined()
  })
})