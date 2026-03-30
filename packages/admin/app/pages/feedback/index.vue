<template>
  <div class="min-h-screen">
    <div class="px-6 py-8 max-w-[1400px] mx-auto">
      <!-- Header -->
      <div class="mb-8">
        <div class="flex items-center gap-2 text-xs font-medium tracking-widest uppercase mb-2">
          <span class="text-base-content/50">Feedback</span>
        </div>
        <div>
          <h1 class="text-4xl text-base-content" style="font-family: 'Instrument Serif', serif; font-weight: 400; letter-spacing: -0.02em; line-height: 1.1;">
            Feedback Reports
          </h1>
          <p class="text-base-content/60 mt-2">Error reports submitted from plugin admin interfaces</p>
        </div>
      </div>

      <!-- Filters Card -->
      <div class="bg-base-100 rounded-xl border border-base-300/50 p-6 shadow-sm mb-6">
        <div class="flex flex-col sm:flex-row gap-4">
          <div class="flex-1">
            <AdminSearchInput
              v-model="searchQuery"
              placeholder="Search by error message or user message..."
              :debounce="300"
              @search="handleSearch"
            />
          </div>
          <div class="flex gap-2">
            <AdminFilterDropdown
              v-model="statusFilter"
              :options="statusOptions"
              label="Status"
              @change="handleFilterChange"
            />
            <button
              class="btn btn-sm gap-2"
              :class="groupMode ? 'btn-primary' : 'btn-outline'"
              @click="groupMode = !groupMode"
            >
              <svg class="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
              Group
            </button>
          </div>
        </div>
      </div>

      <!-- Bulk Actions Bar -->
      <div
        v-if="selectedIds.size > 0"
        class="bg-primary/10 border border-primary/20 rounded-xl px-6 py-3 mb-4 flex items-center justify-between"
      >
        <span class="text-sm font-medium">
          {{ selectedIds.size }} report{{ selectedIds.size === 1 ? '' : 's' }} selected
        </span>
        <div class="flex items-center gap-2">
          <button class="btn btn-xs btn-ghost" @click="selectedIds.clear()">Clear</button>
          <button class="btn btn-xs btn-info" @click="bulkUpdateStatus('new')" :disabled="bulkUpdating">New</button>
          <button class="btn btn-xs btn-warning" @click="bulkUpdateStatus('acknowledged')" :disabled="bulkUpdating">Acknowledge</button>
          <button class="btn btn-xs btn-success" @click="bulkUpdateStatus('resolved')" :disabled="bulkUpdating">Resolve</button>
        </div>
      </div>

      <!-- Reports Table Card -->
      <div class="bg-base-100 rounded-xl border border-base-300/50 shadow-sm hover:shadow-md hover:border-base-300 transition-all duration-300">
        <!-- Loading State -->
        <div v-if="loading" class="flex items-center justify-center py-16">
          <div class="flex flex-col items-center gap-4">
            <span class="loading loading-spinner loading-lg text-primary"></span>
            <p class="text-sm text-base-content/50 font-light tracking-wide">Loading feedback reports...</p>
          </div>
        </div>

        <!-- Error State -->
        <div v-else-if="error" class="flex items-center justify-center py-16">
          <div class="max-w-md text-center space-y-6">
            <div class="inline-flex items-center justify-center w-16 h-16 rounded-full bg-error/10 border border-error/20">
              <svg class="w-8 h-8 text-error" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div class="space-y-2">
              <h3 class="text-xl text-base-content" style="font-family: 'Instrument Serif', serif;">Unable to Load Reports</h3>
              <p class="text-sm text-base-content/60 leading-relaxed">{{ error }}</p>
            </div>
            <button class="btn btn-outline btn-sm" @click="fetchReports">
              Try Again
            </button>
          </div>
        </div>

        <!-- Grouped Table -->
        <div v-else-if="groupMode && groupedReports.length > 0">
          <div class="overflow-x-auto">
            <table class="w-full">
              <thead>
                <tr class="border-b border-base-300/50">
                  <th class="py-4 px-6 w-10">
                    <input
                      type="checkbox"
                      class="checkbox checkbox-sm"
                      :checked="allGroupedSelected"
                      :indeterminate="someGroupedSelected && !allGroupedSelected"
                      @change="toggleAllGrouped"
                    />
                  </th>
                  <th class="text-left py-4 px-6 text-xs font-medium text-base-content/50 uppercase tracking-wider">Error</th>
                  <th class="text-left py-4 px-6 text-xs font-medium text-base-content/50 uppercase tracking-wider">Count</th>
                  <th class="text-left py-4 px-6 text-xs font-medium text-base-content/50 uppercase tracking-wider">Sites</th>
                  <th class="text-left py-4 px-6 text-xs font-medium text-base-content/50 uppercase tracking-wider">Status</th>
                  <th class="text-left py-4 px-6 text-xs font-medium text-base-content/50 uppercase tracking-wider">Latest</th>
                  <th class="text-left py-4 px-6 text-xs font-medium text-base-content/50 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="group in groupedReports"
                  :key="group.id"
                  class="border-b border-base-300/30 last:border-b-0 hover:bg-base-50 transition-colors"
                >
                  <td class="py-4 px-6">
                    <input
                      type="checkbox"
                      class="checkbox checkbox-sm"
                      :checked="groupIdsSelected(group.report_ids)"
                      @change="toggleGroupIds(group.report_ids)"
                    />
                  </td>
                  <td class="py-4 px-6">
                    <span class="text-sm text-base-content truncate block max-w-[400px]">{{ group.error_message }}</span>
                  </td>
                  <td class="py-4 px-6">
                    <span class="badge badge-ghost badge-sm font-mono">{{ group.occurrence_count }}</span>
                  </td>
                  <td class="py-4 px-6">
                    <span class="text-sm text-base-content/70">{{ group.site_count }} site{{ group.site_count === 1 ? '' : 's' }}</span>
                  </td>
                  <td class="py-4 px-6">
                    <span class="badge badge-sm" :class="getStatusBadgeClass(group.status)">
                      {{ group.status }}
                    </span>
                  </td>
                  <td class="py-4 px-6">
                    <span class="text-sm text-base-content/70">{{ formatDate(group.latest_at) }}</span>
                  </td>
                  <td class="py-4 px-6">
                    <NuxtLink
                      :to="`/feedback/group/${encodeErrorHash(group.error_message)}`"
                      class="btn btn-ghost btn-xs"
                    >
                      View All
                    </NuxtLink>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- Pagination (grouped) -->
          <FeedbackPagination
            v-if="pagination.totalPages > 1"
            :pagination="pagination"
            :start-index="startIndex"
            :end-index="endIndex"
            :visible-pages="visiblePages"
            @page-change="handlePageChange"
          />
        </div>

        <!-- Flat Table -->
        <div v-else-if="reports.length > 0">
          <div class="overflow-x-auto">
            <table class="w-full">
              <thead>
                <tr class="border-b border-base-300/50">
                  <th class="py-4 px-6 w-10">
                    <input
                      type="checkbox"
                      class="checkbox checkbox-sm"
                      :checked="allSelected"
                      :indeterminate="someSelected && !allSelected"
                      @change="toggleAll"
                    />
                  </th>
                  <th class="text-left py-4 px-6 text-xs font-medium text-base-content/50 uppercase tracking-wider">Date</th>
                  <th class="text-left py-4 px-6 text-xs font-medium text-base-content/50 uppercase tracking-wider">Site</th>
                  <th class="text-left py-4 px-6 text-xs font-medium text-base-content/50 uppercase tracking-wider">Error</th>
                  <th class="text-left py-4 px-6 text-xs font-medium text-base-content/50 uppercase tracking-wider">Status</th>
                  <th class="text-left py-4 px-6 text-xs font-medium text-base-content/50 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="report in reports"
                  :key="report.id"
                  class="border-b border-base-300/30 last:border-b-0 hover:bg-base-50 transition-colors"
                >
                  <td class="py-4 px-6">
                    <input
                      type="checkbox"
                      class="checkbox checkbox-sm"
                      :checked="selectedIds.has(report.id)"
                      @change="toggleSelect(report.id)"
                    />
                  </td>
                  <td class="py-4 px-6">
                    <span class="text-sm text-base-content/70">{{ formatDate(report.createdAt) }}</span>
                  </td>
                  <td class="py-4 px-6">
                    <div class="flex flex-col">
                      <span class="font-medium text-base-content">{{ report.site_name || 'Unknown' }}</span>
                      <span class="text-xs text-base-content/50 truncate max-w-[200px]">{{ report.site_url }}</span>
                    </div>
                  </td>
                  <td class="py-4 px-6">
                    <span class="text-sm text-base-content truncate block max-w-[300px]">{{ report.error_message }}</span>
                  </td>
                  <td class="py-4 px-6">
                    <span class="badge badge-sm" :class="getStatusBadgeClass(report.status)">
                      {{ report.status }}
                    </span>
                  </td>
                  <td class="py-4 px-6">
                    <NuxtLink
                      :to="`/feedback/${report.id}`"
                      class="btn btn-ghost btn-xs"
                    >
                      View
                    </NuxtLink>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- Pagination (flat) -->
          <FeedbackPagination
            v-if="pagination.totalPages > 1"
            :pagination="pagination"
            :start-index="startIndex"
            :end-index="endIndex"
            :visible-pages="visiblePages"
            @page-change="handlePageChange"
          />
        </div>

        <!-- Empty State -->
        <div v-else class="flex flex-col items-center justify-center py-16 text-center">
          <div class="inline-flex items-center justify-center w-16 h-16 rounded-full bg-base-200 text-base-content/30 mb-4">
            <svg class="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          </div>
          <h3 class="text-lg text-base-content mb-1" style="font-family: 'Instrument Serif', serif;">No Feedback Reports</h3>
          <p class="text-sm text-base-content/50">No error reports match the current filters</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch, onMounted } from 'vue'

