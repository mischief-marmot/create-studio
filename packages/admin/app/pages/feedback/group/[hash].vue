<template>
  <div class="min-h-screen">
    <div class="px-6 py-8 max-w-[1400px] mx-auto">
      <!-- Back link -->
      <NuxtLink to="/feedback" class="inline-flex items-center gap-1.5 text-xs text-base-content/50 hover:text-base-content transition-colors mb-6">
        <svg class="size-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 12H5m7 7-7-7 7-7" /></svg>
        Back to Feedback Reports
      </NuxtLink>

      <!-- Loading -->
      <div v-if="loading" class="flex items-center justify-center py-16">
        <div class="flex flex-col items-center gap-4">
          <span class="loading loading-spinner loading-lg text-primary"></span>
          <p class="text-sm text-base-content/50 font-light tracking-wide">Loading grouped error...</p>
        </div>
      </div>

      <!-- Error -->
      <div v-else-if="error" class="flex items-center justify-center py-16">
        <div class="max-w-md text-center space-y-4">
          <h3 class="text-xl text-base-content" style="font-family: 'Instrument Serif', serif;">Unable to Load</h3>
          <p class="text-sm text-base-content/60">{{ error }}</p>
          <button class="btn btn-outline btn-sm" @click="fetchGroup">Try Again</button>
        </div>
      </div>

      <template v-else-if="groupData">
        <!-- Header -->
        <div class="mb-6">
          <div class="flex items-center gap-2 text-xs font-medium tracking-widest uppercase mb-2">
            <span class="text-base-content/50">Feedback</span>
            <span class="text-base-content/30">&middot;</span>
            <span class="text-base-content/50">Grouped Error</span>
          </div>
          <h1 class="text-2xl lg:text-3xl text-base-content mb-3" style="font-family: 'Instrument Serif', serif; font-weight: 400; letter-spacing: -0.02em; line-height: 1.15;">
            <code class="text-error bg-error/10 px-1.5 py-0.5 rounded text-[0.85em] font-mono">{{ errorType }}</code>
            <span v-if="errorBody">: {{ errorBody }}</span>
          </h1>
          <div class="flex flex-wrap gap-4">
            <div class="flex items-center gap-1.5 text-sm text-base-content/50">
              <svg class="size-3.5 opacity-60" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
              <strong class="text-base-content">{{ groupData.stats.total_count }}</strong> occurrences
            </div>
            <div class="flex items-center gap-1.5 text-sm text-base-content/50">
              <svg class="size-3.5 opacity-60" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" /></svg>
              <strong class="text-base-content">{{ groupData.stats.site_count }}</strong> sites affected
            </div>
            <div class="flex items-center gap-1.5 text-sm text-base-content/50">
              <svg class="size-3.5 opacity-60" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              First seen <strong class="text-base-content">{{ formatDate(groupData.stats.earliest_at) }}</strong>
            </div>
            <div class="flex items-center gap-1.5 text-sm text-base-content/50">
              <svg class="size-3.5 opacity-60" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
              Latest <strong class="text-base-content">{{ formatDate(groupData.stats.latest_at) }}</strong>
            </div>
          </div>
        </div>

        <!-- Bulk actions bar -->
        <div
          v-if="selectedIds.size > 0"
          class="bg-primary/10 border border-primary/20 rounded-xl px-6 py-3 mb-4 flex items-center justify-between"
        >
          <span class="text-sm font-medium">{{ selectedIds.size }} report{{ selectedIds.size === 1 ? '' : 's' }} selected</span>
          <div class="flex items-center gap-2">
            <button class="btn btn-xs btn-ghost" @click="selectedIds.clear()">Clear</button>
            <button class="btn btn-xs btn-info" @click="bulkUpdateStatus('new')" :disabled="bulkUpdating">New</button>
            <button class="btn btn-xs btn-warning" @click="bulkUpdateStatus('acknowledged')" :disabled="bulkUpdating">Acknowledge</button>
            <button class="btn btn-xs btn-success" @click="bulkUpdateStatus('resolved')" :disabled="bulkUpdating">Resolve</button>
          </div>
        </div>

        <!-- Main layout -->
        <div class="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-6 items-start">
          <!-- Occurrences table -->
          <div class="bg-base-100 rounded-xl border border-base-300/50 shadow-sm hover:shadow-md hover:border-base-300 transition-all duration-300">
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
                    <th class="text-left py-4 px-6 text-xs font-medium text-base-content/50 uppercase tracking-wider">Versions</th>
                    <th class="text-left py-4 px-6 text-xs font-medium text-base-content/50 uppercase tracking-wider">User Message</th>
                    <th class="text-left py-4 px-6 text-xs font-medium text-base-content/50 uppercase tracking-wider">Status</th>
                    <th class="text-left py-4 px-6 text-xs font-medium text-base-content/50 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  <tr
                    v-for="report in groupData.data"
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
                      <span class="text-sm text-base-content/70 whitespace-nowrap">{{ formatDate(report.createdAt) }}</span>
                    </td>
                    <td class="py-4 px-6">
                      <div class="flex flex-col">
                        <span class="font-medium text-base-content text-sm">{{ report.site_name || 'Unknown' }}</span>
                        <span class="text-xs text-base-content/50 truncate max-w-[180px]">{{ report.site_url }}</span>
                      </div>
                    </td>
                    <td class="py-4 px-6">
                      <div class="text-sm text-base-content/70 font-mono">
                        {{ report.create_version || '—' }}
                        <span class="block text-xs text-base-content/40">WP {{ report.wp_version || '?' }}</span>
                      </div>
                    </td>
                    <td class="py-4 px-6">
                      <span v-if="report.user_message" class="text-sm text-base-content/50 italic truncate block max-w-[200px]">"{{ report.user_message }}"</span>
                      <span v-else class="text-xs text-base-content/30">—</span>
                    </td>
                    <td class="py-4 px-6">
                      <span class="badge badge-sm" :class="getStatusBadgeClass(report.status)">{{ report.status }}</span>
                    </td>
                    <td class="py-4 px-6">
                      <NuxtLink :to="`/feedback/${report.id}`" class="btn btn-ghost btn-xs">View</NuxtLink>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <!-- Pagination -->
            <FeedbackPagination
              v-if="groupData.pagination.totalPages > 1"
              :pagination="groupData.pagination"
              :start-index="startIndex"
              :end-index="endIndex"
              :visible-pages="visiblePages"
              @page-change="handlePageChange"
            />
          </div>

          <!-- Sidebar -->
          <aside class="flex flex-col gap-4">
            <!-- Affected Sites -->
            <div class="bg-base-100 rounded-xl border border-base-300/50 shadow-sm p-5">
              <h3 class="text-xs font-semibold uppercase tracking-widest text-base-content/50 mb-3">Affected Sites</h3>
              <div class="flex flex-wrap gap-1.5">
                <span
                  v-for="site in groupData.affectedSites"
                  :key="site.site_id"
                  class="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs rounded-lg bg-base-200 text-base-content"
                >
                  <span
                    class="w-1.5 h-1.5 rounded-full"
                    :class="site.has_new > 0 ? 'bg-info' : 'bg-success'"
                  ></span>
                  {{ site.site_name || site.site_url || 'Unknown' }}
                  <span class="text-base-content/40">({{ site.count }})</span>
                </span>
              </div>
            </div>

            <!-- Version Breakdown -->
            <div class="bg-base-100 rounded-xl border border-base-300/50 shadow-sm p-5">
              <h3 class="text-xs font-semibold uppercase tracking-widest text-base-content/50 mb-3">Version Breakdown</h3>
              <ul class="space-y-0">
                <li
                  v-for="v in groupData.versionBreakdown"
                  :key="`${v.create_version}-${v.wp_version}`"
                  class="flex items-center justify-between py-1.5 border-b border-base-300/30 last:border-b-0 text-sm"
                >
                  <span class="font-mono text-xs text-base-content">
                    {{ v.create_version || '?' }}
                    <span class="text-base-content/40"> / WP {{ v.wp_version || '?' }}</span>
                  </span>
                  <span class="text-xs text-base-content/50">{{ v.count }}</span>
                </li>
              </ul>
            </div>

            <!-- Status Summary -->
            <div class="bg-base-100 rounded-xl border border-base-300/50 shadow-sm p-5">
              <h3 class="text-xs font-semibold uppercase tracking-widest text-base-content/50 mb-3">Status Summary</h3>
              <ul class="space-y-0">
                <li class="flex items-center justify-between py-1.5 border-b border-base-300/30">
                  <span class="badge badge-sm badge-info">new</span>
                  <strong class="text-sm">{{ groupData.stats.new_count }}</strong>
                </li>
                <li class="flex items-center justify-between py-1.5 border-b border-base-300/30">
                  <span class="badge badge-sm badge-warning">acknowledged</span>
                  <strong class="text-sm">{{ groupData.stats.acknowledged_count }}</strong>
                </li>
                <li class="flex items-center justify-between py-1.5">
                  <span class="badge badge-sm badge-success">resolved</span>
                  <strong class="text-sm">{{ groupData.stats.resolved_count }}</strong>
                </li>
              </ul>

              <!-- Resolve All -->
              <div v-if="activeCount > 0" class="mt-4 pt-4 border-t border-base-300/50">
                <button
                  class="btn btn-success btn-sm w-full"
                  :disabled="bulkUpdating"
                  @click="resolveAll"
                >
                  <svg class="size-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" /></svg>
                  Resolve All {{ activeCount }} Active
                </button>
              </div>
            </div>
          </aside>
        </div>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'

