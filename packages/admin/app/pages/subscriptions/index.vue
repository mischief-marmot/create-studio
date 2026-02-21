<template>
  <div class="min-h-screen">
    <!-- Page Content -->
    <div class="px-6 py-8 max-w-[1400px] mx-auto">
      <!-- Header -->
      <div class="mb-8">
        <div class="flex items-center gap-2 text-xs font-medium tracking-widest uppercase mb-2">
          <span class="text-base-content/50">Subscriptions</span>
        </div>
        <h1 class="text-4xl text-base-content" style="font-family: 'Instrument Serif', serif; font-weight: 400; letter-spacing: -0.02em; line-height: 1.1;">
          Manage Subscriptions
        </h1>
        <p class="text-base-content/60 mt-2">Site subscriptions and billing management</p>
      </div>

      <!-- Filters Card -->
      <div class="bg-base-100 rounded-xl border border-base-300/50 p-6 shadow-sm mb-6">
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
              v-model="tierFilter"
              :options="tierOptions"
              label="Tier"
              @change="handleFilterChange"
            />
            <AdminFilterDropdown
              v-model="statusFilter"
              :options="statusOptions"
              label="Status"
              @change="handleFilterChange"
            />
          </div>
        </div>
      </div>

      <!-- Subscriptions Table Card -->
      <div class="bg-base-100 rounded-xl border border-base-300/50 shadow-sm hover:shadow-md hover:border-base-300 transition-all duration-300">
        <!-- Loading State -->
        <div v-if="loading" class="flex items-center justify-center py-16">
          <div class="flex flex-col items-center gap-4">
            <span class="loading loading-spinner loading-lg text-primary"></span>
            <p class="text-sm text-base-content/50 font-light tracking-wide">Loading subscriptions...</p>
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
              <h3 class="text-xl text-base-content" style="font-family: 'Instrument Serif', serif;">Unable to Load Subscriptions</h3>
              <p class="text-sm text-base-content/60 leading-relaxed">{{ error }}</p>
            </div>
            <button class="btn btn-outline btn-sm" @click="fetchSubscriptions">
              Try Again
            </button>
          </div>
        </div>

        <!-- Table -->
        <div v-else-if="subscriptions.length > 0">
          <div class="overflow-x-auto">
            <table class="w-full">
              <thead>
                <tr class="border-b border-base-300/50">
                  <th class="text-left py-4 px-6 text-xs font-medium text-base-content/50 uppercase tracking-wider">Site</th>
                  <th class="text-left py-4 px-6 text-xs font-medium text-base-content/50 uppercase tracking-wider">User</th>
                  <th class="text-left py-4 px-6 text-xs font-medium text-base-content/50 uppercase tracking-wider">Plan</th>
                  <th class="text-left py-4 px-6 text-xs font-medium text-base-content/50 uppercase tracking-wider">Status</th>
                  <th class="text-left py-4 px-6 text-xs font-medium text-base-content/50 uppercase tracking-wider">Period End</th>
                  <th class="text-left py-4 px-6 text-xs font-medium text-base-content/50 uppercase tracking-wider">Billing</th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="subscription in subscriptions"
                  :key="subscription.id"
                  class="border-b border-base-300/30 last:border-b-0 cursor-pointer hover:bg-base-50 transition-colors"
                  @click="navigateToSubscription(subscription.id)"
                >
                  <td class="py-4 px-6">
                    <div class="flex flex-col">
                      <span class="font-medium text-base-content">{{ subscription.siteName }}</span>
                      <span class="text-sm text-base-content/50 truncate max-w-xs">{{ subscription.siteUrl }}</span>
                    </div>
                  </td>
                  <td class="py-4 px-6">
                    <span class="text-sm text-base-content/70">{{ subscription.userEmail }}</span>
                  </td>
                  <td class="py-4 px-6">
                    <span class="text-sm font-medium" :class="getTierClass(subscription.tier)">
                      {{ formatTier(subscription.tier) }}
                    </span>
                  </td>
                  <td class="py-4 px-6">
                    <span class="text-sm" :class="getStatusClass(subscription.status)">
                      {{ formatStatus(subscription.status) }}
                    </span>
                  </td>
                  <td class="py-4 px-6">
                    <span v-if="subscription.current_period_end" class="text-sm text-base-content/70">
                      {{ formatDate(subscription.current_period_end) }}
                    </span>
                    <span v-else class="text-sm text-base-content/40">-</span>
                  </td>
                  <td class="py-4 px-6">
                    <div class="flex items-center gap-2" @click.stop>
                      <template v-if="subscription.stripe_subscription_id">
                        <span class="inline-flex items-center gap-1 text-xs font-medium text-[#635bff]">
                          <svg class="size-3" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M13.976 9.15c-2.172-.806-3.356-1.426-3.356-2.409 0-.831.683-1.305 1.901-1.305 2.227 0 4.515.858 6.09 1.631l.89-5.494C18.252.975 15.697 0 12.165 0 9.667 0 7.589.654 6.104 1.872 4.56 3.147 3.757 4.992 3.757 7.218c0 4.039 2.467 5.76 6.476 7.219 2.585.92 3.445 1.574 3.445 2.583 0 .98-.84 1.545-2.354 1.545-1.875 0-4.965-.921-6.99-2.109l-.9 5.555C5.175 22.99 8.385 24 11.714 24c2.641 0 4.843-.624 6.328-1.813 1.664-1.305 2.525-3.236 2.525-5.732 0-4.128-2.524-5.851-6.591-7.305z" />
                          </svg>
                          Paid
                        </span>
                      </template>
                      <template v-else>
                        <span class="text-xs text-base-content/40">Manual</span>
                      </template>
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
              Showing {{ startIndex + 1 }} to {{ Math.min(endIndex, pagination.total) }} of {{ pagination.total }} subscriptions
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
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
            </svg>
          </div>
          <h3 class="text-lg text-base-content mb-1" style="font-family: 'Instrument Serif', serif;">No Subscriptions Found</h3>
          <p class="text-sm text-base-content/50">Try adjusting your search or filters</p>
        </div>
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

