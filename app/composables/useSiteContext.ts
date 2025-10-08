/**
 * Site Context Composable
 *
 * Manages the currently selected site across the admin area
 * Persists selection to localStorage
 */

import { ref, computed, watch } from 'vue'

const SELECTED_SITE_KEY = 'selected_site_id'

// Shared state across all instances
const selectedSiteId = ref<number | null>(null)
const sites = ref<any[]>([])

/**
 * Get selected site ID from localStorage
 */
export function getSelectedSiteId(): number | null {
  if (import.meta.client) {
    const stored = localStorage.getItem(SELECTED_SITE_KEY)
    return stored ? parseInt(stored) : null
  }
  return null
}

/**
 * Set selected site ID in localStorage
 */
export function setSelectedSiteId(id: number | null): void {
  if (import.meta.client) {
    if (id) {
      localStorage.setItem(SELECTED_SITE_KEY, id.toString())
      selectedSiteId.value = id
    } else {
      localStorage.removeItem(SELECTED_SITE_KEY)
      selectedSiteId.value = null
    }
  }
}

/**
 * Clear site context (call on logout)
 */
export function clearSiteContext(): void {
  if (import.meta.client) {
    localStorage.removeItem(SELECTED_SITE_KEY)
    selectedSiteId.value = null
    sites.value = []
  }
}

/**
 * Main composable for site context
 */
export function useSiteContext() {
  // Initialize from localStorage on client
  if (import.meta.client && selectedSiteId.value === null) {
    const storedId = getSelectedSiteId()
    if (storedId) {
      selectedSiteId.value = storedId
    }
  }

  // Computed property to get the currently selected site object
  const selectedSite = computed(() => {
    if (!selectedSiteId.value) return null
    return sites.value.find(site => site.id === selectedSiteId.value) || null
  })

  // Load user's sites
  const loadSites = async () => {
    try {
      const response = await $fetch('/api/v2/sites')
      if (response.success && response.sites) {
        sites.value = response.sites

        // If no site selected but we have sites, select the first one
        if (!selectedSiteId.value && sites.value.length > 0) {
          setSelectedSiteId(sites.value[0].id)
        }
        // If selected site no longer exists, select first available
        else if (selectedSiteId.value) {
          const siteExists = sites.value.some(s => s.id === selectedSiteId.value)
          if (!siteExists && sites.value.length > 0) {
            setSelectedSiteId(sites.value[0].id)
          }
        }
      }
    } catch (error) {
      console.error('Failed to load sites:', error)
    }
  }

  // Select a different site
  const selectSite = (siteId: number) => {
    const site = sites.value.find(s => s.id === siteId)
    if (site) {
      setSelectedSiteId(siteId)
    }
  }

  return {
    selectedSiteId: computed(() => selectedSiteId.value),
    selectedSite,
    sites: computed(() => sites.value),
    loadSites,
    selectSite,
    setSelectedSiteId,
    clearSiteContext
  }
}