definePageMeta({
  layout: 'admin'
})

interface FeedbackReport {
  id: number
  site_id: number
  error_message: string
  create_version: string | null
  wp_version: string | null
  php_version: string | null
  current_url: string | null
  user_message: string | null
  status: string
  admin_notes: string | null
  createdAt: string
  updatedAt: string
  site_name: string | null
  site_url: string | null
}

interface GroupedReport {
  id: number
  error_message: string
  status: string
  occurrence_count: number
  site_count: number
  latest_at: string
  earliest_at: string
  report_ids: string
}

interface Pagination {
  page: number
  limit: number
  total: number
  totalPages: number
}

const reports = ref<FeedbackReport[]>([])
const groupedReports = ref<GroupedReport[]>([])
const pagination = ref<Pagination>({
  page: 1,
  limit: 20,
  total: 0,
  totalPages: 0,
})
const loading = ref(false)
const error = ref<string | null>(null)
const bulkUpdating = ref(false)

const searchQuery = ref('')
const statusFilter = ref<string | number | null>('active')
const groupMode = ref(true)
const selectedIds = reactive(new Set<number>())

const statusOptions = [
  { value: 'active', label: 'Active' },
  { value: 'new', label: 'New' },
  { value: 'acknowledged', label: 'Acknowledged' },
  { value: 'resolved', label: 'Resolved' },
]

