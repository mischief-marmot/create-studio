<template>
  <div class="min-h-screen">
    <!-- Page Content -->
    <div class="px-6 py-8 max-w-[1400px] mx-auto">
      <!-- Header -->
      <div class="mb-8">
        <div class="flex items-center gap-2 text-xs font-medium tracking-widest uppercase mb-2">
          <span class="text-base-content/50">Broadcasts</span>
        </div>
        <div class="flex items-center justify-between">
          <div>
            <h1 class="text-4xl text-base-content" style="font-family: 'Instrument Serif', serif; font-weight: 400; letter-spacing: -0.02em; line-height: 1.1;">
              Manage Broadcasts
            </h1>
            <p class="text-base-content/60 mt-2">Create and manage broadcast messages for plugin users</p>
          </div>
          <button class="btn btn-primary" @click="openCreateModal">
            Create Broadcast
          </button>
        </div>
      </div>

      <!-- Filters Card -->
      <div class="bg-base-100 rounded-xl border border-base-300/50 p-6 shadow-sm mb-6">
        <div class="flex flex-col sm:flex-row gap-4">
          <!-- Search -->
          <div class="flex-1">
            <AdminSearchInput
              v-model="searchQuery"
              placeholder="Search by title or body..."
              :debounce="300"
              @search="handleSearch"
            />
          </div>

          <!-- Filters -->
          <div class="flex gap-2">
            <AdminFilterDropdown
              v-model="statusFilter"
              :options="statusOptions"
              label="Status"
              @change="handleFilterChange"
            />
            <AdminFilterDropdown
              v-model="typeFilter"
              :options="typeOptions"
              label="Type"
              @change="handleFilterChange"
            />
          </div>
        </div>
      </div>

      <!-- Broadcasts Table Card -->
      <div class="bg-base-100 rounded-xl border border-base-300/50 shadow-sm hover:shadow-md hover:border-base-300 transition-all duration-300">
        <!-- Loading State -->
        <div v-if="loading" class="flex items-center justify-center py-16">
          <div class="flex flex-col items-center gap-4">
            <span class="loading loading-spinner loading-lg text-primary"></span>
            <p class="text-sm text-base-content/50 font-light tracking-wide">Loading broadcasts...</p>
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
              <h3 class="text-xl text-base-content" style="font-family: 'Instrument Serif', serif;">Unable to Load Broadcasts</h3>
              <p class="text-sm text-base-content/60 leading-relaxed">{{ error }}</p>
            </div>
            <button class="btn btn-outline btn-sm" @click="fetchBroadcasts">
              Try Again
            </button>
          </div>
        </div>

        <!-- Table -->
        <div v-else-if="broadcasts.length > 0">
          <div class="overflow-x-auto">
            <table class="w-full">
              <thead>
                <tr class="border-b border-base-300/50">
                  <th class="text-left py-4 px-6 text-xs font-medium text-base-content/50 uppercase tracking-wider">Title</th>
                  <th class="text-left py-4 px-6 text-xs font-medium text-base-content/50 uppercase tracking-wider">Type</th>
                  <th class="text-left py-4 px-6 text-xs font-medium text-base-content/50 uppercase tracking-wider">Status</th>
                  <th class="text-left py-4 px-6 text-xs font-medium text-base-content/50 uppercase tracking-wider">Target Tiers</th>
                  <th class="text-left py-4 px-6 text-xs font-medium text-base-content/50 uppercase tracking-wider">Priority</th>
                  <th class="text-left py-4 px-6 text-xs font-medium text-base-content/50 uppercase tracking-wider">Published At</th>
                  <th class="text-left py-4 px-6 text-xs font-medium text-base-content/50 uppercase tracking-wider">Expires At</th>
                  <th class="text-left py-4 px-6 text-xs font-medium text-base-content/50 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="broadcast in broadcasts"
                  :key="broadcast.id"
                  class="border-b border-base-300/30 last:border-b-0 hover:bg-base-50 transition-colors"
                >
                  <td class="py-4 px-6">
                    <div class="flex flex-col">
                      <span class="font-medium text-base-content">{{ broadcast.title }}</span>
                      <span class="text-sm text-base-content/50 truncate max-w-xs">{{ broadcast.body }}</span>
                    </div>
                  </td>
                  <td class="py-4 px-6">
                    <span class="badge badge-sm" :class="getTypeBadgeClass(broadcast.type)">
                      {{ broadcast.type }}
                    </span>
                  </td>
                  <td class="py-4 px-6">
                    <span class="badge badge-sm" :class="getStatusBadgeClass(broadcast.status)">
                      {{ broadcast.status }}
                    </span>
                  </td>
                  <td class="py-4 px-6">
                    <div class="flex flex-wrap gap-1">
                      <span
                        v-for="tier in parseTiers(broadcast.target_tiers)"
                        :key="tier"
                        class="badge badge-sm badge-outline"
                      >
                        {{ tier }}
                      </span>
                    </div>
                  </td>
                  <td class="py-4 px-6">
                    <span class="text-sm text-base-content/70">{{ broadcast.priority }}</span>
                  </td>
                  <td class="py-4 px-6">
                    <span v-if="broadcast.published_at" class="text-sm text-base-content/70">
                      {{ formatDate(broadcast.published_at) }}
                    </span>
                    <span v-else class="text-sm text-base-content/40">-</span>
                  </td>
                  <td class="py-4 px-6">
                    <span v-if="broadcast.expires_at" class="text-sm text-base-content/70">
                      {{ formatDate(broadcast.expires_at) }}
                    </span>
                    <span v-else class="text-sm text-base-content/40">-</span>
                  </td>
                  <td class="py-4 px-6">
                    <div class="flex items-center gap-2">
                      <button class="btn btn-ghost btn-xs" @click="openEditModal(broadcast)">
                        Edit
                      </button>
                      <button class="btn btn-ghost btn-xs text-error" @click="openDeleteModal(broadcast)">
                        Delete
                      </button>
                    </div>
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
              Showing {{ startIndex + 1 }} to {{ Math.min(endIndex, pagination.total) }} of {{ pagination.total }} broadcasts
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
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M10.34 15.84c-.688-.06-1.386-.09-2.09-.09H7.5a4.5 4.5 0 110-9h.75c.704 0 1.402-.03 2.09-.09m0 9.18c.253.962.584 1.892.985 2.783.247.55.06 1.21-.463 1.511l-.657.38c-.551.318-1.26.117-1.527-.461a20.845 20.845 0 01-1.44-4.282m3.102.069a18.03 18.03 0 01-.59-4.59c0-1.586.205-3.124.59-4.59m0 9.18a23.848 23.848 0 018.835 2.535M10.34 6.66a23.847 23.847 0 008.835-2.535m0 0A23.74 23.74 0 0018.795 3m.38 1.125a23.91 23.91 0 011.014 5.395m-1.014 8.855c-.118.38-.245.754-.38 1.125m.38-1.125a23.91 23.91 0 001.014-5.395m0-3.46c.495.413.811 1.035.811 1.73 0 .695-.316 1.317-.811 1.73m0-3.46a24.347 24.347 0 010 3.46" />
            </svg>
          </div>
          <h3 class="text-lg text-base-content mb-1" style="font-family: 'Instrument Serif', serif;">No Broadcasts Found</h3>
          <p class="text-sm text-base-content/50">Try adjusting your search or filters, or create a new broadcast</p>
        </div>
      </div>
    </div>

    <!-- Create/Edit Modal -->
    <dialog ref="createModal" class="modal">
      <div class="modal-box w-11/12 max-w-2xl">
        <h3 class="text-lg font-bold mb-4" style="font-family: 'Instrument Serif', serif;">
          {{ editingBroadcast ? 'Edit Broadcast' : 'Create Broadcast' }}
        </h3>
        <form @submit.prevent="saveBroadcast">
          <div class="space-y-4">
            <!-- Title -->
            <div class="form-control">
              <label class="label">
                <span class="label-text">Title <span class="text-error">*</span></span>
              </label>
              <input
                v-model="form.title"
                type="text"
                class="input input-bordered w-full"
                placeholder="Broadcast title"
                required
              />
            </div>

            <!-- Body -->
            <div class="form-control">
              <label class="label">
                <span class="label-text">Body <span class="text-error">*</span></span>
              </label>
              <textarea
                v-model="form.body"
                class="textarea textarea-bordered w-full h-24"
                placeholder="Broadcast message body"
                required
              ></textarea>
            </div>

            <!-- Type and Status -->
            <div class="grid grid-cols-2 gap-4">
              <div class="form-control">
                <label class="label">
                  <span class="label-text">Type</span>
                </label>
                <select v-model="form.type" class="select select-bordered w-full">
                  <option value="announcement">Announcement</option>
                  <option value="feature">Feature</option>
                  <option value="promotion">Promotion</option>
                  <option value="beta">Beta</option>
                </select>
              </div>
              <div class="form-control">
                <label class="label">
                  <span class="label-text">Status</span>
                </label>
                <select v-model="form.status" class="select select-bordered w-full">
                  <option value="draft">Draft</option>
                  <option value="published">Published</option>
                  <option value="archived">Archived</option>
                </select>
              </div>
            </div>

            <!-- Priority -->
            <div class="form-control">
              <label class="label">
                <span class="label-text">Priority</span>
              </label>
              <input
                v-model.number="form.priority"
                type="number"
                class="input input-bordered w-full"
                placeholder="0"
                min="0"
              />
            </div>

            <!-- URL and Path -->
            <div class="grid grid-cols-2 gap-4">
              <div class="form-control">
                <label class="label">
                  <span class="label-text">URL</span>
                </label>
                <input
                  v-model="form.url"
                  type="text"
                  class="input input-bordered w-full"
                  placeholder="https://..."
                />
              </div>
              <div class="form-control">
                <label class="label">
                  <span class="label-text">Path</span>
                </label>
                <input
                  v-model="form.path"
                  type="text"
                  class="input input-bordered w-full"
                  placeholder="/some/path"
                />
              </div>
            </div>

            <!-- CTA Text -->
            <div class="form-control">
              <label class="label">
                <span class="label-text">CTA Text</span>
              </label>
              <input
                v-model="form.cta_text"
                type="text"
                class="input input-bordered w-full"
                placeholder="Learn more"
              />
            </div>

            <!-- Target Tiers -->
            <div class="form-control">
              <label class="label">
                <span class="label-text">Target Tiers</span>
              </label>
              <div class="flex flex-wrap gap-4">
                <label v-for="tier in allTiers" :key="tier" class="label cursor-pointer gap-2">
                  <input
                    type="checkbox"
                    :value="tier"
                    v-model="form.target_tiers"
                    class="checkbox checkbox-sm"
                  />
                  <span class="label-text">{{ tier }}</span>
                </label>
              </div>
            </div>

            <!-- Version constraints -->
            <div class="grid grid-cols-2 gap-4">
              <div class="form-control">
                <label class="label">
                  <span class="label-text">Min Create Version</span>
                </label>
                <input
                  v-model="form.target_create_version_min"
                  type="text"
                  class="input input-bordered w-full"
                  placeholder="e.g. 2.0.0"
                />
              </div>
              <div class="form-control">
                <label class="label">
                  <span class="label-text">Max Create Version</span>
                </label>
                <input
                  v-model="form.target_create_version_max"
                  type="text"
                  class="input input-bordered w-full"
                  placeholder="e.g. 3.0.0"
                />
              </div>
            </div>

            <!-- Date fields -->
            <div class="grid grid-cols-2 gap-4">
              <div class="form-control">
                <label class="label">
                  <span class="label-text">Published At</span>
                </label>
                <input
                  v-model="form.published_at"
                  type="datetime-local"
                  class="input input-bordered w-full"
                />
              </div>
              <div class="form-control">
                <label class="label">
                  <span class="label-text">Expires At</span>
                </label>
                <input
                  v-model="form.expires_at"
                  type="datetime-local"
                  class="input input-bordered w-full"
                />
              </div>
            </div>
          </div>

          <div class="modal-action">
            <button type="button" class="btn" @click="closeCreateModal">Cancel</button>
            <button type="submit" class="btn btn-primary" :disabled="saving">
              <span v-if="saving" class="loading loading-spinner loading-sm"></span>
              {{ editingBroadcast ? 'Update' : 'Create' }}
            </button>
          </div>
        </form>
      </div>
      <form method="dialog" class="modal-backdrop">
        <button>close</button>
      </form>
    </dialog>

    <!-- Delete Confirmation Modal -->
    <dialog ref="deleteModal" class="modal">
      <div class="modal-box">
        <h3 class="text-lg font-bold" style="font-family: 'Instrument Serif', serif;">Delete Broadcast</h3>
        <p class="py-4 text-base-content/70">
          Are you sure you want to delete <strong>{{ deletingBroadcast?.title }}</strong>? This action cannot be undone.
        </p>
        <div class="modal-action">
          <button class="btn" @click="closeDeleteModal">Cancel</button>
          <button class="btn btn-error" :disabled="deleting" @click="confirmDelete">
            <span v-if="deleting" class="loading loading-spinner loading-sm"></span>
            Delete
          </button>
        </div>
      </div>
      <form method="dialog" class="modal-backdrop">
        <button>close</button>
      </form>
    </dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'

