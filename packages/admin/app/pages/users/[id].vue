<template>
  <div class="min-h-screen">
    <!-- Loading State -->
    <div v-if="loading" class="flex items-center justify-center min-h-[60vh]">
      <div class="flex flex-col items-center gap-4">
        <span class="loading loading-spinner loading-lg text-primary"></span>
        <p class="text-sm text-base-content/50 font-light tracking-wide">Loading user profile...</p>
      </div>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="flex items-center justify-center min-h-[60vh]">
      <div class="max-w-md text-center space-y-6">
        <div class="inline-flex items-center justify-center w-16 h-16 rounded-full bg-error/10 border border-error/20">
          <svg class="w-8 h-8 text-error" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <div class="space-y-2">
          <h3 class="font-serif text-xl text-base-content">Unable to Load User</h3>
          <p class="text-sm text-base-content/60 leading-relaxed">{{ error }}</p>
        </div>
        <button class="btn btn-outline btn-sm" @click="fetchUserDetails">
          Try Again
        </button>
      </div>
    </div>

    <!-- User Profile -->
    <div v-else-if="user" class="user-detail-page">
      <!-- Header with Back Navigation -->
      <div class="page-header">
        <button
          class="back-button group"
          @click="navigateBack"
          aria-label="Back to users"
        >
          <ArrowLeftIcon class="w-4 h-4 transition-transform group-hover:-translate-x-1" />
          <span>Users</span>
        </button>

        <div class="header-content">
          <div class="header-meta">
            <span class="meta-label">User Profile</span>
            <span class="meta-divider">·</span>
            <span class="meta-value">ID {{ user.id }}</span>
          </div>
          <h1 class="page-title">{{ displayName }}</h1>
        </div>
      </div>

      <!-- Main Content -->
      <div class="content-grid">
        <!-- Left Column: Profile Card -->
        <div class="profile-column">
          <div class="profile-card card-elevated">
            <!-- Avatar Section -->
            <div class="avatar-section">
              <div class="avatar-wrapper">
                <img
                  v-if="gravatarUrl"
                  :src="gravatarUrl"
                  :alt="`${displayName}'s avatar`"
                  class="avatar-image"
                  @error="handleImageError"
                />
                <div v-else class="avatar-fallback">
                  {{ userInitials }}
                </div>

                <!-- Status Indicator -->
                <div
                  class="status-ring"
                  :class="user.validEmail ? 'status-verified' : 'status-pending'"
                >
                  <div class="status-dot"></div>
                </div>
              </div>
            </div>

            <!-- Name Section -->
            <div class="name-section">
              <div v-if="!editMode" class="name-display">
                <h2 class="user-name">{{ displayName }}</h2>
                <button
                  class="edit-trigger"
                  @click="enableEditMode"
                  aria-label="Edit name"
                >
                  <PencilIcon class="w-3.5 h-3.5" />
                </button>
              </div>

              <div v-else class="name-edit">
                <div class="edit-inputs">
                  <input
                    v-model="editForm.firstname"
                    type="text"
                    placeholder="First name"
                    class="edit-input"
                  />
                  <input
                    v-model="editForm.lastname"
                    type="text"
                    placeholder="Last name"
                    class="edit-input"
                  />
                </div>
                <div class="edit-actions">
                  <button
                    class="btn-save"
                    @click="saveProfile"
                    :disabled="actionLoading"
                  >
                    <span v-if="actionLoading" class="loading loading-spinner loading-xs"></span>
                    <span v-else>Save Changes</span>
                  </button>
                  <button
                    class="btn-cancel"
                    @click="cancelEdit"
                    :disabled="actionLoading"
                  >
                    Cancel
                  </button>
                </div>
              </div>

              <!-- Email -->
              <div class="email-display">
                <a :href="`mailto:${user.email}`" class="email-link">
                  {{ user.email }}
                </a>
                <AdminBadge
                  :status="user.validEmail ? 'verified' : 'pending'"
                  variant="status"
                  :custom-text="user.validEmail ? 'Verified' : 'Unverified'"
                />
              </div>
            </div>

            <!-- Divider -->
            <div class="section-divider"></div>

            <!-- User Attributes -->
            <div class="attributes-section">
              <div class="attribute-item">
                <span class="attribute-label">Marketing Opt-in</span>
                <AdminBadge
                  :status="user.marketing_opt_in ? 'success' : 'neutral'"
                  variant="status"
                  :custom-text="user.marketing_opt_in ? 'Yes' : 'No'"
                  :show-dot="false"
                />
              </div>

              <div class="attribute-item">
                <span class="attribute-label">Mediavine Publisher</span>
                <AdminBadge
                  :status="user.mediavine_publisher ? 'success' : 'neutral'"
                  variant="status"
                  :custom-text="user.mediavine_publisher ? 'Yes' : 'No'"
                  :show-dot="false"
                />
              </div>

              <div class="attribute-item">
                <span class="attribute-label">Member Since</span>
                <span class="attribute-value">{{ formatDate(user.createdAt) }}</span>
              </div>

              <div class="attribute-item">
                <span class="attribute-label">Last Updated</span>
                <span class="attribute-value">{{ formatDate(user.updatedAt) }}</span>
              </div>
            </div>
          </div>

          <!-- Admin Actions Card -->
          <div class="actions-card card-elevated">
            <h3 class="section-title">Administrative Actions</h3>
            <div class="actions-grid">
              <button
                class="action-button action-reset"
                @click="openResetPasswordModal"
                :disabled="actionLoading"
              >
                <div class="action-icon">
                  <LockClosedIcon class="w-4 h-4" />
                </div>
                <div class="action-content">
                  <div class="action-title">Reset Password</div>
                  <div class="action-desc">Send reset email</div>
                </div>
              </button>

              <button
                class="action-button action-verify"
                @click="openSendVerificationModal"
                :disabled="actionLoading || user.validEmail"
                :class="{ 'opacity-50 cursor-not-allowed': user.validEmail }"
              >
                <div class="action-icon">
                  <EnvelopeIcon class="w-4 h-4" />
                </div>
                <div class="action-content">
                  <div class="action-title">Send Verification</div>
                  <div class="action-desc">Resend email</div>
                </div>
              </button>

              <button
                class="action-button"
                :class="user.validEmail ? 'action-disable' : 'action-enable'"
                @click="openToggleStatusModal"
                :disabled="actionLoading"
              >
                <div class="action-icon">
                  <ShieldExclamationIcon v-if="user.validEmail" class="w-4 h-4" />
                  <ShieldCheckIcon v-else class="w-4 h-4" />
                </div>
                <div class="action-content">
                  <div class="action-title">{{ user.validEmail ? 'Disable Account' : 'Enable Account' }}</div>
                  <div class="action-desc">{{ user.validEmail ? 'Suspend access' : 'Restore access' }}</div>
                </div>
              </button>
            </div>
          </div>
        </div>

        <!-- Right Column: Content -->
        <div class="content-column">
          <!-- Sites Section -->
          <div class="content-card card-elevated">
            <div class="card-header">
              <h3 class="card-title">Associated Sites</h3>
              <div class="card-count">{{ user.sites.length }}</div>
            </div>

            <div v-if="user.sites.length === 0" class="empty-state">
              <div class="empty-icon">
                <svg class="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
              </div>
              <p class="empty-text">No sites associated with this account</p>
            </div>

            <div v-else class="sites-list">
              <div
                v-for="site in user.sites"
                :key="site.id"
                class="site-item"
              >
                <div class="site-main">
                  <div class="site-info">
                    <h4 class="site-name">{{ site.name || 'Unnamed Site' }}</h4>
                    <a
                      :href="site.url"
                      target="_blank"
                      rel="noopener noreferrer"
                      class="site-url group"
                    >
                      <span>{{ site.url }}</span>
                      <svg class="w-3 h-3 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                    </a>
                  </div>
                  <div class="site-badges">
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

                <div v-if="site.subscription" class="site-subscription">
                  <div class="subscription-label">Subscription</div>
                  <div class="subscription-info">
                    <AdminBadge
                      :status="site.subscription.tier"
                      variant="tier"
                    />
                    <AdminBadge
                      :status="site.subscription.status"
                      variant="status"
                    />
                    <span v-if="site.subscription.current_period_end" class="subscription-text">
                      Renews {{ formatDate(site.subscription.current_period_end) }}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Subscription History -->
          <div class="content-card card-elevated">
            <div class="card-header">
              <h3 class="card-title">Active Subscriptions</h3>
              <div class="card-count">{{ activeSubscriptionsCount }}</div>
            </div>

            <div v-if="activeSubscriptionsCount === 0" class="empty-state">
              <div class="empty-icon">
                <svg class="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                </svg>
              </div>
              <p class="empty-text">No active subscriptions</p>
            </div>

            <div v-else class="subscriptions-list">
              <div
                v-for="site in sitesWithSubscriptions"
                :key="site.id"
                class="subscription-card"
              >
                <div class="subscription-header">
                  <h4 class="subscription-site">{{ site.name || site.url }}</h4>
                  <div class="subscription-badges">
                    <AdminBadge
                      :status="site.subscription!.tier"
                      variant="tier"
                    />
                    <AdminBadge
                      :status="site.subscription!.status"
                      variant="status"
                    />
                  </div>
                </div>

                <div class="subscription-details">
                  <div v-if="site.subscription!.current_period_start" class="detail-row">
                    <span class="detail-label">Started</span>
                    <span class="detail-value">{{ formatDate(site.subscription!.current_period_start) }}</span>
                  </div>
                  <div v-if="site.subscription!.current_period_end" class="detail-row">
                    <span class="detail-label">{{ site.subscription!.cancel_at_period_end ? 'Ends' : 'Renews' }}</span>
                    <span class="detail-value">{{ formatDate(site.subscription!.current_period_end) }}</span>
                  </div>
                  <div v-if="site.subscription!.cancel_at_period_end" class="detail-row">
                    <span class="detail-label">Auto-Renew</span>
                    <AdminBadge
                      status="error"
                      variant="status"
                      custom-text="Disabled"
                      :show-dot="false"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Audit Summary -->
          <div class="content-card card-elevated">
            <div class="card-header">
              <h3 class="card-title">Activity Summary</h3>
            </div>

            <div class="audit-grid">
              <div class="audit-stat">
                <div class="stat-value">{{ user.auditLogSummary.totalActions }}</div>
                <div class="stat-label">Total Actions</div>
              </div>

              <div class="audit-stat">
                <div v-if="user.auditLogSummary.lastAction" class="stat-content">
                  <div class="stat-action">{{ user.auditLogSummary.lastAction.action }}</div>
                  <div class="stat-time">{{ formatRelativeTime(user.auditLogSummary.lastAction.timestamp) }}</div>
                </div>
                <div v-else class="stat-content">
                  <div class="stat-empty">No actions yet</div>
                </div>
                <div class="stat-label">Last Action</div>
              </div>
            </div>

            <NuxtLink
              :to="`/audit-logs?user=${user.id}`"
              class="audit-link"
            >
              <span>View Full Audit Log</span>
              <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
              </svg>
            </NuxtLink>
          </div>
        </div>
      </div>

      <!-- Modals -->
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
        <p class="text-sm text-base-content/70 leading-relaxed">
          A password reset link will be sent to <strong class="font-medium">{{ user.email }}</strong>.
          The link will be valid for 24 hours.
        </p>
      </AdminModal>

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
        <p class="text-sm text-base-content/70 leading-relaxed">
          A verification email will be sent to <strong class="font-medium">{{ user.email }}</strong>.
        </p>
      </AdminModal>

      <AdminModal
        :open="showToggleStatusModal"
        :title="user.validEmail ? 'Disable Account' : 'Enable Account'"
        :description="user.validEmail ? 'This action will suspend user access' : 'Restore user account access'"
        :variant="user.validEmail ? 'danger' : 'confirm'"
        :confirm-text="user.validEmail ? 'Disable Account' : 'Enable Account'"
        :loading="actionLoading"
        @confirm="handleToggleStatus"
        @cancel="closeModals"
        @close="closeModals"
      >
        <div
          class="rounded-lg p-4 mb-4"
          :class="user.validEmail ? 'bg-error/10 border border-error/20' : 'bg-success/10 border border-success/20'"
        >
          <p
            class="text-sm font-medium mb-2"
            :class="user.validEmail ? 'text-error' : 'text-success'"
          >
            {{ user.validEmail ? 'Warning: This action will:' : 'This will:' }}
          </p>
          <ul class="text-sm text-base-content/70 space-y-1 list-disc list-inside">
            <li v-if="user.validEmail">Immediately disable the user's account</li>
            <li v-if="user.validEmail">Prevent the user from logging in</li>
            <li v-if="user.validEmail">Require admin intervention to re-enable</li>
            <li v-if="!user.validEmail">Re-enable the user's account</li>
            <li v-if="!user.validEmail">Allow the user to log in</li>
          </ul>
        </div>
        <p class="text-sm text-base-content/70">
          User: <strong class="font-medium">{{ user.email }}</strong>
        </p>
      </AdminModal>

      <!-- Success/Error Toast -->
      <div v-if="alertMessage" class="toast toast-top toast-end">
        <div
          class="alert shadow-lg"
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
import { ArrowLeftIcon, EnvelopeIcon, LockClosedIcon, ShieldExclamationIcon, ShieldCheckIcon, PencilIcon } from '@heroicons/vue/24/outline'
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

