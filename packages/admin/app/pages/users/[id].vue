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
          <h3 class="text-xl text-base-content" style="font-family: 'Instrument Serif', serif;">Unable to Load User</h3>
          <p class="text-sm text-base-content/60 leading-relaxed">{{ error }}</p>
        </div>
        <button class="btn btn-outline btn-sm" @click="fetchUserDetails">
          Try Again
        </button>
      </div>
    </div>

    <!-- User Profile -->
    <div v-else-if="user" class="px-6 py-8 max-w-[1400px] mx-auto">
      <!-- Header with Back Navigation -->
      <div class="mb-12">
        <button
          class="inline-flex items-center gap-2 text-sm text-base-content/60 hover:text-base-content transition-colors mb-6 font-medium tracking-wide group"
          @click="navigateBack"
          aria-label="Back to users"
        >
          <ArrowLeftIcon class="w-4 h-4 transition-transform group-hover:-translate-x-1" />
          <span>Users</span>
        </button>

        <div class="space-y-2">
          <div class="flex items-center gap-2 text-xs font-medium tracking-widest uppercase">
            <span class="text-base-content/50">User Profile</span>
            <span class="text-base-content/30">·</span>
            <span class="text-base-content/40">ID {{ user.id }}</span>
          </div>
          <h1 class="text-4xl text-base-content" style="font-family: 'Instrument Serif', serif; font-weight: 400; letter-spacing: -0.02em; line-height: 1.1;">
            {{ displayName }}
          </h1>
        </div>
      </div>

      <!-- Main Content Grid -->
      <div class="grid grid-cols-1 lg:grid-cols-[380px_1fr] gap-8">
        <!-- Left Column: Profile Card -->
        <div class="space-y-6">
          <!-- Profile Card -->
          <div class="bg-base-100 rounded-xl border border-base-300/50 p-8 shadow-sm hover:shadow-md hover:border-base-300 transition-all duration-300">
            <!-- Avatar Section -->
            <div class="flex justify-center mb-6">
              <div class="relative">
                <div class="w-24 h-24 rounded-full overflow-hidden">
                  <img
                    v-if="gravatarUrl"
                    :src="gravatarUrl"
                    :alt="`${displayName}'s avatar`"
                    class="w-full h-full object-cover"
                    @error="handleImageError"
                  />
                  <div v-else class="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/20 to-primary/10 text-primary font-semibold text-2xl" style="font-family: 'Instrument Serif', serif;">
                    {{ userInitials }}
                  </div>
                </div>

                <!-- Verified Checkmark (only shown if verified) -->
                <div
                  v-if="user.validEmail"
                  class="absolute -bottom-1 -right-1 w-6 h-6 rounded-full flex items-center justify-center bg-base-100 border-2 border-base-100"
                >
                  <div class="w-5 h-5 rounded-full bg-success flex items-center justify-center">
                    <CheckIcon class="w-3 h-3 text-success-content" />
                  </div>
                </div>
              </div>
            </div>

            <!-- Name Section -->
            <div class="space-y-4 text-center">
              <!-- View Mode -->
              <div v-if="!editNameMode" class="flex items-center justify-center gap-3">
                <h2 class="text-2xl text-base-content" style="font-family: 'Instrument Serif', serif; font-weight: 400; letter-spacing: -0.01em;">
                  {{ displayName }}
                </h2>
                <button
                  class="p-1.5 rounded-lg text-base-content/40 hover:text-base-content hover:bg-base-200 transition-all"
                  @click="enableEditNameMode"
                  aria-label="Edit name"
                >
                  <PencilIcon class="w-3.5 h-3.5" />
                </button>
              </div>

              <!-- Edit Name Mode -->
              <div v-else class="space-y-3">
                <div class="space-y-2">
                  <input
                    v-model="editForm.firstname"
                    type="text"
                    placeholder="First name"
                    class="w-full px-3 py-2 rounded-lg border border-base-300 bg-base-100 text-sm text-base-content placeholder:text-base-content/40 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                  />
                  <input
                    v-model="editForm.lastname"
                    type="text"
                    placeholder="Last name"
                    class="w-full px-3 py-2 rounded-lg border border-base-300 bg-base-100 text-sm text-base-content placeholder:text-base-content/40 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                  />
                </div>
                <div class="flex gap-2">
                  <button
                    class="flex-1 px-4 py-2 rounded-lg bg-primary text-primary-content text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                    @click="saveNameChanges"
                    :disabled="actionLoading"
                  >
                    <span v-if="actionLoading" class="loading loading-spinner loading-xs"></span>
                    <span v-else>Save</span>
                  </button>
                  <button
                    class="flex-1 px-4 py-2 rounded-lg bg-base-200 text-base-content text-sm font-medium hover:bg-base-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    @click="cancelEditName"
                    :disabled="actionLoading"
                  >
                    Cancel
                  </button>
                </div>
              </div>

              <!-- Email Section -->
              <div class="flex flex-col items-center gap-1">
                <!-- View Email Mode -->
                <div v-if="!editEmailMode" class="flex items-center gap-2">
                  <a :href="`mailto:${user.email}`" class="text-sm text-base-content/60 hover:text-primary transition-colors">
                    {{ user.email }}
                  </a>
                  <button
                    class="p-1 rounded text-base-content/40 hover:text-base-content hover:bg-base-200 transition-all"
                    @click="enableEditEmailMode"
                    aria-label="Edit email"
                  >
                    <PencilIcon class="w-3 h-3" />
                  </button>
                </div>

                <!-- Edit Email Mode -->
                <div v-else class="w-full space-y-2">
                  <input
                    v-model="editForm.email"
                    type="email"
                    placeholder="Email address"
                    class="w-full px-3 py-2 rounded-lg border border-base-300 bg-base-100 text-sm text-base-content placeholder:text-base-content/40 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-center"
                  />
                  <div class="flex gap-2">
                    <button
                      class="flex-1 px-3 py-1.5 rounded-lg bg-primary text-primary-content text-xs font-medium hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                      @click="saveEmailChange"
                      :disabled="actionLoading"
                    >
                      <span v-if="actionLoading" class="loading loading-spinner loading-xs"></span>
                      <span v-else>Save</span>
                    </button>
                    <button
                      class="flex-1 px-3 py-1.5 rounded-lg bg-base-200 text-base-content text-xs font-medium hover:bg-base-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      @click="cancelEditEmail"
                      :disabled="actionLoading"
                    >
                      Cancel
                    </button>
                  </div>
                </div>

                <!-- Verification Status -->
                <div class="flex items-center gap-1.5 mt-1">
                  <template v-if="user.validEmail">
                    <CheckIcon class="w-3.5 h-3.5 text-success" />
                    <span class="text-xs text-base-content/60">Verified</span>
                  </template>
                  <template v-else>
                    <span class="text-xs text-base-content/50">Unverified</span>
                  </template>
                </div>
              </div>
            </div>

            <!-- Divider -->
            <div class="my-6 h-px bg-gradient-to-r from-transparent via-base-300 to-transparent"></div>

            <!-- User Attributes -->
            <div class="space-y-4">
              <div class="flex items-center justify-between py-3 border-b border-base-300/30">
                <span class="text-sm text-base-content/60">Marketing Opt-in</span>
                <span class="text-sm" :class="user.marketing_opt_in ? 'font-medium text-base-content' : 'text-base-content/50'">
                  {{ user.marketing_opt_in ? 'Yes' : 'No' }}
                </span>
              </div>

              <div class="flex items-center justify-between py-3 border-b border-base-300/30">
                <span class="text-sm text-base-content/60">Mediavine Publisher</span>
                <span class="text-sm" :class="user.mediavine_publisher ? 'font-medium text-base-content' : 'text-base-content/50'">
                  {{ user.mediavine_publisher ? 'Yes' : 'No' }}
                </span>
              </div>

              <div class="flex items-center justify-between py-3 border-b border-base-300/30">
                <span class="text-sm text-base-content/60">Member Since</span>
                <span class="text-sm text-base-content font-medium">{{ formatDate(user.createdAt) }}</span>
              </div>

              <div class="flex items-center justify-between py-3">
                <span class="text-sm text-base-content/60">Last Updated</span>
                <span class="text-sm text-base-content font-medium">{{ formatDate(user.updatedAt) }}</span>
              </div>
            </div>
          </div>

          <!-- Admin Actions Card -->
          <div class="bg-base-100 rounded-xl border border-base-300/50 p-6 shadow-sm hover:shadow-md hover:border-base-300 transition-all duration-300">
            <h3 class="text-lg text-base-content mb-4" style="font-family: 'Instrument Serif', serif; font-weight: 400; letter-spacing: -0.01em;">
              Administrative Actions
            </h3>
            <div class="space-y-3">
              <button
                class="w-full flex items-center gap-4 p-4 rounded-lg border border-base-300/50 hover:border-base-300 hover:bg-base-200/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                @click="openResetPasswordModal"
                :disabled="actionLoading"
              >
                <div class="flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center bg-base-200 text-base-content/70 transition-all">
                  <LockClosedIcon class="w-4 h-4" />
                </div>
                <div class="flex flex-col items-start text-left">
                  <div class="text-sm font-medium text-base-content">Reset Password</div>
                  <div class="text-xs text-base-content/50">Send reset email</div>
                </div>
              </button>

              <button
                class="w-full flex items-center gap-4 p-4 rounded-lg border border-base-300/50 hover:border-base-300 hover:bg-base-200/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                @click="openSendVerificationModal"
                :disabled="actionLoading || user.validEmail"
                :class="{ 'opacity-50 cursor-not-allowed': user.validEmail }"
              >
                <div class="flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center bg-base-200 text-base-content/70 transition-all">
                  <EnvelopeIcon class="w-4 h-4" />
                </div>
                <div class="flex flex-col items-start text-left">
                  <div class="text-sm font-medium text-base-content">Send Verification</div>
                  <div class="text-xs text-base-content/50">Resend verification email</div>
                </div>
              </button>

              <!-- Direct Verify Email Action -->
              <button
                v-if="!user.validEmail"
                class="w-full flex items-center gap-4 p-4 rounded-lg border border-base-300/50 hover:border-base-300 hover:bg-base-200/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                @click="openVerifyEmailModal"
                :disabled="actionLoading"
              >
                <div class="flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center bg-base-200 text-base-content/70 transition-all">
                  <CheckBadgeIcon class="w-4 h-4" />
                </div>
                <div class="flex flex-col items-start text-left">
                  <div class="text-sm font-medium text-base-content">Verify Email</div>
                  <div class="text-xs text-base-content/50">Directly mark email as verified</div>
                </div>
              </button>

              <button
                class="w-full flex items-center gap-4 p-4 rounded-lg border border-base-300/50 hover:border-base-300 hover:bg-base-200/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                @click="openToggleStatusModal"
                :disabled="actionLoading"
              >
                <div class="flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center bg-base-200 text-base-content/70 transition-all">
                  <ShieldExclamationIcon v-if="user.validEmail" class="w-4 h-4" />
                  <ShieldCheckIcon v-else class="w-4 h-4" />
                </div>
                <div class="flex flex-col items-start text-left">
                  <div class="text-sm font-medium text-base-content">{{ user.validEmail ? 'Disable Account' : 'Enable Account' }}</div>
                  <div class="text-xs text-base-content/50">{{ user.validEmail ? 'Suspend access' : 'Restore access' }}</div>
                </div>
              </button>
            </div>
          </div>
        </div>

        <!-- Right Column: Content -->
        <div class="space-y-6">
          <!-- Sites & Subscriptions -->
          <div class="bg-base-100 rounded-xl border border-base-300/50 p-6 shadow-sm hover:shadow-md hover:border-base-300 transition-all duration-300">
            <div class="flex items-center justify-between mb-6">
              <h3 class="text-lg text-base-content" style="font-family: 'Instrument Serif', serif; font-weight: 400; letter-spacing: -0.01em;">
                Sites & Subscriptions
              </h3>
              <span class="text-sm text-base-content/60">{{ user.sites.length }} {{ user.sites.length === 1 ? 'site' : 'sites' }}</span>
            </div>

            <!-- Empty State -->
            <div v-if="user.sites.length === 0" class="py-12 text-center">
              <div class="inline-flex items-center justify-center w-16 h-16 rounded-full bg-base-200 text-base-content/30 mb-4">
                <svg class="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 013 12c0-1.605.42-3.113 1.157-4.418" />
                </svg>
              </div>
              <p class="text-sm text-base-content/50">No sites associated with this account</p>
            </div>

            <!-- Sites List -->
            <div v-else class="space-y-4">
              <div
                v-for="site in user.sites"
                :key="site.id"
                class="rounded-lg border border-base-300/30 hover:border-base-300 transition-all overflow-hidden"
              >
                <!-- Site info row -->
                <div class="p-4">
                  <div class="flex items-start justify-between gap-4 mb-2">
                    <!-- Name + URL -->
                    <div class="min-w-0 flex-1">
                      <h4 class="text-base font-medium text-base-content truncate">{{ site.name || cleanUrl(site.url) }}</h4>
                      <div class="text-xs text-base-content/40 mt-0.5">{{ cleanUrl(site.url) }}</div>
                    </div>
                    <!-- Role badge -->
                    <span
                      v-if="site.role"
                      class="px-2.5 py-1 rounded-md text-[11px] font-semibold uppercase tracking-wider shrink-0"
                      :class="{
                        'bg-primary/10 text-primary': site.role === 'owner',
                        'bg-base-200 text-base-content/50': site.role === 'admin',
                        'bg-base-200/60 text-base-content/40': site.role === 'editor',
                      }"
                    >
                      {{ site.role }}
                    </span>
                  </div>

                  <!-- Verification + Versions row -->
                  <div class="flex items-center gap-3 mt-3 text-xs">
                    <div class="flex items-center gap-1.5">
                      <template v-if="site.isVerified">
                        <CheckIcon class="w-3.5 h-3.5 text-success" />
                        <span class="text-base-content/50">Verified</span>
                      </template>
                      <template v-else>
                        <span class="w-3.5 h-3.5 rounded-full border border-base-300 inline-block"></span>
                        <span class="text-base-content/35">Unverified</span>
                      </template>
                    </div>
                    <template v-if="site.versions?.create">
                      <span class="text-base-content/20">&middot;</span>
                      <span class="text-base-content/35 font-mono">v{{ site.versions.create }}</span>
                    </template>
                  </div>

                  <!-- Subscription summary -->
                  <div v-if="site.subscription" class="mt-3 flex items-center gap-2 text-xs">
                    <span
                      class="w-1.5 h-1.5 rounded-full shrink-0"
                      :class="{
                        'bg-success': site.subscription.status === 'active' || site.subscription.status === 'trialing',
                        'bg-warning': site.subscription.status === 'past_due',
                        'bg-base-content/25': site.subscription.status === 'canceled' || site.subscription.status === 'cancelled',
                      }"
                    ></span>
                    <span class="font-medium text-base-content/60">{{ formatTier(site.subscription.tier) }}</span>
                    <span class="text-base-content/20">&middot;</span>
                    <span :class="getSubscriptionStatusClass(site.subscription.status)" class="text-xs">
                      {{ formatSubscriptionStatus(site.subscription.status) }}
                    </span>
                    <template v-if="site.subscription.current_period_end">
                      <span class="text-base-content/20">&middot;</span>
                      <span class="text-base-content/35">
                        {{ site.subscription.cancel_at_period_end ? 'Ends' : 'Renews' }} {{ formatDate(site.subscription.current_period_end) }}
                      </span>
                    </template>
                  </div>
                </div>

                <!-- Action links -->
                <div class="flex border-t border-base-300/30 divide-x divide-base-300/30 text-xs">
                  <NuxtLink
                    :to="`/sites/${site.id}`"
                    class="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-base-content/50 hover:text-primary hover:bg-primary/5 transition-colors font-medium"
                  >
                    Manage Site
                  </NuxtLink>
                  <NuxtLink
                    v-if="site.subscription"
                    :to="`/subscriptions/${site.subscription.id}`"
                    class="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-base-content/50 hover:text-primary hover:bg-primary/5 transition-colors font-medium"
                  >
                    Manage Subscription
                  </NuxtLink>
                  <a
                    :href="site.url"
                    target="_blank"
                    rel="noopener noreferrer"
                    class="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-base-content/50 hover:text-primary hover:bg-primary/5 transition-colors font-medium"
                  >
                    Visit Site
                    <svg class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                  </a>
                </div>
              </div>
            </div>
          </div>

          <!-- Audit Timeline -->
          <AdminAuditTimeline
            entity-type="user"
            :entity-id="user.id"
          />
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
        :open="showVerifyEmailModal"
        title="Verify Email"
        description="Directly mark this email as verified?"
        variant="confirm"
        confirm-text="Verify Email"
        :loading="actionLoading"
        @confirm="handleDirectVerifyEmail"
        @cancel="closeModals"
        @close="closeModals"
      >
        <p class="text-sm text-base-content/70 leading-relaxed">
          This will mark <strong class="font-medium">{{ user.email }}</strong> as verified without requiring the user to click a verification link.
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
import {
  ArrowLeftIcon,
  EnvelopeIcon,
  LockClosedIcon,
  ShieldExclamationIcon,
  ShieldCheckIcon,
  PencilIcon,
  CheckIcon,
  CheckBadgeIcon,
} from '@heroicons/vue/24/outline'
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
    id: number
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
const editNameMode = ref(false)
const editEmailMode = ref(false)
const editForm = ref({
  firstname: '',
  lastname: '',
  email: '',
})

