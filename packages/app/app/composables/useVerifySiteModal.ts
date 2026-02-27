/**
 * Verify Site Modal Composable
 *
 * Shared state for controlling the Verify Site modal from anywhere in the app.
 * Used when a pending site needs to be connected via the plugin's Create Studio tab.
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

export function useVerifySiteModal() {
  const openVerifySiteModal = (site: PendingSite) => {
    pendingSite.value = site
    showVerifySiteModal.value = true
  }

  const closeVerifySiteModal = () => {
    showVerifySiteModal.value = false
    pendingSite.value = null
  }

  return {
    showVerifySiteModal,
    pendingSite,
    openVerifySiteModal,
    closeVerifySiteModal
  }
}
