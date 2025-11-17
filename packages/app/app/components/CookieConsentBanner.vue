<template>
  <div>
    <!-- Banner -->
    <div v-if="shouldShowBanner" class="fixed bottom-0 left-0 right-0 z-50">
      <div class="bg-base-300 border-base-300 border-t shadow-2xl">
        <div class="max-w-7xl sm:px-6 lg:px-8 sm:py-6 p-8 mx-auto">
          <div class="sm:flex-row sm:items-center flex flex-col items-start justify-between gap-4">
            <!-- Content -->
            <div class="flex-1">
              <h3 class="sm:text-lg text-base-content mb-2 text-base font-semibold">
                Cookie & Privacy Notice
              </h3>
              <p class="text-base-content text-sm">
                We use cookies to improve your experience and analyze site usage. By clicking "Accept All" or continuing to use our site, you agree to our
                <NuxtLink to="/legal/privacy" class="link link-secondary" target="_blank">Privacy Policy</NuxtLink>,
                <NuxtLink to="/legal/cookies" class="link link-secondary" target="_blank">Cookie Policy</NuxtLink>, and
                <NuxtLink to="/legal/terms" class="link link-secondary" target="_blank">Terms of Service</NuxtLink>.
              </p>
            </div>

            <!-- Buttons -->
            <div class="sm:flex-row sm:w-auto flex flex-col w-full gap-2">
              <button
                type="button"
                @click="rejectAll"
                class="btn btn-outline btn-md sm:btn-md sm:order-1 order-2"
                aria-label="Reject all cookies except necessary"
              >
                Reject
              </button>
              <button
                type="button"
                @click="showCustomize"
                class="btn btn-secondary btn-md sm:btn-md sm:order-2 order-3"
                aria-label="Customize cookie preferences"
              >
                Customize
              </button>
              <button
                type="button"
                @click="acceptAll"
                class="btn btn-primary btn-md sm:btn-md order-1"
                aria-label="Accept all cookies"
              >
                Accept All
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Customize Modal (rendered outside banner visibility check) -->
    <dialog ref="customizeDialogRef" class="modal z-[60]">
      <div class="modal-box w-full">
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-xl font-bold">Cookie Preferences</h3>
          <button
            type="button"
            @click="closeCustomizeModal"
            class="btn btn-circle btn-ghost"
            aria-label="Close modal"
          >
            <XMarkIcon class="size-8 text-base-content" />
          </button>
        </div>

        <!-- Necessary Cookies (Always On) -->
        <div class="form-control mb-4">
          <label class="label text-base-content justify-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              class="checkbox checkbox-sm"
              disabled
              checked
            />
            <div>
              <span class="text-md font-semibold">Necessary Cookies</span>
              <p>Required for site functionality. Always enabled.</p>
            </div>
          </label>
        </div>

        <!-- Analytics Cookies -->
        <div class="form-control mb-4">
          <label class="label text-base-content justify-start gap-3 cursor-pointer">
            <input
              v-model="customAnalytics"
              type="checkbox"
              class="checkbox checkbox-sm"
            />
            <div>
              <span class="text-md font-semibold">Analytics Cookies</span>
              <p>Help us understand how you use our site (Google Analytics).</p>
            </div>
          </label>
        </div>

        <!-- Marketing Cookies -->
        <div class="form-control mb-6">
          <label class="label text-base-content justify-start gap-3 cursor-pointer">
            <input
              v-model="customMarketing"
              type="checkbox"
              class="checkbox checkbox-sm"
            />
            <div>
              <span class="text-md font-semibold">Marketing Cookies</span>
              <p class="">Personalize your experience and receive promotional content.</p>
            </div>
          </label>
        </div>

        <!-- Buttons -->
        <div class="modal-action">
          <button
            type="button"
            @click="closeCustomizeModal"
            class="btn btn-ghost"
          >
            Cancel
          </button>
          <button
            type="button"
            @click="saveCustomize"
            class="btn btn-accent"
          >
            Save Preferences
          </button>
        </div>
      </div>
      <form method="dialog" class="modal-backdrop">
        <button type="submit" aria-label="Close modal" />
      </form>
    </dialog>
  </div>
</template>

