import { ref, computed } from 'vue'
import type { ComputedRef } from 'vue'

interface Options {
  creationId: ComputedRef<string>
  siteUrl: ComputedRef<string>
  baseUrl: ComputedRef<string>
  cacheBust: ComputedRef<boolean>
}

export function useInteractiveCreation(options: Options) {
  const { creationId, siteUrl, baseUrl, cacheBust } = options

  const creation = ref<Record<string, any> | null>(null)
  const isLoadingCreation = ref(false)
  const creationError = ref<string | null>(null)

  const dataReady = computed(() => !isLoadingCreation.value && creation.value !== null)

  const steps = computed(() => {
    if (!creation.value) return []
    return (creation.value.step ?? []) as any[]
  })

  const suppliesLabel = computed(() => {
    return creation.value?.['@type'] === 'Recipe' ? 'Ingredients' : 'Supplies'
  })

  async function loadCreationData() {
    isLoadingCreation.value = true

    try {
      const response = await fetch(`${baseUrl.value}/api/v2/fetch-creation`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'max-age=2592001',
        },
        body: JSON.stringify({
          site_url: siteUrl.value,
          creation_id: parseInt(creationId.value),
          cache_bust: cacheBust.value,
        }),
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const data = await response.json()
      creation.value = data
    } catch (error: any) {
      console.error('Failed to fetch creation:', error)
      creationError.value = error?.statusMessage || error?.message || 'Failed to load creation data'
    } finally {
      isLoadingCreation.value = false
    }
  }

  return {
    creation,
    isLoadingCreation,
    creationError,
    dataReady,
    steps,
    suppliesLabel,
    loadCreationData,
  }
}
