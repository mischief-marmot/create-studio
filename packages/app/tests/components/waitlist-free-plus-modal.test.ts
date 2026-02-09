import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import WaitlistFreePlusModal from '~/components/WaitlistFreePlusModal.vue'

describe('WaitlistFreePlusModal', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders the form with email input', async () => {
    const wrapper = await mountSuspended(WaitlistFreePlusModal, {
      props: { modelValue: true },
    })

    expect(wrapper.find('input[type="email"]').exists()).toBe(true)
  })

  it('renders the Join the Waitlist button', async () => {
    const wrapper = await mountSuspended(WaitlistFreePlusModal, {
      props: { modelValue: true },
    })

    const submitBtn = wrapper.find('button[type="submit"]')
    expect(submitBtn.exists()).toBe(true)
    expect(submitBtn.text()).toContain('Join the Waitlist')
  })

  it('disables submit button when email is empty', async () => {
    const wrapper = await mountSuspended(WaitlistFreePlusModal, {
      props: { modelValue: true },
    })

    const submitBtn = wrapper.find('button[type="submit"]')
    expect(submitBtn.attributes('disabled')).toBeDefined()
  })

  it('renders the marketing opt-in checkbox', async () => {
    const wrapper = await mountSuspended(WaitlistFreePlusModal, {
      props: { modelValue: true },
    })

    expect(wrapper.find('input[type="checkbox"]').exists()).toBe(true)
  })

  it('emits update:modelValue false when close is clicked', async () => {
    const wrapper = await mountSuspended(WaitlistFreePlusModal, {
      props: { modelValue: true },
    })

    const closeBtn = wrapper.find('[aria-label="Close"]')
    await closeBtn.trigger('click')

    expect(wrapper.emitted('update:modelValue')).toBeTruthy()
    expect(wrapper.emitted('update:modelValue')![0]).toEqual([false])
  })

  it('has modal-open class when modelValue is true', async () => {
    const wrapper = await mountSuspended(WaitlistFreePlusModal, {
      props: { modelValue: true },
    })

    expect(wrapper.find('dialog').classes()).toContain('modal-open')
  })
})
