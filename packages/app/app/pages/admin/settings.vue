<template>
  <div class="min-h-screen">
    <!-- Page Header -->
    <header class="backdrop-blur-xl bg-base-100/80 border-base-300/60 sticky top-0 z-10 border-b">
      <div :class="scrollPosition ? '' : 'lg:pt-10'" class="lg:px-12 max-w-[1400px] p-6 mx-auto">
        <div class="breadcrumbs text-xs">
          <ul>
            <li>
              <NuxtLink to="/admin" class="font-thin">Dashboard</NuxtLink>
            </li>
            <li class="font-light">Site Settings</li>
          </ul>
        </div>
        <h1 :class="scrollPosition ? '' : 'lg:text-5xl'" class="text-base-content mb-2 font-serif text-3xl">Site
          Settings</h1>
        <p class="text-base-content/70">Configure <span class="text-primary-content dark:text-primary italic">{{
          site?.name || site?.url || ' your site' }}</span></p>
      </div>

    </header>
    <!-- Tab Navigation -->
    <nav class="lg:px-12 max-w-[1400px] px-6 pb-6 mx-auto mt-6">
      <div class="flex gap-6">
        <button v-for="item in secondaryNavigation" :key="item.id" @click="setActiveTab(item.id)"
          class="gap-1.5 py-1 text-sm flex items-center flex-0 justify-center border-b-2 cursor-pointer"
          :class="item.current ? 'border-primary text-base-content dark:text-primary' : 'border-transparent text-base-content/70 hover:border-primary/50'">
          <component :is="item.icon" class="w-4 h-4" />
          {{ item.name }}
        </button>
      </div>
    </nav>
    <!-- Settings Content -->
    <div class="lg:px-12 max-w-[1400px] px-6 py-10 mx-auto space-y-16">
      <!-- General Settings -->
      <section v-show="activeTab === 'general'" class="w-full">
        <div class="gap-10">
          <!-- Section Form -->
          <div class="">
            <div class="bg-base-100 border-base-300 rounded-3xl overflow-hidden border-2">
              <div class="lg:p-16 p-6">
                <!-- Loading -->
                <div v-if="loading" class="flex justify-center py-12">
                  <div class="border-base-300 border-t-primary animate-spin w-12 h-12 border-4 rounded-full"></div>
                </div>

                <!-- Form -->
                <form v-else @submit.prevent="handleSaveGeneral" class="space-y-8">
                  <h2 class="text-base-content font-serif text-lg leading-tight">Site Information</h2>
                  <p class="text-base-content/70 text-sm">
                    Basic details about your site.
                  </p>
                  <div class="flex w-full gap-6">
                    <div class="w-full space-y-2">
                      <label class="block" for="site-name">
                        <span class="text-base-content block mb-2 text-sm font-bold">Site name</span>
                      </label>
                      <input id="site-name" v-model="siteForm.name" type="text" class="input bg-base-200"
                        placeholder="My Awesome Blog" />
                      <p class="text-base-content/60 text-sm">The display name for your site</p>
                    </div>

                    <div class="w-full space-y-2">
                      <label class="block" for="site-url">
                        <span class="text-base-content block mb-2 text-sm font-bold">Site URL</span>
                      </label>
                      <input id="site-url" v-model="siteForm.url" type="text" class="bg-base-200 input"
                        placeholder="example.com" disabled />
                      <p class="text-base-content/60 text-sm">Your website's domain (cannot be changed)</p>
                    </div>
                  </div>

                  <!-- Interactive Mode Options Section -->
                  <div class="border-base-300 pt-8 mt-8 border-t-2">
                    <div class="flex items-center gap-3 mb-6">
                      <h2 class="text-base-content font-serif text-lg leading-tight">Interactive Mode Options</h2>
                      <span class="badge badge-md badge-primary">PRO</span>
                    </div>
                    <p class="text-base-content/70 mb-8 text-sm">
                      Customize how Interactive Mode appears on your site.
                    </p>

                    <!-- Pro Upgrade Prompt (Free tier only) -->
                    <div v-if="tier !== 'pro'" class="rounded-2xl border-primary/20 bg-primary/5 p-6 mb-8 border-2 border-dashed">
                      <div class="flex items-start gap-4">
                        <div class="bg-primary/10 p-2 rounded-lg">
                          <SparklesIcon class="text-primary size-5" />
                        </div>
                        <div class="flex-1">
                          <p class="text-base-content mb-1 font-medium">Upgrade to Pro to customize Interactive Mode</p>
                          <p class="text-base-content/60 mb-4 text-sm">
                            Pro subscribers can disable Interactive Mode or customize the button text.
                          </p>
                          <button type="button" @click="showUpgradeModal = true" class="btn btn-primary btn-sm">
                            Upgrade to Pro
                          </button>
                        </div>
                      </div>
                    </div>

                    <div class="space-y-8" :class="{ 'opacity-50 pointer-events-none': tier !== 'pro' }">
                      <!-- Interactive Mode Toggle -->
                      <div class="flex items-start justify-between gap-6">
                        <div class="flex-1">
                          <label for="interactive-mode-toggle" class="text-base-content block mb-1 text-sm font-bold cursor-pointer">
                            Enable Interactive Mode
                          </label>
                          <p class="text-base-content/60 text-sm">
                            Show the Interactive Mode button on your recipe cards
                          </p>
                        </div>
                        <input
                          id="interactive-mode-toggle"
                          v-model="siteForm.interactive_mode_enabled"
                          type="checkbox"
                          class="toggle toggle-primary"
                          :disabled="tier !== 'pro'"
                        />
                      </div>

                      <!-- Button Text -->
                      <div class="space-y-2" :class="{ 'opacity-50': !siteForm.interactive_mode_enabled && tier === 'pro' }">
                        <label class="block" for="button-text">
                          <span class="text-base-content block mb-2 text-sm font-bold">Button Text</span>
                        </label>
                        <input
                          id="button-text"
                          v-model="siteForm.interactive_mode_button_text"
                          type="text"
                          class="input bg-base-200 max-w-md"
                          placeholder="Try Interactive Mode!"
                          maxlength="50"
                          :disabled="tier !== 'pro' || !siteForm.interactive_mode_enabled"
                        />
                        <p class="text-base-content/60 text-sm">
                          Customize the text shown on the Interactive Mode button (max 50 characters)
                        </p>
                      </div>
                    </div>
                  </div>

                  <!-- Alerts -->
                  <div v-if="generalError" role="alert" class="alert alert-error">
                    <ExclamationCircleIcon class="size-5" />
                    <span class="font-medium">{{ generalError }}</span>
                  </div>

                  <div v-if="generalSuccess" role="alert" class="alert alert-success">
                    <CheckCircleIcon class="size-5" />
                    <span class="font-medium">Settings saved successfully!</span>
                  </div>

                  <!-- Submit -->
                  <div class="border-base-300 flex justify-end pt-6 border-t-2">
                    <button type="submit" class="btn btn-primary" :disabled="savingGeneral">
                      <span v-if="savingGeneral"
                        class="border-primary-content/30 border-t-primary-content animate-spin w-5 h-5 border-2 rounded-full"></span>
                      {{ savingGeneral ? 'Saving...' : 'Save changes' }}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- Subscription Settings -->
      <section v-show="activeTab === 'subscription'" class="w-full space-y-6">
        <!-- Loading -->
        <div v-if="subscriptionLoading" class="flex justify-center py-12">
          <div class="border-base-300 border-t-primary animate-spin w-12 h-12 border-4 rounded-full"></div>
        </div>

        <template v-else>
          <!-- Current Plan Card -->
          <div class="bg-base-100 border-base-300 rounded-3xl overflow-hidden border-2">
            <div class="lg:p-12 p-6">
              <h2 class="text-base-content mb-1 font-serif text-lg leading-tight">Current Plan</h2>
              <p class="text-base-content/60 mb-6 text-sm">Your subscription details and billing information.</p>

              <div
                class="rounded-2xl lg:p-8 p-6"
                :class="tier !== 'free' ? 'bg-gradient-to-br from-base-200 to-primary/10 border border-primary/20' : 'bg-base-200'"
              >
                <!-- Plan Header -->
                <div class="flex items-start justify-between mb-6">
                  <div class="flex flex-col gap-1">
                    <span class="font-serif text-2xl italic font-light">{{ tier === 'pro' ? 'Pro Plan' : tier === 'free-plus' ? 'Free+ Plan' : 'Free Plan' }}</span>
                    <div class="flex items-center gap-2">
                      <span
                        class="w-2 h-2 rounded-full"
                        :class="{
                          'bg-success shadow-[0_0_8px_rgba(34,197,94,0.4)]': subscription?.status === 'active' && !subscription?.cancel_at_period_end,
                          'bg-base-content/40': tier === 'free',
                          'bg-warning shadow-[0_0_8px_rgba(245,158,11,0.4)]': subscription?.cancel_at_period_end
                        }"
                      ></span>
                      <span class="text-sm font-medium">
                        {{
                          subscription?.cancel_at_period_end
                            ? 'Canceling'
                            : subscription?.status === 'active'
                              ? 'Active'
                              : tier === 'free-plus'
                                ? 'Active'
                                : 'Free'
                        }}
                      </span>
                    </div>
                  </div>
                  <span v-if="tier === 'pro' && stripeDetails?.plan" class="text-4xl font-light">
                    ${{ stripeDetails.plan.amount }}<span class="text-base-content/60 text-base">/{{ stripeDetails.plan.interval }}</span>
                  </span>
                  <span v-else-if="tier === 'pro'" class="text-4xl font-light">
                    $9<span class="text-base-content/60 text-base">/mo</span>
                  </span>
                </div>

                <!-- Billing Date -->
                <div v-if="(stripeDetails?.currentPeriodEnd || subscription?.current_period_end) && tier === 'pro'" class="border-base-300 pb-6 mb-6 border-b">
                  <div class="flex flex-wrap items-baseline gap-2">
                    <span class="text-base-content/60 text-sm">
                      {{ (stripeDetails?.cancelAtPeriodEnd || subscription?.cancel_at_period_end) ? 'Access ends' : 'Next billing date' }}
                    </span>
                    <span class="font-medium">{{ formatDate(stripeDetails?.currentPeriodEnd || subscription?.current_period_end) }}</span>
                    <span class="text-base-content/60 text-sm">({{ getDaysUntil(stripeDetails?.currentPeriodEnd || subscription?.current_period_end) }} days)</span>
                  </div>
                </div>

                <!-- Features List -->
                <div class="mb-6">
                  <h4 class="text-base-content/50 mb-3 text-xs tracking-wide uppercase">Included features:</h4>
                  <ul class="space-y-2 text-sm">
                    <li v-if="tier === 'pro'" class="flex items-center gap-2">
                      <svg class="text-primary shrink-0 w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <polyline points="20 6 9 17 4 12"/>
                      </svg>
                      Use your own ad network in Interactive Mode
                    </li>
                    <li v-if="tier === 'pro'" class="flex items-center gap-2">
                      <svg class="text-primary shrink-0 w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <polyline points="20 6 9 17 4 12"/>
                      </svg>
                      Customize Interactive Mode settings
                    </li>
                    <li v-if="tier === 'pro'" class="flex items-center gap-2">
                      <svg class="text-primary shrink-0 w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <polyline points="20 6 9 17 4 12"/>
                      </svg>
                      Priority support
                    </li>
                    <li v-if="tier !== 'free'" class="flex items-center gap-2">
                      <svg class="text-primary shrink-0 w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <polyline points="20 6 9 17 4 12"/>
                      </svg>
                      Interactive Mode{{ tier !== 'pro' ? ' with Create ads' : '' }}
                    </li>
                    <li v-if="tier !== 'free'" class="flex items-center gap-2">
                      <svg class="text-primary shrink-0 w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <polyline points="20 6 9 17 4 12"/>
                      </svg>
                      Servings Adjustment
                    </li>
                    <li v-if="tier !== 'free'" class="flex items-center gap-2">
                      <svg class="text-primary shrink-0 w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <polyline points="20 6 9 17 4 12"/>
                      </svg>
                      Unit Conversion
                    </li>
                    <li v-if="tier !== 'free'" class="flex items-center gap-2">
                      <svg class="text-primary shrink-0 w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <polyline points="20 6 9 17 4 12"/>
                      </svg>
                      Premium Themes
                    </li>
                    <li v-if="tier !== 'free'" class="flex items-center gap-2">
                      <svg class="text-primary shrink-0 w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <polyline points="20 6 9 17 4 12"/>
                      </svg>
                      Interactive Checklists
                    </li>
                    <li v-if="tier !== 'free'" class="flex items-center gap-2">
                      <svg class="text-primary shrink-0 w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <polyline points="20 6 9 17 4 12"/>
                      </svg>
                      Review Responses &amp; Management
                    </li>
                    <li v-if="tier !== 'free'" class="flex items-center gap-2">
                      <svg class="text-primary shrink-0 w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <polyline points="20 6 9 17 4 12"/>
                      </svg>
                      Featured Reviews Block
                    </li>
                    <li v-if="tier !== 'free'" class="flex items-center gap-2">
                      <svg class="text-primary shrink-0 w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <polyline points="20 6 9 17 4 12"/>
                      </svg>
                      Products in Lists
                    </li>
                    <li v-if="tier !== 'free'" class="flex items-center gap-2">
                      <svg class="text-primary shrink-0 w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <polyline points="20 6 9 17 4 12"/>
                      </svg>
                      Bulk Import List Items
                    </li>
                    <li class="flex items-center gap-2">
                      <svg class="text-primary shrink-0 w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <polyline points="20 6 9 17 4 12"/>
                      </svg>
                      Email support <a :href="`mailto:${supportEmail}`" class="link inline-flex items-center gap-1"><EnvelopeIcon class="size-4" />{{supportEmail}}</a>
                    </li>
                  </ul>
                </div>

                <!-- Payment Method -->
                <div v-if="stripeDetails?.paymentMethod" class="border-base-300 pb-6 mb-6 border-b">
                  <h4 class="text-base-content/50 mb-3 text-xs tracking-wide uppercase">Payment method:</h4>
                  <div class="flex items-center gap-3">
                    <div class="bg-base-100 p-2 rounded-lg">
                      <svg class="w-8 h-5" viewBox="0 0 32 20" fill="none">
                        <rect width="32" height="20" rx="2" fill="currentColor" class="text-base-content/10"/>
                        <rect x="2" y="4" width="8" height="5" rx="1" fill="currentColor" class="text-base-content/30"/>
                        <rect x="2" y="12" width="18" height="2" rx="1" fill="currentColor" class="text-base-content/20"/>
                        <rect x="2" y="15" width="12" height="2" rx="1" fill="currentColor" class="text-base-content/20"/>
                      </svg>
                    </div>
                    <div>
                      <p class="font-medium capitalize">{{ stripeDetails.paymentMethod.brand }} •••• {{ stripeDetails.paymentMethod.last4 }}</p>
                      <p class="text-base-content/60 text-sm">Expires {{ stripeDetails.paymentMethod.expMonth }}/{{ stripeDetails.paymentMethod.expYear }}</p>
                    </div>
                  </div>
                </div>

                <!-- Action Buttons -->
                <div class="flex flex-wrap gap-3">
                  <template v-if="tier === 'pro' && subscription?.stripe_customer_id">
                    <button
                      @click="handleManageBilling"
                      class="btn btn-outline btn-sm"
                      :disabled="managingBilling"
                    >
                      <span v-if="managingBilling" class="loading loading-spinner loading-xs"></span>
                      {{ managingBilling ? 'Loading...' : 'Manage Subscription' }}
                    </button>
                  </template>
                  <template v-else>
                    <button @click="showUpgradeModal = true" class="btn btn-primary btn-sm">
                      Upgrade to Pro
                    </button>
                  </template>
                </div>
              </div>

              <!-- Error -->
              <div v-if="subscriptionError" class="bg-error/10 border-error/30 text-error rounded-2xl flex items-start gap-3 p-5 mt-6 border-2">
                <ExclamationCircleIcon class="w-5 h-5 flex-shrink-0 mt-0.5" />
                <span class="font-medium">{{ subscriptionError }}</span>
              </div>
            </div>
          </div>

          <!-- Invoice History -->
          <div v-if="stripeDetails?.invoices?.length" class="bg-base-100 border-base-300 rounded-3xl overflow-hidden border-2">
            <div class="lg:p-12 p-6">
              <h2 class="text-base-content mb-1 font-serif text-lg leading-tight">Billing History</h2>
              <p class="text-base-content/60 mb-6 text-sm">Your recent invoices and payment history.</p>

              <div class="overflow-x-auto">
                <table class="table">
                  <thead>
                    <tr>
                      <th class="text-base-content/60">Date</th>
                      <th class="text-base-content/60">Invoice</th>
                      <th class="text-base-content/60 text-right">Amount</th>
                      <th class="text-base-content/60 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="invoice in stripeDetails.invoices" :key="invoice.id" class="hover:bg-base-200/50">
                      <td class="text-sm">{{ formatDate(invoice.date) }}</td>
                      <td class="text-base-content/70 font-mono text-sm">{{ invoice.number || 'N/A' }}</td>
                      <td class="text-sm font-medium text-right">${{ invoice.amount.toFixed(2) }}</td>
                      <td class="text-right">
                        <a
                          v-if="invoice.pdfUrl"
                          :href="invoice.pdfUrl"
                          target="_blank"
                          class="btn btn-ghost btn-xs"
                        >
                          <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                          </svg>
                          PDF
                        </a>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </template>
      </section>

      <!-- Danger Zone (Hidden for now) -->
      <section v-if="false" class="w-full">
        <div class="lg:grid-cols-3 grid grid-cols-1 gap-8">
          <div class="lg:col-span-1">
            <h2 class="text-error mb-2 font-serif text-xl font-bold">Danger Zone</h2>
            <p class="text-base-content/60 text-sm leading-relaxed">
              Irreversible actions. Please proceed with caution.
            </p>
          </div>

          <div class="lg:col-span-2">
            <div class="card bg-error/5 border-error/20 border">
              <div class="card-body">
                <p class="mb-4 text-sm">
                  Once you delete this site, there is no going back. All data will be permanently removed.
                </p>
                <button type="button" class="btn btn-error btn-outline" @click="showDeleteConfirm = true">
                  Delete this site
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>

    <!-- Delete Confirmation Modal -->
    <dialog :class="{ 'modal modal-open': showDeleteConfirm }" class="modal">
      <div class="modal-box">
        <h3 class="text-lg font-bold">Delete Site</h3>
        <p class="opacity-70 py-4">
          Are you sure you want to delete this site? This action cannot be undone.
        </p>
        <div class="modal-action">
          <button class="btn btn-ghost" @click="showDeleteConfirm = false">Cancel</button>
          <button class="btn btn-error" @click="handleDeleteSite">Delete</button>
        </div>
      </div>
      <form method="dialog" class="modal-backdrop" @click="showDeleteConfirm = false">
        <button>close</button>
      </form>
    </dialog>

    <!-- Upgrade Modal -->
    <SubscriptionUpgradeModal v-model="showUpgradeModal" />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import {
  Cog6ToothIcon,
  CreditCardIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
  SparklesIcon,
} from '@heroicons/vue/24/outline'
import { useSiteContext } from '~/composables/useSiteContext.js'
import { useAuthFetch } from '~/composables/useAuthFetch.js'
import { EnvelopeIcon } from '@heroicons/vue/20/solid'

