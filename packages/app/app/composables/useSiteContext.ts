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
  // Returns { matched: boolean } when preferredSiteUrl is provided
  const loadSites = async (preferredSiteUrl?: string): Promise<{ matched: boolean }> => {
    try {
      const response = await $fetch('/api/v2/sites')
      if (response.success && response.sites) {
        sites.value = response.sites

        // If a preferred site URL is provided, try to select that site
        if (preferredSiteUrl) {
          const normalizedPreferred = preferredSiteUrl.replace(/^https?:\/\//, '').replace(/\/$/, '').toLowerCase()
          const matchingSite = sites.value.find(s => {
            const normalizedSiteUrl = s.url.replace(/^https?:\/\//, '').replace(/\/$/, '').toLowerCase()
            return normalizedSiteUrl === normalizedPreferred
          })
          if (matchingSite) {
            setSelectedSiteId(matchingSite.id)
            return { matched: true }
          }
          // No match found - return false so caller can handle (e.g., open add site modal)
          return { matched: false }
        }

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
      return { matched: true }
    } catch (error) {
      console.error('Failed to load sites:', error)
      return { matched: false }
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