definePageMeta({
  layout: 'admin'
})

interface GroupReport {
  id: number
  site_id: number
  error_message: string
  stack_trace: string | null
  create_version: string | null
  wp_version: string | null
  php_version: string | null
  current_url: string | null
  user_message: string | null
  user_email: string | null
  status: string
  admin_notes: string | null
  createdAt: string
  updatedAt: string
  site_name: string | null
  site_url: string | null
}

interface GroupData {
  error_message: string
  hash: string
  stats: {
    total_count: number
    site_count: number
    earliest_at: string
    latest_at: string
    new_count: number
    acknowledged_count: number
    resolved_count: number
  }
  versionBreakdown: { create_version: string | null; wp_version: string | null; count: number }[]
  affectedSites: { site_id: number; site_name: string | null; site_url: string | null; count: number; has_new: number }[]
  data: GroupReport[]
  pagination: { page: number; limit: number; total: number; totalPages: number }
}

const route = useRoute()
const groupData = ref<GroupData | null>(null)
const loading = ref(false)
const error = ref<string | null>(null)
const bulkUpdating = ref(false)
const selectedIds = reactive(new Set<number>())

const errorType = computed(() => {
  if (!groupData.value) return ''
  const msg = groupData.value.error_message
  const colonIdx = msg.indexOf(':')
  return colonIdx > 0 ? msg.substring(0, colonIdx) : msg
})

