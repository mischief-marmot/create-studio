<template>
  <div class="min-h-screen">
    <!-- Content -->
    <div class="px-6 py-8 max-w-[1400px] mx-auto">
      <!-- Header -->
      <div class="mb-12">
        <div class="space-y-2">
          <div class="flex items-center gap-2 text-xs font-medium tracking-widest uppercase">
            <span class="text-base-content/50">Administration</span>
            <span class="text-base-content/30">·</span>
            <span class="text-base-content/40">Activity Tracking</span>
          </div>
          <h1 class="text-4xl text-base-content" style="font-family: 'Instrument Serif', serif; font-weight: 400; letter-spacing: -0.02em; line-height: 1.1;">
            Audit Logs
          </h1>
          <p class="text-base-content/60 text-sm mt-2">Track all administrative actions and changes across the platform</p>
        </div>
      </div>

      <!-- Filters Card -->
      <div class="bg-base-100 rounded-xl border border-base-300/50 p-6 shadow-sm mb-6">
        <div class="flex flex-wrap items-center gap-4">
          <div class="flex items-center gap-2">
            <span class="text-sm text-base-content/60 font-medium">Filter by:</span>
          </div>
          <AdminFilterDropdown
            v-model="selectedAction"
            :options="actionOptions"
            label="Action"
            @change="handleFilterChange"
          />
          <AdminFilterDropdown
            v-model="selectedEntityType"
            :options="entityTypeOptions"
            label="Entity Type"
            @change="handleFilterChange"
          />
          <button
            v-if="selectedAction || selectedEntityType"
            class="text-sm text-base-content/50 hover:text-base-content transition-colors"
            @click="clearFilters"
          >
            Clear filters
          </button>
        </div>
      </div>

      <!-- Error State -->
      <div v-if="error" class="flex items-center justify-center min-h-[40vh]">
        <div class="max-w-md text-center space-y-6">
          <div class="inline-flex items-center justify-center w-16 h-16 rounded-full bg-error/10 border border-error/20">
            <svg class="w-8 h-8 text-error" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div class="space-y-2">
            <h3 class="text-xl text-base-content" style="font-family: 'Instrument Serif', serif;">Failed to Load Audit Logs</h3>
            <p class="text-sm text-base-content/60 leading-relaxed">{{ error }}</p>
          </div>
          <button class="btn btn-outline btn-sm" @click="fetchAuditLogs">
            Try Again
          </button>
        </div>
      </div>

      <!-- Loading State -->
      <div v-else-if="loading" class="flex items-center justify-center min-h-[40vh]">
        <div class="flex flex-col items-center gap-4">
          <span class="loading loading-spinner loading-lg text-primary"></span>
          <p class="text-sm text-base-content/50 font-light tracking-wide">Loading audit logs...</p>
        </div>
      </div>

      <!-- Audit Logs Table -->
      <div v-else-if="logs.length > 0" class="bg-base-100 rounded-xl border border-base-300/50 shadow-sm hover:shadow-md hover:border-base-300 transition-all duration-300">
        <div class="overflow-x-auto">
          <table class="w-full">
            <thead>
              <tr class="border-b border-base-300/50">
                <th class="text-left py-4 px-6 text-xs font-medium text-base-content/50 uppercase tracking-wider">Timestamp</th>
                <th class="text-left py-4 px-6 text-xs font-medium text-base-content/50 uppercase tracking-wider">Admin</th>
                <th class="text-left py-4 px-6 text-xs font-medium text-base-content/50 uppercase tracking-wider">Action</th>
                <th class="text-left py-4 px-6 text-xs font-medium text-base-content/50 uppercase tracking-wider">Entity</th>
                <th class="text-left py-4 px-6 text-xs font-medium text-base-content/50 uppercase tracking-wider">Details</th>
              </tr>
            </thead>
            <tbody>
              <template v-for="log in logs" :key="log.id">
                <tr class="border-b border-base-300/30 last:border-b-0 hover:bg-base-50 transition-colors">
                  <!-- Timestamp -->
                  <td class="py-4 px-6">
                    <div class="text-sm text-base-content font-medium whitespace-nowrap">{{ formatDate(log.createdAt) }}</div>
                    <div class="text-xs text-base-content/50">{{ formatTime(log.createdAt) }}</div>
                  </td>

                  <!-- Admin -->
                  <td class="py-4 px-6">
                    <div class="text-sm text-base-content font-medium">{{ log.adminName || 'Unknown' }}</div>
                    <div class="text-xs text-base-content/50">{{ log.adminEmail }}</div>
                  </td>

                  <!-- Action -->
                  <td class="py-4 px-6">
                    <span class="text-sm font-medium text-base-content">{{ formatAction(log.action) }}</span>
                  </td>

                  <!-- Entity -->
                  <td class="py-4 px-6">
                    <div class="flex items-center gap-2">
                      <span class="text-sm text-base-content">{{ formatEntityType(log.entity_type) }}</span>
                      <span class="text-xs text-base-content/40 font-mono">#{{ log.entity_id }}</span>
                    </div>
                  </td>

                  <!-- Details -->
                  <td class="py-4 px-6">
                    <div class="flex items-center gap-3">
                      <span class="text-sm text-base-content/60 truncate max-w-[200px]">
                        {{ formatChangesPreview(log.changes) }}
                      </span>
                      <button
                        v-if="log.changes"
                        class="text-xs text-primary hover:underline font-medium whitespace-nowrap"
                        @click="toggleExpandedRow(log.id)"
                      >
                        {{ expandedRows.has(log.id) ? 'Hide details' : 'View details' }}
                      </button>
                    </div>
                  </td>
                </tr>

                <!-- Expanded Row -->
                <tr v-if="expandedRows.has(log.id)" class="bg-base-200/30">
                  <td colspan="5" class="px-6 py-4">
                    <div class="space-y-4">
                      <div>
                        <div class="text-xs font-medium text-base-content/50 uppercase tracking-wider mb-2">Change Details</div>
                        <pre class="text-xs font-mono bg-base-200 p-4 rounded-lg overflow-x-auto text-base-content/80"><code>{{ formatChanges(log.changes) }}</code></pre>
                      </div>
                      <div v-if="log.ip_address" class="flex items-center gap-2">
                        <span class="text-xs font-medium text-base-content/50 uppercase tracking-wider">IP Address:</span>
                        <span class="text-xs font-mono text-base-content/70">{{ log.ip_address }}</span>
                      </div>
                    </div>
                  </td>
                </tr>
              </template>
            </tbody>
          </table>
        </div>

        <!-- Pagination -->
        <div
          v-if="pagination.totalPages > 1"
          class="border-t border-base-300/50 px-6 py-4 flex items-center justify-between"
        >
          <div class="text-base-content/60 text-sm">
            Showing {{ (pagination.page - 1) * pagination.limit + 1 }} to {{ Math.min(pagination.page * pagination.limit, pagination.total) }} of {{ pagination.total }} entries
          </div>
          <div class="flex items-center gap-2">
            <button
              class="btn btn-sm btn-ghost"
              :disabled="pagination.page === 1"
              @click="handlePageChange(pagination.page - 1)"
              aria-label="Previous page"
            >
              <svg class="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
              </svg>
            </button>

            <div class="flex items-center gap-1">
              <button
                v-for="page in visiblePages"
                :key="page"
                class="btn btn-sm"
                :class="page === pagination.page ? 'btn-primary' : 'btn-ghost'"
                @click="handlePageChange(page)"
                :aria-label="`Go to page ${page}`"
                :aria-current="page === pagination.page ? 'page' : undefined"
              >
                {{ page }}
              </button>
            </div>

            <button
              class="btn btn-sm btn-ghost"
              :disabled="pagination.page === pagination.totalPages"
              @click="handlePageChange(pagination.page + 1)"
              aria-label="Next page"
            >
              <svg class="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      <!-- Empty State -->
      <div v-else class="bg-base-100 rounded-xl border border-base-300/50 p-12 shadow-sm">
        <div class="flex flex-col items-center justify-center text-center">
          <div class="inline-flex items-center justify-center w-16 h-16 rounded-full bg-base-200 text-base-content/30 mb-4">
            <svg class="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h3 class="text-lg text-base-content mb-1" style="font-family: 'Instrument Serif', serif; font-weight: 400;">No audit logs found</h3>
          <p class="text-sm text-base-content/50">Try adjusting your filters or check back later</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'