const startIndex = computed(() => (pagination.value.page - 1) * pagination.value.limit)
const endIndex = computed(() => startIndex.value + pagination.value.limit)

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

// Flat mode selection
const allSelected = computed(() => reports.value.length > 0 && reports.value.every(r => selectedIds.has(r.id)))
const someSelected = computed(() => reports.value.some(r => selectedIds.has(r.id)))

const toggleAll = () => {
  if (allSelected.value) {
    reports.value.forEach(r => selectedIds.delete(r.id))
  } else {
    reports.value.forEach(r => selectedIds.add(r.id))
  }
}

const toggleSelect = (id: number) => {
  if (selectedIds.has(id)) {
    selectedIds.delete(id)
  } else {
    selectedIds.add(id)
  }
}

// Grouped mode selection
const parseGroupIds = (reportIds: string): number[] => {
  return reportIds.split(',').map(Number).filter(id => !isNaN(id))
}

const allGroupedSelected = computed(() => {
  if (groupedReports.value.length === 0) return false
  return groupedReports.value.every(g => {
    const ids = parseGroupIds(g.report_ids)
    return ids.every(id => selectedIds.has(id))
  })
})

const someGroupedSelected = computed(() => {
  return groupedReports.value.some(g => {
    const ids = parseGroupIds(g.report_ids)
    return ids.some(id => selectedIds.has(id))
  })
})

