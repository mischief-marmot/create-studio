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
      <button class="btn btn-sm btn-primary" @click="fetchUserDetails">
        Try Again
      </button>
    </div>

    <!-- User Details -->
    <div v-else-if="user">
      <!-- Page Header with Back Button -->
      <div class="admin-page-header mb-6">
        <button
          class="btn btn-ghost btn-sm mb-4"
          @click="navigateBack"
          aria-label="Back to users"
        >
          <ArrowLeftIcon class="size-5 mr-2" />
          Back to Users
        </button>
        <h1 class="admin-page-title">User Details</h1>
        <p class="admin-page-subtitle">View and manage user account</p>
      </div>

      <!-- Main Content Grid -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <!-- Profile Card (Left/Top) -->
        <div class="lg:col-span-1">
          <div class="admin-section">
            <h2 class="text-lg font-semibold mb-4">Profile</h2>

            <div class="flex flex-col items-center text-center mb-6">
              <!-- Avatar -->
              <div class="avatar mb-4">
                <div class="rounded-full size-20 ring ring-primary ring-offset-base-100 ring-offset-2">
                  <img
                    v-if="gravatarUrl"
                    :src="gravatarUrl"
                    :alt="`${displayName}'s avatar`"
                    @error="handleImageError"
                  />
                  <div
                    v-else
                    class="flex items-center justify-center bg-primary/10 text-primary font-semibold text-2xl size-full"
                  >
                    {{ userInitials }}
                  </div>
                </div>
              </div>

              <!-- Name -->
              <h3 class="text-xl font-semibold mb-1">{{ displayName }}</h3>

              <!-- Email with Verified Badge -->
              <div class="flex items-center gap-2 mb-3">
                <p class="text-base-content/60 text-sm">{{ user.email }}</p>
                <AdminBadge
                  :status="user.validEmail ? 'verified' : 'pending'"
                  variant="status"
                  :custom-text="user.validEmail ? 'Verified' : 'Unverified'"
                />
              </div>
            </div>

            <!-- User Info -->
            <div class="space-y-3">
              <div class="flex justify-between items-center py-2 border-b border-base-300">
                <span class="text-base-content/60 text-sm">Marketing Opt-in</span>
                <AdminBadge
                  :status="user.marketing_opt_in ? 'success' : 'neutral'"
                  variant="status"
                  :custom-text="user.marketing_opt_in ? 'Yes' : 'No'"
                  :show-dot="false"
                />
              </div>

              <div class="flex justify-between items-center py-2 border-b border-base-300">
                <span class="text-base-content/60 text-sm">Mediavine Publisher</span>
                <AdminBadge
                  :status="user.mediavine_publisher ? 'success' : 'neutral'"
                  variant="status"
                  :custom-text="user.mediavine_publisher ? 'Yes' : 'No'"
                  :show-dot="false"
                />
              </div>

              <div class="flex justify-between items-center py-2 border-b border-base-300">
                <span class="text-base-content/60 text-sm">Created</span>
                <span class="text-sm">{{ formatDate(user.createdAt) }}</span>
              </div>

              <div class="flex justify-between items-center py-2">
                <span class="text-base-content/60 text-sm">Updated</span>
                <span class="text-sm">{{ formatDate(user.updatedAt) }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Right Column (Sites, Subscription, Audit) -->
        <div class="lg:col-span-2 space-y-6">
          <!-- Sites Section -->
          <div class="admin-section">
            <div class="flex items-center justify-between mb-4">
              <h2 class="text-lg font-semibold">Associated Sites</h2>
              <AdminBadge
                status="info"
                variant="status"
                :custom-text="user.sites.length.toString()"
                :show-dot="false"
              />
            </div>

            <!-- No Sites -->
            <div v-if="user.sites.length === 0" class="text-center py-8">
              <div class="bg-base-200 rounded-full size-12 flex items-center justify-center mx-auto mb-3">
                <svg class="size-6 text-base-content/40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
              </div>
              <p class="text-base-content/60 text-sm">No sites associated</p>
            </div>

            <!-- Sites List -->
            <div v-else class="space-y-3">
              <div
                v-for="site in user.sites"
                :key="site.id"
                class="border border-base-300 rounded-lg p-4 hover:bg-base-200 transition-colors"
              >
                <div class="flex items-start justify-between mb-2">
                  <div class="flex-1">
                    <h3 class="font-medium mb-1">{{ site.name || site.url }}</h3>
                    <a
                      :href="site.url"
                      target="_blank"
                      rel="noopener noreferrer"
                      class="text-primary text-sm hover:underline inline-flex items-center gap-1"
                    >
                      {{ site.url }}
                      <svg class="size-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                    </a>
                  </div>
                  <div class="flex flex-col items-end gap-2">
                    <AdminBadge
                      v-if="site.role"
                      :status="site.role"
                      variant="role"
                    />
                    <AdminBadge
                      :status="site.isVerified ? 'verified' : 'pending'"
                      variant="status"
                      :custom-text="site.isVerified ? 'Verified' : 'Pending'"
                    />
                  </div>
                </div>

                <!-- Site Subscription Info -->
                <div v-if="site.subscription" class="mt-3 pt-3 border-t border-base-300">
                  <div class="flex items-center gap-2 text-sm">
                    <span class="text-base-content/60">Subscription:</span>
                    <AdminBadge
                      :status="site.subscription.tier"
                      variant="tier"
                    />
                    <AdminBadge
                      :status="site.subscription.status"
                      variant="status"
                    />
                    <span v-if="site.subscription.current_period_end" class="text-base-content/60">
                      Renews {{ formatDate(site.subscription.current_period_end) }}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Audit Summary Section -->
          <div class="admin-section">
            <h2 class="text-lg font-semibold mb-4">Audit Summary</h2>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
              <div class="border border-base-300 rounded-lg p-4">
                <div class="text-base-content/60 text-sm mb-1">Total Actions</div>
                <div class="text-2xl font-semibold">{{ user.auditLogSummary.totalActions }}</div>
              </div>

              <div class="border border-base-300 rounded-lg p-4">
                <div class="text-base-content/60 text-sm mb-1">Last Action</div>
                <div v-if="user.auditLogSummary.lastAction" class="text-sm">
                  <div class="font-medium mb-1">{{ user.auditLogSummary.lastAction.action }}</div>
                  <div class="text-base-content/60">{{ formatRelativeTime(user.auditLogSummary.lastAction.timestamp) }}</div>
                </div>
                <div v-else class="text-base-content/60 text-sm">No actions yet</div>
              </div>
            </div>

            <NuxtLink
              :to="`/audit-logs?user=${user.id}`"
              class="btn btn-outline btn-sm w-full"
            >
              View Full Audit Log
            </NuxtLink>
          </div>
        </div>
      </div>

      <!-- Admin Actions Section -->
      <div class="admin-section">
        <h2 class="text-lg font-semibold mb-4">Admin Actions</h2>

        <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <button
            class="btn btn-outline btn-sm"
            @click="openResetPasswordModal"
            :disabled="actionLoading"
          >
            <LockClosedIcon class="size-4" />
            Reset Password
          </button>

          <button
            class="btn btn-outline btn-sm"
            @click="openSendVerificationModal"
            :disabled="actionLoading || user.validEmail"
          >
            <EnvelopeIcon class="size-4" />
            Send Verification Email
          </button>

          <button
            class="btn btn-error btn-outline btn-sm"
            @click="openDisableAccountModal"
            :disabled="actionLoading"
          >
            <ShieldExclamationIcon class="size-4" />
            Disable Account
          </button>
        </div>
      </div>

      <!-- Modals -->
      <!-- Reset Password Modal -->
      <AdminModal
        :open="showResetPasswordModal"
        title="Reset Password"
        description="Send a password reset email to this user?"
        variant="confirm"
        confirm-text="Send Reset Email"
        :loading="actionLoading"
        @confirm="handleResetPassword"
        @cancel="closeModals"
        @close="closeModals"
      >
        <p class="text-sm text-base-content/70">
          A password reset link will be sent to <strong>{{ user.email }}</strong>.
          The link will be valid for 24 hours.
        </p>
      </AdminModal>

      <!-- Send Verification Email Modal -->
      <AdminModal
        :open="showSendVerificationModal"
        title="Send Verification Email"
        description="Resend verification email to this user?"
        variant="confirm"
        confirm-text="Send Email"
        :loading="actionLoading"
        @confirm="handleSendVerification"
        @cancel="closeModals"
        @close="closeModals"
      >
        <p class="text-sm text-base-content/70">
          A verification email will be sent to <strong>{{ user.email }}</strong>.
        </p>
      </AdminModal>

      <!-- Disable Account Modal -->
      <AdminModal
        :open="showDisableAccountModal"
        title="Disable Account"
        description="This is a destructive action. Are you sure?"
        variant="danger"
        confirm-text="Disable Account"
        :loading="actionLoading"
        @confirm="handleDisableAccount"
        @cancel="closeModals"
        @close="closeModals"
      >
        <div class="bg-error/10 border border-error/20 rounded-lg p-4 mb-4">
          <p class="text-sm text-error font-medium mb-2">Warning: This action will:</p>
          <ul class="text-sm text-base-content/70 space-y-1 list-disc list-inside">
            <li>Immediately disable the user's account</li>
            <li>Prevent the user from logging in</li>
            <li>Require admin intervention to re-enable</li>
          </ul>
        </div>
        <p class="text-sm text-base-content/70">
          User: <strong>{{ user.email }}</strong>
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
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ArrowLeftIcon, EnvelopeIcon, LockClosedIcon, ShieldExclamationIcon } from '@heroicons/vue/24/outline'
import { getGravatarUrl, getUserInitials } from '~/composables/useAvatar'