definePageMeta({
  layout: 'admin'
})

interface Broadcast {
  id: number
  title: string
  body: string
  type: string
  status: string
  priority: number
  url: string | null
  path: string | null
  cta_text: string | null
  target_tiers: string | string[]
  target_create_version_min: string | null
  target_create_version_max: string | null
  published_at: string | null
  expires_at: string | null
  createdAt: string
  updatedAt: string
}

interface Pagination {
  page: number
  limit: number
  total: number
  totalPages: number
}

interface BroadcastForm {
  title: string
  body: string
  type: string
  status: string
  priority: number
  url: string
  path: string
  cta_text: string
  target_tiers: string[]
  target_create_version_min: string
  target_create_version_max: string
  published_at: string
  expires_at: string
}

const allTiers = ['all', 'free', 'free-plus', 'pro']

// Refs for modals
const createModal = ref<HTMLDialogElement | null>(null)
const deleteModal = ref<HTMLDialogElement | null>(null)

// Reactive state
const broadcasts = ref<Broadcast[]>([])
const pagination = ref<Pagination>({
  page: 1,
  limit: 20,
  total: 0,
  totalPages: 0,
})
const loading = ref(false)
const error = ref<string | null>(null)
const saving = ref(false)
const deleting = ref(false)

// Filters
const searchQuery = ref('')
const statusFilter = ref<string | number | null>(null)
const typeFilter = ref<string | number | null>(null)

