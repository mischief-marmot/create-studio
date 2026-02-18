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
          </div>
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

        <!-- Table -->
        <div v-else-if="reports.length > 0">
          <div class="overflow-x-auto">
            <table class="w-full">
              <thead>
                <tr class="border-b border-base-300/50">
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

          <!-- Pagination -->
          <div
            v-if="pagination.totalPages > 1"
            class="border-t border-base-300/50 px-6 py-4 flex items-center justify-between"
          >
            <div class="text-base-content/50 text-sm">
              Showing {{ startIndex + 1 }} to {{ Math.min(endIndex, pagination.total) }} of {{ pagination.total }} reports
            </div>
            <div class="flex items-center gap-2">
              <button
                class="p-2 rounded-lg text-base-content/50 hover:text-base-content hover:bg-base-200 transition-all disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-transparent"
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
                  class="min-w-[32px] h-8 px-2 rounded-lg text-sm font-medium transition-all"
                  :class="page === pagination.page
                    ? 'bg-primary text-primary-content'
                    : 'text-base-content/70 hover:text-base-content hover:bg-base-200'"
                  @click="handlePageChange(page)"
                  :aria-label="`Go to page ${page}`"
                  :aria-current="page === pagination.page ? 'page' : undefined"
                >
                  {{ page }}
                </button>
              </div>

              <button
                class="p-2 rounded-lg text-base-content/50 hover:text-base-content hover:bg-base-200 transition-all disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-transparent"
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
        <div v-else class="flex flex-col items-center justify-center py-16 text-center">
          <div class="inline-flex items-center justify-center w-16 h-16 rounded-full bg-base-200 text-base-content/30 mb-4">
            <svg class="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          </div>
          <h3 class="text-lg text-base-content mb-1" style="font-family: 'Instrument Serif', serif;">No Feedback Reports</h3>
          <p class="text-sm text-base-content/50">No error reports have been submitted yet</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'

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

interface Pagination {
  page: number
  limit: number
  total: number
  totalPages: number
}

const reports = ref<FeedbackReport[]>([])
const pagination = ref<Pagination>({
  page: 1,
  limit: 20,
  total: 0,
  totalPages: 0,
})
const loading = ref(false)
const error = ref<string | null>(null)

const searchQuery = ref('')
const statusFilter = ref<string | number | null>(null)

const statusOptions = [
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

    const response = await $fetch<{
      data: FeedbackReport[]
      pagination: Pagination
    }>(`/api/admin/feedback?${params.toString()}`)

    reports.value = response.data
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

watch([searchQuery, statusFilter], () => {
  pagination.value.page = 1
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

const getStatusBadgeClass = (status: string): string => {
  const map: Record<string, string> = {
    new: 'badge-info',
    acknowledged: 'badge-warning',
    resolved: 'badge-success',
  }
  return map[status] || 'badge-ghost'
}
</script>
