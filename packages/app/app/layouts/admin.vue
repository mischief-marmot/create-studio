<template>

  <div class="min-h-screen bg-base-100">
    <!-- Sidebar -->
    <div class="hidden lg:fixed lg:inset-y-0 lg:z-50 lg:flex lg:w-72 lg:flex-col">
      <aside class="flex grow flex-col gap-y-5 overflow-y-auto bg-base-200 border-r border-base-300">
        <!-- Logo -->
        <div class="flex h-16 shrink-0 items-center px-6 border-b border-base-300">
          <NuxtLink to="/" class="flex items-center gap-2">
            <h1 class="text-2xl font-bold text-primary">Create Studio</h1>
          </NuxtLink>
        </div>

        <!-- Sidebar Content -->
        <nav class="flex flex-1 flex-col px-6">
          <ul role="list" class="flex flex-1 flex-col gap-y-7">
            <li>
              <!-- Sites Dropdown -->
              <div class="form-control">
                <label class="label">
                  <span class="label-text font-semibold">Select Site</span>
                </label>
                <select v-model="localSelectedSiteId" class="select select-bordered w-full" @change="handleSiteChange">
                  <option disabled :value="null">Choose a site</option>
                  <option v-for="site in sitesList" :key="site.id" :value="site.id">
                    {{ site.name || site.url || `Site #${site.id}` }}
                  </option>
                </select>
              </div>
            </li>

            <li>
              <!-- Navigation Menu -->
              <div class="text-xs font-semibold text-base-content/70 mb-2">Navigation</div>
              <ul role="list" class="space-y-1">
                <li v-for="item in navigation" :key="item.name">
                  <NuxtLink :to="item.href"
                    class="group flex gap-x-3 rounded-md p-2 text-sm font-semibold hover:bg-base-200"
                    active-class="bg-base-200 text-primary">
                    <component :is="item.icon" class="h-5 w-5 shrink-0" />
                    {{ item.name }}
                  </NuxtLink>
                </li>
              </ul>
            </li>

            <!-- User Profile Section (bottom) -->
            <li class="mt-auto -mx-6">
              <NuxtLink to="/admin/account"
                class="flex items-center gap-x-4 px-6 py-3 text-sm font-semibold hover:bg-base-200">
                <div class="avatar">
                  <div class="w-8 rounded-full bg-base-300">
                    <img v-if="avatarUrl" :src="avatarUrl" :alt="`${user?.firstname || 'User'} avatar`" />
                    <div v-else class="flex items-center justify-center h-full text-xs font-semibold">
                      {{ initials }}
                    </div>
                  </div>
                </div>
                <span class="sr-only">Your profile</span>
                <span class="truncate">
                  {{ user?.firstname || user?.lastname ? `${user.firstname} ${user.lastname}`.trim() : user?.email }}
                </span>
              </NuxtLink>
            </li>
          </ul>
        </nav>
      </aside>
    </div>

    <!-- Main content area -->
    <div class="lg:pl-72">
      <!-- Sticky search header -->
      <div
        class=" lg:hidden sticky top-0 z-40 flex h-16 shrink-0 items-center gap-x-6 border-b border-base-300 bg-base-100 px-4 shadow-sm sm:px-6 lg:px-8">
        <button type="button" class="btn btn-square btn-ghost lg:hidden" @click="sidebarOpen = true">
          <span class="sr-only">Open sidebar</span>
          <Bars3Icon class="h-6 w-6" />
        </button>

        <div class="flex flex-1 gap-x-4 self-stretch lg:gap-x-6  lg:hidden">
          <!-- User avatar dropdown (mobile) -->
          <div class="flex items-center">
            <div class="dropdown dropdown-end">
              <div tabindex="0" role="button" class="btn btn-ghost btn-circle avatar">
                <div class="w-10 rounded-full bg-base-300">
                  <img v-if="avatarUrl" :src="avatarUrl" :alt="`${user?.firstname || 'User'} avatar`" />
                  <div v-else class="flex items-center justify-center h-full text-sm font-semibold">
                    {{ initials }}
                  </div>
                </div>
              </div>
              <ul tabindex="0" class="menu menu-sm dropdown-content mt-3 z-[1] p-2 shadow bg-base-100 rounded-box w-52">
                <li>
                  <NuxtLink to="/admin/account">Account Settings</NuxtLink>
                </li>
                <li><a @click="handleLogout">Logout</a></li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      <!-- Page content -->
      <main>
        <Banner v-if="tier === 'free' && !router.currentRoute.value.path.includes('settings') && !bannerDismissed" smallText="Upgrade to Create Pro!" fullText="Upgrade to Create Pro for full control over your ad network in
                Interactive Mode." :buttonAction="openModal" buttonText="Learn more"
          :dismissAction="dismissBanner" />

        <!-- Sticky search header -->
        <div
          class="hidden sticky top-0 z-40 flex h-16 shrink-0 items-center gap-x-6 border-b border-base-300 bg-base-100 px-4 shadow-sm sm:px-6 lg:px-8">
          <div class="flex flex-1 gap-x-4 self-stretch lg:gap-x-6">
            <form class="grid flex-1 grid-cols-1" @submit.prevent>
              <input name="search" aria-label="Search" class="input input-ghost col-start-1 row-start-1 w-full pl-10"
                placeholder="Search settings..." />
              <MagnifyingGlassIcon
                class="pointer-events-none col-start-1 row-start-1 h-5 w-5 self-center ml-3 opacity-50"
                aria-hidden="true" />
            </form>
          </div>
        </div>
        <slot />
      </main>

      <!-- Subscription Upgrade Modal -->
      <SubscriptionUpgradeModal v-model="showUpgradeModal" />
    </div>

    <!-- Mobile sidebar overlay -->
    <div v-if="sidebarOpen" class="relative z-50 lg:hidden">
      <div class="fixed inset-0 bg-base-300/80" @click="sidebarOpen = false"></div>

      <div class="fixed inset-0 flex">
        <div class="relative mr-16 flex w-full max-w-xs flex-1">
          <div class="absolute left-full top-0 flex w-16 justify-center pt-5">
            <button type="button" class="btn btn-sm btn-circle btn-ghost" @click="sidebarOpen = false">
              <span class="sr-only">Close sidebar</span>
              <XMarkIcon class="h-6 w-6" />
            </button>
          </div>

          <!-- Mobile sidebar content (same as desktop) -->
          <aside class="flex grow flex-col gap-y-5 overflow-y-auto bg-base-100 border-r border-base-300">
            <div class="flex h-16 shrink-0 items-center px-6 border-b border-base-300">
              <NuxtLink to="/" class="flex items-center gap-2">
                <h1 class="text-2xl font-bold text-primary">Create Studio</h1>
              </NuxtLink>
            </div>

            <nav class="flex flex-1 flex-col px-6">
              <ul role="list" class="flex flex-1 flex-col gap-y-7">
                <li>
                  <div class="form-control">
                    <label class="label">
                      <span class="label-text font-semibold">Select Site</span>
                    </label>
                    <select v-model="localSelectedSiteId" class="select select-bordered w-full"
                      @change="handleSiteChange">
                      <option disabled :value="null">Choose a site</option>
                      <option v-for="site in sitesList" :key="site.id" :value="site.id">
                        {{ site.name || site.url || `Site #${site.id}` }}
                      </option>
                    </select>
                  </div>
                </li>

                <li>
                  <div class="text-xs font-semibold text-base-content/70 mb-2">Navigation</div>
                  <ul role="list" class="space-y-1">
                    <li v-for="item in navigation" :key="item.name">
                      <NuxtLink :to="item.href"
                        class="group flex gap-x-3 rounded-md p-2 text-sm font-semibold hover:bg-base-200"
                        active-class="bg-base-200 text-primary" @click="sidebarOpen = false">
                        <component :is="item.icon" class="h-5 w-5 shrink-0" />
                        {{ item.name }}
                      </NuxtLink>
                    </li>
                  </ul>
                </li>

                <li class="mt-auto -mx-6">
                  <NuxtLink to="/admin/account"
                    class="flex items-center gap-x-4 px-6 py-3 text-sm font-semibold hover:bg-base-200"
                    @click="sidebarOpen = false">
                    <div class="avatar">
                      <div class="w-8 rounded-full bg-base-300">
                        <img v-if="avatarUrl" :src="avatarUrl" :alt="`${user?.firstname || 'User'} avatar`" />
                        <div v-else class="flex items-center justify-center h-full text-xs font-semibold">
                          {{ initials }}
                        </div>
                      </div>
                    </div>
                    <span class="truncate">
                      {{ user?.firstname || user?.lastname ? `${user.firstname} ${user.lastname}`.trim() : user?.email
                      }}
                    </span>
                  </NuxtLink>
                </li>
              </ul>
            </nav>
          </aside>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch, reactive } from 'vue'
