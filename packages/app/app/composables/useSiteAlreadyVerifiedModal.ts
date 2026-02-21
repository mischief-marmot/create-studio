/**
 * Site Already Verified Modal Composable
 *
 * Shows a notification when user tries to verify an already-verified site.
 */

import { ref } from 'vue'

interface VerifiedSite {
  id: number
  url: string
  name?: string
}

const showModal = ref(false)
const site = ref<VerifiedSite | null>(null)

export function useSiteAlreadyVerifiedModal() {
  const openSiteAlreadyVerifiedModal = (verifiedSite: VerifiedSite) => {
    site.value = verifiedSite
    showModal.value = true
  }

  const closeSiteAlreadyVerifiedModal = () => {
    showModal.value = false
    site.value = null
  }

  return {
    showSiteAlreadyVerifiedModal: showModal,
    alreadyVerifiedSite: site,
    openSiteAlreadyVerifiedModal,
    closeSiteAlreadyVerifiedModal
  }
}
