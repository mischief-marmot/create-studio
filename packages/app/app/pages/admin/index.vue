<template>
  <div class="p-6">
    <div class="max-w-7xl mx-auto space-y-6">
      <!-- Header -->
      <div>
        <h1 class="text-3xl font-bold">Dashboard</h1>
        <p class="text-base-content/70 mt-1">Overview of your Create Studio sites</p>
      </div>

      <!-- Stats Cards -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div class="card bg-base-200 shadow-xl">
          <div class="card-body">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-sm text-base-content/70">Total Sites</p>
                <p class="text-3xl font-bold">{{ sites.length }}</p>
              </div>
              <ServerIcon class="h-12 w-12 text-primary" />
            </div>
          </div>
        </div>

        <div class="card bg-base-200 shadow-xl">
          <div class="card-body">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-sm text-base-content/70">Selected Site</p>
                <p class="text-xl font-bold truncate">
                  {{ selectedSite?.name || selectedSite?.url || 'None' }}
                </p>
              </div>
              <GlobeAltIcon class="h-12 w-12 text-success" />
            </div>
          </div>
        </div>

        
      </div>

      <!-- Sites List -->
      <div class="card bg-base-200">
        <div class="card-body">
          <div class="flex items-center justify-between mb-4">
            <h2 class="card-title">Your Sites</h2>
            <!-- <button class="btn btn-primary btn-sm">
              <PlusIcon class="h-5 w-5 mr-1" />
              Add Site
            </button> -->
          </div>

          <div v-if="loading" class="flex justify-center py-8">
            <span class="loading loading-spinner loading-lg"></span>
          </div>

          <div v-else-if="sites.length === 0" class="text-center py-8">
            <ServerIcon class="h-16 w-16 mx-auto text-base-content/30 mb-4" />
            <p class="text-lg font-semibold mb-2">No sites yet</p>
            <!-- <p class="text-base-content/70 mb-4">Get started by adding your first site</p>
            <button class="btn btn-primary">
              <PlusIcon class="h-5 w-5 mr-1" />
              Add Your First Site
            </button> -->
          </div>

          <ul v-else role="list" class="divide-y divide-base-300 bg-base-200 px-3 overflow-hidden rounded-xl">
            <li v-for="site in sites" :key="site.id" class="flex items-center justify-between gap-x-6 py-5 ">
              <div class="min-w-0">
                <div class="flex items-start gap-x-3">
                  <p class="text-sm font-semibold grow-0">{{ site.name || site.url }}</p>
                  <span v-if="getSiteTier(site.id) === 'pro'" class="badge-md badge-success badge">
                    Pro
                  </span>
                  <span v-else class="badge badge-md badge-warning">
                    Free
                  </span>
                </div>
                <div class="mt-1 flex items-center gap-x-2 text-xs/5 text-base-content">
                  <p class="whitespace-nowrap">
                    <a :href="`https://${site.url}`" target="_blank" class="link link-primary">
                      {{ site.url }}
                    </a>
                  </p>
                </div>
              </div>
              <div class="flex flex-none items-center gap-x-4">
                <button
                  v-if="getSiteTier(site.id) === 'free'"
                  @click="selectSite(site.id); openModal()"
                  class="btn btn-primary btn-sm"
                >
                  Upgrade
                </button>
                <button @click="selectAndNavigate(site.id)"
                  class=" btn btn-neutral">
                  <Cog6ToothIcon class="size-5" aria-hidden="true" /> Manage<span class="sr-only">, {{ site.name || site.url }}</span>
                </button>
                <Menu as="div" class="hidden relative flex-none">
                  <MenuButton
                    class="relative block text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white">
                    <span class="absolute -inset-2.5" />
                    <span class="sr-only">Open options</span>
                    <EllipsisVerticalIcon class="size-5" aria-hidden="true" />
                  </MenuButton>
                  <transition enter-active-class="transition ease-out duration-100"
                    enter-from-class="transform opacity-0 scale-95" enter-to-class="transform scale-100"
                    leave-active-class="transition ease-in duration-75" leave-from-class="transform scale-100"
                    leave-to-class="transform opacity-0 scale-95">
                    <MenuItems
                      class="absolute right-0 z-10 mt-2 w-32 origin-top-right rounded-md bg-white py-2 shadow-lg outline-1 outline-gray-900/5 dark:bg-gray-800 dark:shadow-none dark:-outline-offset-1 dark:outline-white/10">
                      <MenuItem v-slot="{ active }">
                      <a href="#"
                        :class="[active ? 'bg-gray-50 outline-hidden dark:bg-white/5' : '', 'block px-3 py-1 text-sm/6 text-gray-900 dark:text-white']">Edit<span
                          class="sr-only"> {{ site.name }}</span></a>
                      </MenuItem>
                      <MenuItem v-slot="{ active }">
                      <a href="#"
                        :class="[active ? 'bg-gray-50 outline-hidden dark:bg-white/5' : '', 'block px-3 py-1 text-sm/6 text-gray-900 dark:text-white']">Move<span
                          class="sr-only">, {{ site.name }}</span></a>
                      </MenuItem>
                      <MenuItem v-slot="{ active }">
                      <a href="#"
                        :class="[active ? 'bg-gray-50 outline-hidden dark:bg-white/5' : '', 'block px-3 py-1 text-sm/6 text-gray-900 dark:text-white']">Delete<span
                          class="sr-only">, {{ site.name }}</span></a>
                      </MenuItem>
                    </MenuItems>
                  </transition>
                </Menu>
              </div>
            </li>
          </ul>
        </div>
      </div>

      <!-- Quick Actions -->
      <div v-show="false" class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div class="card bg-base-100 shadow-xl">
          <div class="card-body">
            <h3 class="card-title text-lg">Quick Actions</h3>
            <div class="space-y-2">
              <NuxtLink to="/admin/settings" class="btn btn-ghost btn-sm justify-start w-full">
                <Cog6ToothIcon class="h-5 w-5 mr-2" />
                Site Settings
              </NuxtLink>
              <NuxtLink to="/admin/account" class="btn btn-ghost btn-sm justify-start w-full">
                <UserCircleIcon class="h-5 w-5 mr-2" />
                Account Settings
              </NuxtLink>
            </div>
          </div>
        </div>

        <div class="card bg-base-100 shadow-xl">
          <div class="card-body">
            <h3 class="card-title text-lg">Resources</h3>
            <div class="space-y-2">
              <a href="#" class="btn btn-ghost btn-sm justify-start w-full">
                <DocumentTextIcon class="h-5 w-5 mr-2" />
                Documentation
              </a>
              <a href="#" class="btn btn-ghost btn-sm justify-start w-full">
                <QuestionMarkCircleIcon class="h-5 w-5 mr-2" />
                Support
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import {
  ServerIcon,
  GlobeAltIcon,
  SparklesIcon,
  PlusIcon,
  Cog6ToothIcon,
  UserCircleIcon,
  DocumentTextIcon,
  QuestionMarkCircleIcon,
} from '@heroicons/vue/24/outline'
import { Menu, MenuButton, MenuItem, MenuItems } from '@headlessui/vue'

