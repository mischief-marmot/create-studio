<template>
  <div class="min-h-screen">
    <!-- Page Container -->
    <div class="px-6 py-8 max-w-[1400px] mx-auto">
      <!-- Page Header -->
      <div class="mb-8">
        <div class="flex items-center gap-2 text-xs font-medium tracking-widest uppercase mb-2">
          <span class="text-base-content/50">Admin</span>
          <span class="text-base-content/30">·</span>
          <span class="text-base-content/40">User Management</span>
        </div>
        <h1 class="text-4xl text-base-content" style="font-family: 'Instrument Serif', serif; font-weight: 400; letter-spacing: -0.02em; line-height: 1.1;">
          Users
        </h1>
      </div>

      <!-- Filters Section -->
      <div class="bg-base-100 rounded-xl border border-base-300/50 p-6 shadow-sm mb-6">
        <div class="flex flex-col sm:flex-row gap-4">
          <!-- Search -->
          <div class="flex-1">
            <AdminSearchInput
              v-model="searchQuery"
              placeholder="Search by email or name..."
              :debounce="300"
              @search="handleSearch"
            />
          </div>

          <!-- Filters -->
          <div class="flex gap-2">
            <AdminFilterDropdown
              v-model="verifiedFilter"
              :options="verifiedOptions"
              label="Verified"
              @change="handleFilterChange"
            />
            <AdminFilterDropdown
              v-model="hasSitesFilter"
              :options="hasSitesOptions"
              label="Has Sites"
              @change="handleFilterChange"
            />
          </div>
        </div>
      </div>

      <!-- Users Table Card -->
      <div class="bg-base-100 rounded-xl border border-base-300/50 shadow-sm hover:shadow-md hover:border-base-300 transition-all duration-300">
        <!-- Loading State -->
        <div v-if="loading" class="flex items-center justify-center py-16">
          <div class="flex flex-col items-center gap-4">
            <span class="loading loading-spinner loading-lg text-primary"></span>
            <p class="text-sm text-base-content/50 font-light tracking-wide">Loading users...</p>
          </div>
        </div>

        <!-- Error State -->
        <div v-else-if="error" class="flex flex-col items-center justify-center py-16 text-center px-6">
          <div class="inline-flex items-center justify-center w-16 h-16 rounded-full bg-error/10 border border-error/20 mb-4">
            <svg class="w-8 h-8 text-error" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 class="text-xl text-base-content mb-2" style="font-family: 'Instrument Serif', serif;">Unable to Load Users</h3>
          <p class="text-sm text-base-content/60 mb-4">{{ error }}</p>
          <button class="btn btn-outline btn-sm" @click="fetchUsers">
            Try Again
          </button>
        </div>

        <!-- Table -->
        <div v-else-if="users.length > 0">
          <div class="overflow-x-auto">
            <table class="w-full">
              <thead>
                <tr class="border-b border-base-300/50">
                  <th class="text-left py-4 px-6 text-xs font-medium text-base-content/50 uppercase tracking-wider">User</th>
                  <th class="text-left py-4 px-6 text-xs font-medium text-base-content/50 uppercase tracking-wider">Sites</th>
                  <th class="text-left py-4 px-6 text-xs font-medium text-base-content/50 uppercase tracking-wider">Plan</th>
                  <th class="text-left py-4 px-6 text-xs font-medium text-base-content/50 uppercase tracking-wider">Status</th>
                  <th class="text-left py-4 px-6 text-xs font-medium text-base-content/50 uppercase tracking-wider">Joined</th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="user in users"
                  :key="user.id"
                  class="border-b border-base-300/30 last:border-b-0 hover:bg-base-50 transition-colors cursor-pointer"
                  @click="navigateToUser(user.id)"
                >
                  <td class="py-4 px-6">
                    <div class="flex items-center gap-4">
                      <!-- Avatar -->
                      <div class="w-10 h-10 rounded-full overflow-hidden flex-shrink-0">
                        <img
                          v-if="!avatarErrors[user.id]"
                          :src="getGravatarUrl(user.email, 80)"
                          :alt="`${formatName(user)}'s avatar`"
                          class="w-full h-full object-cover"
                          @error="handleAvatarError(user.id)"
                        />
                        <div v-else class="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/20 to-primary/10 text-primary font-medium text-sm" style="font-family: 'Instrument Serif', serif;">
                          {{ getUserInitials(user.firstname || undefined, user.lastname || undefined) }}
                        </div>
                      </div>
                      <!-- Name & Email -->
                      <div class="min-w-0">
                        <div class="font-medium text-base-content hover:text-primary transition-colors truncate">
                          {{ formatName(user) }}
                        </div>
                        <div class="text-sm text-base-content/50 truncate">{{ user.email }}</div>
                      </div>
                    </div>
                  </td>
                  <td class="py-4 px-6">
                    <span class="text-sm font-medium text-base-content">{{ user.sitesCount }}</span>
                  </td>
                  <td class="py-4 px-6">
                    <span
                      class="text-sm font-medium"
                      :class="user.hasActiveSubscription ? 'text-base-content' : 'text-base-content/50'"
                    >
                      {{ user.hasActiveSubscription ? 'Pro' : 'Free' }}
                    </span>
                  </td>
                  <td class="py-4 px-6">
                    <div class="flex items-center gap-1.5">
                      <template v-if="user.validEmail">
                        <CheckIcon class="w-4 h-4 text-success" />
                        <span class="text-sm text-base-content/70">Verified</span>
                      </template>
                      <template v-else>
                        <span class="text-sm text-base-content/50">Unverified</span>
                      </template>
                    </div>
                  </td>
                  <td class="py-4 px-6">
                    <span class="text-sm text-base-content/70">{{ formatDate(user.createdAt) }}</span>
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
            <div class="text-base-content/60 text-sm">
              Showing {{ startIndex + 1 }} to {{ Math.min(endIndex, pagination.total) }} of {{ pagination.total }} users
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
        <div v-else class="flex flex-col items-center justify-center py-16 text-center px-6">
          <div class="inline-flex items-center justify-center w-16 h-16 rounded-full bg-base-200 text-base-content/30 mb-4">
            <svg class="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
          </div>
          <h3 class="text-xl text-base-content mb-2" style="font-family: 'Instrument Serif', serif;">No Users Found</h3>
          <p class="text-sm text-base-content/50">Try adjusting your search or filters</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { CheckIcon } from '@heroicons/vue/24/outline'
