/**
 * Verify Site Modal Composable
 *
 * Shared state for controlling the Verify Site modal from anywhere in the app.
 * Used when a pending site needs verification, optionally with a pre-filled code.
 */

import { ref } from 'vue'

interface PendingSite {
  id: number
  url: string
  name?: string
}

// Shared state across all instances
const showVerifySiteModal = ref(false)
const pendingSite = ref<PendingSite | null>(null)
const initialVerificationCode = ref<string | null>(null)

export function useVerifySiteModal() {
  const openVerifySiteModal = (site: PendingSite, verificationCode?: string) => {
    pendingSite.value = site
    initialVerificationCode.value = verificationCode || null
    showVerifySiteModal.value = true
  }

  const closeVerifySiteModal = () => {
    showVerifySiteModal.value = false
    pendingSite.value = null
    initialVerificationCode.value = null
  }

  return {
    showVerifySiteModal,
    pendingSite,
    initialVerificationCode,
    openVerifySiteModal,
    closeVerifySiteModal
  }
}