const errorBody = computed(() => {
  if (!groupData.value) return ''
  const msg = groupData.value.error_message
  const colonIdx = msg.indexOf(':')
  return colonIdx > 0 ? msg.substring(colonIdx + 1).trim() : ''
})

const activeCount = computed(() => {
  if (!groupData.value) return 0
  return (groupData.value.stats.new_count || 0) + (groupData.value.stats.acknowledged_count || 0)
})

const startIndex = computed(() => {
  if (!groupData.value) return 0
  return (groupData.value.pagination.page - 1) * groupData.value.pagination.limit
})

const endIndex = computed(() => {
  if (!groupData.value) return 0
  return startIndex.value + groupData.value.pagination.limit
})

const visiblePages = computed(() => {
  if (!groupData.value) return []
  const pages: number[] = []
  const maxVisible = 5
  const totalPages = groupData.value.pagination.totalPages
  const currentPage = groupData.value.pagination.page
  let start = Math.max(1, currentPage - Math.floor(maxVisible / 2))
  let end = Math.min(totalPages, start + maxVisible - 1)
  if (end - start < maxVisible - 1) start = Math.max(1, end - maxVisible + 1)
  for (let i = start; i <= end; i++) pages.push(i)
  return pages
})

// Selection
const allSelected = computed(() => {
  if (!groupData.value || groupData.value.data.length === 0) return false
  return groupData.value.data.every(r => selectedIds.has(r.id))
})

const someSelected = computed(() => {
  if (!groupData.value) return false
  return groupData.value.data.some(r => selectedIds.has(r.id))
})

const toggleAll = () => {
  if (!groupData.value) return
  if (allSelected.value) {
    groupData.value.data.forEach(r => selectedIds.delete(r.id))
  } else {
    groupData.value.data.forEach(r => selectedIds.add(r.id))
  }
}

const toggleSelect = (id: number) => {
  if (selectedIds.has(id)) {
    selectedIds.delete(id)
  } else {
    selectedIds.add(id)
  }
}

// Bulk actions
const bulkUpdateStatus = async (status: string) => {
  if (selectedIds.size === 0) return
  bulkUpdating.value = true
  try {
    await $fetch('/api/admin/feedback/bulk', {
      method: 'PATCH',
      body: { ids: Array.from(selectedIds), status },
    })
    selectedIds.clear()
    await fetchGroup()
  } catch (err: any) {
    console.error('Bulk update failed:', err)
  } finally {
    bulkUpdating.value = false
  }
}

const resolveAll = async () => {
  if (!groupData.value) return
  bulkUpdating.value = true
  try {
    const allIds = groupData.value.data
      .filter(r => r.status !== 'resolved')
      .map(r => r.id)
    if (allIds.length === 0) return
    await $fetch('/api/admin/feedback/bulk', {
      method: 'PATCH',
      body: { ids: allIds, status: 'resolved' },
    })
    selectedIds.clear()
    await fetchGroup()
  } catch (err: any) {
    console.error('Resolve all failed:', err)
  } finally {
    bulkUpdating.value = false
  }
}

// Fetch
const fetchGroup = async (page = 1) => {
  loading.value = true
  error.value = null
  try {
    const params = new URLSearchParams()
    params.append('page', page.toString())
    params.append('limit', '50')
    groupData.value = await $fetch<GroupData>(
      `/api/admin/feedback/group/${route.params.hash}?${params.toString()}`
    )
  } catch (err: any) {
    error.value = err?.data?.message || 'Failed to load grouped error'
  } finally {
    loading.value = false
  }
}

const handlePageChange = (page: number) => {
  fetchGroup(page)
}

onMounted(() => fetchGroup())

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