definePageMeta({
  layout: 'admin',
})

interface AuditLog {
  id: number
  admin_id: number
  adminName: string
  adminEmail: string
  action: string
  entity_type: string
  entity_id: number
  changes: Record<string, any> | null
  ip_address: string | null
  createdAt: string
}

interface Pagination {
  page: number
  limit: number
  total: number
  totalPages: number
}

interface AuditLogsResponse {
  data: AuditLog[]
  pagination: Pagination
}

const actionOptions = [
  { value: 'login', label: 'Login' },
  { value: 'logout', label: 'Logout' },
  { value: 'create', label: 'Create' },
  { value: 'update', label: 'Update' },
  { value: 'delete', label: 'Delete' },
]

const entityTypeOptions = [
  { value: 'user', label: 'User' },
  { value: 'subscription', label: 'Subscription' },
  { value: 'site', label: 'Site' },
  { value: 'admin', label: 'Admin' },
]

const loading = ref(true)
const error = ref<string | null>(null)
const logs = ref<AuditLog[]>([])
const pagination = ref<Pagination>({
  page: 1,
  limit: 20,
  total: 0,
  totalPages: 0,
})

const selectedAction = ref<string | number | null>(null)
const selectedEntityType = ref<string | number | null>(null)
const expandedRows = ref<Set<number>>(new Set())