definePageMeta({
  middleware: 'auth',
  layout: 'admin'
})

const config = useRuntimeConfig()
const supportEmail = config.public.supportEmail || 'support@create.studio'

const router = useRouter()
const route = useRoute()
const { selectedSiteId, loadSites } = useSiteContext()

const activeTab = ref('general')
const scrollPosition = ref(0)

const secondaryNavigation = computed(() => [
  { name: 'General', id: 'general', icon: Cog6ToothIcon, current: activeTab.value === 'general' },
  { name: 'Subscription', id: 'subscription', icon: CreditCardIcon, current: activeTab.value === 'subscription' },
])

const setActiveTab = (tabId: string) => {
  activeTab.value = tabId
  router.push({ hash: `#${tabId}` })
}

onMounted(() => {
  const hash = route.hash.replace('#', '')
  if (hash && (hash === 'general' || hash === 'subscription')) {
    activeTab.value = hash
  } else {
    router.replace({ hash: '#general' })
  }
  scrollPosition.value = window.scrollY

  const handleScroll = () => {
    scrollPosition.value = window.scrollY
  }
  window.addEventListener('scroll', handleScroll)
})

watch(() => route.hash, (newHash) => {
  const hash = newHash.replace('#', '')
  if (hash && (hash === 'general' || hash === 'subscription')) {
    activeTab.value = hash
  }
})

