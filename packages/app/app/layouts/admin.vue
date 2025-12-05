<template>
  <div class="bg-base-100 min-h-screen">
    <!-- Desktop Sidebar -->
    <aside class="w-70 lg:flex lg:flex-col bg-base-200 border-base-300 fixed inset-y-0 left-0 z-50 hidden border-r">
      <!-- Brand Header -->
      <div class="border-base-300 flex items-center h-24 px-8 border-b">
        <NuxtLink to="/" class="hover:opacity-70 group flex items-center gap-3 transition-all duration-300 ease-out">
          <LogoFull class="h-9 group-hover:scale-105 w-auto transition-transform duration-300" />
        </NuxtLink>
      </div>

      <!-- Site Selector - Custom Dropdown -->
      <div class="relative mx-6 my-8">
        <button
          @click="siteSelectorOpen = !siteSelectorOpen"
          :class="[
            'w-full bg-base-100 border-base-300 text-base-content hover:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary px-4 py-3 text-sm font-semibold transition-all duration-300 border-1 rounded-lg cursor-pointer flex items-center justify-between',
            siteSelectorOpen ? 'border-primary ring-2 ring-primary/20' : ''
          ]"
        >
          <div class="flex flex-col items-start overflow-hidden">
            <span class="text-base-content font-sans text-sm font-light truncate">
              {{ sitesList.find(({id}) => id === localSelectedSiteId)?.name || 'Select Site' }}
            </span>
            <span class="text-base-content/50 text-xs font-light truncate">
              {{ sitesList.find(({id}) => id === localSelectedSiteId)?.url || '' }}
            </span>
          </div>
          <svg
            :class="['size-4 text-base-content/60 shrink-0 ml-4 transition-transform', siteSelectorOpen ? 'rotate-180' : '']"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 14l-7 7m0 0l-7-7m7 7V3" />
          </svg>
        </button>

        <!-- Dropdown Menu -->
        <transition
          enter-active-class="transition-all duration-200"
          leave-active-class="transition-all duration-200"
          enter-from-class="scale-95 -translate-y-2 opacity-0"
          enter-to-class="scale-100 opacity-100"
          leave-from-class="scale-100 opacity-100"
          leave-to-class="scale-95 -translate-y-2 opacity-0"
        >
          <div
            v-if="siteSelectorOpen"
            class="top-full bg-base-100 border-base-300 border-1 absolute left-0 right-0 z-50 mt-2 rounded-lg shadow-lg"
          >
            <div class="max-h-96 overflow-y-auto">
              <button
                v-for="site in sitesList"
                :key="site.id"
                @click="handleSiteSelect(site.id)"
                :class="[
                  'w-full px-4 py-3 border-b border-base-300 text-left hover:bg-base-200 transition-colors duration-150 flex items-start justify-between last:border-0 cursor-pointer',
                  localSelectedSiteId === site.id ? 'bg-base-200/60 border-base-200' : ''
                ]"
              >
                <div class="flex-1">
                  <div class="text-base-content font-semibold">{{ site.name || 'Unnamed Site' }}</div>
                  <div class="text-base-content/60 text-xs mt-0.5">{{ site.url }}</div>
                </div>
                <div v-if="localSelectedSiteId === site.id" class="flex-shrink-0 ml-2">
                  <svg class="text-primary-content dark:text-primary w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
                  </svg>
                </div>
              </button>
            </div>
          </div>
        </transition>
      </div>

      <!-- Close dropdown when clicking outside -->
      <transition name="fade">
        <div
          v-if="siteSelectorOpen"
          class="fixed inset-0 z-40"
          @click="siteSelectorOpen = false"
        />
      </transition>

      <!-- Primary Navigation -->
      <nav class="flex-1 px-6 py-2 overflow-y-auto">
        <div class="space-y-3">
          <ul class="space-y-1.5">
            <li v-for="item in navigation" :key="item.name">
              <NuxtLink
                :to="item.href"
                class="rounded-xl border-1 relative flex items-center gap-4 px-4 py-2 text-sm border-transparent"
                :class="isActiveRoute(item.href)
                  ? 'bg-base-100 text-primary-content dark:text-primary shadow-xs'
                  : 'text-base-content hover:bg-base-100/80 hover:shadow-sm hover:border-base-200/80'"
              >
                <component :is="item.icon" class=" flex-shrink-0 w-5 h-5 transition-transform duration-300" />
                <span class="flex-1">{{ item.name }}</span>
                <span v-if="isActiveRoute(item.href)" class="right-4 size-2 bg-primary-content dark:bg-primary animate-pulse absolute rounded-full"></span>
              </NuxtLink>
            </li>
          </ul>
        </div>
      </nav>

      <!-- Sidebar Footer -->
      <div class="border-base-300 px-6 pt-6 pb-8 mt-auto space-y-4 border-t">
        <!-- Pro Badge (if applicable) -->
        <div v-if="tier === 'pro'" class="badge badge-primary badge-xl">
          <SparklesIcon class="w-4 h-4" />
          <span>Pro Member</span>
        </div>

        <!-- User Profile -->
        <NuxtLink to="/admin/account" class="rounded-2xl hover:bg-base-200 flex items-center gap-3 px-4 py-3.5 transition-all duration-300 group">
          <div class="bg-gradient-to-br from-primary to-error w-11 h-11 ring-2 ring-base-300 group-hover:ring-primary/50 flex-shrink-0 overflow-hidden transition-all duration-300 rounded-full">
            <img v-if="avatarUrl" :src="avatarUrl" :alt="`${user?.firstname || 'User'} avatar`" class="object-cover w-full h-full" />
            <span v-else class="text-primary-content flex items-center justify-center w-full h-full text-sm font-bold">{{ initials }}</span>
          </div>
          <div class="flex-1 min-w-0">
            <span class="text-base-content block text-sm font-bold truncate">
              {{ user?.firstname || user?.lastname ? `${user.firstname} ${user.lastname}`.trim() : 'Account' }}
            </span>
            <span class="text-base-content/60 block text-xs truncate">{{ user?.email }}</span>
          </div>
          <ChevronRightIcon class="text-base-content/50 flex-shrink-0 w-4 h-4 group-hover:translate-x-0.5 transition-transform duration-300" />
        </NuxtLink>

        <!-- Logout -->
        <button @click="handleLogout" class="rounded-2xl text-base-content/70 hover:bg-error/10 hover:text-error group flex items-center w-full gap-3 px-4 py-3 text-sm font-semibold transition-all duration-300">
          <ArrowLeftStartOnRectangleIcon class="w-5 h-5 group-hover:-translate-x-0.5 transition-transform duration-300" />
          <span>Sign out</span>
        </button>
      </div>
    </aside>

    <!-- Mobile Header -->
    <header class="lg:hidden bg-base-100/95 backdrop-blur-xl border-base-300 fixed top-0 left-0 right-0 z-40 flex items-center justify-between h-20 px-6 border-b shadow-sm">
      <button type="button" class="rounded-xl hover:bg-base-200 p-2 -ml-2 transition-colors duration-300" @click="sidebarOpen = true">
        <span class="sr-only">Open sidebar</span>
        <Bars3Icon class="text-base-content w-6 h-6" />
      </button>

      <NuxtLink to="/" class="left-1/2 absolute -translate-x-1/2">
        <LogoFull class="h-7 w-auto" />
      </NuxtLink>
      <div class="flex items-center">
        <div class="dropdown dropdown-end">
          <div tabindex="0" role="button" class="hover:ring-2 hover:ring-primary/30 p-1 transition-all duration-300 rounded-full">
            <div class="bg-gradient-to-br from-primary to-error ring-2 ring-base-300 w-10 h-10 overflow-hidden rounded-full">
              <img v-if="avatarUrl" :src="avatarUrl" :alt="`${user?.firstname || 'User'} avatar`" class="object-cover w-full h-full" />
              <span v-else class="text-primary-content flex items-center justify-center w-full h-full text-xs font-bold">{{ initials }}</span>
            </div>
          </div>
          <ul tabindex="0" class="mt-4 p-2 rounded-2xl shadow-2xl bg-base-100 border-2 border-base-300 min-w-44 menu dropdown-content z-[1]">
            <li>
              <NuxtLink to="/admin/account" class="rounded-xl text-base-content hover:bg-base-200 block w-full px-4 py-3 text-sm font-semibold text-left transition-colors duration-200">Account</NuxtLink>
            </li>
            <li>
              <button @click="handleLogout" class="rounded-xl text-error hover:bg-error/10 block w-full px-4 py-3 text-sm font-semibold text-left transition-colors duration-200">Sign out</button>
            </li>
          </ul>
        </div>
      </div>
    </header>

    <!-- Main Content -->
    <main class="lg:ml-70 lg:pt-0 lg:border-l border-base-300 min-h-screen pt-20">
      <!-- Upgrade Banner -->
      <Transition name="banner">
        <Banner
          v-if="tier === 'free' && !router.currentRoute.value.path.includes('settings') && !bannerDismissed"
          smallText="Upgrade to Pro"
          fullText="Unlock full control over your ad network in Interactive Mode"
          buttonText="Learn more"
          :buttonAction="openModal"
          :dismissAction="dismissBanner"
          kind="primary"
        />
      </Transition>

      <!-- Page Content -->
      <div class="min-h-screen">
        <slot />
      </div>
    </main>

    <!-- Mobile Sidebar Overlay -->
    <Teleport to="body">
      <Transition name="overlay">
        <div v-if="sidebarOpen" class="lg:hidden bg-base-content/50 backdrop-blur-sm fixed inset-0 z-50" @click="sidebarOpen = false"></div>
      </Transition>

      <Transition name="drawer">
        <aside v-if="sidebarOpen" class="lg:hidden fixed inset-y-0 left-0 z-50 w-70 max-w-[85vw] flex flex-col bg-base-200 shadow-2xl">
          <!-- Close Button -->
          <button class="top-6 right-6 rounded-xl hover:bg-base-200 absolute p-2 transition-colors duration-300" @click="sidebarOpen = false">
            <XMarkIcon class="text-base-content w-6 h-6" />
          </button>

          <!-- Mobile Brand -->
          <div class="border-base-content/15 flex items-center h-24 mx-8 border-b">
            <NuxtLink to="/" class="hover:opacity-70 flex items-center gap-3 transition-opacity duration-300" @click="sidebarOpen = false">
              <LogoFull class="h-9 w-auto" />
            </NuxtLink>
          </div>

          <!-- Mobile Site Selector - Custom Dropdown -->
          <div class="border-base-300 px-6 py-6 mt-8 border-b">
            <div class="relative">
              <button
                @click="siteSelectorOpen = !siteSelectorOpen"
                :class="[
                  'w-full bg-base-100 border-base-300 text-base-content hover:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary px-4 py-3 text-sm font-semibold transition-all duration-300 border-1 rounded-lg cursor-pointer flex items-center justify-between',
                  siteSelectorOpen ? 'border-primary ring-2 ring-primary/20' : ''
                ]"
              >
                <div class="flex flex-col items-start">
                  <span class="text-base-content font-sans text-sm font-light truncate">
                    {{ sitesList.find(({id}) => id === localSelectedSiteId)?.name || 'Select Site' }}
                  </span>
                  <span class="text-base-content/50 text-xs font-light truncate">
                    {{ sitesList.find(({id}) => id === localSelectedSiteId)?.url || '' }}
                  </span>
                </div>
                <svg
                  :class="['size-4 text-base-content/60 transition-transform', siteSelectorOpen ? 'rotate-180' : '']"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                </svg>
              </button>

              <!-- Dropdown Menu -->
              <transition
                enter-active-class="transition-all duration-200"
                leave-active-class="transition-all duration-200"
                enter-from-class="scale-95 -translate-y-2 opacity-0"
                enter-to-class="scale-100 opacity-100"
                leave-from-class="scale-100 opacity-100"
                leave-to-class="scale-95 -translate-y-2 opacity-0"
              >
                <div
                  v-if="siteSelectorOpen"
                  class="top-full bg-base-100 border-base-300 border-1 absolute left-0 right-0 z-50 mt-2 rounded-lg shadow-lg"
                >
                  <div class="max-h-96 overflow-y-auto">
                    <button
                      v-for="site in sitesList"
                      :key="site.id"
                      @click="handleSiteSelect(site.id)"
                      :class="[
                        'w-full px-4 py-3 border-b border-base-300 text-left hover:bg-base-200 transition-colors duration-150 flex items-start justify-between last:border-0 cursor-pointer',
                        localSelectedSiteId === site.id ? 'bg-base-200/60 border-base-200' : ''
                      ]"
                    >
                      <div class="flex-1">
                        <div class="text-base-content font-semibold">{{ site.name || 'Unnamed Site' }}</div>
                        <div class="text-base-content/60 text-xs mt-0.5">{{ site.url }}</div>
                      </div>
                      <div v-if="localSelectedSiteId === site.id" class="flex-shrink-0 ml-2">
                        <svg class="text-primary-content dark:text-primary w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                          <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
                        </svg>
                      </div>
                    </button>
                  </div>
                </div>
              </transition>
            </div>
          </div>

          <!-- Mobile Navigation -->
          <nav class="flex-1 px-6 py-2 overflow-y-auto">
            <div class="space-y-3">
              <ul class="space-y-1.5">
                <li v-for="item in navigation" :key="item.name">
                  <NuxtLink
                    :to="item.href"
                    class="rounded-xl border-1 relative flex items-center gap-4 px-4 py-2 text-sm transition-all duration-300 border-transparent"
                    :class="isActiveRoute(item.href)
                      ? 'bg-base-100 text-primary-content dark:text-primary shadow-xs'
                      : 'text-base-content hover:bg-base-100/80 hover:shadow-sm hover:border-base-200/80'"
                    @click="sidebarOpen = false"
                  >
                    <component :is="item.icon" class="flex-shrink-0 w-5 h-5 transition-transform duration-300" />
                    <span class="flex-1">{{ item.name }}</span>
                    <span v-if="isActiveRoute(item.href)" class="right-4 size-2 bg-primary-content dark:bg-primary animate-pulse absolute rounded-full"></span>
                  </NuxtLink>
                </li>
              </ul>
            </div>
          </nav>

          <!-- Mobile Sidebar Footer -->
          <div class="border-base-300 px-6 pt-6 pb-8 mt-auto space-y-4 border-t">
            <!-- Pro Badge (if applicable) -->
            <div v-if="tier === 'pro'" class="badge badge-primary badge-xl">
              <SparklesIcon class="w-4 h-4" />
              <span>Pro Member</span>
            </div>

            <!-- User Profile -->
            <NuxtLink to="/admin/account" class="rounded-2xl hover:bg-base-200 flex items-center gap-3 px-4 py-3.5 transition-all duration-300 group" @click="sidebarOpen = false">
              <div class="bg-gradient-to-br from-primary to-error w-11 h-11 ring-2 ring-base-300 group-hover:ring-primary/50 flex-shrink-0 overflow-hidden transition-all duration-300 rounded-full">
                <img v-if="avatarUrl" :src="avatarUrl" :alt="`${user?.firstname || 'User'} avatar`" class="object-cover w-full h-full" />
                <span v-else class="text-primary-content flex items-center justify-center w-full h-full text-sm font-bold">{{ initials }}</span>
              </div>
              <div class="flex-1 min-w-0">
                <span class="text-base-content block text-sm font-bold truncate">
                  {{ user?.firstname || user?.lastname ? `${user.firstname} ${user.lastname}`.trim() : 'Account' }}
                </span>
                <span class="text-base-content/60 block text-xs truncate">{{ user?.email }}</span>
              </div>
              <ChevronRightIcon class="text-base-content/50 flex-shrink-0 w-4 h-4 group-hover:translate-x-0.5 transition-transform duration-300" />
            </NuxtLink>

            <!-- Logout -->
            <button @click="handleLogout; sidebarOpen = false" class="rounded-2xl text-base-content/70 hover:bg-error/10 hover:text-error group flex items-center w-full gap-3 px-4 py-3 text-sm font-semibold transition-all duration-300">
              <ArrowLeftStartOnRectangleIcon class="w-5 h-5 group-hover:-translate-x-0.5 transition-transform duration-300" />
              <span>Sign out</span>
            </button>
          </div>
        </aside>
      </Transition>
    </Teleport>

    <!-- Subscription Upgrade Modal -->
    <SubscriptionUpgradeModal v-model="showUpgradeModal" />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch, reactive } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import {
  Cog6ToothIcon,
  HomeIcon,
  XMarkIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  SparklesIcon,
  ArrowLeftStartOnRectangleIcon,
} from '@heroicons/vue/24/outline'
import { Bars3Icon } from '@heroicons/vue/20/solid'
import { useAuth } from '~/composables/useAuth.js'
import { useSiteContext } from '~/composables/useSiteContext.js'
import { useAvatar } from '~/composables/useAvatar.js'
import { useUpgradeModal } from '~/composables/useUpgradeModal.js'
import { useAddSiteModal } from '~/composables/useAddSiteModal.js'