definePageMeta({
  layout: 'admin'
})

interface Site {
  id: number
  name: string | null
  url: string
  createdAt: string
  verifiedAt: string | null
  role: string | null
  isVerified: boolean
  versions: {
    create: string | null
    wordpress: string | null
  }
  subscription: {
    siteId: number
    status: string
    tier: string
    current_period_start: string | null
    current_period_end: string | null
    cancel_at_period_end: boolean
  } | null
}

interface AuditLogSummary {
  totalActions: number
  lastAction: {
    action: string
    timestamp: string
  } | null
}

interface User {
  id: number
  email: string
  firstname: string | null
  lastname: string | null
  avatar: string | null
  validEmail: boolean
  mediavine_publisher: boolean
  marketing_opt_in: boolean
  createdAt: string
  updatedAt: string
  sites: Site[]
  auditLogSummary: AuditLogSummary
}

const router = useRouter()
const route = useRoute()

// State
const user = ref<User | null>(null)
const loading = ref(true)
const error = ref<string | null>(null)
const actionLoading = ref(false)
const gravatarError = ref(false)

// Modal state
const showResetPasswordModal = ref(false)
const showSendVerificationModal = ref(false)
const showDisableAccountModal = ref(false)

// Alert state
const alertMessage = ref<string | null>(null)
const alertType = ref<'success' | 'error'>('success')