// Modal state
const showResetPasswordModal = ref(false)
const showSendVerificationModal = ref(false)
const showVerifyEmailModal = ref(false)
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

const activeSubscriptionsCount = computed(() => {
  if (!user.value) return 0
  return user.value.sites.filter(site =>
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

const openVerifyEmailModal = () => {
  showVerifyEmailModal.value = true
}

const openToggleStatusModal = () => {
  showToggleStatusModal.value = true
}

const closeModals = () => {
  showResetPasswordModal.value = false
  showSendVerificationModal.value = false
  showVerifyEmailModal.value = false
  showToggleStatusModal.value = false
}

// Edit name mode handlers
const enableEditNameMode = () => {
  if (user.value) {
    editForm.value.firstname = user.value.firstname || ''
    editForm.value.lastname = user.value.lastname || ''
    editNameMode.value = true
  }
}

const cancelEditName = () => {
  editNameMode.value = false
  editForm.value.firstname = ''
  editForm.value.lastname = ''
}

const saveNameChanges = async () => {
  if (!user.value) return

  actionLoading.value = true
  try {
    await $fetch(`/api/admin/users/${user.value.id}/update`, {
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

    showAlert('Name updated successfully', 'success')
    editNameMode.value = false
  } catch (err: any) {
    console.error('Failed to update name:', err)
    showAlert(err?.data?.message || 'Failed to update name', 'error')
  } finally {
    actionLoading.value = false
  }
}

// Edit email mode handlers
const enableEditEmailMode = () => {
  if (user.value) {
    editForm.value.email = user.value.email
    editEmailMode.value = true
  }
}

const cancelEditEmail = () => {
  editEmailMode.value = false
  editForm.value.email = ''
}

const saveEmailChange = async () => {
  if (!user.value) return

  if (!editForm.value.email || !editForm.value.email.includes('@')) {
    showAlert('Please enter a valid email address', 'error')
    return
  }

  actionLoading.value = true
  try {
    await $fetch(`/api/admin/users/${user.value.id}/update`, {
      method: 'PATCH',
      body: {
        email: editForm.value.email,
      },
    })

    // Update local user data
    user.value.email = editForm.value.email
    user.value.updatedAt = new Date().toISOString()

    showAlert('Email updated successfully', 'success')
    editEmailMode.value = false
  } catch (err: any) {
    console.error('Failed to update email:', err)
    showAlert(err?.data?.message || 'Failed to update email', 'error')
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

const handleDirectVerifyEmail = async () => {
  if (!user.value) return

  actionLoading.value = true
  try {
    await $fetch(`/api/admin/users/${user.value.id}/update`, {
      method: 'PATCH',
      body: {
        validEmail: true,
      },
    })

    // Update local user data
    user.value.validEmail = true
    user.value.updatedAt = new Date().toISOString()

    showAlert('Email verified successfully', 'success')
    closeModals()
  } catch (err: any) {
    console.error('Failed to verify email:', err)
    showAlert(err?.data?.message || 'Failed to verify email', 'error')
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

// Format helpers
const formatDate = (dateString: string): string => {
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}

const capitalizeFirst = (str: string): string => {
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase()
}

const cleanUrl = (url: string): string => {
  return url.replace(/^https?:\/\//, '').replace(/\/$/, '')
}

const formatTier = (tier: string): string => {
  const tierMap: Record<string, string> = {
    free: 'Free',
    basic: 'Basic',
    pro: 'Pro',
    professional: 'Pro',
    enterprise: 'Enterprise',
  }
  return tierMap[tier.toLowerCase()] || capitalizeFirst(tier)
}

const formatSubscriptionStatus = (status: string): string => {
  const statusMap: Record<string, string> = {
    active: 'Active',
    trialing: 'Trial',
    past_due: 'Past Due',
    canceled: 'Canceled',
    cancelled: 'Canceled',
    unpaid: 'Unpaid',
    inactive: 'Inactive',
  }
  return statusMap[status.toLowerCase()] || capitalizeFirst(status)
}

const getSubscriptionStatusClass = (status: string): string => {
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

// Initialize
onMounted(() => {
  fetchUserDetails()
})
</script>
