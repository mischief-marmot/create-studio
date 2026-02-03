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
      <button class="btn btn-sm btn-primary" @click="fetchSubscriptionDetails">
        Try Again
      </button>
    </div>

    <!-- Subscription Details -->
    <div v-else-if="subscription">
      <!-- Page Header with Back Button -->
      <div class="admin-page-header mb-6">
        <button
          class="btn btn-ghost btn-sm mb-4"
          @click="navigateBack"
          aria-label="Back to subscriptions"
        >
          <ArrowLeftIcon class="size-5 mr-2" />
          Back to Subscriptions
        </button>
        <h1 class="admin-page-title">Subscription Details</h1>
        <p class="admin-page-subtitle">Subscription #{{ subscription.id }}</p>
      </div>

      <!-- Main Content Grid -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <!-- Left Column (Overview) -->
        <div class="lg:col-span-2 space-y-6">
          <!-- Subscription Overview Section -->
          <div class="admin-section">
            <h2 class="text-lg font-semibold mb-4">Subscription Overview</h2>

            <div class="space-y-4">
              <!-- Site -->
              <div class="flex justify-between items-start py-3 border-b border-base-300">
                <span class="text-base-content/60 text-sm">Site</span>
                <div class="text-right">
                  <NuxtLink
                    :to="`/sites/${subscription.site.id}`"
                    class="font-medium hover:text-primary transition-colors"
                  >
                    {{ subscription.site.name }}
                  </NuxtLink>
                  <a
                    :href="subscription.site.url"
                    target="_blank"
                    rel="noopener noreferrer"
                    class="text-primary text-sm hover:underline inline-flex items-center gap-1 mt-1"
                  >
                    {{ subscription.site.url }}
                    <svg class="size-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                  </a>
                </div>
              </div>

              <!-- User -->
              <div class="flex justify-between items-center py-3 border-b border-base-300">
                <span class="text-base-content/60 text-sm">User</span>
                <div v-if="subscription.user" class="text-right">
                  <NuxtLink
                    :to="`/users/${subscription.user.id}`"
                    class="font-medium hover:text-primary transition-colors"
                  >
                    {{ subscription.user.displayName }}
                  </NuxtLink>
                  <div class="text-base-content/60 text-sm">{{ subscription.user.email }}</div>
                </div>
                <div v-else class="text-base-content/40 text-sm">Unknown</div>
              </div>

              <!-- Tier -->
              <div class="flex justify-between items-center py-3 border-b border-base-300">
                <span class="text-base-content/60 text-sm">Tier</span>
                <AdminBadge
                  :status="subscription.tier"
                  variant="tier"
                />
              </div>

              <!-- Status -->
              <div class="flex justify-between items-center py-3 border-b border-base-300">
                <span class="text-base-content/60 text-sm">Status</span>
                <AdminBadge
                  :status="getStatusBadgeType(subscription.status)"
                  variant="status"
                  :custom-text="formatStatus(subscription.status)"
                />
              </div>

              <!-- Billing Period -->
              <div class="flex justify-between items-start py-3 border-b border-base-300">
                <span class="text-base-content/60 text-sm">Billing Period</span>
                <div class="text-right text-sm">
                  <div v-if="subscription.current_period_start">
                    <span class="text-base-content/60">Start:</span>
                    <span class="ml-2">{{ formatDate(subscription.current_period_start) }}</span>
                  </div>
                  <div v-if="subscription.current_period_end" class="mt-1">
                    <span class="text-base-content/60">End:</span>
                    <span class="ml-2">{{ formatDate(subscription.current_period_end) }}</span>
                  </div>
                  <div v-if="!subscription.current_period_start && !subscription.current_period_end" class="text-base-content/40">
                    -
                  </div>
                </div>
              </div>

              <!-- Cancel at Period End -->
              <div v-if="subscription.cancel_at_period_end" class="flex justify-between items-center py-3 border-b border-base-300">
                <span class="text-base-content/60 text-sm">Auto-Renew</span>
                <AdminBadge
                  status="error"
                  variant="status"
                  custom-text="Disabled"
                  :show-dot="false"
                />
              </div>

              <!-- Created / Updated -->
              <div class="flex justify-between items-center py-3 border-b border-base-300">
                <span class="text-base-content/60 text-sm">Created</span>
                <span class="text-sm">{{ formatDate(subscription.createdAt) }}</span>
              </div>

              <div class="flex justify-between items-center py-3">
                <span class="text-base-content/60 text-sm">Updated</span>
                <span class="text-sm">{{ formatDate(subscription.updatedAt) }}</span>
              </div>
            </div>
          </div>

          <!-- Stripe Links Section -->
          <div class="admin-section">
            <h2 class="text-lg font-semibold mb-4">Stripe Dashboard</h2>

            <div class="space-y-3">
              <!-- Stripe Customer Link -->
              <div v-if="subscription.stripeCustomerLink" class="flex items-center justify-between p-4 border border-base-300 rounded-lg hover:bg-base-200 transition-colors">
                <div class="flex items-center gap-3">
                  <div class="bg-primary/10 rounded-lg size-10 flex items-center justify-center">
                    <svg class="size-5 text-primary" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M13.976 9.15c-2.172-.806-3.356-1.426-3.356-2.409 0-.831.683-1.305 1.901-1.305 2.227 0 4.515.858 6.09 1.631l.89-5.494C18.252.975 15.697 0 12.165 0 9.667 0 7.589.654 6.104 1.872 4.56 3.147 3.757 4.992 3.757 7.218c0 4.039 2.467 5.76 6.476 7.219 2.585.92 3.445 1.574 3.445 2.583 0 .98-.84 1.545-2.354 1.545-1.875 0-4.965-.921-6.99-2.109l-.9 5.555C5.175 22.99 8.385 24 11.714 24c2.641 0 4.843-.624 6.328-1.813 1.664-1.305 2.525-3.236 2.525-5.732 0-4.128-2.524-5.851-6.591-7.305z" />
                    </svg>
                  </div>
                  <div>
                    <div class="font-medium">Customer Dashboard</div>
                    <div class="text-base-content/60 text-sm">View customer details in Stripe</div>
                  </div>
                </div>
                <a
                  :href="subscription.stripeCustomerLink"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="btn btn-sm btn-outline"
                >
                  Open
                  <svg class="size-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </a>
              </div>

              <!-- Stripe Subscription Link -->
              <div v-if="subscription.stripeSubscriptionLink" class="flex items-center justify-between p-4 border border-base-300 rounded-lg hover:bg-base-200 transition-colors">
                <div class="flex items-center gap-3">
                  <div class="bg-primary/10 rounded-lg size-10 flex items-center justify-center">
                    <svg class="size-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <div>
                    <div class="font-medium">Subscription Dashboard</div>
                    <div class="text-base-content/60 text-sm">View subscription details in Stripe</div>
                  </div>
                </div>
                <a
                  :href="subscription.stripeSubscriptionLink"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="btn btn-sm btn-outline"
                >
                  Open
                  <svg class="size-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </a>
              </div>

              <!-- No Stripe Data -->
              <div v-if="!subscription.stripeCustomerLink && !subscription.stripeSubscriptionLink" class="text-center py-8">
                <div class="bg-base-200 rounded-full size-12 flex items-center justify-center mx-auto mb-3">
                  <svg class="size-6 text-base-content/40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <p class="text-base-content/60 text-sm">No Stripe data available</p>
              </div>
            </div>
          </div>
        </div>

        <!-- Right Column (Actions) -->
        <div class="space-y-6">
          <!-- Admin Actions Section -->
          <div class="admin-section">
            <h2 class="text-lg font-semibold mb-4">Admin Actions</h2>

            <div class="space-y-3">
              <button
                class="btn btn-outline btn-sm w-full"
                @click="openModifyTierModal"
                :disabled="actionLoading"
              >
                <svg class="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
                </svg>
                Modify Tier
              </button>

              <button
                class="btn btn-outline btn-sm btn-error w-full"
                @click="openCancelModal"
                :disabled="actionLoading || subscription.status === 'canceled' || subscription.cancel_at_period_end"
              >
                <svg class="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
                Cancel Subscription
              </button>
            </div>
          </div>

          <!-- Billing History Section -->
          <div class="admin-section">
            <h2 class="text-lg font-semibold mb-4">Billing History</h2>
            <div class="text-center py-8">
              <div class="bg-base-200 rounded-full size-12 flex items-center justify-center mx-auto mb-3">
                <svg class="size-6 text-base-content/40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <p class="text-base-content/60 text-sm mb-3">View billing history in Stripe</p>
              <a
                v-if="subscription.stripeCustomerLink"
                :href="subscription.stripeCustomerLink"
                target="_blank"
                rel="noopener noreferrer"
                class="btn btn-sm btn-outline"
              >
                Open Stripe
                <svg class="size-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </a>
            </div>
          </div>
        </div>
      </div>

      <!-- Modals -->
      <!-- Modify Tier Modal -->
      <AdminModal
        :open="showModifyTierModal"
        title="Modify Tier"
        description="Change the subscription tier for this site"
        variant="confirm"
        confirm-text="Update Tier"
        :loading="actionLoading"
        @confirm="handleModifyTier"
        @cancel="closeModals"
        @close="closeModals"
      >
        <div class="mb-4">
          <label class="block text-sm font-medium mb-2">Select New Tier</label>
          <div class="space-y-2">
            <label class="flex items-center gap-3 p-3 border border-base-300 rounded-lg cursor-pointer hover:bg-base-200 transition-colors" :class="{ 'border-primary bg-primary/5': selectedTier === 'free' }">
              <input
                type="radio"
                name="tier"
                value="free"
                v-model="selectedTier"
                class="radio radio-primary"
              />
              <div class="flex-1">
                <div class="font-medium">Free</div>
                <div class="text-base-content/60 text-sm">Downgrade to free tier</div>
              </div>
              <AdminBadge status="free" variant="tier" />
            </label>

            <label class="flex items-center gap-3 p-3 border border-base-300 rounded-lg cursor-pointer hover:bg-base-200 transition-colors" :class="{ 'border-primary bg-primary/5': selectedTier === 'pro' }">
              <input
                type="radio"
                name="tier"
                value="pro"
                v-model="selectedTier"
                class="radio radio-primary"
              />
              <div class="flex-1">
                <div class="font-medium">Pro</div>
                <div class="text-base-content/60 text-sm">Upgrade to pro tier</div>
              </div>
              <AdminBadge status="pro" variant="tier" />
            </label>
          </div>
        </div>

        <div class="bg-warning/10 border border-warning/20 rounded-lg p-4">
          <p class="text-sm text-warning font-medium mb-2">Note:</p>
          <ul class="text-sm text-base-content/70 space-y-1 list-disc list-inside">
            <li>This will immediately change the tier in the database</li>
            <li>If downgrading to free with an active Stripe subscription, it will be canceled</li>
            <li>Changes are logged in the audit log</li>
          </ul>
        </div>
      </AdminModal>

      <!-- Cancel Subscription Modal -->
      <AdminModal
        :open="showCancelModal"
        title="Cancel Subscription"
        description="This is a destructive action. Are you sure?"
        variant="danger"
        confirm-text="Cancel Subscription"
        :loading="actionLoading"
        @confirm="handleCancelSubscription"
        @cancel="closeModals"
        @close="closeModals"
      >
        <div class="bg-error/10 border border-error/20 rounded-lg p-4 mb-4">
          <p class="text-sm text-error font-medium mb-2">Warning: This action will:</p>
          <ul class="text-sm text-base-content/70 space-y-1 list-disc list-inside">
            <li>Cancel the subscription in Stripe (if applicable)</li>
            <li>Set the subscription to cancel at period end</li>
            <li>Downgrade tier to free</li>
            <li>User will retain access until current period ends</li>
          </ul>
        </div>
        <p class="text-sm text-base-content/70">
          Site: <strong>{{ subscription.site.name }}</strong>
        </p>
      </AdminModal>

      <!-- Success/Error Alert -->
      <div
        v-if="alertMessage"
        class="toast toast-top toast-end"
      >
        <div
          class="alert"
          :class="alertType === 'success' ? 'alert-success' : 'alert-error'"
        >
          <span>{{ alertMessage }}</span>
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