import { useRouter } from 'vue-router'
import {
  Cog6ToothIcon,
  HomeIcon,
  XMarkIcon,
} from '@heroicons/vue/24/outline'
import { Bars3Icon, MagnifyingGlassIcon } from '@heroicons/vue/20/solid'
import { useAuth } from '~/composables/useAuth.js'
import { useSiteContext } from '~/composables/useSiteContext.js'
import { useAvatar } from '~/composables/useAvatar.js'
import { useUpgradeModal } from '~/composables/useUpgradeModal.js'

const router = useRouter()
const { logout, user } = useAuth()
const { selectedSiteId, sites: sitesList, loadSites, selectSite } = useSiteContext()
const { showUpgradeModal, openModal } = useUpgradeModal()

const sidebarOpen = ref(false)
const localSelectedSiteId = ref<number | null>(null)
const tier = ref('free')
const bannerDismissed = ref(true)

const navigation = [
  { name: 'Dashboard', href: '/admin', icon: HomeIcon },
  { name: 'Settings', href: '/admin/settings', icon: Cog6ToothIcon },
]

const dismissBanner = () => {
  bannerDismissed.value = true
  // Optionally save to localStorage
  if (typeof window !== 'undefined') {
    localStorage.setItem('upgrade-banner-dismissed', 'true')
  }
}

