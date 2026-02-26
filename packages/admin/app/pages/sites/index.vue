<template>
  <div class="min-h-screen">
    <!-- Page Content -->
    <div class="px-6 py-8 max-w-[1400px] mx-auto">
      <!-- Header -->
      <div class="mb-8">
        <div class="flex items-center gap-2 text-xs font-medium tracking-widest uppercase mb-2">
          <span class="text-base-content/50">Management</span>
        </div>
        <h1 class="text-4xl text-base-content" style="font-family: 'Instrument Serif', serif; font-weight: 400; letter-spacing: -0.02em; line-height: 1.1;">
          Sites
        </h1>
        <p class="mt-2 text-sm text-base-content/60">Manage WordPress sites and their subscriptions</p>
      </div>

      <!-- Filters Card -->
      <div class="bg-base-100 rounded-xl border border-base-300/50 p-4 shadow-sm mb-6">
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
          <div class="flex gap-2 flex-wrap">
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
            <AdminVersionFilter
              v-model="versionFilter"
              @change="handleFilterChange"
            />
            <AdminFilterDropdown
              v-model="activityFilter"
              :options="activityOptions"
              label="Activity"
              @change="handleFilterChange"
            />
          </div>
        </div>
      </div>

      <!-- Sites Table Card -->
      <div class="bg-base-100 rounded-xl border border-base-300/50 shadow-sm hover:shadow-md hover:border-base-300 transition-all duration-300">
        <!-- Loading State -->
        <div v-if="loading" class="flex items-center justify-center py-16">
          <div class="flex flex-col items-center gap-4">
            <span class="loading loading-spinner loading-lg text-primary"></span>
            <p class="text-sm text-base-content/50 font-light tracking-wide">Loading sites...</p>
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
              <h3 class="text-xl text-base-content" style="font-family: 'Instrument Serif', serif;">Unable to Load Sites</h3>
              <p class="text-sm text-base-content/60 leading-relaxed">{{ error }}</p>
            </div>
            <button class="btn btn-outline btn-sm" @click="fetchSites">
              Try Again
            </button>
          </div>
        </div>

        <!-- Table -->
        <div v-else-if="sites.length > 0">
          <div class="overflow-x-auto">
            <table class="w-full">
              <thead>
                <tr class="border-b border-base-300/50">
                  <th class="text-left py-4 px-6 text-xs font-medium text-base-content/50 uppercase tracking-wider">Site</th>
                  <th class="text-left py-4 px-6 text-xs font-medium text-base-content/50 uppercase tracking-wider">Owner</th>
                  <th class="text-left py-4 px-6 text-xs font-medium text-base-content/50 uppercase tracking-wider">Users</th>
                  <th class="text-left py-4 px-6 text-xs font-medium text-base-content/50 uppercase tracking-wider">Plan</th>
                  <th class="text-left py-4 px-6 text-xs font-medium text-base-content/50 uppercase tracking-wider">Status</th>
                  <th class="text-left py-4 px-6 text-xs font-medium text-base-content/50 uppercase tracking-wider">Last Active</th>
                  <th class="text-left py-4 px-6 text-xs font-medium text-base-content/50 uppercase tracking-wider">Created</th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="site in sites"
                  :key="site.id"
                  class="border-b border-base-300/30 last:border-b-0 cursor-pointer hover:bg-base-50 transition-colors"
                  @click="navigateToSite(site.id)"
                >
                  <!-- Site Name & URL -->
                  <td class="py-4 px-6">
                    <div class="flex items-center gap-3">
                      <div class="flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center bg-gradient-to-br from-primary/20 to-primary/10 text-primary">
                        <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                        </svg>
                      </div>
                      <div class="min-w-0">
                        <div class="font-medium text-base-content hover:text-primary transition-colors truncate max-w-[200px]">
                          {{ site.name }}
                        </div>
                        <div class="text-xs text-base-content/50 truncate max-w-[200px]" :title="site.url">
                          {{ site.url }}
                        </div>
                      </div>
                    </div>
                  </td>

                  <!-- Owner -->
                  <td class="py-4 px-6">
                    <div class="font-medium text-sm text-base-content">{{ formatOwnerName(site.owner) }}</div>
                    <div class="text-xs text-base-content/50">{{ site.owner.email }}</div>
                  </td>

                  <!-- Users Count -->
                  <td class="py-4 px-6">
                    <span class="text-sm font-medium text-base-content">{{ site.usersCount }}</span>
                  </td>

                  <!-- Subscription Tier -->
                  <td class="py-4 px-6">
                    <span
                      class="text-sm font-medium"
                      :class="site.subscription && site.subscription.tier !== 'free' ? 'text-base-content' : 'text-base-content/50'"
                    >
                      {{ formatTier(site.subscription?.tier) }}
                    </span>
                  </td>

                  <!-- Verified Status -->
                  <td class="py-4 px-6">
                    <div class="flex items-center gap-1.5">
                      <template v-if="site.isVerified">
                        <svg class="w-4 h-4 text-success" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span class="text-sm text-base-content">Verified</span>
                      </template>
                      <template v-else>
                        <span class="text-sm text-base-content/50">Pending</span>
                      </template>
                    </div>
                  </td>

                  <!-- Last Active -->
                  <td class="py-4 px-6">
                    <span v-if="site.lastActiveAt" class="text-sm text-base-content/70">{{ formatDate(site.lastActiveAt) }}</span>
                    <span v-else class="text-sm text-base-content/30">Never</span>
                  </td>

                  <!-- Created Date -->
                  <td class="py-4 px-6">
                    <span class="text-sm text-base-content/70">{{ formatDate(site.createdAt) }}</span>
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
            <div class="text-sm text-base-content/60">
              Showing <span class="font-medium text-base-content">{{ startIndex + 1 }}</span> to <span class="font-medium text-base-content">{{ Math.min(endIndex, pagination.total) }}</span> of <span class="font-medium text-base-content">{{ pagination.total }}</span> sites
            </div>
            <div class="flex items-center gap-1">
              <button
                class="w-8 h-8 flex items-center justify-center rounded-lg text-base-content/60 hover:text-base-content hover:bg-base-200 transition-all disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-transparent"
                :disabled="pagination.page === 1"
                @click="handlePageChange(pagination.page - 1)"
                aria-label="Previous page"
              >
                <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
                </svg>
              </button>

              <div class="flex items-center gap-1">
                <button
                  v-for="page in visiblePages"
                  :key="page"
                  class="min-w-[32px] h-8 px-2 flex items-center justify-center rounded-lg text-sm font-medium transition-all"
                  :class="page === pagination.page
                    ? 'bg-primary text-primary-content'
                    : 'text-base-content/60 hover:text-base-content hover:bg-base-200'"
                  @click="handlePageChange(page)"
                  :aria-label="`Go to page ${page}`"
                  :aria-current="page === pagination.page ? 'page' : undefined"
                >
                  {{ page }}
                </button>
              </div>

              <button
                class="w-8 h-8 flex items-center justify-center rounded-lg text-base-content/60 hover:text-base-content hover:bg-base-200 transition-all disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-transparent"
                :disabled="pagination.page === pagination.totalPages"
                @click="handlePageChange(pagination.page + 1)"
                aria-label="Next page"
              >
                <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
            </svg>
          </div>
          <h3 class="text-lg text-base-content mb-1" style="font-family: 'Instrument Serif', serif;">No sites found</h3>
          <p class="text-sm text-base-content/50">Try adjusting your search or filters</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import type { VersionFilterValue } from '~/components/AdminVersionFilter.vue'

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