const router = useRouter()
const route = useRoute()
const { logout, user } = useAuth()
const { selectedSiteId, sites: sitesList, loadSites, selectSite } = useSiteContext()
const { showUpgradeModal, openModal } = useUpgradeModal()
const { openAddSiteModal } = useAddSiteModal()

const sidebarOpen = ref(false)
const siteSelectorOpen = ref(false)
const localSelectedSiteId = ref<number | null>(null)
const tier = ref('free')
const bannerDismissed = ref(true)

// Navigation items - Settings only shown when user has sites
const navigation = computed(() => {
  const items = [
    { name: 'Dashboard', href: '/admin', icon: HomeIcon },
  ]

  // Only show Settings when there are verified (non-pending) sites
  const hasVerifiedSites = sitesList.value.some(site => !site.pending)
  if (hasVerifiedSites) {
    items.push({ name: 'Settings', href: '/admin/settings', icon: Cog6ToothIcon })
  }

  return items
})

const isActiveRoute = (href: string) => {
  if (href === '/admin') {
    return route.path === '/admin' || route.path === '/admin/'
  }
  return route.path.startsWith(href)
}

const dismissBanner = () => {
  bannerDismissed.value = true
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

const handleSiteSelect = (siteId: number) => {
  localSelectedSiteId.value = siteId
  selectSite(siteId)
  siteSelectorOpen.value = false
}

// Sync local state with context
watch(selectedSiteId, (newId) => {
  localSelectedSiteId.value = newId
}, { immediate: true })

onMounted(async () => {
  // Check for site_url query parameter to auto-select a site
  const siteUrlParam = route.query.site_url as string | undefined
  const result = await loadSites(siteUrlParam)

  // If a site_url was provided but no matching site was found, open the Add Site modal
  if (siteUrlParam && !result.matched) {
    openAddSiteModal(siteUrlParam)
  }

  if (typeof window !== 'undefined') {
    bannerDismissed.value = false
  }

  if (selectedSiteId.value) {
    loadSubscriptionStatus()
  }
})

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

<style scoped>
/* Transitions only */
.overlay-enter-active,
.overlay-leave-active {
  transition: opacity 0.25s ease;
}

.overlay-enter-from,
.overlay-leave-to {
  opacity: 0;
}

.drawer-enter-active {
  transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}

.drawer-leave-active {
  transition: transform 0.25s ease-in;
}

.drawer-enter-from,
.drawer-leave-to {
  transform: translateX(-100%);
}

.banner-enter-active,
.banner-leave-active {
  transition: all 0.3s ease;
}

.banner-enter-from,
.banner-leave-to {
  opacity: 0;
  transform: translateY(-100%);
}
</style>