// Filter options
const statusOptions = [
  { value: 'draft', label: 'Draft' },
  { value: 'published', label: 'Published' },
  { value: 'archived', label: 'Archived' },
]

const typeOptions = [
  { value: 'announcement', label: 'Announcement' },
  { value: 'feature', label: 'Feature' },
  { value: 'promotion', label: 'Promotion' },
  { value: 'beta', label: 'Beta' },
]

// Form state
const editingBroadcast = ref<Broadcast | null>(null)
const deletingBroadcast = ref<Broadcast | null>(null)

const defaultForm = (): BroadcastForm => ({
  title: '',
  body: '',
  type: 'announcement',
  status: 'draft',
  priority: 0,
  url: '',
  path: '',
  cta_text: '',
  target_tiers: ['all'],
  target_create_version_min: '',
  target_create_version_max: '',
  published_at: '',
  expires_at: '',
})

const form = ref<BroadcastForm>(defaultForm())

// Computed pagination values
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

// Fetch broadcasts
const fetchBroadcasts = async () => {
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

    if (typeFilter.value) {
      params.append('type', typeFilter.value.toString())
    }

    const response = await $fetch<{
      data: Broadcast[]
      pagination: Pagination
    }>(`/api/admin/broadcasts?${params.toString()}`)

    broadcasts.value = response.data
    pagination.value = response.pagination
  } catch (err: any) {
    console.error('Failed to fetch broadcasts:', err)
    error.value = err?.data?.message || 'Failed to load broadcasts. Please try again.'
  } finally {
    loading.value = false
  }
}