// Edit mode state
const editMode = ref(false)
const editForm = ref({
  firstname: '',
  lastname: '',
})

// Modal state
const showResetPasswordModal = ref(false)
const showSendVerificationModal = ref(false)
const showToggleStatusModal = ref(false)

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
  return getGravatarUrl(user.value.email, 120)
})

const sitesWithSubscriptions = computed(() => {
  if (!user.value) return []
  return user.value.sites.filter(site => site.subscription !== null)
})

const activeSubscriptionsCount = computed(() => {
  return sitesWithSubscriptions.value.filter(site =>
    site.subscription?.status === 'active' || site.subscription?.status === 'trialing'
  ).length
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

const openToggleStatusModal = () => {
  showToggleStatusModal.value = true
}

const closeModals = () => {
  showResetPasswordModal.value = false
  showSendVerificationModal.value = false
  showToggleStatusModal.value = false
}

// Edit mode handlers
const enableEditMode = () => {
  if (user.value) {
    editForm.value = {
      firstname: user.value.firstname || '',
      lastname: user.value.lastname || '',
    }
    editMode.value = true
  }
}

const cancelEdit = () => {
  editMode.value = false
  editForm.value = {
    firstname: '',
    lastname: '',
  }
}

const saveProfile = async () => {
  if (!user.value) return

  actionLoading.value = true
  try {
    const response = await $fetch(`/api/admin/users/${user.value.id}/update`, {
      method: 'PATCH',
      body: {
        firstname: editForm.value.firstname,
        lastname: editForm.value.lastname,
      },
    })

    // Update local user data
    user.value.firstname = editForm.value.firstname || null
    user.value.lastname = editForm.value.lastname || null
    user.value.updatedAt = new Date().toISOString()

    showAlert('Profile updated successfully', 'success')
    editMode.value = false
  } catch (err: any) {
    console.error('Failed to update profile:', err)
    showAlert(err?.data?.message || 'Failed to update profile', 'error')
  } finally {
    actionLoading.value = false
  }
}

// Action handlers
const handleResetPassword = async () => {
  if (!user.value) return

  actionLoading.value = true
  try {
    await $fetch(`/api/admin/users/${user.value.id}/reset-password`, {
      method: 'POST',
    })
    showAlert('Password reset email sent successfully', 'success')
    closeModals()
    await fetchUserDetails()
  } catch (err: any) {
    console.error('Failed to reset password:', err)
    showAlert(err?.data?.message || 'Failed to send password reset email', 'error')
  } finally {
    actionLoading.value = false
  }
}

const handleSendVerification = async () => {
  if (!user.value) return

  actionLoading.value = true
  try {
    await $fetch(`/api/admin/users/${user.value.id}/send-verification`, {
      method: 'POST',
    })
    showAlert('Verification email sent successfully', 'success')
    closeModals()
    await fetchUserDetails()
  } catch (err: any) {
    console.error('Failed to send verification email:', err)
    showAlert(err?.data?.message || 'Failed to send verification email', 'error')
  } finally {
    actionLoading.value = false
  }
}

const handleToggleStatus = async () => {
  if (!user.value) return

  actionLoading.value = true
  try {
    const response = await $fetch<{ success: boolean; enabled: boolean; message: string }>(
      `/api/admin/users/${user.value.id}/toggle-status`,
      {
        method: 'POST',
        body: {
          enabled: !user.value.validEmail,
        },
      }
    )
    showAlert(response.message, 'success')
    closeModals()
    await fetchUserDetails()
  } catch (err: any) {
    console.error('Failed to toggle account status:', err)
    showAlert(err?.data?.message || 'Failed to toggle account status', 'error')
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

<style scoped>
/* ============================================
   EDITORIAL PRECISION DESIGN SYSTEM
   Sophisticated admin interface with refined typography
   ============================================ */

.user-detail-page {
  @apply px-6 py-8 max-w-[1400px] mx-auto;
}

/* ============================================
   PAGE HEADER
   ============================================ */

.page-header {
  @apply mb-12;
}

.back-button {
  @apply inline-flex items-center gap-2 text-sm text-base-content/60 hover:text-base-content transition-colors mb-6;
  font-family: 'Satoshi', sans-serif;
  font-weight: 500;
  letter-spacing: 0.01em;
}

.header-content {
  @apply space-y-2;
}

.header-meta {
  @apply flex items-center gap-2 text-xs;
  font-family: 'Satoshi', sans-serif;
  font-weight: 500;
  letter-spacing: 0.05em;
  text-transform: uppercase;
}

.meta-label {
  @apply text-base-content/50;
}

.meta-divider {
  @apply text-base-content/30;
}

.meta-value {
  @apply text-base-content/40;
}

.page-title {
  @apply text-4xl text-base-content;
  font-family: 'Instrument Serif', serif;
  font-weight: 400;
  letter-spacing: -0.02em;
  line-height: 1.1;
}

/* ============================================
   CONTENT GRID
   ============================================ */

.content-grid {
  @apply grid grid-cols-1 lg:grid-cols-[380px_1fr] gap-8;
}

.profile-column {
  @apply space-y-6;
}

.content-column {
  @apply space-y-6;
}

/* ============================================
   CARD SYSTEM
   ============================================ */

.card-elevated {
  @apply bg-base-100 rounded-xl border border-base-300/50 overflow-hidden;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.02), 0 1px 2px rgba(0, 0, 0, 0.03);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.card-elevated:hover {
  @apply border-base-300;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03);
}

/* ============================================
   PROFILE CARD
   ============================================ */

.profile-card {
  @apply p-8;
}

.avatar-section {
  @apply flex justify-center mb-6;
}

.avatar-wrapper {
  @apply relative;
}

.avatar-image,
.avatar-fallback {
  @apply w-24 h-24 rounded-full;
}

.avatar-image {
  @apply object-cover;
}

.avatar-fallback {
  @apply flex items-center justify-center bg-gradient-to-br from-primary/20 to-primary/10 text-primary font-semibold text-2xl;
  font-family: 'Instrument Serif', serif;
}

.status-ring {
  @apply absolute -bottom-1 -right-1 w-7 h-7 rounded-full flex items-center justify-center;
  @apply bg-base-100 border-2 border-base-100;
}

.status-verified {
  @apply bg-success/20;
}

.status-pending {
  @apply bg-warning/20;
}

.status-dot {
  @apply w-3 h-3 rounded-full;
}

.status-verified .status-dot {
  @apply bg-success;
  animation: pulse-success 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}

.status-pending .status-dot {
  @apply bg-warning;
  animation: pulse-warning 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}

@keyframes pulse-success {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.6; }
}

@keyframes pulse-warning {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

.name-section {
  @apply space-y-4 text-center;
}

.name-display {
  @apply flex items-center justify-center gap-3;
}

.user-name {
  @apply text-2xl text-base-content;
  font-family: 'Instrument Serif', serif;
  font-weight: 400;
  letter-spacing: -0.01em;
}

.edit-trigger {
  @apply p-1.5 rounded-lg text-base-content/40 hover:text-base-content hover:bg-base-200 transition-all;
}

.name-edit {
  @apply space-y-3;
}

.edit-inputs {
  @apply space-y-2;
}

.edit-input {
  @apply w-full px-3 py-2 rounded-lg border border-base-300 bg-base-100;
  @apply text-sm text-base-content placeholder:text-base-content/40;
  @apply focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary;
  @apply transition-all;
  font-family: 'Satoshi', sans-serif;
}

.edit-actions {
  @apply flex gap-2;
}

.btn-save {
  @apply flex-1 px-4 py-2 rounded-lg bg-primary text-primary-content;
  @apply text-sm font-medium hover:opacity-90 transition-opacity;
  @apply disabled:opacity-50 disabled:cursor-not-allowed;
  font-family: 'Satoshi', sans-serif;
}

.btn-cancel {
  @apply flex-1 px-4 py-2 rounded-lg bg-base-200 text-base-content;
  @apply text-sm font-medium hover:bg-base-300 transition-colors;
  @apply disabled:opacity-50 disabled:cursor-not-allowed;
  font-family: 'Satoshi', sans-serif;
}

.email-display {
  @apply flex flex-col items-center gap-2;
}

.email-link {
  @apply text-sm text-base-content/60 hover:text-primary transition-colors;
  font-family: 'Satoshi', sans-serif;
}

.section-divider {
  @apply my-6 h-px bg-gradient-to-r from-transparent via-base-300 to-transparent;
}

/* ============================================
   ATTRIBUTES SECTION
   ============================================ */

.attributes-section {
  @apply space-y-4;
}

.attribute-item {
  @apply flex items-center justify-between py-3 border-b border-base-300/30 last:border-0;
}

.attribute-label {
  @apply text-sm text-base-content/60;
  font-family: 'Satoshi', sans-serif;
  font-weight: 500;
}

.attribute-value {
  @apply text-sm text-base-content;
  font-family: 'Satoshi', sans-serif;
  font-weight: 500;
}

/* ============================================
   ACTIONS CARD
   ============================================ */

.actions-card {
  @apply p-6;
}

.section-title {
  @apply text-lg text-base-content mb-4;
  font-family: 'Instrument Serif', serif;
  font-weight: 400;
  letter-spacing: -0.01em;
}

.actions-grid {
  @apply space-y-3;
}

.action-button {
  @apply w-full flex items-center gap-4 p-4 rounded-lg border border-base-300/50;
  @apply hover:border-base-300 hover:bg-base-200/50 transition-all;
  @apply disabled:opacity-50 disabled:cursor-not-allowed;
}

.action-icon {
  @apply flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center;
  @apply transition-all;
}

.action-reset .action-icon {
  @apply bg-info/10 text-info;
}

.action-reset:hover .action-icon {
  @apply bg-info/20;
}

.action-verify .action-icon {
  @apply bg-success/10 text-success;
}

.action-verify:hover .action-icon {
  @apply bg-success/20;
}

.action-enable .action-icon {
  @apply bg-success/10 text-success;
}

.action-enable:hover .action-icon {
  @apply bg-success/20;
}

.action-disable .action-icon {
  @apply bg-error/10 text-error;
}

.action-disable:hover .action-icon {
  @apply bg-error/20;
}

.action-content {
  @apply flex flex-col items-start text-left;
}

.action-title {
  @apply text-sm font-medium text-base-content;
  font-family: 'Satoshi', sans-serif;
}

.action-desc {
  @apply text-xs text-base-content/50;
  font-family: 'Satoshi', sans-serif;
}

/* ============================================
   CONTENT CARDS
   ============================================ */

.content-card {
  @apply p-6;
}

.card-header {
  @apply flex items-center justify-between mb-6;
}

.card-title {
  @apply text-lg text-base-content;
  font-family: 'Instrument Serif', serif;
  font-weight: 400;
  letter-spacing: -0.01em;
}

.card-count {
  @apply px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium;
  font-family: 'Satoshi', sans-serif;
}

/* ============================================
   EMPTY STATES
   ============================================ */

.empty-state {
  @apply py-12 text-center;
}

.empty-icon {
  @apply inline-flex items-center justify-center w-16 h-16 rounded-full bg-base-200 text-base-content/30 mb-4;
}

.empty-text {
  @apply text-sm text-base-content/50;
  font-family: 'Satoshi', sans-serif;
}

/* ============================================
   SITES LIST
   ============================================ */

.sites-list {
  @apply space-y-4;
}

.site-item {
  @apply p-4 rounded-lg border border-base-300/30 hover:border-base-300 hover:bg-base-50 transition-all;
}

.site-main {
  @apply flex items-start justify-between gap-4 mb-3;
}

.site-info {
  @apply flex-1 min-w-0;
}

.site-name {
  @apply text-base font-medium text-base-content mb-1 truncate;
  font-family: 'Satoshi', sans-serif;
}

.site-url {
  @apply inline-flex items-center gap-1.5 text-sm text-primary hover:underline;
  font-family: 'Satoshi', sans-serif;
}

.site-badges {
  @apply flex flex-col items-end gap-2;
}

.site-subscription {
  @apply pt-3 mt-3 border-t border-base-300/30;
}

.subscription-label {
  @apply text-xs text-base-content/50 mb-2;
  font-family: 'Satoshi', sans-serif;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.subscription-info {
  @apply flex items-center gap-2 flex-wrap;
}

.subscription-text {
  @apply text-sm text-base-content/60;
  font-family: 'Satoshi', sans-serif;
}

/* ============================================
   SUBSCRIPTIONS LIST
   ============================================ */

.subscriptions-list {
  @apply space-y-4;
}

.subscription-card {
  @apply p-4 rounded-lg border border-base-300/30;
}

.subscription-header {
  @apply flex items-start justify-between gap-4 mb-3;
}

.subscription-site {
  @apply text-base font-medium text-base-content;
  font-family: 'Satoshi', sans-serif;
}

.subscription-badges {
  @apply flex items-center gap-2;
}

.subscription-details {
  @apply space-y-2;
}

.detail-row {
  @apply flex items-center justify-between text-sm;
}

.detail-label {
  @apply text-base-content/60;
  font-family: 'Satoshi', sans-serif;
}

.detail-value {
  @apply text-base-content font-medium;
  font-family: 'Satoshi', sans-serif;
}

/* ============================================
   AUDIT SUMMARY
   ============================================ */

.audit-grid {
  @apply grid grid-cols-2 gap-4 mb-6;
}

.audit-stat {
  @apply p-4 rounded-lg bg-base-200/50;
}

.stat-value {
  @apply text-3xl font-semibold text-base-content mb-1;
  font-family: 'Instrument Serif', serif;
}

.stat-content {
  @apply mb-2;
}

.stat-action {
  @apply text-sm font-medium text-base-content mb-1;
  font-family: 'Satoshi', sans-serif;
}

.stat-time {
  @apply text-xs text-base-content/50;
  font-family: 'Satoshi', sans-serif;
}

.stat-empty {
  @apply text-sm text-base-content/50 mb-1;
  font-family: 'Satoshi', sans-serif;
}

.stat-label {
  @apply text-xs text-base-content/50;
  font-family: 'Satoshi', sans-serif;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.audit-link {
  @apply flex items-center justify-center gap-2 py-3 px-4 rounded-lg;
  @apply border border-base-300 text-sm font-medium text-base-content;
  @apply hover:border-primary hover:text-primary hover:bg-primary/5 transition-all;
  font-family: 'Satoshi', sans-serif;
}
</style>
