<template>
  <div class="p-8">
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
      <p class="text-base-content/60 text-sm mb-4">{{ error }}</p>
      <button class="btn btn-sm btn-primary" @click="fetchSiteDetails">
        Try Again
      </button>
    </div>

    <!-- Site Details -->
    <div v-else-if="site">
      <!-- Page Header with Back Button -->
      <div class="admin-page-header mb-6">
        <button
          class="btn btn-ghost btn-sm mb-4"
          @click="navigateBack"
          aria-label="Back to sites"
        >
          <ArrowLeftIcon class="size-5 mr-2" />
          Back to Sites
        </button>
        <h1 class="admin-page-title">{{ site.name || site.url }}</h1>
        <p class="admin-page-subtitle">Site details and configuration</p>
      </div>

      <!-- Main Content Grid -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <!-- Left Column (Site Information) -->
        <div class="lg:col-span-1">
          <div class="admin-section">
            <h2 class="text-lg font-semibold mb-4">Site Information</h2>

            <div class="space-y-3">
              <!-- Site Name -->
              <div class="flex justify-between items-start py-2 border-b border-base-300">
                <span class="text-base-content/60 text-sm">Name</span>
                <span class="text-sm font-medium text-right">{{ site.name || 'Unnamed Site' }}</span>
              </div>

              <!-- URL -->
              <div class="flex justify-between items-start py-2 border-b border-base-300">
                <span class="text-base-content/60 text-sm">URL</span>
                <a
                  :href="site.url"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="text-primary text-sm hover:underline inline-flex items-center gap-1"
                >
                  {{ truncateUrl(site.url) }}
                  <svg class="size-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </a>
              </div>

              <!-- Owner -->
              <div class="flex justify-between items-start py-2 border-b border-base-300">
                <span class="text-base-content/60 text-sm">Owner</span>
                <NuxtLink
                  :to="`/users/${site.owner.id}`"
                  class="text-primary text-sm hover:underline text-right"
                >
                  {{ formatOwnerName(site.owner) }}
                </NuxtLink>
              </div>

              <!-- Canonical Site -->
              <div v-if="site.canonical_site" class="flex justify-between items-start py-2 border-b border-base-300">
                <span class="text-base-content/60 text-sm">Canonical Site</span>
                <NuxtLink
                  :to="`/sites/${site.canonical_site.id}`"
                  class="text-primary text-sm hover:underline text-right"
                >
                  {{ site.canonical_site.name || site.canonical_site.url }}
                </NuxtLink>
              </div>

              <!-- Created -->
              <div class="flex justify-between items-center py-2 border-b border-base-300">
                <span class="text-base-content/60 text-sm">Created</span>
                <span class="text-sm">{{ formatDate(site.createdAt) }}</span>
              </div>

              <!-- Updated -->
              <div class="flex justify-between items-center py-2">
                <span class="text-base-content/60 text-sm">Updated</span>
                <span class="text-sm">{{ formatDate(site.updatedAt) }}</span>
              </div>
            </div>
          </div>

          <!-- Versions Section -->
          <div class="admin-section mt-6">
            <h2 class="text-lg font-semibold mb-4">Version Information</h2>

            <div class="space-y-3">
              <div class="flex justify-between items-center py-2 border-b border-base-300">
                <span class="text-base-content/60 text-sm">WordPress</span>
                <span class="text-sm font-mono">{{ site.versions.wordpress || 'Unknown' }}</span>
              </div>

              <div class="flex justify-between items-center py-2 border-b border-base-300">
                <span class="text-base-content/60 text-sm">PHP</span>
                <span class="text-sm font-mono">{{ site.versions.php || 'Unknown' }}</span>
              </div>

              <div class="flex justify-between items-center py-2">
                <span class="text-base-content/60 text-sm">Create Plugin</span>
                <span class="text-sm font-mono">{{ site.versions.create || 'Unknown' }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Right Column (Users, Subscription, Settings) -->
        <div class="lg:col-span-2 space-y-6">
          <!-- Associated Users Section -->
          <div class="admin-section">
            <div class="flex items-center justify-between mb-4">
              <h2 class="text-lg font-semibold">Associated Users</h2>
              <AdminBadge
                status="info"
                variant="status"
                :custom-text="site.associated_users.length.toString()"
                :show-dot="false"
              />
            </div>

            <!-- No Users -->
            <div v-if="site.associated_users.length === 0" class="text-center py-8">
              <div class="bg-base-200 rounded-full size-12 flex items-center justify-center mx-auto mb-3">
                <svg class="size-6 text-base-content/40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              </div>
              <p class="text-base-content/60 text-sm">No associated users</p>
            </div>

            <!-- Users Table -->
            <div v-else class="overflow-x-auto">
              <table class="admin-table">
                <thead>
                  <tr>
                    <th>User</th>
                    <th>Role</th>
                    <th>Verified</th>
                    <th>Joined</th>
                  </tr>
                </thead>
                <tbody>
                  <tr
                    v-for="user in site.associated_users"
                    :key="user.id"
                    class="cursor-pointer hover:bg-base-200"
                    @click="navigateToUser(user.id)"
                  >
                    <td>
                      <div class="font-medium">{{ formatUserName(user) }}</div>
                      <div class="text-base-content/60 text-xs">{{ user.email }}</div>
                    </td>
                    <td>
                      <AdminBadge
                        :status="user.role"
                        variant="role"
                      />
                    </td>
                    <td>
                      <AdminBadge
                        :status="user.verified ? 'verified' : 'pending'"
                        variant="status"
                        :custom-text="user.verified ? 'Verified' : 'Pending'"
                      />
                    </td>
                    <td>
                      <span class="text-sm">{{ formatDate(user.joined_at) }}</span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <!-- Subscription Details Section -->
          <div class="admin-section">
            <h2 class="text-lg font-semibold mb-4">Subscription Details</h2>

            <!-- No Subscription -->
            <div v-if="!site.subscription" class="text-center py-8">
              <div class="bg-base-200 rounded-full size-12 flex items-center justify-center mx-auto mb-3">
                <svg class="size-6 text-base-content/40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                </svg>
              </div>
              <p class="text-base-content/60 text-sm">No active subscription</p>
            </div>

            <!-- Subscription Info -->
            <div v-else>
              <div class="space-y-3 mb-4">
                <!-- Tier and Status -->
                <div class="flex justify-between items-center py-2 border-b border-base-300">
                  <span class="text-base-content/60 text-sm">Tier</span>
                  <AdminBadge
                    :status="site.subscription.tier"
                    variant="tier"
                  />
                </div>

                <div class="flex justify-between items-center py-2 border-b border-base-300">
                  <span class="text-base-content/60 text-sm">Status</span>
                  <AdminBadge
                    :status="site.subscription.status"
                    variant="status"
                  />
                </div>

                <!-- Period Dates -->
                <div v-if="site.subscription.current_period_start" class="flex justify-between items-center py-2 border-b border-base-300">
                  <span class="text-base-content/60 text-sm">Period Start</span>
                  <span class="text-sm">{{ formatDate(site.subscription.current_period_start) }}</span>
                </div>

                <div v-if="site.subscription.current_period_end" class="flex justify-between items-center py-2 border-b border-base-300">
                  <span class="text-base-content/60 text-sm">{{ site.subscription.cancel_at_period_end ? 'Ends' : 'Renews' }}</span>
                  <span class="text-sm">{{ formatDate(site.subscription.current_period_end) }}</span>
                </div>

                <!-- Auto-Renew Warning -->
                <div v-if="site.subscription.cancel_at_period_end" class="flex justify-between items-center py-2">
                  <span class="text-base-content/60 text-sm">Auto-Renew</span>
                  <AdminBadge
                    status="error"
                    variant="status"
                    custom-text="Disabled"
                    :show-dot="false"
                  />
                </div>
              </div>

              <!-- Link to Subscription Detail -->
              <NuxtLink
                :to="`/subscriptions/${site.subscription.id}`"
                class="btn btn-outline btn-sm w-full"
              >
                View Subscription Details
              </NuxtLink>
            </div>
          </div>

          <!-- Site Settings Section -->
          <div class="admin-section">
            <h2 class="text-lg font-semibold mb-4">Site Settings</h2>

            <div class="space-y-3">
              <div class="flex justify-between items-center py-2 border-b border-base-300">
                <span class="text-base-content/60 text-sm">Interactive Mode</span>
                <AdminBadge
                  :status="site.settings.interactive_mode_enabled ? 'success' : 'neutral'"
                  variant="status"
                  :custom-text="site.settings.interactive_mode_enabled ? 'Enabled' : 'Disabled'"
                  :show-dot="false"
                />
              </div>

              <div v-if="site.settings.interactive_mode_button_text" class="flex justify-between items-start py-2">
                <span class="text-base-content/60 text-sm">Button Text</span>
                <span class="text-sm text-right font-medium">{{ site.settings.interactive_mode_button_text }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ArrowLeftIcon } from '@heroicons/vue/24/outline'

definePageMeta({
  layout: 'admin'
})

interface Owner {
  id: number
  email: string
  firstname: string | null
  lastname: string | null
}

interface CanonicalSite {
  id: number
  name: string | null
  url: string
}

interface AssociatedUser {
  id: number
  email: string
  firstname: string | null
  lastname: string | null
  role: string
  verified: boolean
  verified_at: string | null
  joined_at: string
}

interface Subscription {
  id: number
  status: string
  tier: string
  current_period_start: string | null
  current_period_end: string | null
  cancel_at_period_end: boolean
  stripe_customer_id: string | null
  stripe_subscription_id: string | null
}

interface Site {
  id: number
  name: string | null
  url: string
  owner: Owner
  versions: {
    create: string | null
    wordpress: string | null
    php: string | null
  }
  settings: {
    interactive_mode_enabled: boolean
    interactive_mode_button_text: string | null
  }
  canonical_site: CanonicalSite | null
  associated_users: AssociatedUser[]
  subscription: Subscription | null
  createdAt: string
  updatedAt: string
}

const router = useRouter()
const route = useRoute()

// State
const site = ref<Site | null>(null)
const loading = ref(true)
const error = ref<string | null>(null)

// Fetch site details
const fetchSiteDetails = async () => {
  loading.value = true
  error.value = null

  try {
    const siteId = route.params.id
    const response = await $fetch<Site>(`/api/admin/sites/${siteId}`)
    site.value = response
  } catch (err: any) {
    console.error('Failed to fetch site details:', err)
    if (err?.statusCode === 404) {
      error.value = 'Site not found'
    } else {
      error.value = err?.data?.message || 'Failed to load site details. Please try again.'
    }
  } finally {
    loading.value = false
  }
}

// Navigation
const navigateBack = () => {
  router.push('/sites')
}

const navigateToUser = (userId: number) => {
  router.push(`/users/${userId}`)
}

// Format helpers
const formatDate = (dateString: string | null): string => {
  if (!dateString) return 'N/A'
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}

const formatOwnerName = (owner: Owner): string => {
  if (owner.firstname && owner.lastname) {
    return `${owner.firstname} ${owner.lastname}`
  }
  if (owner.firstname) return owner.firstname
  if (owner.lastname) return owner.lastname
  return owner.email
}

const formatUserName = (user: AssociatedUser): string => {
  if (user.firstname && user.lastname) {
    return `${user.firstname} ${user.lastname}`
  }
  if (user.firstname) return user.firstname
  if (user.lastname) return user.lastname
  return user.email
}

const truncateUrl = (url: string): string => {
  if (url.length > 40) {
    return url.substring(0, 37) + '...'
  }
  return url
}

// Initialize
onMounted(() => {
  fetchSiteDetails()
})
</script>
