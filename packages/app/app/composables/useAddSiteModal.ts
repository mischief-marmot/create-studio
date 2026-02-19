/**
 * Add Site Modal Composable
 *
 * Shared state for controlling the Add Site modal from anywhere in the app.
 * Used when navigating from the plugin with a site_url that doesn't exist yet.
 * Supports optional verification_code for auto-filling the verification step.
 */

import { ref } from 'vue'

// Shared state across all instances
const showAddSiteModal = ref(false)
const initialSiteUrl = ref<string | null>(null)
const initialVerificationCode = ref<string | null>(null)

export function useAddSiteModal() {
  const openAddSiteModal = (url?: string, verificationCode?: string) => {
    initialSiteUrl.value = url || null
    initialVerificationCode.value = verificationCode || null
    showAddSiteModal.value = true
  }

  const closeAddSiteModal = () => {
    showAddSiteModal.value = false
    initialSiteUrl.value = null
    initialVerificationCode.value = null
  }

  return {
    showAddSiteModal,
    initialSiteUrl,
    initialVerificationCode,
    openAddSiteModal,
    closeAddSiteModal
  }
}
