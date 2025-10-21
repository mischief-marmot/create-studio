<template>
  <div class="flex-1">
    <main>
      <h1 class="sr-only">Site Settings</h1>

      <header class="">
        <!-- Secondary navigation -->
        <nav class="flex overflow-x-auto items-center h-16 border-b border-base-300">
          <ul role="list" class="flex min-w-full flex-none px-4 text-sm font-semibold sm:px-6 lg:px-8 join">
            <li v-for="item in secondaryNavigation" :key="item.name"
            @click="setActiveTab(item.id)"
            :class="[
                  'px-3 py-2 cursor-pointer join-item text-base-content bg-primary/20',
                  item.current ? 'bg-primary/90 text-primary-content' : ' hover:bg-primary/30'
                  ]"
                  >
                {{ item.name }}
            </li>
          </ul>
        </nav>
      </header>

      <!-- Settings forms -->
      <div class="divide-y divide-base-300">
        <!-- General Information -->
        <div :class="activeTab === 'general' ? '' : 'hidden'" class="grid max-w-7xl grid-cols-1 gap-x-8 gap-y-10 px-4 py-16 sm:px-6 md:grid-cols-3 lg:px-8">
          <div>
            <h2 class="text-base font-semibold">General </h2>
            <p class="mt-1 text-sm text-base-content/70">
              General information about your site
            </p>
          </div>

          <form @submit.prevent="handleSaveGeneral" class="md:col-span-2">
            <div v-if="loading" class="flex justify-center py-8">
              <span class="loading loading-spinner loading-lg"></span>
            </div>

            <div v-else class="grid grid-cols-1 gap-x-6 gap-y-8 sm:max-w-xl sm:grid-cols-6">
              <div class="col-span-full">
                <label for="site-name" class="label">
                  <span class="label-text font-medium">Site name</span>
                </label>
                <input
                  id="site-name"
                  v-model="siteForm.name"
                  type="text"
                  class="input input-bordered w-full"
                  placeholder="My Awesome Blog"
                />
              </div>

              <div class="col-span-full">
                <label for="site-url" class="label">
                  <span class="label-text font-medium">Site URL</span>
                </label>
                <input
                  id="site-url"
                  v-model="siteForm.url"
                  type="text"
                  class="input input-bordered w-full"
                  placeholder="example.com"
                />
              </div>

              
            </div>

            <div v-if="generalError" class="alert alert-error mt-4">
              <span>{{ generalError }}</span>
            </div>

            <div v-if="generalSuccess" class="alert alert-success mt-4">
              <span>Settings saved successfully!</span>
            </div>

            <div class="mt-8 flex">
              <button type="submit" class="btn btn-primary" :disabled="savingGeneral">
                <span v-if="savingGeneral" class="loading loading-spinner"></span>
                {{ savingGeneral ? 'Saving...' : 'Save changes' }}
              </button>
            </div>
          </form>
        </div>

        <!-- Subscription -->
        <div :class="activeTab === 'subscription' ? '' : 'hidden'" class="grid max-w-7xl grid-cols-1 gap-x-8 gap-y-10 px-4 py-16 sm:px-6 md:grid-cols-3 lg:px-8">
          <div>
            <h2 class="text-base font-semibold">Subscription</h2>
            <p class="mt-1 text-sm text-base-content/70">
              Manage your subscription plan and billing.
            </p>
          </div>

          <div class="md:col-span-2">
            <div v-if="subscriptionLoading" class="flex justify-center py-8">
              <span class="loading loading-spinner loading-lg"></span>
            </div>

            <div v-else class="space-y-6">
              <!-- Current Plan -->
              <div>
                <label class="label">
                  <span class="label-text font-medium">Current Plan</span>
                </label>
                <div class="flex items-center gap-3">
                  <span
                    class="badge badge-lg"
                    :class="{
                      'badge-neutral': tier === 'free',
                      'badge-primary': tier === 'pro'
                    }"
                  >
                    {{ tierDisplayName }}
                  </span>
                  <span v-if="subscription?.status === 'active'" class="text-sm text-success">
                    ✓ Active
                  </span>
                </div>
              </div>

              <!-- Subscription Details -->
              <div v-if="subscription && subscription.status !== 'free'" class="space-y-4">
                <div v-if="subscription.current_period_end">
                  <label class="label">
                    <span class="label-text font-medium">Renewal Date</span>
                  </label>
                  <p class="text-base-content">
                    {{ formatDate(subscription.current_period_end) }}
                  </p>
                </div>

                <div v-if="subscription.cancel_at_period_end" class="alert alert-warning">
                  <span>Your subscription will cancel at the end of the current period.</span>
                </div>
              </div>

              <!-- Upgrade Callout (Free tier only) -->
              <div v-if="tier === 'free'">
                <div class="alert alert-success">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" class="stroke-current shrink-0 w-6 h-6">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                  </svg>
                  <div class="flex-1">
                    <h3 class="font-semibold">Upgrade to Create Unlocked for full control</h3>
                    <div class="text-sm">Use your own ad network in Interactive Mode and boost your revenue.</div>
                  </div>
                  <button @click="showUpgradeModal = true" class="btn btn-sm btn-neutral">
                    Learn More
                  </button>
                </div>
              </div>

              <!-- Action Buttons (Pro tier only) -->
              <div v-if="tier !== 'free' && subscription?.stripe_customer_id" class="flex gap-3">
                <button
                  @click="handleManageBilling"
                  class="btn btn-primary"
                  :disabled="managingBilling"
                >
                  <span v-if="managingBilling" class="loading loading-spinner"></span>
                  {{ managingBilling ? 'Loading...' : 'Manage Billing' }}
                </button>
              </div>

              <div v-if="subscriptionError" class="alert alert-error">
                <span>{{ subscriptionError }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Danger Zone -->
        <div :class="activeTab === 'general' ? 'hidden' : 'hidden'" class="grid max-w-7xl grid-cols-1 gap-x-8 gap-y-10 px-4 py-16 sm:px-6 md:grid-cols-3 lg:px-8">
          <div>
            <h2 class="text-base font-semibold text-error">Delete Site</h2>
            <p class="mt-1 text-sm text-base-content/70">
              No longer need this site? You can delete it here. This action is not reversible.
            </p>
          </div>

          <div class="md:col-span-2">
            <button type="button" class="btn btn-error" @click="showDeleteConfirm = true">
              Delete this site
            </button>
          </div>
        </div>
      </div>
    </main>

    <!-- Delete Confirmation Modal -->
    <dialog :class="{ 'modal modal-open': showDeleteConfirm }" class="modal">
      <div class="modal-box">
        <h3 class="font-bold text-lg">Delete Site</h3>
        <p class="py-4">
          Are you sure you want to delete this site? This action cannot be undone.
        </p>
        <div class="modal-action">
          <button class="btn" @click="showDeleteConfirm = false">Cancel</button>
          <button class="btn btn-error" @click="handleDeleteSite">Delete</button>
        </div>
      </div>
      <form method="dialog" class="modal-backdrop" @click="showDeleteConfirm = false">
        <button>close</button>
      </form>
    </dialog>

    <!-- Upgrade Modal (using reusable component) -->
    <SubscriptionUpgradeModal v-model="showUpgradeModal" />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useSiteContext } from '~/composables/useSiteContext.js'