// Initial fetch
onMounted(() => {
  fetchBroadcasts()
})

// Watch for filter changes and refetch
watch([searchQuery, statusFilter, typeFilter], () => {
  pagination.value.page = 1
  fetchBroadcasts()
})

// Handlers
const handleSearch = () => {
  pagination.value.page = 1
  fetchBroadcasts()
}

const handleFilterChange = () => {
  pagination.value.page = 1
  fetchBroadcasts()
}

const handlePageChange = (page: number) => {
  if (page >= 1 && page <= pagination.value.totalPages) {
    pagination.value.page = page
    fetchBroadcasts()
  }
}

// Modal handlers
const openCreateModal = () => {
  editingBroadcast.value = null
  form.value = defaultForm()
  createModal.value?.showModal()
}

const openEditModal = (broadcast: Broadcast) => {
  editingBroadcast.value = broadcast
  form.value = {
    title: broadcast.title,
    body: broadcast.body,
    type: broadcast.type,
    status: broadcast.status,
    priority: broadcast.priority,
    url: broadcast.url || '',
    path: broadcast.path || '',
    cta_text: broadcast.cta_text || '',
    target_tiers: parseTiers(broadcast.target_tiers),
    target_create_version_min: broadcast.target_create_version_min || '',
    target_create_version_max: broadcast.target_create_version_max || '',
    published_at: broadcast.published_at ? toDatetimeLocal(broadcast.published_at) : '',
    expires_at: broadcast.expires_at ? toDatetimeLocal(broadcast.expires_at) : '',
  }
  createModal.value?.showModal()
}