const visiblePages = computed(() => {
  const pages: number[] = []
  const maxVisible = 5
  let start = Math.max(1, pagination.value.page - Math.floor(maxVisible / 2))
  let end = Math.min(pagination.value.totalPages, start + maxVisible - 1)

  if (end - start < maxVisible - 1) {
    start = Math.max(1, end - maxVisible + 1)
  }

  for (let i = start; i <= end; i++) {
    pages.push(i)
  }

  return pages
})

const formatDate = (timestamp: string): string => {
  const date = new Date(timestamp)
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

const formatTime = (timestamp: string): string => {
  const date = new Date(timestamp)
  return date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  })
}

const formatAction = (action: string): string => {
  const actionMap: Record<string, string> = {
    login: 'Login',
    logout: 'Logout',
    create: 'Created',
    update: 'Updated',
    delete: 'Deleted',
  }
  return actionMap[action.toLowerCase()] || action.charAt(0).toUpperCase() + action.slice(1)
}

const formatEntityType = (entityType: string): string => {
  const entityMap: Record<string, string> = {
    user: 'User',
    subscription: 'Subscription',
    site: 'Site',
    admin: 'Admin',
  }
  return entityMap[entityType.toLowerCase()] || entityType.charAt(0).toUpperCase() + entityType.slice(1)
}

const formatChangesPreview = (changes: Record<string, any> | null): string => {
  if (!changes) return 'No changes recorded'

  const keys = Object.keys(changes)
  if (keys.length === 0) return 'No changes recorded'

  if (keys.length === 1) {
    return `${keys[0]} modified`
  }

  return `${keys.length} fields modified`
}

const formatChanges = (changes: Record<string, any> | null): string => {
  if (!changes) return 'No changes recorded'
  return JSON.stringify(changes, null, 2)
}

const toggleExpandedRow = (rowId: number) => {
  if (expandedRows.value.has(rowId)) {
    expandedRows.value.delete(rowId)
  } else {
    expandedRows.value.add(rowId)
  }
}

const clearFilters = () => {
  selectedAction.value = null
  selectedEntityType.value = null
  pagination.value.page = 1
  expandedRows.value.clear()
  fetchAuditLogs()
}

const fetchAuditLogs = async () => {
  loading.value = true
  error.value = null

  try {
    const params = new URLSearchParams({
      page: pagination.value.page.toString(),
      limit: pagination.value.limit.toString(),
    })

    if (selectedAction.value) {
      params.append('action', selectedAction.value.toString())
    }

    if (selectedEntityType.value) {
      params.append('entity_type', selectedEntityType.value.toString())
    }

    const response = await $fetch<AuditLogsResponse>(`/api/admin/audit-logs?${params.toString()}`)
    logs.value = response.data || []
    pagination.value = response.pagination
  } catch (err: any) {
    error.value = err?.message || 'An unexpected error occurred'
    console.error('Failed to fetch audit logs:', err)
  } finally {
    loading.value = false
  }
}

const handleFilterChange = () => {
  pagination.value.page = 1
  expandedRows.value.clear()
  fetchAuditLogs()
}

const handlePageChange = (page: number) => {
  if (page >= 1 && page <= pagination.value.totalPages) {
    pagination.value.page = page
    expandedRows.value.clear()
    fetchAuditLogs()
  }
}

onMounted(() => {
  fetchAuditLogs()
})
</script>