import { useAuthFetch } from '~/composables/useAuthFetch.js'

definePageMeta({
  middleware: 'auth',
  layout: 'admin'
})

const router = useRouter()
const route = useRoute()
const { selectedSiteId, loadSites } = useSiteContext()

// Initialize to default tab to avoid hydration mismatch
// Will be updated after mount based on URL hash
const activeTab = ref('general')

const secondaryNavigation = computed(() => [
  { name: 'General', id: 'general', current: activeTab.value === 'general' },
  { name: 'Subscription', id: 'subscription', current: activeTab.value === 'subscription' },
])

// Update URL hash when tab changes
const setActiveTab = (tabId: string) => {
  activeTab.value = tabId
  router.push({ hash: `#${tabId}` })
}

// Initialize from hash after mount to avoid hydration mismatch
onMounted(() => {
  const hash = route.hash.replace('#', '')
  if (hash && (hash === 'general' || hash === 'subscription')) {
    activeTab.value = hash
  } else {
    // Set default hash if not present or invalid
    router.replace({ hash: '#general' })
  }
})

// Watch for hash changes (e.g., browser back/forward)
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
    // Load site data
    const siteResponse = await useAuthFetch(`/api/v2/sites/${selectedSiteId.value}`)
    if (siteResponse.success) {
      site.value = siteResponse.site
      siteForm.value = {
        name: site.value.name || '',
        url: site.value.url || ''
      }
    }

    // Load subscription
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
      await loadSites() // Refresh sites list
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
  // Always create a customer-specific portal session via API
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
  // TODO: Implement site deletion
  console.log('Delete site:', selectedSiteId.value)
  showDeleteConfirm.value = false
}

// Watch for site changes
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
