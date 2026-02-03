<template>
  <div class="p-8">
    <div class="admin-page-header mb-8">
      <h1 class="admin-page-title">Audit Logs</h1>
      <p class="admin-page-subtitle">Track all administrative actions and changes</p>
    </div>

    <!-- Filters -->
    <div class="flex flex-wrap gap-3 mb-6">
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
    </div>

    <!-- Error State -->
    <div v-if="error" class="alert alert-error mb-6">
      <svg xmlns="http://www.w3.org/2000/svg" class="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      <div>
        <h3 class="font-bold">Failed to load audit logs</h3>
        <div class="text-xs">{{ error }}</div>
      </div>
      <button class="btn btn-sm btn-ghost" @click="fetchAuditLogs">
        Retry
      </button>
    </div>

    <!-- Audit Logs Table -->
    <AdminDataTable
      :columns="columns"
      :data="logs"
      :loading="loading"
      :page-size="20"
    >
      <!-- Timestamp Column -->
      <template #cell-timestamp="{ value }">
        <span class="text-sm whitespace-nowrap">{{ formatTimestamp(value) }}</span>
      </template>

      <!-- Admin Column -->
      <template #cell-admin="{ row }">
        <div class="flex flex-col">
          <span class="text-sm font-medium">{{ row.admin_name || 'Unknown' }}</span>
          <span class="text-xs text-base-content/60">{{ row.admin_email }}</span>
        </div>
      </template>

      <!-- Action Column -->
      <template #cell-action="{ value }">
        <AdminBadge
          :status="getActionVariant(value)"
          :custom-text="value"
          variant="status"
          :show-dot="false"
        />
      </template>

      <!-- Entity Column -->
      <template #cell-entity="{ row }">
        <span class="text-sm font-mono">{{ row.entity_type }} #{{ row.entity_id }}</span>
      </template>

      <!-- Changes Column -->
      <template #cell-changes="{ row }">
        <div class="flex items-center gap-2">
          <span class="text-sm text-base-content/60 truncate max-w-xs">
            {{ formatChangesPreview(row.changes) }}
          </span>
          <button
            v-if="row.changes"
            class="btn btn-xs btn-ghost"
            @click="toggleExpandedRow(row.id)"
          >
            {{ expandedRows.has(row.id) ? 'Hide' : 'View full' }}
          </button>
        </div>
        <!-- Expanded Changes -->
        <div v-if="expandedRows.has(row.id)" class="mt-3 p-4 bg-base-200 rounded-lg">
          <div class="text-xs font-semibold mb-2 text-base-content/70">Full Changes:</div>
          <pre class="text-xs overflow-x-auto bg-base-300 p-3 rounded"><code>{{ formatChanges(row.changes) }}</code></pre>
          <div v-if="row.ip_address" class="mt-3 text-xs text-base-content/60">
            IP Address: <span class="font-mono">{{ row.ip_address }}</span>
          </div>
        </div>
      </template>
    </AdminDataTable>

    <!-- Pagination -->
    <div
      v-if="!loading && logs.length > 0 && pagination.totalPages > 1"
      class="border-t border-base-300 px-6 py-4 flex items-center justify-between mt-6"
    >
      <div class="text-base-content/60 text-sm">
        Showing {{ (pagination.page - 1) * pagination.limit + 1 }} to {{ Math.min(pagination.page * pagination.limit, pagination.total) }} of {{ pagination.total }} results
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
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'

definePageMeta({
  layout: 'admin',
})

interface AuditLog {
  id: number
  admin_id: number
  admin_name: string
  admin_email: string
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
  logs: AuditLog[]
  pagination: Pagination
}

const columns = [
  { key: 'timestamp', label: 'Timestamp' },
  { key: 'admin', label: 'Admin' },
  { key: 'action', label: 'Action' },
  { key: 'entity', label: 'Entity' },
  { key: 'changes', label: 'Changes' },
]

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

const formatTimestamp = (timestamp: string): string => {
  const date = new Date(timestamp)
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  })
}

const getActionVariant = (action: string): string => {
  const actionColors: Record<string, string> = {
    login: 'info',
    logout: 'info',
    create: 'success',
    update: 'warning',
    delete: 'error',
  }
  return actionColors[action.toLowerCase()] || 'neutral'
}

const formatChangesPreview = (changes: Record<string, any> | null): string => {
  if (!changes) return 'No changes'

  const changeText = JSON.stringify(changes)
  return changeText.length > 50 ? changeText.substring(0, 50) + '...' : changeText
}

const formatChanges = (changes: Record<string, any> | null): string => {
  if (!changes) return 'No changes'
  return JSON.stringify(changes, null, 2)
}

const toggleExpandedRow = (rowId: number) => {
  if (expandedRows.value.has(rowId)) {
    expandedRows.value.delete(rowId)
  } else {
    expandedRows.value.add(rowId)
  }
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
    logs.value = response.logs
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
