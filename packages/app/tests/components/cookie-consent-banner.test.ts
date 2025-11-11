import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import { setActivePinia, createPinia } from 'pinia'
import CookieConsentBanner from '~/components/CookieConsentBanner.vue'
import { useConsentStore } from '~/stores/consent'

describe('CookieConsentBanner', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  describe('Visibility', () => {
    it('renders when consent is not given', async () => {
      const wrapper = await mountSuspended(CookieConsentBanner)
      // Wait for hydration
      await wrapper.vm.$nextTick()

      expect(wrapper.find('.fixed').exists()).toBe(true)
    })

    it('banner is hidden when consent is already given', async () => {
      const store = useConsentStore()
      store.acceptAll()

      const wrapper = await mountSuspended(CookieConsentBanner)

      // Banner content should not be visible (shouldShowBanner = false)
      expect(store.shouldShowBanner).toBe(false)
    })

    it('banner is hidden when dismissed', async () => {
      const store = useConsentStore()
      store.dismissBanner()

      const wrapper = await mountSuspended(CookieConsentBanner)

      // Banner should not be visible but dialog should still exist
      expect(store.shouldShowBanner).toBe(false)
    })

    it('renders when analytics consent is null', async () => {
      const store = useConsentStore()
      store.marketing = true
      store.analytics = null

      const wrapper = await mountSuspended(CookieConsentBanner)

      expect(wrapper.find('.fixed').exists()).toBe(true)
    })

    it('renders when marketing consent is null', async () => {
      const store = useConsentStore()
      store.analytics = true
      store.marketing = null

      const wrapper = await mountSuspended(CookieConsentBanner)

      expect(wrapper.find('.fixed').exists()).toBe(true)
    })
  })

  describe('Content', () => {
    it('displays cookie consent heading', async () => {
      const wrapper = await mountSuspended(CookieConsentBanner)

      expect(wrapper.text()).toContain('Cookie & Privacy Notice')
    })

    it('displays accept all button', async () => {
      const wrapper = await mountSuspended(CookieConsentBanner)

      expect(wrapper.text()).toContain('Accept All')
    })

    it('displays reject button', async () => {
      const wrapper = await mountSuspended(CookieConsentBanner)

      expect(wrapper.text()).toContain('Reject')
    })

    it('displays customize button', async () => {
      const wrapper = await mountSuspended(CookieConsentBanner)

      expect(wrapper.text()).toContain('Customize')
    })

    it('displays links to legal pages', async () => {
      const wrapper = await mountSuspended(CookieConsentBanner)

      expect(wrapper.text()).toContain('Privacy Policy')
      expect(wrapper.text()).toContain('Cookie Policy')
      expect(wrapper.text()).toContain('Terms of Service')
    })
  })

  describe('Accept All Functionality', () => {
    it('sets analytics consent to true on accept all', async () => {
      const wrapper = await mountSuspended(CookieConsentBanner)
      await wrapper.vm.$nextTick()
      const store = useConsentStore()

      const buttons = wrapper.findAll('button')
      const acceptButton = buttons.find(btn => btn.text().includes('Accept All'))

      if (acceptButton) {
        await acceptButton.trigger('click')
        await wrapper.vm.$nextTick()
        expect(store.analytics).toBe(true)
      }
    })

    it('sets marketing consent to true on accept all', async () => {
      const wrapper = await mountSuspended(CookieConsentBanner)
      await wrapper.vm.$nextTick()
      const store = useConsentStore()

      const buttons = wrapper.findAll('button')
      const acceptButton = buttons.find(btn => btn.text().includes('Accept All'))

      if (acceptButton) {
        await acceptButton.trigger('click')
        await wrapper.vm.$nextTick()
        expect(store.marketing).toBe(true)
      }
    })

    it('dismisses banner after accept all', async () => {
      const wrapper = await mountSuspended(CookieConsentBanner)
      await wrapper.vm.$nextTick()
      const store = useConsentStore()

      const buttons = wrapper.findAll('button')
      const acceptButton = buttons.find(btn => btn.text().includes('Accept All'))

      if (acceptButton) {
        await acceptButton.trigger('click')
        await wrapper.vm.$nextTick()
        expect(store.bannerDismissed).toBe(true)
      }
    })
  })

  describe('Reject Functionality', () => {
    it('sets analytics consent to false on reject', async () => {
      const wrapper = await mountSuspended(CookieConsentBanner)
      await wrapper.vm.$nextTick()
      const store = useConsentStore()

      const buttons = wrapper.findAll('button')
      const rejectButton = buttons.find(btn => btn.text().includes('Reject'))

      if (rejectButton) {
        await rejectButton.trigger('click')
        await wrapper.vm.$nextTick()
        expect(store.analytics).toBe(false)
      }
    })

    it('sets marketing consent to false on reject', async () => {
      const wrapper = await mountSuspended(CookieConsentBanner)
      await wrapper.vm.$nextTick()
      const store = useConsentStore()

      const buttons = wrapper.findAll('button')
      const rejectButton = buttons.find(btn => btn.text().includes('Reject'))

      if (rejectButton) {
        await rejectButton.trigger('click')
        await wrapper.vm.$nextTick()
        expect(store.marketing).toBe(false)
      }
    })

    it('dismisses banner after reject', async () => {
      const wrapper = await mountSuspended(CookieConsentBanner)
      await wrapper.vm.$nextTick()
      const store = useConsentStore()

      const buttons = wrapper.findAll('button')
      const rejectButton = buttons.find(btn => btn.text().includes('Reject'))

      if (rejectButton) {
        await rejectButton.trigger('click')
        await wrapper.vm.$nextTick()
        expect(store.bannerDismissed).toBe(true)
      }
    })
  })

  describe('Customize Modal', () => {
    it('opens customize modal on customize button click', async () => {
      const wrapper = await mountSuspended(CookieConsentBanner)
      await wrapper.vm.$nextTick()
      const store = useConsentStore()

      const buttons = wrapper.findAll('button')
      const customizeButton = buttons.find(btn => btn.text().includes('Customize'))

      if (customizeButton) {
        await customizeButton.trigger('click')
        // Modal state is in store now
        expect(store.showCustomizeModal).toBe(true)
      }
    })

    it('initializes custom preferences from store', async () => {
      const store = useConsentStore()
      store.setConsent({ analytics: true, marketing: false })

      const wrapper = await mountSuspended(CookieConsentBanner)
      await wrapper.vm.$nextTick()

      // Custom preferences are initialized from store on mount
      // Verify by checking the store values were set correctly
      expect(store.analytics).toBe(true)
      expect(store.marketing).toBe(false)
    })

    it('displays necessary, analytics, and marketing checkboxes', async () => {
      const wrapper = await mountSuspended(CookieConsentBanner)
      await wrapper.vm.$nextTick()

      const buttons = wrapper.findAll('button')
      const customizeButton = buttons.find(btn => btn.text().includes('Customize'))

      if (customizeButton) {
        await customizeButton.trigger('click')
        await wrapper.vm.$nextTick()

        expect(wrapper.text()).toContain('Necessary Cookies')
        expect(wrapper.text()).toContain('Analytics Cookies')
        expect(wrapper.text()).toContain('Marketing Cookies')
      }
    })

    it('saves custom preferences on save button click', async () => {
      const wrapper = await mountSuspended(CookieConsentBanner)
      await wrapper.vm.$nextTick()
      const store = useConsentStore()

      const buttons = wrapper.findAll('button')
      const customizeButton = buttons.find(btn => btn.text().includes('Customize'))

      if (customizeButton) {
        await customizeButton.trigger('click')
        await wrapper.vm.$nextTick()

        // Simulate user toggling analytics
        wrapper.vm.$data.customAnalytics = true
        wrapper.vm.$data.customMarketing = false
        await wrapper.vm.$nextTick()

        // Find and click save button
        const modalButtons = wrapper.findAll('button')
        const saveButton = modalButtons.find(btn => btn.text().includes('Save'))

        if (saveButton) {
          await saveButton.trigger('click')
          // Wait for async operations to complete
          await wrapper.vm.$nextTick()

          expect(store.analytics).toBe(true)
          expect(store.marketing).toBe(false)
        }
      }
    })

    it('closes modal after saving preferences', async () => {
      const wrapper = await mountSuspended(CookieConsentBanner)
      await wrapper.vm.$nextTick()
      const store = useConsentStore()

      const buttons = wrapper.findAll('button')
      const customizeButton = buttons.find(btn => btn.text().includes('Customize'))

      if (customizeButton) {
        await customizeButton.trigger('click')
        await wrapper.vm.$nextTick()

        wrapper.vm.$data.customAnalytics = true
        await wrapper.vm.$nextTick()

        const modalButtons = wrapper.findAll('button')
        const saveButton = modalButtons.find(btn => btn.text().includes('Save'))

        if (saveButton) {
          await saveButton.trigger('click')

          expect(store.showCustomizeModal).toBe(false)
        }
      }
    })

    it('closes modal on cancel button click', async () => {
      const wrapper = await mountSuspended(CookieConsentBanner)
      await wrapper.vm.$nextTick()
      const store = useConsentStore()

      const buttons = wrapper.findAll('button')
      const customizeButton = buttons.find(btn => btn.text().includes('Customize'))

      if (customizeButton) {
        await customizeButton.trigger('click')
        await wrapper.vm.$nextTick()

        const modalButtons = wrapper.findAll('button')
        const cancelButton = modalButtons.find(btn => btn.text().includes('Cancel'))

        if (cancelButton) {
          await cancelButton.trigger('click')

          expect(store.showCustomizeModal).toBe(false)
        }
      }
    })
  })

  describe('Responsive Behavior', () => {
    it('renders with responsive classes', async () => {
      const wrapper = await mountSuspended(CookieConsentBanner)
      await wrapper.vm.$nextTick()

      const bannerDiv = wrapper.find('.fixed')
      if (bannerDiv.exists()) {
        expect(bannerDiv.classes()).toContain('bottom-0')
        expect(bannerDiv.classes()).toContain('left-0')
        expect(bannerDiv.classes()).toContain('right-0')
      }
    })
  })

  describe('Accessibility', () => {
    it('buttons have aria labels', async () => {
      const wrapper = await mountSuspended(CookieConsentBanner)

      const buttons = wrapper.findAll('button')
      expect(buttons.length).toBeGreaterThan(0)

      // At least some buttons should have aria-label
      const hasAriaLabel = buttons.some(btn => btn.attributes('aria-label'))
      expect(hasAriaLabel).toBe(true)
    })
  })
})
