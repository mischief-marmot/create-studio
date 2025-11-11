<template>

  <div class="bg-base-100 min-h-screen">
    <!-- Sidebar -->
    <div class="lg:fixed lg:inset-y-0 lg:z-50 lg:flex lg:w-72 lg:flex-col hidden">
      <aside class="grow gap-y-5 bg-base-200 border-base-300 flex flex-col overflow-y-auto border-r">
        <!-- Logo -->
        <div class="shrink-0 border-base-300 flex items-center h-16 px-6 border-b">
          <NuxtLink to="/" class="flex items-center gap-2">
            <LogoFull />
          </NuxtLink>
        </div>

        <!-- Sidebar Content -->
        <nav class="flex flex-col flex-1 px-6">
          <ul role="list" class="gap-y-7 flex flex-col flex-1">
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
              <div class="text-base-content/70 mb-2 text-xs font-semibold">Navigation</div>
              <ul role="list" class="space-y-1">
                <li v-for="item in navigation" :key="item.name">
                  <NuxtLink :to="item.href"
                    class="group gap-x-3 hover:bg-base-200 flex p-2 text-sm font-semibold rounded-md"
                    active-class="bg-base-200 text-primary">
                    <component :is="item.icon" class="shrink-0 w-5 h-5" />
                    {{ item.name }}
                  </NuxtLink>
                </li>
              </ul>
            </li>

            <!-- User Profile Section (bottom) -->
            <li class="mt-auto -mx-6">
              <NuxtLink to="/admin/account"
                class="gap-x-4 hover:bg-base-200 flex items-center px-6 py-3 text-sm font-semibold">
                <div class="avatar">
                  <div class="bg-base-300 w-8 rounded-full">
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
        class=" lg:hidden shrink-0 gap-x-6 border-base-300 bg-base-100 sm:px-6 lg:px-8 sticky top-0 z-40 flex items-center h-16 px-4 border-b shadow-sm">
        <button type="button" class="btn btn-square btn-ghost lg:hidden" @click="sidebarOpen = true">
          <span class="sr-only">Open sidebar</span>
          <Bars3Icon class="w-6 h-6" />
        </button>

        <div class="gap-x-4 lg:gap-x-6 lg:hidden flex self-stretch flex-1">
          <!-- User avatar dropdown (mobile) -->
          <div class="flex items-center">
            <div class="dropdown dropdown-end">
              <div tabindex="0" role="button" class="btn btn-ghost btn-circle avatar">
                <div class="bg-base-300 w-10 rounded-full">
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
          class="shrink-0 gap-x-6 border-base-300 bg-base-100 sm:px-6 lg:px-8 sticky top-0 z-40 flex items-center hidden h-16 px-4 border-b shadow-sm">
          <div class="gap-x-4 lg:gap-x-6 flex self-stretch flex-1">
            <form class="grid flex-1 grid-cols-1" @submit.prevent>
              <input name="search" aria-label="Search" class="input input-ghost w-full col-start-1 row-start-1 pl-10"
                placeholder="Search settings..." />
              <MagnifyingGlassIcon
                class="self-center w-5 h-5 col-start-1 row-start-1 ml-3 opacity-50 pointer-events-none"
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
    <div v-if="sidebarOpen" class="lg:hidden relative z-50">
      <div class="bg-base-300/80 fixed inset-0" @click="sidebarOpen = false"></div>

      <div class="fixed inset-0 flex">
        <div class="relative flex flex-1 w-full max-w-xs mr-16">
          <div class="left-full absolute top-0 flex justify-center w-16 pt-5">
            <button type="button" class="btn btn-sm btn-circle btn-ghost" @click="sidebarOpen = false">
              <span class="sr-only">Close sidebar</span>
              <XMarkIcon class="w-6 h-6" />
            </button>
          </div>

          <!-- Mobile sidebar content (same as desktop) -->
          <aside class="grow gap-y-5 bg-base-100 border-base-300 flex flex-col overflow-y-auto border-r">
            <div class="shrink-0 border-base-300 flex items-center h-16 px-6 border-b">
              <NuxtLink to="/" class="flex items-center gap-2">
                <h1 class="text-primary text-2xl font-bold">Create Studio</h1>
              </NuxtLink>
            </div>

            <nav class="flex flex-col flex-1 px-6">
              <ul role="list" class="gap-y-7 flex flex-col flex-1">
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
                  <div class="text-base-content/70 mb-2 text-xs font-semibold">Navigation</div>
                  <ul role="list" class="space-y-1">
                    <li v-for="item in navigation" :key="item.name">
                      <NuxtLink :to="item.href"
                        class="group gap-x-3 hover:bg-base-200 flex p-2 text-sm font-semibold rounded-md"
                        active-class="bg-base-200 text-primary" @click="sidebarOpen = false">
                        <component :is="item.icon" class="shrink-0 w-5 h-5" />
                        {{ item.name }}
                      </NuxtLink>
                    </li>
                  </ul>
                </li>

                <li class="mt-auto -mx-6">
                  <NuxtLink to="/admin/account"
                    class="gap-x-4 hover:bg-base-200 flex items-center px-6 py-3 text-sm font-semibold"
                    @click="sidebarOpen = false">
                    <div class="avatar">
                      <div class="bg-base-300 w-8 rounded-full">
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