import { EllipsisVerticalIcon } from '@heroicons/vue/20/solid'
import { useSiteContext } from '~/composables/useSiteContext.js'
import { useAuthFetch } from '~/composables/useAuthFetch.js'
import { useUpgradeModal } from '~/composables/useUpgradeModal.js'

definePageMeta({
  middleware: 'auth',
  layout: 'admin'
})

const router = useRouter()
const { selectedSiteId, selectedSite, sites, loadSites, selectSite } = useSiteContext()
const { openModal } = useUpgradeModal()

const loading = ref(true)
const subscriptionTier = ref('Free')
const siteTiers = ref<Record<number, string>>({})

const formatDate = (dateString: string) => {
  if (!dateString) return 'N/A'
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  })
}

const selectAndNavigate = async (siteId: number) => {
  selectSite(siteId)
  await navigateTo('/admin/settings')
}

const loadDashboardData = async () => {
  try {
    await loadSites()

    // Load subscription info for all sites
    const tierPromises = sites.value.map(async (site) => {
      try {
        const response = await useAuthFetch(`/api/v2/subscriptions/status/${site.id}`)
        if (response.success) {
          siteTiers.value[site.id] = response.tier || 'free'
        }
      } catch (error) {
        console.error(`Failed to load subscription for site ${site.id}:`, error)
        siteTiers.value[site.id] = 'free'
      }
    })

    await Promise.all(tierPromises)

    // Load subscription info for selected site if available
    if (selectedSiteId.value) {
      subscriptionTier.value = siteTiers.value[selectedSiteId.value] === 'pro' ? 'Pro' : 'Free'
    }
  } catch (error) {
    console.error('Failed to load dashboard data:', error)
  } finally {
    loading.value = false
  }
}

const getSiteTier = (siteId: number) => {
  return siteTiers.value[siteId] || 'free'
}

onMounted(() => {
  loadDashboardData()
})

useHead({
  title: 'Dashboard - Create Studio',
  meta: [
    { name: 'description', content: 'Manage your Create Studio sites' }
  ]
})
</script>