interface SiteVersions {
  create: string | null
  wordpress: string | null
  php: string | null
}

interface Site {
  id: number
  name: string
  url: string
  versions: SiteVersions
  lastActiveAt: string | null
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
const versionFilter = ref<VersionFilterValue | null>(null)
const activityFilter = ref<string | number | null>(null)

// Filter options
const verifiedOptions = [
  { value: 'yes', label: 'Verified' },
  { value: 'no', label: 'Unverified' },
]

const subscriptionOptions = [
  { value: 'has_subscription', label: 'Has Subscription' },
  { value: 'free', label: 'Free Tier' },
]

const activityOptions = [
  { value: 'active_7d', label: 'Active (7 days)' },
  { value: 'active_30d', label: 'Active (30 days)' },
  { value: 'never_active', label: 'Never Active' },
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

    if (versionFilter.value) {
      params.append('vf_field', versionFilter.value.field)
      params.append('vf_op', versionFilter.value.op)
      params.append('vf_value', versionFilter.value.value)
      if (versionFilter.value.value2) {
        params.append('vf_value2', versionFilter.value.value2)
      }
    }

    if (activityFilter.value) {
      params.append('activity', activityFilter.value.toString())
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
watch([searchQuery, verifiedFilter, subscriptionFilter, versionFilter, activityFilter], () => {
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

const formatTier = (tier: string | undefined): string => {
  if (!tier || tier === 'free') {
    return 'Free'
  }
  const tierMap: Record<string, string> = {
    pro: 'Pro',
    professional: 'Pro',
    enterprise: 'Enterprise',
    basic: 'Basic',
  }
  return tierMap[tier.toLowerCase()] || tier.charAt(0).toUpperCase() + tier.slice(1)
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
