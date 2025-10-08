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
        <div class="card bg-base-100 shadow-xl">
          <div class="card-body">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-sm text-base-content/70">Total Sites</p>
                <p class="text-3xl font-bold">{{ sites.length }}</p>
              </div>
              <ServerIcon class="h-12 w-12 text-primary opacity-50" />
            </div>
          </div>
        </div>

        <div class="card bg-base-100 shadow-xl">
          <div class="card-body">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-sm text-base-content/70">Active Site</p>
                <p class="text-xl font-bold truncate">
                  {{ selectedSite?.name || selectedSite?.url || 'None' }}
                </p>
              </div>
              <GlobeAltIcon class="h-12 w-12 text-success opacity-50" />
            </div>
          </div>
        </div>

        <div class="card bg-base-100 shadow-xl">
          <div class="card-body">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-sm text-base-content/70">Subscription</p>
                <p class="text-xl font-bold">
                  {{ subscriptionTier }}
                </p>
              </div>
              <SparklesIcon class="h-12 w-12 text-accent opacity-50" />
            </div>
          </div>
        </div>
      </div>

      <!-- Sites List -->
      <div class="card bg-base-100 shadow-xl">
        <div class="card-body">
          <div class="flex items-center justify-between mb-4">
            <h2 class="card-title">Your Sites</h2>
            <button class="btn btn-primary btn-sm">
              <PlusIcon class="h-5 w-5 mr-1" />
              Add Site
            </button>
          </div>

          <div v-if="loading" class="flex justify-center py-8">
            <span class="loading loading-spinner loading-lg"></span>
          </div>

          <div v-else-if="sites.length === 0" class="text-center py-8">
            <ServerIcon class="h-16 w-16 mx-auto text-base-content/30 mb-4" />
            <p class="text-lg font-semibold mb-2">No sites yet</p>
            <p class="text-base-content/70 mb-4">Get started by adding your first site</p>
            <button class="btn btn-primary">
              <PlusIcon class="h-5 w-5 mr-1" />
              Add Your First Site
            </button>
          </div>

          <div v-else class="overflow-x-auto">
            <table class="table">
              <thead>
                <tr>
                  <th>Site</th>
                  <th>URL</th>
                  <th>Create Version</th>
                  <th>Last Updated</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="site in sites" :key="site.id" class="hover">
                  <td>
                    <div class="flex items-center gap-3">
                      <div class="avatar placeholder">
                        <div class="bg-neutral text-neutral-content rounded-full w-10">
                          <span class="text-xl">{{ getInitial(site.name || site.url) }}</span>
                        </div>
                      </div>
                      <div>
                        <div class="font-bold">{{ site.name || site.url }}</div>
                        <div v-if="site.name" class="text-sm opacity-50">{{ site.url }}</div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <a :href="`https://${site.url}`" target="_blank" class="link link-primary">
                      {{ site.url }}
                    </a>
                  </td>
                  <td>
                    <span class="badge badge-ghost">{{ site.create_version || 'N/A' }}</span>
                  </td>
                  <td>{{ formatDate(site.updatedAt) }}</td>
                  <td>
                    <div class="flex gap-2">
                      <button @click="selectAndNavigate(site.id)" class="btn btn-ghost btn-sm">
                        <Cog6ToothIcon class="h-5 w-5" />
                      </button>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- Quick Actions -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div class="card bg-base-100 shadow-xl">
          <div class="card-body">
            <h3 class="card-title text-lg">Quick Actions</h3>
            <div class="space-y-2">
              <NuxtLink to="/admin/settings" class="btn btn-ghost btn-sm justify-start w-full">
                <Cog6ToothIcon class="h-5 w-5 mr-2" />
                Site Settings
              </NuxtLink>
              <NuxtLink to="/users/account" class="btn btn-ghost btn-sm justify-start w-full">
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
import { ref, computed, onMounted } from 'vue'
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
import { useSiteContext } from '~/composables/useSiteContext'
import { useAuthFetch } from '~/composables/useAuthFetch'

definePageMeta({
  middleware: 'auth',
  layout: 'admin'
})

const router = useRouter()
const { selectedSiteId, selectedSite, sites, loadSites, selectSite } = useSiteContext()

const loading = ref(true)
const subscriptionTier = ref('Free')

const getInitial = (name: string) => {
  return name?.[0]?.toUpperCase() || '?'
}

const formatDate = (dateString: string) => {
  if (!dateString) return 'N/A'
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  })
}

const selectAndNavigate = (siteId: number) => {
  selectSite(siteId)
  router.push('/admin/settings')
}

const loadDashboardData = async () => {
  try {
    await loadSites()

    // Load subscription info for selected site if available
    if (selectedSiteId.value) {
      try {
        const response = await useAuthFetch(`/api/v2/subscriptions/status/${selectedSiteId.value}`)
        if (response.success && response.tier) {
          subscriptionTier.value = response.tier === 'pro' ? 'Pro' : 'Free'
        }
      } catch (error) {
        console.error('Failed to load subscription:', error)
      }
    }
  } catch (error) {
    console.error('Failed to load dashboard data:', error)
  } finally {
    loading.value = false
  }
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
