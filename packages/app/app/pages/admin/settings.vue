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
            <div class="bg-base-100 border-base-300 rounded-3xl  overflow-hidden border-2">
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
      <section v-show="activeTab === 'subscription'" class="w-full">
        <div class="gap-10"></div>
        <!-- Section Content -->
        <div class="bg-base-100 border-base-300 rounded-3xl  overflow-hidden border-2">
          <div class="lg:p-16 p-6">
            <!-- Loading -->
            <div v-if="subscriptionLoading" class="flex justify-center py-12">
              <div class="border-base-300 border-t-primary animate-spin w-12 h-12 border-4 rounded-full"></div>
            </div>

            <!-- Content -->
            <div>
              <h2 class="text-base-content font-serif text-lg leading-tight">Current Plan</h2>
              <p class="text-base-content/70 text-sm">
                Your subscription details and billing.
              </p>
              <!-- Current Plan -->
              <div class="rounded-2xl bg-base-300 border-base-content/10 lg:p-16 p-6 mt-8 border">
                <div class="flex items-center justify-between">
                  <div>
                    <p class="text-base-content/70 mb-3 font-serif text-2xl italic">{{ tierDisplayName }}</p>
                  </div>
                  <div class="text-right">
                    <SparklesIcon v-if="tier === 'free'" class="text-primary size-10" />
                  </div>
                </div>
              </div>

              <!-- Subscription Details (Pro only) -->
              <div v-if="subscription && tier !== 'free'" class="space-y-6">
                <div v-if="subscription.current_period_end">
                  <label class="text-base-content block mb-2 text-sm font-bold">Renewal Date</label>
                  <p class="text-base-content/80 text-lg font-semibold">
                    {{ formatDate(subscription.current_period_end) }}
                  </p>
                </div>

                <div v-if="subscription.cancel_at_period_end"
                  class="bg-warning/10 border-warning/30 text-warning rounded-2xl flex items-start gap-3 p-5 border-2">
                  <ExclamationTriangleIcon class="w-5 h-5 flex-shrink-0 mt-0.5" />
                  <span class="font-medium">Your subscription will cancel at the end of the current period.</span>
                </div>
              </div>

              <!-- Upgrade CTA (Free tier only) -->
              <div v-if="tier === 'free'" class="rounded-2xl border-primary-content/30 bg-primary-content/5 dark:border-primary/30 dark:bg-primary/5 p-7 mt-8 border-2 border-dashed">
                <div class="flex items-start gap-5">
                  <div
                    class="bg-primary size-12 sm:flex items-center justify-center flex-shrink-0 hidden rounded-lg">
                    <SparklesIcon class="text-primary-content size-7" />
                  </div>
                  <div class="flex-1">
                    <h3 class="text-base-content sm:text-2xl mb-2 font-serif text-lg">Upgrade to Create Pro</h3>
                    <p class="text-base-content/80 mb-5 text-base leading-relaxed">
                     Use your own ad network in Interactive Mode and boost your revenue.
                    </p>
                    <button @click="showUpgradeModal = true"
                      class="btn btn-primary btn-lg">
                      Learn More
                    </button>
                  </div>
                </div>
              </div>

              <!-- Billing Management (Pro tier only) -->
              <div v-if="tier !== 'free' && subscription?.stripe_customer_id"
                class="border-base-300 flex justify-end pt-6 border-t-2">
                <button @click="handleManageBilling"
                  class="bg-base-300 hover:bg-base-content/20 text-base-content disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 px-6 py-3 font-bold transition-all duration-300 rounded-full"
                  :disabled="managingBilling">
                  <span v-if="managingBilling"
                    class="border-base-content/30 border-t-base-content animate-spin w-5 h-5 border-2 rounded-full"></span>
                  <CreditCardIcon v-else class="w-5 h-5" />
                  {{ managingBilling ? 'Loading...' : 'Manage Billing' }}
                </button>
              </div>

              <!-- Error -->
              <div v-if="subscriptionError"
                class="bg-error/10 border-error/30 text-error rounded-2xl flex items-start gap-3 p-5 border-2">
                <ExclamationCircleIcon class="w-5 h-5 flex-shrink-0 mt-0.5" />
                <span class="font-medium">{{ subscriptionError }}</span>
              </div>
            </div>
          </div>
        </div>
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
  ExclamationTriangleIcon,
  SparklesIcon,
} from '@heroicons/vue/24/outline'
import { useSiteContext } from '~/composables/useSiteContext.js'
import { useAuthFetch } from '~/composables/useAuthFetch.js'

definePageMeta({
  middleware: 'auth',
  layout: 'admin'
})

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
  url: ''
})

const tierDisplayName = computed(() => {
  return tier.value === 'pro' ? 'Pro' : 'Free'
})

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
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
        url: site.value.url || ''
      }
    }

    const subResponse = await useAuthFetch(`/api/v2/subscriptions/status/${selectedSiteId.value}`)
    if (subResponse.success) {
      subscription.value = subResponse.subscription
      tier.value = subResponse.tier || 'free'
    }
  } catch (error: any) {
    console.error('Failed to load site data:', error)
    generalError.value = 'Failed to load site data'
  } finally {
    loading.value = false
    subscriptionLoading.value = false
  }
}

const handleSaveGeneral = async () => {
  generalError.value = ''
  generalSuccess.value = false
  savingGeneral.value = true

  try {
    const response = await useAuthFetch(`/api/v2/sites/${selectedSiteId.value}`, {
      method: 'PATCH',
      body: {
        name: siteForm.value.name,
        url: siteForm.value.url
      }
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
