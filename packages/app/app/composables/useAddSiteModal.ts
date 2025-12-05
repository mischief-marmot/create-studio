/**
 * Add Site Modal Composable
 *
 * Shared state for controlling the Add Site modal from anywhere in the app.
 * Used when navigating from the plugin with a site_url that doesn't exist yet.
 */

import { ref } from 'vue'

// Shared state across all instances
const showAddSiteModal = ref(false)
const initialSiteUrl = ref<string | null>(null)

export function useAddSiteModal() {
  const openAddSiteModal = (url?: string) => {
    initialSiteUrl.value = url || null
    showAddSiteModal.value = true
  }

  const closeAddSiteModal = () => {
    showAddSiteModal.value = false
    initialSiteUrl.value = null
  }

  return {
    showAddSiteModal,
    initialSiteUrl,
    openAddSiteModal,
    closeAddSiteModal
  }
}
