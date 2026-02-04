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
          <!-- Sites Section -->
          <div class="bg-base-100 rounded-xl border border-base-300/50 p-6 shadow-sm hover:shadow-md hover:border-base-300 transition-all duration-300">
            <div class="flex items-center justify-between mb-6">
              <h3 class="text-lg text-base-content" style="font-family: 'Instrument Serif', serif; font-weight: 400; letter-spacing: -0.01em;">
                Associated Sites
              </h3>
              <span class="text-sm text-base-content/60">{{ user.sites.length }} {{ user.sites.length === 1 ? 'site' : 'sites' }}</span>
            </div>

            <div v-if="user.sites.length === 0" class="py-12 text-center">
              <div class="inline-flex items-center justify-center w-16 h-16 rounded-full bg-base-200 text-base-content/30 mb-4">
                <svg class="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
              </div>
              <p class="text-sm text-base-content/50">No sites associated with this account</p>
            </div>

            <div v-else class="space-y-4">
              <div
                v-for="site in user.sites"
                :key="site.id"
                class="p-4 rounded-lg border border-base-300/30 hover:border-base-300 hover:bg-base-50 transition-all"
              >
                <div class="flex items-start justify-between gap-4 mb-3">
                  <div class="flex-1 min-w-0">
                    <h4 class="text-base font-medium text-base-content mb-1 truncate">
                      {{ site.name || 'Unnamed Site' }}
                    </h4>
                    <a
                      :href="site.url"
                      target="_blank"
                      rel="noopener noreferrer"
                      class="inline-flex items-center gap-1.5 text-sm text-primary hover:underline group"
                    >
                      <span>{{ site.url }}</span>
                      <svg class="w-3 h-3 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                    </a>
                  </div>
                  <div class="flex flex-col items-end gap-1 text-right">
                    <!-- Role -->
                    <div v-if="site.role" class="flex items-center gap-1.5">
                      <UserIcon class="w-3.5 h-3.5 text-base-content/40" />
                      <span class="text-sm font-medium text-base-content">{{ capitalizeFirst(site.role) }}</span>
                    </div>
                    <!-- Verification Status -->
                    <div class="flex items-center gap-1.5">
                      <template v-if="site.isVerified">
                        <CheckIcon class="w-3.5 h-3.5 text-success" />
                        <span class="text-xs text-base-content/60">Verified</span>
                      </template>
                      <template v-else>
                        <span class="text-xs text-base-content/50">Pending verification</span>
                      </template>
                    </div>
                  </div>
                </div>

                <div v-if="site.subscription" class="pt-3 mt-3 border-t border-base-300/30">
                  <div class="flex items-center gap-4 flex-wrap text-sm">
                    <!-- Tier -->
                    <div class="flex items-center gap-1.5">
                      <span class="text-base-content/60">Plan:</span>
                      <span class="font-medium text-base-content">{{ formatTier(site.subscription.tier) }}</span>
                    </div>
                    <!-- Status -->
                    <div class="flex items-center gap-1.5">
                      <span class="text-base-content/60">Status:</span>
                      <span :class="getSubscriptionStatusClass(site.subscription.status)">
                        {{ formatSubscriptionStatus(site.subscription.status) }}
                      </span>
                    </div>
                    <!-- Renewal -->
                    <div v-if="site.subscription.current_period_end" class="flex items-center gap-1.5">
                      <span class="text-base-content/60">{{ site.subscription.cancel_at_period_end ? 'Ends:' : 'Renews:' }}</span>
                      <span class="text-base-content">{{ formatDate(site.subscription.current_period_end) }}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Subscription History -->
          <div class="bg-base-100 rounded-xl border border-base-300/50 p-6 shadow-sm hover:shadow-md hover:border-base-300 transition-all duration-300">
            <div class="flex items-center justify-between mb-6">
              <h3 class="text-lg text-base-content" style="font-family: 'Instrument Serif', serif; font-weight: 400; letter-spacing: -0.01em;">
                Active Subscriptions
              </h3>
              <span class="text-sm text-base-content/60">{{ activeSubscriptionsCount }} active</span>
            </div>

            <div v-if="activeSubscriptionsCount === 0" class="py-12 text-center">
              <div class="inline-flex items-center justify-center w-16 h-16 rounded-full bg-base-200 text-base-content/30 mb-4">
                <svg class="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                </svg>
              </div>
              <p class="text-sm text-base-content/50">No active subscriptions</p>
            </div>

            <div v-else class="space-y-4">
              <div
                v-for="site in sitesWithSubscriptions"
                :key="site.id"
                class="p-4 rounded-lg border border-base-300/30"
              >
                <div class="flex items-start justify-between gap-4 mb-3">
                  <h4 class="text-base font-medium text-base-content">
                    {{ site.name || site.url }}
                  </h4>
                  <div class="flex items-center gap-3 text-sm">
                    <span class="font-medium text-base-content">{{ formatTier(site.subscription!.tier) }}</span>
                    <span :class="getSubscriptionStatusClass(site.subscription!.status)">
                      {{ formatSubscriptionStatus(site.subscription!.status) }}
                    </span>
                  </div>
                </div>

                <div class="space-y-2">
                  <div v-if="site.subscription!.current_period_start" class="flex items-center justify-between text-sm">
                    <span class="text-base-content/60">Started</span>
                    <span class="text-base-content font-medium">{{ formatDate(site.subscription!.current_period_start) }}</span>
                  </div>
                  <div v-if="site.subscription!.current_period_end" class="flex items-center justify-between text-sm">
                    <span class="text-base-content/60">{{ site.subscription!.cancel_at_period_end ? 'Ends' : 'Renews' }}</span>
                    <span class="text-base-content font-medium">{{ formatDate(site.subscription!.current_period_end) }}</span>
                  </div>
                  <div v-if="site.subscription!.cancel_at_period_end" class="flex items-center justify-between text-sm">
                    <span class="text-base-content/60">Auto-Renew</span>
                    <span class="text-base-content/50">Disabled</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Audit Summary -->
          <div class="bg-base-100 rounded-xl border border-base-300/50 p-6 shadow-sm hover:shadow-md hover:border-base-300 transition-all duration-300">
            <div class="flex items-center justify-between mb-6">
              <h3 class="text-lg text-base-content" style="font-family: 'Instrument Serif', serif; font-weight: 400; letter-spacing: -0.01em;">
                Activity Summary
              </h3>
            </div>

            <div class="grid grid-cols-2 gap-4 mb-6">
              <div class="p-4 rounded-lg bg-base-200/50">
                <div class="text-3xl font-semibold text-base-content mb-1" style="font-family: 'Instrument Serif', serif;">
                  {{ user.auditLogSummary.totalActions }}
                </div>
                <div class="text-xs text-base-content/50 font-medium uppercase tracking-wider">Total Actions</div>
              </div>

              <div class="p-4 rounded-lg bg-base-200/50">
                <div v-if="user.auditLogSummary.lastAction" class="mb-2">
                  <div class="text-sm font-medium text-base-content mb-1">{{ user.auditLogSummary.lastAction.action }}</div>
                  <div class="text-xs text-base-content/50">{{ formatRelativeTime(user.auditLogSummary.lastAction.timestamp) }}</div>
                </div>
                <div v-else class="text-sm text-base-content/50 mb-1">No actions yet</div>
                <div class="text-xs text-base-content/50 font-medium uppercase tracking-wider">Last Action</div>
              </div>
            </div>

            <NuxtLink
              :to="`/audit-logs?user=${user.id}`"
              class="flex items-center justify-center gap-2 py-3 px-4 rounded-lg border border-base-300 text-sm font-medium text-base-content hover:border-primary hover:text-primary hover:bg-primary/5 transition-all"
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
  UserIcon
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

const capitalizeFirst = (str: string): string => {
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase()
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