const groupIdsSelected = (reportIds: string): boolean => {
  const ids = parseGroupIds(reportIds)
  return ids.every(id => selectedIds.has(id))
}

const toggleGroupIds = (reportIds: string) => {
  const ids = parseGroupIds(reportIds)
  const allSelected = ids.every(id => selectedIds.has(id))
  if (allSelected) {
    ids.forEach(id => selectedIds.delete(id))
  } else {
    ids.forEach(id => selectedIds.add(id))
  }
}

const toggleAllGrouped = () => {
  if (allGroupedSelected.value) {
    groupedReports.value.forEach(g => {
      parseGroupIds(g.report_ids).forEach(id => selectedIds.delete(id))
    })
  } else {
    groupedReports.value.forEach(g => {
      parseGroupIds(g.report_ids).forEach(id => selectedIds.add(id))
    })
  }
}

// Bulk actions
const bulkUpdateStatus = async (status: string) => {
  if (selectedIds.size === 0) return
  bulkUpdating.value = true

  try {
    await $fetch('/api/admin/feedback/bulk', {
      method: 'PATCH',
      body: {
        ids: Array.from(selectedIds),
        status,
      },
    })
    selectedIds.clear()
    await fetchReports()
  } catch (err: any) {
    console.error('Bulk update failed:', err)
  } finally {
    bulkUpdating.value = false
  }
}

const fetchReports = async () => {
  loading.value = true
  error.value = null

  try {
    const params = new URLSearchParams()
    params.append('page', pagination.value.page.toString())
    params.append('limit', pagination.value.limit.toString())

    if (searchQuery.value) {
      params.append('search', searchQuery.value)
    }

    if (statusFilter.value) {
      params.append('status', statusFilter.value.toString())
    }

    if (groupMode.value) {
      params.append('group', 'true')
    }

    const response = await $fetch<{
      data: any[]
      grouped: boolean
      pagination: Pagination
    }>(`/api/admin/feedback?${params.toString()}`)

    if (response.grouped) {
      groupedReports.value = response.data as GroupedReport[]
      reports.value = []
    } else {
      reports.value = response.data as FeedbackReport[]
      groupedReports.value = []
    }
    pagination.value = response.pagination
  } catch (err: any) {
    console.error('Failed to fetch feedback reports:', err)
    error.value = err?.data?.message || 'Failed to load feedback reports. Please try again.'
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchReports()
})

watch([searchQuery, statusFilter, groupMode], () => {
  pagination.value.page = 1
  selectedIds.clear()
  fetchReports()
})

const handleSearch = () => {
  pagination.value.page = 1
  fetchReports()
}

const handleFilterChange = () => {
  pagination.value.page = 1
  fetchReports()
}

const handlePageChange = (page: number) => {
  if (page >= 1 && page <= pagination.value.totalPages) {
    pagination.value.page = page
    fetchReports()
  }
}

const formatDate = (dateString: string): string => {
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  if (diffDays === 0) return 'Today'
  if (diffDays === 1) return 'Yesterday'
  if (diffDays < 7) return `${diffDays} days ago`
  if (diffDays < 30) {
    const weeks = Math.floor(diffDays / 7)
    return `${weeks} ${weeks === 1 ? 'week' : 'weeks'} ago`
  }
  if (diffDays < 365) {
    const months = Math.floor(diffDays / 30)
    return `${months} ${months === 1 ? 'month' : 'months'} ago`
  }
  return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
}

const encodeErrorHash = (errorMessage: string): string => {
  return btoa(errorMessage).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

const getStatusBadgeClass = (status: string): string => {
  const map: Record<string, string> = {
    new: 'badge-info',
    acknowledged: 'badge-warning',
    resolved: 'badge-success',
  }
  return map[status] || 'badge-ghost'
}
</script>
