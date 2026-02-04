<template>
  <div class="p-8">
    <!-- Page Header -->
    <div class="admin-page-header">
      <h1 class="admin-page-title">Sites</h1>
      <p class="admin-page-subtitle">Manage WordPress sites and their subscriptions</p>
    </div>

    <!-- Filters Section -->
    <div class="admin-section mb-6">
      <div class="flex flex-col sm:flex-row gap-4">
        <!-- Search -->
        <div class="flex-1">
          <AdminSearchInput
            v-model="searchQuery"
            placeholder="Search by site name or URL..."
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
            v-model="subscriptionFilter"
            :options="subscriptionOptions"
            label="Subscription"
            @change="handleFilterChange"
          />
        </div>
      </div>
    </div>

    <!-- Sites Table -->
    <div class="admin-section">
      <!-- Loading State -->
      <div v-if="loading" class="flex items-center justify-center py-12">
        <span class="loading loading-spinner loading-lg text-primary"></span>
      </div>

      <!-- Error State -->
      <div v-else-if="error" class="flex flex-col items-center justify-center py-12 text-center">
        <div class="bg-error/10 rounded-full size-16 flex items-center justify-center mb-4">
          <svg class="size-8 text-error" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <p class="text-base-content/60 text-sm">{{ error }}</p>
        <button class="btn btn-sm btn-primary mt-4" @click="fetchSites">
          Try Again
        </button>
      </div>

      <!-- Table -->
      <div v-else-if="sites.length > 0">
        <div class="overflow-x-auto">
          <table class="admin-table">
            <thead>
              <tr>
                <th>Site Name</th>
                <th>URL</th>
                <th>Owner</th>
                <th>Users</th>
                <th>Subscription</th>
                <th>Verified</th>
                <th>Created</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="site in sites"
                :key="site.id"
                class="cursor-pointer hover:bg-base-200"
                @click="navigateToSite(site.id)"
              >
                <td>
                  <div class="font-medium">{{ site.name }}</div>
                </td>
                <td>
                  <div class="text-base-content/60 text-sm truncate max-w-xs" :title="site.url">
                    {{ site.url }}
                  </div>
                </td>
                <td>
                  <div class="text-base-content/60">
                    {{ formatOwnerName(site.owner) }}
                  </div>
                  <div class="text-base-content/40 text-xs">{{ site.owner.email }}</div>
                </td>
                <td>
                  <div class="font-medium">{{ site.usersCount }}</div>
                </td>
                <td>
                  <AdminBadge
                    v-if="site.subscription"
                    :status="site.subscription.tier"
                    variant="tier"
                  />
                  <AdminBadge
                    v-else
                    status="free"
                    variant="tier"
                  />
                </td>
                <td>
                  <AdminBadge
                    :status="site.isVerified ? 'success' : 'warning'"
                    variant="status"
                    :custom-text="site.isVerified ? 'Verified' : 'Unverified'"
                  />
                </td>
                <td>
                  <div class="text-base-content/60 text-sm">
                    {{ formatDate(site.createdAt) }}
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Pagination -->
        <div
          v-if="pagination.totalPages > 1"
          class="border-t border-base-300 px-6 py-4 flex items-center justify-between"
        >
          <div class="text-base-content/60 text-sm">
            Showing {{ startIndex + 1 }} to {{ Math.min(endIndex, pagination.total) }} of {{ pagination.total }} sites
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
      <div v-else class="flex flex-col items-center justify-center py-12 text-center">
        <div class="bg-base-200 rounded-full size-16 flex items-center justify-center mb-4">
          <svg class="size-8 text-base-content/40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
          </svg>
        </div>
        <p class="text-base-content/60 text-sm mb-1">No sites found</p>
        <p class="text-base-content/40 text-xs">Try adjusting your filters</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { useRouter } from 'vue-router'

definePageMeta({
  layout: 'admin'
})

interface Owner {
  id: number
  email: string
  firstname: string | null
  lastname: string | null
}

interface SiteSubscription {
  tier: string
  status: string
}

interface Site {
  id: number
  name: string
  url: string
  owner: Owner
  usersCount: number
  subscription: SiteSubscription | null
  isVerified: boolean
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
const sites = ref<Site[]>([])
const pagination = ref<Pagination>({
  page: 1,
  limit: 20,
  total: 0,
  totalPages: 0,
})
const loading = ref(false)
const error = ref<string | null>(null)

// Filters
const searchQuery = ref('')
const verifiedFilter = ref<string | number | null>(null)
const subscriptionFilter = ref<string | number | null>(null)

// Filter options
const verifiedOptions = [
  { value: 'yes', label: 'Verified' },
  { value: 'no', label: 'Unverified' },
]

const subscriptionOptions = [
  { value: 'has_subscription', label: 'Has Subscription' },
  { value: 'free', label: 'Free Tier' },
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

// Fetch sites function
const fetchSites = async () => {
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

    if (subscriptionFilter.value === 'has_subscription') {
      params.append('filter', 'has_subscription')
    }

    const response = await $fetch<{
      data: Site[]
      pagination: Pagination
    }>(`/api/admin/sites?${params.toString()}`)

    sites.value = response.data
    pagination.value = response.pagination
  } catch (err: any) {
    console.error('Failed to fetch sites:', err)
    error.value = err?.data?.message || 'Failed to load sites. Please try again.'
  } finally {
    loading.value = false
  }
}

// Initial fetch
onMounted(() => {
  fetchSites()
})

// Watch for filter changes and refetch
watch([searchQuery, verifiedFilter, subscriptionFilter], () => {
  pagination.value.page = 1
  fetchSites()
})

// Handlers
const handleSearch = () => {
  pagination.value.page = 1
  fetchSites()
}

const handleFilterChange = () => {
  pagination.value.page = 1
  fetchSites()
}

const handlePageChange = (page: number) => {
  if (page >= 1 && page <= pagination.value.totalPages) {
    pagination.value.page = page
    fetchSites()
  }
}

const navigateToSite = (siteId: number) => {
  router.push(`/sites/${siteId}`)
}

// Format helpers
const formatOwnerName = (owner: Owner): string => {
  if (owner.firstname && owner.lastname) {
    return `${owner.firstname} ${owner.lastname}`
  }
  if (owner.firstname) {
    return owner.firstname
  }
  if (owner.lastname) {
    return owner.lastname
  }
  return owner.email
}

const formatDate = (dateString: string): string => {
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  if (diffDays === 0) {
    return 'Today'
  } else if (diffDays === 1) {
    return 'Yesterday'
  } else if (diffDays < 7) {
    return `${diffDays} days ago`
  } else if (diffDays < 30) {
    const weeks = Math.floor(diffDays / 7)
    return `${weeks} ${weeks === 1 ? 'week' : 'weeks'} ago`
  } else if (diffDays < 365) {
    const months = Math.floor(diffDays / 30)
    return `${months} ${months === 1 ? 'month' : 'months'} ago`
  } else {
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }
}
</script>