const site = ref<any>(null)
const subscription = ref<any>(null)
const stripeDetails = ref<any>(null)
const tier = ref('free')

const loading = ref(true)
const subscriptionLoading = ref(true)
const savingGeneral = ref(false)
const managingBilling = ref(false)
const showDeleteConfirm = ref(false)
const showUpgradeModal = ref(false)

const generalError = ref('')
const generalSuccess = ref(false)
const subscriptionError = ref('')

const siteForm = ref({
  name: '',
  url: '',
  interactive_mode_enabled: true,
  interactive_mode_button_text: ''
})

const tierDisplayName = computed(() => {
  if (tier.value === 'pro') return 'Pro'
  if (tier.value === 'free-plus') return 'Free+'
  return 'Free'
})

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

const getDaysUntil = (dateString: string) => {
  const now = new Date()
  const target = new Date(dateString)
  const diffTime = target.getTime() - now.getTime()
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  return diffDays > 0 ? diffDays : 0
}

const loadSiteData = async () => {
  if (!selectedSiteId.value) {
    router.push('/admin')
    return
  }

  loading.value = true
  subscriptionLoading.value = true

  try {
    const siteResponse = await useAuthFetch(`/api/v2/sites/${selectedSiteId.value}`)
    if (siteResponse.success) {
      site.value = siteResponse.site
      siteForm.value = {
        name: site.value.name || '',
        url: site.value.url || '',
        // Pro settings: default to enabled if not set (null/undefined treated as enabled)
        interactive_mode_enabled: site.value.interactive_mode_enabled !== 0,
        interactive_mode_button_text: site.value.interactive_mode_button_text || ''
      }
    }

    const subResponse = await useAuthFetch(`/api/v2/subscriptions/status/${selectedSiteId.value}`)
    if (subResponse.success) {
      subscription.value = subResponse.subscription
      tier.value = subResponse.tier || 'free'

      // Fetch detailed Stripe info for Pro subscribers
      if (tier.value === 'pro' && subscription.value?.stripe_subscription_id) {
        loadStripeDetails()
      }
    }
  } catch (error: any) {
    console.error('Failed to load site data:', error)
    generalError.value = 'Failed to load site data'
  } finally {
    loading.value = false
    subscriptionLoading.value = false
  }
}