interface Subscription {
  id: number
  site_id: number
  site: {
    id: number
    name: string
    url: string
  }
  user: {
    id: number
    email: string
    firstname: string | null
    lastname: string | null
    displayName: string
  } | null
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

const router = useRouter()
const route = useRoute()

// State
const subscription = ref<Subscription | null>(null)
const loading = ref(true)
const error = ref<string | null>(null)
const actionLoading = ref(false)

// Modal state
const showModifyTierModal = ref(false)
const showCancelModal = ref(false)
const selectedTier = ref<'free' | 'pro'>('free')

// Alert state
const alertMessage = ref<string | null>(null)
const alertType = ref<'success' | 'error'>('success')

// Fetch subscription details
const fetchSubscriptionDetails = async () => {
  loading.value = true
  error.value = null

  try {
    const subscriptionId = route.params.id
    const response = await $fetch<Subscription>(`/api/admin/subscriptions/${subscriptionId}`)
    subscription.value = response
    selectedTier.value = response.tier as 'free' | 'pro'
  } catch (err: any) {
    console.error('Failed to fetch subscription details:', err)
    if (err?.statusCode === 404) {
      error.value = 'Subscription not found'
    } else {
      error.value = err?.data?.message || 'Failed to load subscription details. Please try again.'
    }
  } finally {
    loading.value = false
  }
}

// Navigation
const navigateBack = () => {
  router.push('/subscriptions')
}

// Modal handlers
const openModifyTierModal = () => {
  if (subscription.value) {
    selectedTier.value = subscription.value.tier as 'free' | 'pro'
  }
  showModifyTierModal.value = true
}

const openCancelModal = () => {
  showCancelModal.value = true
}

const closeModals = () => {
  showModifyTierModal.value = false
  showCancelModal.value = false
}

// Action handlers
const handleModifyTier = async () => {
  if (!subscription.value) return

  actionLoading.value = true
  try {
    const response = await $fetch(`/api/admin/subscriptions/${subscription.value.id}/modify-tier`, {
      method: 'POST',
      body: {
        tier: selectedTier.value,
      },
    })

    showAlert('Subscription tier updated successfully', 'success')
    closeModals()
    await fetchSubscriptionDetails() // Refresh data
  } catch (err: any) {
    console.error('Failed to modify tier:', err)
    showAlert(err?.data?.message || 'Failed to modify subscription tier', 'error')
  } finally {
    actionLoading.value = false
  }
}

const handleCancelSubscription = async () => {
  if (!subscription.value) return

  actionLoading.value = true
  try {
    await $fetch(`/api/admin/subscriptions/${subscription.value.id}/cancel`, {
      method: 'POST',
    })
    showAlert('Subscription canceled successfully', 'success')
    closeModals()
    await fetchSubscriptionDetails() // Refresh data
  } catch (err: any) {
    console.error('Failed to cancel subscription:', err)
    showAlert(err?.data?.message || 'Failed to cancel subscription', 'error')
  } finally {
    actionLoading.value = false
  }
}

// Alert helper
const showAlert = (message: string, type: 'success' | 'error') => {
  alertMessage.value = message
  alertType.value = type
  setTimeout(() => {
    alertMessage.value = null
  }, 5000)
}

// Format helpers
const formatDate = (dateString: string): string => {
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}

const formatStatus = (status: string): string => {
  return status.charAt(0).toUpperCase() + status.slice(1).replace('_', ' ')
}

const getStatusBadgeType = (status: string): string => {
  const statusMap: Record<string, string> = {
    'free': 'neutral',
    'active': 'success',
    'trialing': 'info',
    'canceled': 'error',
    'past_due': 'warning',
    'unpaid': 'error',
  }
  return statusMap[status] || 'neutral'
}

// Initialize
onMounted(() => {
  fetchSubscriptionDetails()
})
</script>
