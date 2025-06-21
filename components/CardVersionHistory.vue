<template>
  <div class="card bg-base-100 shadow-lg">
    <div class="card-body">
      <div class="flex items-center justify-between mb-4">
        <h2 class="card-title">Version History</h2>
        <div v-if="stats" class="text-sm opacity-70">
          {{ stats.totalVersions }} versions
        </div>
      </div>

      <!-- Loading State -->
      <div v-if="loading" class="flex justify-center py-8">
        <span class="loading loading-spinner loading-lg"></span>
      </div>

      <!-- Error State -->
      <div v-else-if="error" class="alert alert-error">
        <span>{{ error.message || 'Failed to load version history' }}</span>
      </div>

      <!-- Version List -->
      <div v-else-if="versions.length > 0" class="space-y-4">
        <div
          v-for="version in versions"
          :key="version.id"
          class="border border-base-300 rounded-lg p-4 hover:bg-base-50 transition-colors"
        >
          <div class="flex items-center justify-between mb-2">
            <div class="flex items-center gap-3">
              <div class="badge badge-primary">v{{ version.version_number }}</div>
              <div class="badge" :class="getChangeTypeBadgeClass(version.change_type)">
                {{ formatChangeType(version.change_type) }}
              </div>
            </div>
            <div class="text-sm opacity-70">
              {{ formatDate(version.created_at) }}
            </div>
          </div>

          <div v-if="version.change_summary" class="text-sm mb-3">
            {{ version.change_summary }}
          </div>

          <div class="flex gap-2">
            <button
              class="btn btn-sm btn-outline"
              @click="viewVersion(version)"
            >
              View
            </button>
            <button
              v-if="version.version_number < (stats?.latestVersion || 0)"
              class="btn btn-sm btn-warning"
              @click="restoreVersion(version)"
              :disabled="restoring === version.id"
            >
              <span v-if="restoring === version.id" class="loading loading-spinner loading-xs"></span>
              {{ restoring === version.id ? 'Restoring...' : 'Restore' }}
            </button>
            <button
              v-if="selectedVersion && selectedVersion.id !== version.id"
              class="btn btn-sm btn-ghost"
              @click="compareWith(version)"
            >
              Compare
            </button>
          </div>
        </div>
      </div>

      <!-- Empty State -->
      <div v-else class="text-center py-8">
        <div class="text-base-content/60">No version history available</div>
      </div>

      <!-- Comparison Modal -->
      <div v-if="showComparison" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div class="modal-box max-w-4xl">
          <h3 class="font-bold text-lg mb-4">Version Comparison</h3>
          
          <div class="grid grid-cols-2 gap-4 mb-4">
            <div>
              <h4 class="font-semibold">Version {{ comparisonVersions.from?.version_number }}</h4>
              <div class="text-sm opacity-70">{{ formatDate(comparisonVersions.from?.created_at) }}</div>
            </div>
            <div>
              <h4 class="font-semibold">Version {{ comparisonVersions.to?.version_number }}</h4>
              <div class="text-sm opacity-70">{{ formatDate(comparisonVersions.to?.created_at) }}</div>
            </div>
          </div>

          <div v-if="comparison.length > 0" class="space-y-2">
            <div
              v-for="change in comparison"
              :key="change.field"
              class="p-3 border border-base-300 rounded"
            >
              <div class="font-medium">{{ formatFieldName(change.field) }}</div>
              <div class="text-sm space-y-1">
                <div class="text-red-600">- {{ change.oldValue }}</div>
                <div class="text-green-600">+ {{ change.newValue }}</div>
              </div>
            </div>
          </div>
          <div v-else class="text-center py-4">
            No differences found between these versions.
          </div>

          <div class="modal-action">
            <button class="btn" @click="closeComparison">Close</button>
          </div>
        </div>
      </div>

      <!-- Version Viewer Modal -->
      <div v-if="viewingVersion" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div class="modal-box max-w-4xl max-h-screen overflow-y-auto">
          <h3 class="font-bold text-lg mb-4">
            Version {{ viewingVersion.version_number }} Preview
          </h3>
          
          <div class="mb-4">
            <div class="badge badge-primary">{{ viewingVersion.change_type }}</div>
            <span class="ml-2 text-sm opacity-70">{{ formatDate(viewingVersion.created_at) }}</span>
          </div>

          <!-- Card Preview using the version data -->
          <div class="border border-base-300 rounded-lg p-4">
            <StructuredDataPreview
              :data="convertVersionDataToFormData(viewingVersion.card_data)"
              theme="default"
            />
          </div>

          <div class="modal-action">
            <button class="btn" @click="closeViewer">Close</button>
            <button
              v-if="viewingVersion.version_number < (stats?.latestVersion || 0)"
              class="btn btn-warning"
              @click="restoreVersion(viewingVersion)"
              :disabled="restoring === viewingVersion.id"
            >
              <span v-if="restoring === viewingVersion.id" class="loading loading-spinner loading-xs"></span>
              {{ restoring === viewingVersion.id ? 'Restoring...' : 'Restore This Version' }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { CardVersion } from '~/server/utils/versioning'
import type { CardFormData } from '~/types/schemas'

interface Props {
  cardId: string
}

const props = defineProps<Props>()
const { addToast } = useToasts()

// State
const loading = ref(true)
const error = ref<Error | null>(null)
const versions = ref<CardVersion[]>([])
const stats = ref<any>(null)
const restoring = ref<string | null>(null)

// Comparison state
const showComparison = ref(false)
const selectedVersion = ref<CardVersion | null>(null)
const comparisonVersions = ref<{ from: CardVersion | null; to: CardVersion | null }>({
  from: null,
  to: null
})
const comparison = ref<any[]>([])

// Viewer state
const viewingVersion = ref<CardVersion | null>(null)

// Fetch version history
const fetchVersions = async () => {
  loading.value = true
  error.value = null
  
  try {
    const response = await $fetch(`/api/cards/${props.cardId}/versions`)
    versions.value = response.versions
    stats.value = response.stats
  } catch (err) {
    error.value = err as Error
  } finally {
    loading.value = false
  }
}

// Format functions
const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const formatChangeType = (changeType: string) => {
  return changeType.charAt(0).toUpperCase() + changeType.slice(1)
}

const formatFieldName = (field: string) => {
  return field.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
}

const getChangeTypeBadgeClass = (changeType: string) => {
  switch (changeType) {
    case 'created': return 'badge-success'
    case 'updated': return 'badge-info'
    case 'published': return 'badge-primary'
    case 'archived': return 'badge-ghost'
    case 'restored': return 'badge-warning'
    default: return 'badge-outline'
  }
}

// Actions
const viewVersion = (version: CardVersion) => {
  viewingVersion.value = version
}

const closeViewer = () => {
  viewingVersion.value = null
}

const restoreVersion = async (version: CardVersion) => {
  if (!confirm(`Are you sure you want to restore to version ${version.version_number}? This will create a new version with the restored content.`)) {
    return
  }

  restoring.value = version.id
  
  try {
    await $fetch(`/api/cards/${props.cardId}/versions/${version.version_number}/restore`, {
      method: 'POST'
    })
    
    addToast({
      title: 'Success',
      description: `Card restored to version ${version.version_number}`,
      type: 'success'
    })
    
    // Refresh versions and close modals
    await fetchVersions()
    closeViewer()
    closeComparison()
    
    // Emit event to parent to refresh card data
    emit('restored')
  } catch (err) {
    console.error('Failed to restore version:', err)
    addToast({
      title: 'Error',
      description: 'Failed to restore version. Please try again.',
      type: 'error'
    })
  } finally {
    restoring.value = null
  }
}

const compareWith = (version: CardVersion) => {
  comparisonVersions.value = {
    from: selectedVersion.value,
    to: version
  }
  
  // TODO: Implement actual comparison logic
  comparison.value = []
  showComparison.value = true
}

const closeComparison = () => {
  showComparison.value = false
  selectedVersion.value = null
  comparisonVersions.value = { from: null, to: null }
  comparison.value = []
}

// Convert version data to form data format
const convertVersionDataToFormData = (versionData: any): CardFormData => {
  return {
    type: versionData.type,
    title: versionData.title,
    description: versionData.description || '',
    image: versionData.image_url,
    ingredients: versionData.ingredients?.map((ing: any) => ({
      name: ing.ingredient_name || ing.name,
      amount: ing.amount?.toString() || '',
      unit: ing.unit || ''
    })) || [],
    instructions: versionData.instructions?.map((inst: any) => ({
      name: inst.title || '',
      text: inst.content
    })) || [],
    prepTime: versionData.prep_time,
    cookTime: versionData.cook_time,
    totalTime: versionData.total_time,
    servings: versionData.servings
  }
}

// Events
const emit = defineEmits<{
  restored: []
}>()

// Lifecycle
onMounted(() => {
  fetchVersions()
})

// Expose refresh function
defineExpose({
  refresh: fetchVersions
})
</script>