const closeCreateModal = () => {
  createModal.value?.close()
}

const openDeleteModal = (broadcast: Broadcast) => {
  deletingBroadcast.value = broadcast
  deleteModal.value?.showModal()
}

const closeDeleteModal = () => {
  deleteModal.value?.close()
}

const saveBroadcast = async () => {
  saving.value = true
  try {
    const payload = {
      ...form.value,
      target_tiers: form.value.target_tiers,
      published_at: form.value.published_at || null,
      expires_at: form.value.expires_at || null,
      url: form.value.url || null,
      path: form.value.path || null,
      cta_text: form.value.cta_text || null,
      target_create_version_min: form.value.target_create_version_min || null,
      target_create_version_max: form.value.target_create_version_max || null,
    }

    if (editingBroadcast.value) {
      await $fetch(`/api/admin/broadcasts/${editingBroadcast.value.id}`, {
        method: 'PATCH',
        body: payload,
      })
    } else {
      await $fetch('/api/admin/broadcasts', {
        method: 'POST',
        body: payload,
      })
    }

    closeCreateModal()
    fetchBroadcasts()
  } catch (err: any) {
    console.error('Failed to save broadcast:', err)
    alert(err?.data?.message || 'Failed to save broadcast.')
  } finally {
    saving.value = false
  }
}

const confirmDelete = async () => {
  if (!deletingBroadcast.value) return
  deleting.value = true
  try {
    await $fetch(`/api/admin/broadcasts/${deletingBroadcast.value.id}`, {
      method: 'DELETE',
    })
    closeDeleteModal()
    fetchBroadcasts()
  } catch (err: any) {
    console.error('Failed to delete broadcast:', err)
    alert(err?.data?.message || 'Failed to delete broadcast.')
  } finally {
    deleting.value = false
  }
}

// Helpers
const parseTiers = (tiers: string | string[]): string[] => {
  if (Array.isArray(tiers)) return tiers
  if (!tiers) return []
  try {
    const parsed = JSON.parse(tiers)
    return Array.isArray(parsed) ? parsed : [tiers]
  } catch {
    return tiers.split(',').map(t => t.trim()).filter(Boolean)
  }
}

const toDatetimeLocal = (dateString: string): string => {
  const date = new Date(dateString)
  const offset = date.getTimezoneOffset()
  const local = new Date(date.getTime() - offset * 60000)
  return local.toISOString().slice(0, 16)
}

const formatDate = (dateString: string): string => {
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  if (diffDays < 0) {
    const absDiffDays = Math.abs(diffDays)
    if (absDiffDays === 0) return 'Today'
    if (absDiffDays === 1) return 'Tomorrow'
    if (absDiffDays < 7) return `In ${absDiffDays} days`
    if (absDiffDays < 30) {
      const weeks = Math.floor(absDiffDays / 7)
      return `In ${weeks} ${weeks === 1 ? 'week' : 'weeks'}`
    }
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
  }

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

const getTypeBadgeClass = (type: string): string => {
  const map: Record<string, string> = {
    announcement: 'badge-info',
    feature: 'badge-primary',
    promotion: 'badge-warning',
    beta: 'badge-success',
  }
  return map[type] || 'badge-ghost'
}

const getStatusBadgeClass = (status: string): string => {
  const map: Record<string, string> = {
    draft: 'badge-ghost',
    published: 'badge-success',
    archived: 'badge-neutral',
  }
  return map[status] || 'badge-ghost'
}
</script>