const loadStripeDetails = async () => {
  try {
    const response = await useAuthFetch(`/api/v2/subscriptions/details/${selectedSiteId.value}`)
    if (response.success && response.hasSubscription) {
      stripeDetails.value = response.details
    }
  } catch (error: any) {
    console.error('Failed to load Stripe details:', error)
    // Non-critical, don't show error to user
  }
}

const handleSaveGeneral = async () => {
  generalError.value = ''
  generalSuccess.value = false
  savingGeneral.value = true

  try {
    // Build request body - always include general fields
    const body: Record<string, unknown> = {
      name: siteForm.value.name,
      url: siteForm.value.url
    }

    // Include Pro fields only for Pro tier
    if (tier.value === 'pro') {
      body.interactive_mode_enabled = siteForm.value.interactive_mode_enabled
      body.interactive_mode_button_text = siteForm.value.interactive_mode_button_text || null
    }

    const response = await useAuthFetch(`/api/v2/sites/${selectedSiteId.value}`, {
      method: 'PATCH',
      body
    })

    if (response.success) {
      generalSuccess.value = true
      await loadSites()
      setTimeout(() => {
        generalSuccess.value = false
      }, 3000)
    } else {
      generalError.value = response.error || 'Failed to save settings'
    }
  } catch (error: any) {
    generalError.value = error.data?.error || 'Failed to save settings'
  } finally {
    savingGeneral.value = false
  }
}

const handleManageBilling = async () => {
  managingBilling.value = true
  subscriptionError.value = ''

  try {
    const response = await useAuthFetch('/api/v2/subscriptions/portal', {
      method: 'POST',
      body: {
        siteId: selectedSiteId.value
      }
    })

    if (response.success && response.url) {
      window.open(response.url, '_blank')
    } else {
      subscriptionError.value = response.error || 'Failed to open billing portal'
    }
  } catch (error: any) {
    subscriptionError.value = error.data?.error || 'Failed to open billing portal'
  } finally {
    managingBilling.value = false
  }
}

const handleDeleteSite = async () => {
  showDeleteConfirm.value = false
}

watch(selectedSiteId, () => {
  if (selectedSiteId.value) {
    loadSiteData()
  }
}, { immediate: true })

useHead({
  title: 'Site Settings - Create Studio',
  meta: [
    { name: 'description', content: 'Manage your site settings and subscription' }
  ]
})
</script>
