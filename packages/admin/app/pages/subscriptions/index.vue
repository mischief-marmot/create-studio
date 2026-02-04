<template>
  <div class="p-8">
    <!-- Page Header -->
    <div class="admin-page-header">
      <h1 class="admin-page-title">Subscriptions</h1>
      <p class="admin-page-subtitle">Manage site subscriptions and billing</p>
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

    <!-- Subscriptions Table -->
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
        <button class="btn btn-sm btn-primary mt-4" @click="fetchSubscriptions">
          Try Again
        </button>
      </div>

      <!-- Table -->
      <div v-else-if="subscriptions.length > 0">
        <div class="overflow-x-auto">
          <table class="admin-table">
            <thead>
              <tr>
                <th>Site</th>
                <th>User</th>
                <th>Tier</th>
                <th>Status</th>
                <th>Period End</th>
                <th>Stripe</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="subscription in subscriptions"
                :key="subscription.id"
                class="cursor-pointer hover:bg-base-200"
                @click="navigateToSubscription(subscription.id)"
              >
                <td>
                  <div class="flex flex-col">
                    <div class="font-medium">{{ subscription.siteName }}</div>
                    <div class="text-base-content/60 text-sm">{{ subscription.siteUrl }}</div>
                  </div>
                </td>
                <td>
                  <div class="text-base-content/60">{{ subscription.userEmail }}</div>
                </td>
                <td>
                  <AdminBadge
                    :status="subscription.tier"
                    variant="tier"
                  />
                </td>
                <td>
                  <AdminBadge
                    :status="getStatusBadgeType(subscription.status)"
                    variant="status"
                    :custom-text="formatStatus(subscription.status)"
                  />
                </td>
                <td>
                  <div v-if="subscription.current_period_end" class="text-base-content/60 text-sm">
                    {{ formatDate(subscription.current_period_end) }}
                  </div>
                  <div v-else class="text-base-content/40 text-sm">-</div>
                </td>
                <td>
                  <div class="flex gap-2" @click.stop>
                    <!-- Stripe Customer Link -->
                    <a
                      v-if="subscription.stripeCustomerLink"
                      :href="subscription.stripeCustomerLink"
                      target="_blank"
                      rel="noopener noreferrer"
                      class="btn btn-xs btn-ghost"
                      title="View in Stripe Customer Dashboard"
                      aria-label="View customer in Stripe dashboard"
                    >
                      <svg class="size-4" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M13.976 9.15c-2.172-.806-3.356-1.426-3.356-2.409 0-.831.683-1.305 1.901-1.305 2.227 0 4.515.858 6.09 1.631l.89-5.494C18.252.975 15.697 0 12.165 0 9.667 0 7.589.654 6.104 1.872 4.56 3.147 3.757 4.992 3.757 7.218c0 4.039 2.467 5.76 6.476 7.219 2.585.92 3.445 1.574 3.445 2.583 0 .98-.84 1.545-2.354 1.545-1.875 0-4.965-.921-6.99-2.109l-.9 5.555C5.175 22.99 8.385 24 11.714 24c2.641 0 4.843-.624 6.328-1.813 1.664-1.305 2.525-3.236 2.525-5.732 0-4.128-2.524-5.851-6.591-7.305z" />
                      </svg>
                    </a>

                    <!-- Stripe Subscription Link -->
                    <a
                      v-if="subscription.stripeSubscriptionLink"
                      :href="subscription.stripeSubscriptionLink"
                      target="_blank"
                      rel="noopener noreferrer"
                      class="btn btn-xs btn-ghost"
                      title="View in Stripe Subscription Dashboard"
                      aria-label="View subscription in Stripe dashboard"
                    >
                      <svg class="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </a>

                    <!-- No Stripe Data -->
                    <span v-if="!subscription.stripeCustomerLink && !subscription.stripeSubscriptionLink" class="text-base-content/40 text-xs">
                      -
                    </span>
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
            Showing {{ startIndex + 1 }} to {{ Math.min(endIndex, pagination.total) }} of {{ pagination.total }} subscriptions
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
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
          </svg>
        </div>
        <p class="text-base-content/60 text-sm mb-1">No subscriptions found</p>
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

const formatStatus = (status: string): string => {
  // Handle special cases
  const statusMap: Record<string, string> = {
    past_due: 'Past Due',
  }

  return statusMap[status] || status.charAt(0).toUpperCase() + status.slice(1).toLowerCase()
}

const getStatusBadgeType = (status: string): string => {
  // Map subscription statuses to badge types
  const statusMap: Record<string, string> = {
    active: 'success',
    trialing: 'info',
    canceled: 'neutral',
    past_due: 'warning',
    unpaid: 'error',
    free: 'neutral',
  }

  return statusMap[status] || 'neutral'
}
</script>