// Computed
const displayName = computed(() => {
  if (!user.value) return ''
  if (user.value.firstname && user.value.lastname) {
    return `${user.value.firstname} ${user.value.lastname}`
  }
  if (user.value.firstname) return user.value.firstname
  if (user.value.lastname) return user.value.lastname
  return user.value.email
})

const userInitials = computed(() => {
  if (!user.value) return '??'
  return getUserInitials(user.value.firstname || undefined, user.value.lastname || undefined)
})

const gravatarUrl = computed(() => {
  if (!user.value || gravatarError.value) return null
  return getGravatarUrl(user.value.email, 80)
})

// Fetch user details
const fetchUserDetails = async () => {
  loading.value = true
  error.value = null

  try {
    const userId = route.params.id
    const response = await $fetch<User>(`/api/admin/users/${userId}`)
    user.value = response
  } catch (err: any) {
    console.error('Failed to fetch user details:', err)
    if (err?.statusCode === 404) {
      error.value = 'User not found'
    } else {
      error.value = err?.data?.message || 'Failed to load user details. Please try again.'
    }
  } finally {
    loading.value = false
  }
}

// Navigation
const navigateBack = () => {
  router.push('/users')
}

// Modal handlers
const openResetPasswordModal = () => {
  showResetPasswordModal.value = true
}

const openSendVerificationModal = () => {
  showSendVerificationModal.value = true
}

const openDisableAccountModal = () => {
  showDisableAccountModal.value = true
}

const closeModals = () => {
  showResetPasswordModal.value = false
  showSendVerificationModal.value = false
  showDisableAccountModal.value = false
}

// Action handlers (placeholder API calls)
const handleResetPassword = async () => {
  actionLoading.value = true
  try {
    // Placeholder - implement actual API call
    await new Promise(resolve => setTimeout(resolve, 1000))
    showAlert('Password reset email sent successfully', 'success')
    closeModals()
  } catch (err: any) {
    showAlert(err?.data?.message || 'Failed to send password reset email', 'error')
  } finally {
    actionLoading.value = false
  }
}

const handleSendVerification = async () => {
  actionLoading.value = true
  try {
    // Placeholder - implement actual API call
    await new Promise(resolve => setTimeout(resolve, 1000))
    showAlert('Verification email sent successfully', 'success')
    closeModals()
  } catch (err: any) {
    showAlert(err?.data?.message || 'Failed to send verification email', 'error')
  } finally {
    actionLoading.value = false
  }
}

const handleDisableAccount = async () => {
  actionLoading.value = true
  try {
    // Placeholder - implement actual API call
    await new Promise(resolve => setTimeout(resolve, 1000))
    showAlert('Account disabled successfully', 'success')
    closeModals()
    // Optionally navigate back to users list
    setTimeout(() => {
      navigateBack()
    }, 2000)
  } catch (err: any) {
    showAlert(err?.data?.message || 'Failed to disable account', 'error')
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

// Image error handler
const handleImageError = () => {
  gravatarError.value = true
}

// Format date helper
const formatDate = (dateString: string): string => {
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}

// Format relative time helper
const formatRelativeTime = (dateString: string): string => {
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffSeconds = Math.floor(diffMs / 1000)
  const diffMinutes = Math.floor(diffSeconds / 60)
  const diffHours = Math.floor(diffMinutes / 60)
  const diffDays = Math.floor(diffHours / 24)

  if (diffSeconds < 60) {
    return 'Just now'
  } else if (diffMinutes < 60) {
    return `${diffMinutes} ${diffMinutes === 1 ? 'minute' : 'minutes'} ago`
  } else if (diffHours < 24) {
    return `${diffHours} ${diffHours === 1 ? 'hour' : 'hours'} ago`
  } else if (diffDays < 7) {
    return `${diffDays} ${diffDays === 1 ? 'day' : 'days'} ago`
  } else {
    return formatDate(dateString)
  }
}

// Initialize
onMounted(() => {
  fetchUserDetails()
})
</script>