// Avatar composable with reactive options
const avatarOptions = reactive({
  email: computed(() => user.value?.email || ''),
  firstname: computed(() => user.value?.firstname || ''),
  lastname: computed(() => user.value?.lastname || ''),
  avatar: computed(() => user.value?.avatar || '')
})

const { avatarUrl, initials } = useAvatar(avatarOptions)

const handleLogout = () => {
  logout()
}

const handleSiteChange = () => {
  if (localSelectedSiteId.value) {
    selectSite(localSelectedSiteId.value)
  }
}

// Sync local state with context
watch(selectedSiteId, (newId) => {
  localSelectedSiteId.value = newId
}, { immediate: true })

onMounted(async () => {
  await loadSites()

  // Check if banner was dismissed
  if (typeof window !== 'undefined') {
    bannerDismissed.value = false
    // bannerDismissed.value = localStorage.getItem('upgrade-banner-dismissed') === 'true'
  }

  // Load subscription status for selected site
  if (selectedSiteId.value) {
    loadSubscriptionStatus()
  }
})

// Watch for site changes to reload subscription status
watch(selectedSiteId, (newId) => {
  if (newId) {
    loadSubscriptionStatus()
  }
})

const loadSubscriptionStatus = async () => {
  if (!selectedSiteId.value) return

  try {
    const response = await $fetch(`/api/v2/subscriptions/status/${selectedSiteId.value}`)
    if (response.success) {
      tier.value = response.tier || 'free'
    }
  } catch (error) {
    console.error('Failed to load subscription status:', error)
  }
}
</script>