<script setup lang="ts">
import { XMarkIcon } from '@heroicons/vue/20/solid'
import { ref, computed, nextTick, watch, onMounted } from 'vue'
import { useConsentStore } from '~/stores/consent'

const consentStore = useConsentStore()
const customizeDialogRef = ref<HTMLDialogElement | null>(null)
const customAnalytics = ref(false)
const customMarketing = ref(false)
const isHydrated = ref(false)
const syncError = ref<string | null>(null)
const isSyncing = ref(false)

// Compute banner visibility based on store state
// Hide banner until hydrated to prevent flash of unsaved consent state
const shouldShowBanner = computed(() => {
  return isHydrated.value && !consentStore.bannerDismissed && (consentStore.analytics === null || consentStore.marketing === null)
})

// Initialize custom preferences from store
const initializeCustomPreferences = () => {
  customAnalytics.value = consentStore.analytics ?? false
  customMarketing.value = consentStore.marketing ?? false
}

onMounted(() => {
  initializeCustomPreferences()
  // Mark component as hydrated after mount (pinia persisted state is ready)
  isHydrated.value = true
  // Reset modal flag so it can be triggered again
  consentStore.showCustomizeModal = false
})

// Watch for modal open requests from store
watch(
  () => consentStore.showCustomizeModal,
  async (shouldShow) => {
    if (shouldShow) {
      // Initialize preferences from current store state
      initializeCustomPreferences()
      await nextTick()
      customizeDialogRef.value?.showModal()
      // Move focus to the first focusable element in the modal
      await nextTick()
      const firstFocusable = customizeDialogRef.value?.querySelector(
        'button:not([aria-label="Close modal"]), input, a'
      ) as HTMLElement
      firstFocusable?.focus()
    } else {
      // Close the modal if flag is set to false
      customizeDialogRef.value?.close()
    }
  }
)

// Close modal and reset store state
const closeCustomizeModal = () => {
  customizeDialogRef.value?.close()
  consentStore.showCustomizeModal = false
}

const acceptAll = async () => {
  syncError.value = null
  isSyncing.value = true
  try {
    consentStore.acceptAll()
    triggerConsent('analytics')
    triggerConsent('marketing')
    // Sync consent to user account if authenticated
    await consentStore.syncToDatabase()
  } catch (error) {
    console.error('Error accepting all consent:', error)
    syncError.value = 'Failed to save consent preferences. Please try again.'
  } finally {
    isSyncing.value = false
  }
}

const rejectAll = async () => {
  syncError.value = null
  isSyncing.value = true
  try {
    consentStore.rejectAll()
    consentStore.deleteAnalyticsCookies()
    // Sync consent to user account if authenticated
    await consentStore.syncToDatabase()
  } catch (error) {
    console.error('Error rejecting all consent:', error)
    syncError.value = 'Failed to save consent preferences. Please try again.'
  } finally {
    isSyncing.value = false
  }
}

const showCustomize = () => {
  initializeCustomPreferences()
  syncError.value = null
  consentStore.showCustomizeModal = true
}

const saveCustomize = async () => {
  syncError.value = null
  isSyncing.value = true
  try {
    consentStore.setConsent({
      analytics: customAnalytics.value,
      marketing: customMarketing.value,
    })

    // Trigger consent for enabled categories
    if (customAnalytics.value) {
      triggerConsent('analytics')
    } else {
      consentStore.deleteAnalyticsCookies()
    }

    if (customMarketing.value) {
      triggerConsent('marketing')
    }

    // Sync consent to user account if authenticated
    await consentStore.syncToDatabase()

    closeCustomizeModal()
  } catch (error) {
    console.error('Error saving consent preferences:', error)
    syncError.value = 'Failed to save consent preferences. Your preferences are saved locally, but were not synced to your account.'
  } finally {
    isSyncing.value = false
  }
}

const triggerConsent = (category: 'analytics' | 'marketing') => {
  try {
    const { useScriptTriggerConsent } = useNuxtApp()
    if (useScriptTriggerConsent) {
      useScriptTriggerConsent(category)
    }
  } catch (error) {
    console.error(`Failed to trigger ${category} consent:`, error)
  }
}
</script>