interface Subscription {
  id: number
  site_id: number
  siteName: string
  siteUrl: string
  userEmail: string
  tier: string
  status: string
  current_period_start: string | null
  current_period_end: string | null
  cancel_at_period_end: boolean
  stripe_customer_id: string | null
  stripe_subscription_id: string | null
  stripeCustomerLink: string | null
  stripeSubscriptionLink: string | null
  createdAt: string
  updatedAt: string
}

interface Pagination {
  page: number
  limit: number
  total: number
  totalPages: number
}

const router = useRouter()

// Reactive state
const subscriptions = ref<Subscription[]>([])
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
const tierFilter = ref<string | number | null>(null)
const statusFilter = ref<string | number | null>(null)

// Filter options
const tierOptions = [
  { value: 'free', label: 'Free' },
  { value: 'pro', label: 'Professional' },
]

const statusOptions = [
  { value: 'free', label: 'Free' },
  { value: 'active', label: 'Active' },
  { value: 'canceled', label: 'Canceled' },
  { value: 'past_due', label: 'Past Due' },
  { value: 'trialing', label: 'Trialing' },
  { value: 'unpaid', label: 'Unpaid' },
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

// Fetch subscriptions function
const fetchSubscriptions = async () => {
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

    if (tierFilter.value) {
      params.append('tier', tierFilter.value.toString())
    }

    if (statusFilter.value) {
      params.append('status', statusFilter.value.toString())
    }

    const response = await $fetch<{
      data: Subscription[]
      pagination: Pagination
    }>(`/api/admin/subscriptions?${params.toString()}`)

    subscriptions.value = response.data
    pagination.value = response.pagination
  } catch (err: any) {
    console.error('Failed to fetch subscriptions:', err)
    error.value = err?.data?.message || 'Failed to load subscriptions. Please try again.'
  } finally {
    loading.value = false
  }
}

// Initial fetch
onMounted(() => {
  fetchSubscriptions()
})

// Watch for filter changes and refetch
watch([searchQuery, tierFilter, statusFilter], () => {
  pagination.value.page = 1
  fetchSubscriptions()
})

// Handlers
const handleSearch = () => {
  pagination.value.page = 1
  fetchSubscriptions()
}

const handleFilterChange = () => {
  pagination.value.page = 1
  fetchSubscriptions()
}

const handlePageChange = (page: number) => {
  if (page >= 1 && page <= pagination.value.totalPages) {
    pagination.value.page = page
    fetchSubscriptions()
  }
}

const navigateToSubscription = (subscriptionId: number) => {
  router.push(`/subscriptions/${subscriptionId}`)
}

// Format helpers
const formatDate = (dateString: string): string => {
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  // If date is in the future
  if (diffDays < 0) {
    const absDiffDays = Math.abs(diffDays)
    if (absDiffDays === 0) {
      return 'Today'
    } else if (absDiffDays === 1) {
      return 'Tomorrow'
    } else if (absDiffDays < 7) {
      return `In ${absDiffDays} days`
    } else if (absDiffDays < 30) {
      const weeks = Math.floor(absDiffDays / 7)
      return `In ${weeks} ${weeks === 1 ? 'week' : 'weeks'}`
    } else {
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      })
    }
  }

  // Past dates
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

const formatTier = (tier: string): string => {
  const tierMap: Record<string, string> = {
    free: 'Free',
    pro: 'Pro',
    professional: 'Pro',
    enterprise: 'Enterprise',
  }
  return tierMap[tier.toLowerCase()] || tier.charAt(0).toUpperCase() + tier.slice(1)
}

const getTierClass = (tier: string): string => {
  const tierLower = tier.toLowerCase()
  if (tierLower === 'pro' || tierLower === 'professional' || tierLower === 'enterprise') {
    return 'text-base-content'
  }
  return 'text-base-content/60'
}

const formatStatus = (status: string): string => {
  const statusMap: Record<string, string> = {
    active: 'Active',
    trialing: 'Trial',
    past_due: 'Past Due',
    canceled: 'Canceled',
    cancelled: 'Canceled',
    unpaid: 'Unpaid',
    free: 'Free',
  }
  return statusMap[status.toLowerCase()] || status.charAt(0).toUpperCase() + status.slice(1)
}

const getStatusClass = (status: string): string => {
  const statusLower = status.toLowerCase()
  if (statusLower === 'active' || statusLower === 'trialing') {
    return 'font-medium text-base-content'
  }
  if (statusLower === 'past_due' || statusLower === 'unpaid') {
    return 'text-warning'
  }
  if (statusLower === 'canceled' || statusLower === 'cancelled') {
    return 'text-base-content/50'
  }
  return 'text-base-content/60'
}
</script>