import { getGravatarUrl, getUserInitials } from '~/composables/useAvatar'

definePageMeta({
  layout: 'admin'
})

interface User {
  id: string
  email: string
  firstname: string | null
  lastname: string | null
  validEmail: boolean
  sitesCount: number
  hasActiveSubscription: boolean
  createdAt: string
}

interface Pagination {
  page: number
  limit: number
  total: number
  totalPages: number
}

const router = useRouter()

// Reactive state
const users = ref<User[]>([])
const pagination = ref<Pagination>({
  page: 1,
  limit: 20,
  total: 0,
  totalPages: 0,
})
const loading = ref(false)
const error = ref<string | null>(null)

// Avatar error tracking
const avatarErrors = reactive<Record<string, boolean>>({})

// Filters
const searchQuery = ref('')
const verifiedFilter = ref<string | number | null>(null)
const hasSitesFilter = ref<string | number | null>(null)

// Filter options
const verifiedOptions = [
  { value: 'yes', label: 'Verified' },
  { value: 'no', label: 'Unverified' },
]

const hasSitesOptions = [
  { value: 'yes', label: 'Has Sites' },
  { value: 'no', label: 'No Sites' },
]

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

// Fetch users function
const fetchUsers = async () => {
  loading.value = true
  error.value = null

  try {
    // Build query params
    const params = new URLSearchParams()
    params.append('page', pagination.value.page.toString())
    params.append('limit', pagination.value.limit.toString())

    if (searchQuery.value) {
      params.append('search', searchQuery.value)
    }

    if (verifiedFilter.value === 'yes') {
      params.append('filter', 'verified')
    }

    if (hasSitesFilter.value === 'yes') {
      params.append('filter', 'has_sites')
    }

    const response = await $fetch<{
      data: User[]
      pagination: Pagination
    }>(`/api/admin/users?${params.toString()}`)

    users.value = response.data
    pagination.value = response.pagination
  } catch (err: any) {
    console.error('Failed to fetch users:', err)
    error.value = err?.data?.message || 'Failed to load users. Please try again.'
  } finally {
    loading.value = false
  }
}

// Initial fetch
onMounted(() => {
  fetchUsers()
})

// Watch for filter changes and refetch
watch([searchQuery, verifiedFilter, hasSitesFilter], () => {
  pagination.value.page = 1
  fetchUsers()
})

// Handlers
const handleSearch = () => {
  pagination.value.page = 1
  fetchUsers()
}

const handleFilterChange = () => {
  pagination.value.page = 1
  fetchUsers()
}

const handlePageChange = (page: number) => {
  if (page >= 1 && page <= pagination.value.totalPages) {
    pagination.value.page = page
    fetchUsers()
  }
}

const navigateToUser = (userId: string) => {
  router.push(`/users/${userId}`)
}

// Avatar error handler
const handleAvatarError = (userId: string) => {
  avatarErrors[userId] = true
}

// Format helpers
const formatName = (user: User): string => {
  if (user.firstname && user.lastname) {
    return `${user.firstname} ${user.lastname}`
  }
  if (user.firstname) {
    return user.firstname
  }
  if (user.lastname) {
    return user.lastname
  }
  return user.email
}

const formatDate = (dateString: string): string => {
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}
</script>
