<template>
  <div class="min-h-screen">
    <!-- Loading State -->
    <div v-if="loading" class="flex items-center justify-center min-h-[60vh]">
      <div class="flex flex-col items-center gap-4">
        <span class="loading loading-spinner loading-lg text-primary"></span>
        <p class="text-sm text-base-content/50 font-light tracking-wide">Loading subscription details...</p>
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
          <h3 class="text-xl text-base-content" style="font-family: 'Instrument Serif', serif;">Unable to Load Subscription</h3>
          <p class="text-sm text-base-content/60 leading-relaxed">{{ error }}</p>
        </div>
        <button class="btn btn-outline btn-sm" @click="fetchSubscriptionDetails">
          Try Again
        </button>
      </div>
    </div>

    <!-- Subscription Details -->
    <div v-else-if="subscription" class="px-6 py-8 max-w-[1400px] mx-auto">
      <!-- Header with Back Navigation -->
      <div class="mb-12">
        <button
          class="inline-flex items-center gap-2 text-sm text-base-content/60 hover:text-base-content transition-colors mb-6 font-medium tracking-wide group"
          @click="navigateBack"
          aria-label="Back to subscriptions"
        >
          <ArrowLeftIcon class="w-4 h-4 transition-transform group-hover:-translate-x-1" />
          <span>Subscriptions</span>
        </button>

        <div class="space-y-2">
          <div class="flex items-center gap-2 text-xs font-medium tracking-widest uppercase">
            <span class="text-base-content/50">Subscription</span>
            <span class="text-base-content/30">·</span>
            <span class="text-base-content/40">ID {{ subscription.id }}</span>
          </div>
          <h1 class="text-4xl text-base-content" style="font-family: 'Instrument Serif', serif; font-weight: 400; letter-spacing: -0.02em; line-height: 1.1;">
            {{ formatTier(subscription.tier) }}
          </h1>
        </div>
      </div>

      <!-- Main Content Grid -->
      <div class="grid grid-cols-1 lg:grid-cols-[380px_1fr] gap-8">
        <!-- Left Column: Subscription Profile Card -->
        <div class="space-y-6">
          <!-- Profile Card -->
          <div class="bg-base-100 rounded-xl border border-base-300/50 p-8 shadow-sm hover:shadow-md hover:border-base-300 transition-all duration-300">
            <!-- Icon Section -->
            <div class="flex justify-center mb-6">
              <div class="relative">
                <div class="w-24 h-24 rounded-full overflow-hidden flex items-center justify-center bg-gradient-to-br from-primary/20 to-primary/10 text-primary">
                  <CreditCardIcon class="w-12 h-12" />
                </div>
              </div>
            </div>

            <!-- Plan & Status Section -->
            <div class="space-y-4 text-center">
              <h2 class="text-2xl text-base-content" style="font-family: 'Instrument Serif', serif; font-weight: 400; letter-spacing: -0.01em;">
                {{ formatTier(subscription.tier) }}
              </h2>

              <!-- Status -->
              <div class="flex flex-col items-center gap-1">
                <span class="text-xs text-base-content/50 font-medium uppercase tracking-wider">Status</span>
                <span
                  class="text-sm font-medium"
                  :class="getStatusClass(subscription.status)"
                >
                  {{ formatStatus(subscription.status) }}
                </span>
              </div>
            </div>

            <!-- Divider -->
            <div class="my-6 h-px bg-gradient-to-r from-transparent via-base-300 to-transparent"></div>

            <!-- Subscription Attributes -->
            <div class="space-y-4">
              <!-- Billing Period -->
              <div v-if="subscription.current_period_start" class="flex items-center justify-between py-3 border-b border-base-300/30">
                <span class="text-sm text-base-content/60 font-medium">Period Start</span>
                <span class="text-sm text-base-content font-medium">{{ formatDate(subscription.current_period_start) }}</span>
              </div>

              <div v-if="subscription.current_period_end" class="flex items-center justify-between py-3 border-b border-base-300/30">
                <span class="text-sm text-base-content/60 font-medium">{{ subscription.cancel_at_period_end ? 'Ends' : 'Renews' }}</span>
                <span class="text-sm text-base-content font-medium">{{ formatDate(subscription.current_period_end) }}</span>
              </div>

              <!-- Auto-Renew -->
              <div class="flex items-center justify-between py-3 border-b border-base-300/30">
                <span class="text-sm text-base-content/60 font-medium">Auto-Renew</span>
                <span
                  class="text-sm font-medium"
                  :class="subscription.cancel_at_period_end ? 'text-base-content/50' : 'text-base-content'"
                >
                  {{ subscription.cancel_at_period_end ? 'Disabled' : 'Enabled' }}
                </span>
              </div>

              <div class="flex items-center justify-between py-3 border-b border-base-300/30">
                <span class="text-sm text-base-content/60 font-medium">Created</span>
                <span class="text-sm text-base-content font-medium">{{ formatDate(subscription.createdAt) }}</span>
              </div>

              <div class="flex items-center justify-between py-3">
                <span class="text-sm text-base-content/60 font-medium">Updated</span>
                <span class="text-sm text-base-content font-medium">{{ formatDate(subscription.updatedAt) }}</span>
              </div>
            </div>
          </div>

          <!-- Admin Actions Card -->
          <div class="bg-base-100 rounded-xl border border-base-300/50 p-6 shadow-sm hover:shadow-md hover:border-base-300 transition-all duration-300">
            <h3 class="text-lg text-base-content mb-4" style="font-family: 'Instrument Serif', serif; font-weight: 400; letter-spacing: -0.01em;">
              Administrative Actions
            </h3>

            <!-- Stripe status indicator -->
            <div class="mb-4 p-3 rounded-lg" :class="hasStripeIntegration ? 'bg-[#635bff]/10 border border-[#635bff]/20' : 'bg-base-200/50 border border-base-300/30'">
              <div class="flex items-center gap-2">
                <div class="w-2 h-2 rounded-full" :class="hasStripeIntegration ? 'bg-[#635bff]' : 'bg-base-content/30'"></div>
                <span class="text-xs font-medium" :class="hasStripeIntegration ? 'text-[#635bff]' : 'text-base-content/50'">
                  {{ hasStripeIntegration ? 'Stripe Connected' : 'Manual Subscription' }}
                </span>
              </div>
              <p class="text-xs text-base-content/50 mt-1 ml-4">
                {{ hasStripeIntegration ? 'Changes sync with Stripe billing' : 'Direct database control, no billing' }}
              </p>
            </div>

            <div class="space-y-3">
              <button
                class="w-full flex items-center gap-4 p-4 rounded-lg border border-base-300/50 hover:border-base-300 hover:bg-base-200/50 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                @click="openModifyTierModal"
                :disabled="actionLoading"
              >
                <div class="flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center bg-base-200 text-base-content/70 transition-all">
                  <ArrowsUpDownIcon class="w-4 h-4" />
                </div>
                <div class="flex flex-col items-start text-left">
                  <div class="text-sm font-medium text-base-content">Modify Tier</div>
                  <div class="text-xs text-base-content/50">
                    {{ hasStripeIntegration ? 'Change plan (syncs with Stripe)' : 'Toggle between Free/Pro' }}
                  </div>
                </div>
              </button>

              <!-- Cancel button for Stripe subscriptions -->
              <button
                v-if="hasStripeIntegration"
                class="w-full flex items-center gap-4 p-4 rounded-lg border border-base-300/50 hover:border-warning/30 hover:bg-warning/5 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                @click="openCancelModal"
                :disabled="actionLoading || subscription.status === 'canceled' || subscription.cancel_at_period_end"
              >
                <div class="flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center bg-base-200 text-base-content/70 transition-all">
                  <XMarkIcon class="w-4 h-4" />
                </div>
                <div class="flex flex-col items-start text-left">
                  <div class="text-sm font-medium text-base-content">Cancel Subscription</div>
                  <div class="text-xs text-base-content/50">
                    {{ subscription.status === 'canceled' ? 'Already canceled' : subscription.cancel_at_period_end ? 'Cancellation pending' : 'Cancel at period end' }}
                  </div>
                </div>
              </button>

              <!-- Delete button for non-Stripe subscriptions -->
              <button
                v-if="!hasStripeIntegration"
                class="w-full flex items-center gap-4 p-4 rounded-lg border border-base-300/50 hover:border-error/30 hover:bg-error/5 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                @click="openDeleteModal"
                :disabled="actionLoading"
              >
                <div class="flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center bg-base-200 text-base-content/70 transition-all">
                  <TrashIcon class="w-4 h-4" />
                </div>
                <div class="flex flex-col items-start text-left">
                  <div class="text-sm font-medium text-base-content">Delete Subscription</div>
                  <div class="text-xs text-base-content/50">Remove subscription record entirely</div>
                </div>
              </button>
            </div>
          </div>
        </div>

        <!-- Right Column: Content -->
        <div class="space-y-6">
          <!-- Site & User Info Section -->
          <div class="bg-base-100 rounded-xl border border-base-300/50 p-6 shadow-sm hover:shadow-md hover:border-base-300 transition-all duration-300">
            <h3 class="text-lg text-base-content mb-6" style="font-family: 'Instrument Serif', serif; font-weight: 400; letter-spacing: -0.01em;">
              Associated Account
            </h3>

            <div class="space-y-6">
              <!-- Site Info -->
              <div class="p-4 rounded-lg border border-base-300/30 hover:border-base-300 transition-all">
                <div class="flex items-start gap-4">
                  <div class="flex-shrink-0 w-12 h-12 rounded-lg flex items-center justify-center bg-gradient-to-br from-primary/20 to-primary/10 text-primary">
                    <GlobeAltIcon class="w-6 h-6" />
                  </div>
                  <div class="flex-1 min-w-0">
                    <div class="flex items-center gap-2 text-xs text-base-content/50 font-medium uppercase tracking-wider mb-1">Site</div>
                    <NuxtLink
                      :to="`/sites/${subscription.site.id}`"
                      class="text-base font-medium text-base-content hover:text-primary transition-colors block truncate"
                    >
                      {{ subscription.site.name }}
                    </NuxtLink>
                    <a
                      :href="subscription.site.url"
                      target="_blank"
                      rel="noopener noreferrer"
                      class="inline-flex items-center gap-1.5 text-sm text-primary hover:underline group mt-1"
                    >
                      <span class="truncate">{{ subscription.site.url }}</span>
                      <svg class="w-3 h-3 flex-shrink-0 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                    </a>
                  </div>
                </div>
              </div>

              <!-- User Info -->
              <div v-if="subscription.user" class="p-4 rounded-lg border border-base-300/30 hover:border-base-300 transition-all">
                <div class="flex items-start gap-4">
                  <div class="flex-shrink-0 w-12 h-12 rounded-lg flex items-center justify-center bg-gradient-to-br from-primary/20 to-primary/10 text-primary">
                    <UserIcon class="w-6 h-6" />
                  </div>
                  <div class="flex-1 min-w-0">
                    <div class="flex items-center gap-2 text-xs text-base-content/50 font-medium uppercase tracking-wider mb-1">Owner</div>
                    <NuxtLink
                      :to="`/users/${subscription.user.id}`"
                      class="text-base font-medium text-base-content hover:text-primary transition-colors block truncate"
                    >
                      {{ subscription.user.displayName }}
                    </NuxtLink>
                    <a
                      :href="`mailto:${subscription.user.email}`"
                      class="text-sm text-base-content/60 hover:text-primary transition-colors"
                    >
                      {{ subscription.user.email }}
                    </a>
                  </div>
                </div>
              </div>

              <div v-else class="p-4 rounded-lg border border-base-300/30 bg-base-200/30">
                <div class="flex items-center gap-3 text-base-content/50">
                  <UserIcon class="w-5 h-5" />
                  <span class="text-sm">No user associated</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Stripe Links Section -->
          <div class="bg-base-100 rounded-xl border border-base-300/50 p-6 shadow-sm hover:shadow-md hover:border-base-300 transition-all duration-300">
            <h3 class="text-lg text-base-content mb-6" style="font-family: 'Instrument Serif', serif; font-weight: 400; letter-spacing: -0.01em;">
              Stripe Dashboard
            </h3>

            <div v-if="!subscription.stripeCustomerLink && !subscription.stripeSubscriptionLink" class="py-12 text-center">
              <div class="inline-flex items-center justify-center w-16 h-16 rounded-full bg-base-200 text-base-content/30 mb-4">
                <svg class="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <p class="text-sm text-base-content/50">No Stripe data available</p>
              <p class="text-xs text-base-content/40 mt-1">This subscription may not be connected to Stripe</p>
            </div>

            <div v-else class="space-y-4">
              <!-- Stripe Customer Link -->
              <a
                v-if="subscription.stripeCustomerLink"
                :href="subscription.stripeCustomerLink"
                target="_blank"
                rel="noopener noreferrer"
                class="flex items-center gap-4 p-4 rounded-lg border border-base-300/50 hover:border-base-300 hover:bg-base-200/50 transition-all group"
              >
                <div class="flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center bg-[#635bff]/10 text-[#635bff] transition-all">
                  <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M13.976 9.15c-2.172-.806-3.356-1.426-3.356-2.409 0-.831.683-1.305 1.901-1.305 2.227 0 4.515.858 6.09 1.631l.89-5.494C18.252.975 15.697 0 12.165 0 9.667 0 7.589.654 6.104 1.872 4.56 3.147 3.757 4.992 3.757 7.218c0 4.039 2.467 5.76 6.476 7.219 2.585.92 3.445 1.574 3.445 2.583 0 .98-.84 1.545-2.354 1.545-1.875 0-4.965-.921-6.99-2.109l-.9 5.555C5.175 22.99 8.385 24 11.714 24c2.641 0 4.843-.624 6.328-1.813 1.664-1.305 2.525-3.236 2.525-5.732 0-4.128-2.524-5.851-6.591-7.305z" />
                  </svg>
                </div>
                <div class="flex-1">
                  <div class="text-sm font-medium text-base-content">Customer Dashboard</div>
                  <div class="text-xs text-base-content/50">View customer details in Stripe</div>
                </div>
                <svg class="w-4 h-4 text-base-content/40 transition-transform group-hover:translate-x-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </a>

              <!-- Stripe Subscription Link -->
              <a
                v-if="subscription.stripeSubscriptionLink"
                :href="subscription.stripeSubscriptionLink"
                target="_blank"
                rel="noopener noreferrer"
                class="flex items-center gap-4 p-4 rounded-lg border border-base-300/50 hover:border-base-300 hover:bg-base-200/50 transition-all group"
              >
                <div class="flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center bg-[#635bff]/10 text-[#635bff] transition-all">
                  <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <div class="flex-1">
                  <div class="text-sm font-medium text-base-content">Subscription Dashboard</div>
                  <div class="text-xs text-base-content/50">View subscription details in Stripe</div>
                </div>
                <svg class="w-4 h-4 text-base-content/40 transition-transform group-hover:translate-x-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </a>
            </div>
          </div>

          <!-- Billing History Section -->
          <div class="bg-base-100 rounded-xl border border-base-300/50 p-6 shadow-sm hover:shadow-md hover:border-base-300 transition-all duration-300">
            <h3 class="text-lg text-base-content mb-6" style="font-family: 'Instrument Serif', serif; font-weight: 400; letter-spacing: -0.01em;">
              Billing History
            </h3>

            <div class="py-12 text-center">
              <div class="inline-flex items-center justify-center w-16 h-16 rounded-full bg-base-200 text-base-content/30 mb-4">
                <svg class="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <p class="text-sm text-base-content/50 mb-4">View billing history in Stripe</p>
              <a
                v-if="subscription.stripeCustomerLink"
                :href="subscription.stripeCustomerLink"
                target="_blank"
                rel="noopener noreferrer"
                class="inline-flex items-center justify-center gap-2 py-3 px-4 rounded-lg border border-base-300 text-sm font-medium text-base-content hover:border-primary hover:text-primary hover:bg-primary/5 transition-all"
              >
                <span>Open Stripe</span>
                <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
        :disabled="selectedTier === subscription?.tier"
        @confirm="handleModifyTier"
        @cancel="closeModals"
        @close="closeModals"
      >
        <div class="mb-4">
          <label class="block text-sm font-medium mb-2">Select New Tier</label>
          <p v-if="selectedTier === subscription?.tier" class="text-sm text-base-content/50 mb-2">
            Current tier: <span class="font-medium capitalize">{{ subscription?.tier }}</span>
          </p>
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
              <span class="text-sm font-medium text-base-content/60">Free Plan</span>
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
              <span class="text-sm font-medium text-base-content">Pro Plan</span>
            </label>
          </div>
        </div>

        <!-- Warning for Stripe subscriptions -->
        <div v-if="hasStripeIntegration && selectedTier === 'free'" class="bg-warning/10 border border-warning/20 rounded-lg p-4">
          <p class="text-sm text-warning font-medium mb-2">Stripe Integration Notice:</p>
          <ul class="text-sm text-base-content/70 space-y-1 list-disc list-inside">
            <li>Downgrading to free will cancel the Stripe subscription</li>
            <li>User will lose Pro access immediately</li>
            <li>No refunds are processed automatically</li>
          </ul>
        </div>

        <!-- Info for non-Stripe subscriptions -->
        <div v-else-if="!hasStripeIntegration" class="bg-info/10 border border-info/20 rounded-lg p-4">
          <p class="text-sm text-info font-medium mb-2">Manual Subscription:</p>
          <ul class="text-sm text-base-content/70 space-y-1 list-disc list-inside">
            <li>This is a manually managed subscription (no Stripe billing)</li>
            <li>Tier change takes effect immediately</li>
            <li v-if="selectedTier === 'pro'">Upgrading to Pro grants access without payment</li>
          </ul>
        </div>

        <!-- Default info -->
        <div v-else class="bg-base-200/50 border border-base-300/30 rounded-lg p-4">
          <p class="text-sm text-base-content/60">Changes are logged in the audit log.</p>
        </div>
      </AdminModal>

      <!-- Cancel Subscription Modal (Stripe subscriptions) -->
      <AdminModal
        :open="showCancelModal"
        title="Cancel Subscription"
        description="This subscription is connected to Stripe billing."
        variant="danger"
        confirm-text="Cancel Subscription"
        :loading="actionLoading"
        @confirm="handleCancelSubscription"
        @cancel="closeModals"
        @close="closeModals"
      >
        <div class="bg-warning/10 border border-warning/20 rounded-lg p-4 mb-4">
          <p class="text-sm text-warning font-medium mb-2">This action will:</p>
          <ul class="text-sm text-base-content/70 space-y-1 list-disc list-inside">
            <li>Set the subscription to cancel at period end in Stripe</li>
            <li>User retains Pro access until current billing period ends</li>
            <li>Stripe webhooks will finalize the cancellation</li>
            <li>No further charges will be made</li>
          </ul>
        </div>
        <p class="text-sm text-base-content/70">
          Site: <strong>{{ subscription.site.name }}</strong>
        </p>
      </AdminModal>

      <!-- Delete Subscription Modal (Non-Stripe subscriptions) -->
      <AdminModal
        :open="showDeleteModal"
        title="Delete Subscription"
        description="This will permanently remove the subscription record."
        variant="danger"
        confirm-text="Delete Subscription"
        :loading="actionLoading"
        @confirm="handleDeleteSubscription"
        @cancel="closeModals"
        @close="closeModals"
      >
        <div class="bg-error/10 border border-error/20 rounded-lg p-4 mb-4">
          <p class="text-sm text-error font-medium mb-2">Warning: This action will:</p>
          <ul class="text-sm text-base-content/70 space-y-1 list-disc list-inside">
            <li>Permanently delete this subscription record</li>
            <li>Site will have no subscription (can create a new one)</li>
            <li>This action cannot be undone</li>
          </ul>
        </div>
        <p class="text-sm text-base-content/70">
          Site: <strong>{{ subscription.site.name }}</strong>
        </p>
      </AdminModal>

      <!-- Success/Error Alert -->
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
  CreditCardIcon,
  ArrowsUpDownIcon,
  XMarkIcon,
  GlobeAltIcon,
  UserIcon,
  TrashIcon
} from '@heroicons/vue/24/outline'

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
const showDeleteModal = ref(false)
const selectedTier = ref<'free' | 'pro'>('free')

// Computed
const hasStripeIntegration = computed(() => {
  return !!(subscription.value?.stripe_subscription_id || subscription.value?.stripe_customer_id)
})

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

const openDeleteModal = () => {
  showDeleteModal.value = true
}

const closeModals = () => {
  showModifyTierModal.value = false
  showCancelModal.value = false
  showDeleteModal.value = false
}

// Action handlers
const handleModifyTier = async () => {
  if (!subscription.value) return

  actionLoading.value = true
  try {
    await $fetch(`/api/admin/subscriptions/${subscription.value.id}/modify-tier`, {
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
    const response = await $fetch<{ message: string; hasStripe: boolean }>(`/api/admin/subscriptions/${subscription.value.id}/cancel`, {
      method: 'POST',
    })
    showAlert(response.message || 'Subscription canceled successfully', 'success')
    closeModals()
    await fetchSubscriptionDetails() // Refresh data
  } catch (err: any) {
    console.error('Failed to cancel subscription:', err)
    showAlert(err?.data?.message || 'Failed to cancel subscription', 'error')
  } finally {
    actionLoading.value = false
  }
}

const handleDeleteSubscription = async () => {
  if (!subscription.value) return

  actionLoading.value = true
  try {
    await $fetch(`/api/admin/subscriptions/${subscription.value.id}`, {
      method: 'DELETE',
    })
    showAlert('Subscription deleted successfully', 'success')
    closeModals()
    // Navigate back to subscriptions list since this subscription no longer exists
    router.push('/subscriptions')
  } catch (err: any) {
    console.error('Failed to delete subscription:', err)
    showAlert(err?.data?.message || 'Failed to delete subscription', 'error')
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
const formatDate = (dateString: string | null): string => {
  if (!dateString) return 'N/A'
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}

const formatTier = (tier: string): string => {
  const tierMap: Record<string, string> = {
    'free': 'Free Plan',
    'pro': 'Pro Plan',
    'enterprise': 'Enterprise Plan'
  }
  return tierMap[tier] || tier.charAt(0).toUpperCase() + tier.slice(1) + ' Plan'
}

const formatStatus = (status: string): string => {
  const statusMap: Record<string, string> = {
    'free': 'Free',
    'active': 'Active',
    'trialing': 'Trial',
    'canceled': 'Canceled',
    'past_due': 'Past Due',
    'unpaid': 'Unpaid',
    'incomplete': 'Incomplete',
    'incomplete_expired': 'Expired',
    'paused': 'Paused'
  }
  return statusMap[status] || status.charAt(0).toUpperCase() + status.slice(1).replace('_', ' ')
}

const getStatusClass = (status: string): string => {
  const positiveStatuses = ['active', 'trialing']
  const negativeStatuses = ['canceled', 'incomplete', 'incomplete_expired', 'unpaid']
  const warningStatuses = ['past_due', 'paused']
  const neutralStatuses = ['free']

  if (positiveStatuses.includes(status)) {
    return 'text-success'
  } else if (negativeStatuses.includes(status)) {
    return 'text-error'
  } else if (warningStatuses.includes(status)) {
    return 'text-warning'
  } else if (neutralStatuses.includes(status)) {
    return 'text-base-content/60'
  }
  return 'text-base-content'
}

// Initialize
onMounted(() => {
  fetchSubscriptionDetails()
})
</script>
