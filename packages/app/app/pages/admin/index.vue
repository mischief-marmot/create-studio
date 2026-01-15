<template>
  <div class="min-h-screen">
    <!-- Page Header -->
    <header class="backdrop-blur-xl border-base-300 sticky top-0 z-10 border-b">
      <div class="max-w-[1400px] flex items-end justify-between gap-6 mx-auto px-6 py-8"
          :class="scrollPosition > 0 ? 'lg:py-4 lg:px-6' : 'lg:px-12 lg:py-10 '"
      >
        <div class="flex-1 min-w-0">
          <h1 class=" text-base-content font-extralight font-serif text-3xl leading-none tracking-tight"
          :class="scrollPosition > 0 ? '' : 'lg:text-5xl'"
          >
            {{ greeting }}, <span class="text-primary ml-2 italic font-thin">{{ user?.firstname || 'friend' }}</span>
          </h1>
        </div>
        <div class="flex items-center hidden gap-3"
        :class="scrollPosition > 0 ? 'hidden' : ''">
          <div class="bg-success/10 border border-success/30 text-success rounded-full px-5 py-2.5 flex items-center gap-2.5 shadow-sm">
            <span class="relative flex w-2 h-2">
              <span class="animate-ping bg-success absolute inline-flex w-full h-full rounded-full opacity-75"></span>
              <span class="bg-success relative inline-flex w-2 h-2 rounded-full"></span>
            </span>
            <span class="text-sm">{{ sites.length }} {{ sites.length === 1 ? 'Site' : 'Sites' }}</span>
          </div>
        </div>
      </div>
    </header>

    <!-- Main Content -->
    <div class="lg:px-12 max-w-[1400px] px-6 py-10 mx-auto space-y-14">
      <!-- Stats Overview - Editorial Cards -->
      <section class="w-full font-sans">
        <div class="lg:grid-cols-4 grid grid-cols-2 gap-5">
          <!-- Total Sites -->
          <div class="bg-base-100 border-base-300 border-1 rounded-3xl p-6">
            <div class="flex items-center h-full space-x-2">
              <div class="rounded-2xl bg-gradient-to-br from-primary/5 via-primary-35 to-primary/35 text-amber-600 size-12 flex items-center justify-center mb-4 transition-transform duration-500">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" class="size-6">
              <rect x="3" y="3" width="18" height="18" rx="2"/>
              <path d="M3 9h18"/>
              <path d="M9 21V9"/>
            </svg>
              </div>
              <div class="flex flex-col">
                <span class="text-base-content font-serif text-3xl font-thin leading-none">{{ sites.length }}</span>
                <p class="text-base-content/70 text-sm">Total Sites</p>
              </div>
            </div>
          </div>

          <!-- Pro Sites -->
          <div class="bg-base-100 border-base-300 border-1 rounded-3xl p-6">
            <div class="flex items-center h-full space-x-2">
              <div class="rounded-2xl bg-gradient-to-br from-success/5 via-success-35 to-success/35 size-12 flex items-center justify-center mb-4 transition-transform duration-500">
                <SparklesIcon class="text-success size-6" />
              </div>
              <div class="flex flex-col">
                <span class="text-base-content font-serif text-3xl font-thin leading-none">{{ proSitesCount }}</span>
                <p class="text-base-content/70 text-sm">Pro Site{{ proSitesCount > 1 ? 's' : '' }}</p>
              </div>
            </div>
            <div v-if="proSitesCount > 0" class="mt-auto">
              <div class="bg-base-300 h-2 overflow-hidden rounded-full">
                  <div class="bg-success h-full transition-all duration-700 rounded-full" :style="`width: ${(proSitesCount / sites.length) * 100}%`"></div>
                </div>
            </div>
          </div>

          <!-- Team Members -->
          <div class="bg-base-100 border-base-300 border-1 rounded-3xl hidden p-6">
            <div class="flex items-center h-full space-x-2">
              <div class="rounded-2xl bg-gradient-to-br from-accent/5 via-accent-35 to-accent/35 size-12 flex items-center justify-center mb-4 transition-transform duration-500">
                <UsersIcon class="text-accent size-6" />
              </div>
              <div class="flex flex-col">

              <span class="text-base-content font-serif text-3xl font-thin leading-none">{{ totalTeamMembers }}</span>
              <p class="text-base-content/70 text-sm">Team Members</p>
            </div>
            </div>
          </div>

          <!-- Account Age -->
          <div class="bg-base-100 border-base-300 border-1 rounded-3xl p-6">
            <div class="flex items-center h-full space-x-2">
              <div class="rounded-2xl bg-gradient-to-br from-secondary/5 via-secondary-35 to-secondary/35 size-12 flex items-center justify-center mb-4 transition-transform duration-500">
                <CalendarDaysIcon class="text-secondary size-6" />
              </div>
              
              <div class="flex flex-col">
              <span class="text-base-content font-serif text-3xl font-thin leading-none">{{ accountAgeDays }}</span>
              <p class="text-base-content/70 text-sm">Days with Create</p>
            </div>
            </div>
          </div>
        </div>
      </section>

      <!-- Active Site Card (if selected) -->
      <section v-if="selectedSite" class="w-full">
        <h3 class="mb-6 font-serif text-2xl">Selected Site</h3>
        <div class="bg-gradient-to-br from-base-100 via-base-200 to-base-200 border-base-300 rounded-3xl border-1 p-16">
          <div class="sm:flex-row sm:items-center flex flex-col justify-between gap-6 mb-8">
            <div class="flex items-center gap-5">
              <div>
                <div class="mb-1">
                  <h3 class="text-base-content font-serif text-2xl italic">{{ selectedSite.name || selectedSite.url }}</h3>
                </div>
                <a
                  :href="`https://${selectedSite.url}`"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="text-base-content/60 flex items-center gap-1.5 text-xs font-light"
                >
                  {{ selectedSite.url }}
                  <ArrowTopRightOnSquareIcon class="w-3.5 h-3.5" />
                </a>
              </div>
            </div>
            <div class=" flex items-center justify-end gap-2">
              <button @click="navigateTo('/admin/settings')" class="btn btn-md btn-circle btn-ghost text-base-content/70 font-normal uppercase">
                <Cog6ToothIcon class="size-6" />
              </button>
              <div class="badge badge-md bg-amber-700 text-amber-50 border-amber-700 font-sans uppercase rounded-full">
                {{ getSiteTier(selectedSite.id) === 'pro' ? 'Pro' : 'Free' }}
              </div>
            </div>
          </div>

          <!-- Site Stats Row -->
          <div v-if="selectedSiteStats" class="sm:grid-cols-4 border-base-300 grid grid-cols-2 gap-6 pt-8 border-t-2">
            <div>
              <p class="text-base-content/60 mb-2 text-[11px]  tracking-[0.1em] uppercase">Subscription</p>
              <p class="text-base-content">
                <span :class="getSiteTier(selectedSiteId) === 'pro' ? 'inline-flex size-2 rounded-full bg-success animate-pulse' : 'hidden'"></span>
                {{ getSiteTier(selectedSiteId) === 'pro' ? 'Active' : 'Free' }}</p>
            </div>
            <div>
              <p class="text-base-content/60 mb-2 text-[11px]  tracking-[0.1em] uppercase">WordPress</p>
              <p class="text-base-content">{{ selectedSite.wp_version || '—' }}</p>
            </div>
            <div>
              <p class="text-base-content/60 mb-2 text-[11px]  tracking-[0.1em] uppercase">PHP</p>
              <p class="text-base-content">{{ selectedSite.php_version || '—' }}</p>
            </div>
            <div>
              <p class="text-base-content/60 mb-2 text-[11px]  tracking-[0.1em] uppercase">Create Version</p>
              <p class="text-base-content">{{ selectedSite.create_version || '—' }}</p>
            </div>
            <!-- <div>
              <p class="text-base-content/60 mb-2 text-[11px]  tracking-[0.1em] uppercase">Team Size</p>
              <p class="text-base-content text-lg">{{ selectedSiteStats.teamCount }} {{ selectedSiteStats.teamCount === 1 ? 'member' : 'members' }}</p>
            </div> -->
          </div>
        </div>
      </section>

      <!-- Sites List -->
      <section class="space-y-8">
        <div class="flex items-end justify-between">
          <div class="flex flex-col gap-2">
            <h2 class="text-base-content font-serif text-2xl leading-none">Your Sites</h2>
            <p class="text-base-content/70 text-base font-medium">Select a site to manage its settings</p>
          </div>
          <button @click="openAddSiteModal()" class="btn btn-primary">
            <PlusIcon class="size-5" />
            Add Site
          </button>
        </div>

        <!-- Loading State -->
        <div v-if="loading" class="flex justify-center py-20">
          <div class="relative">
            <div class="border-base-300 border-t-primary animate-spin w-16 h-16 border-4 rounded-full"></div>
          </div>
        </div>

        <!-- Empty State -->
        <div v-else-if="sites.length === 0" class="bg-base-100 border-base-300 rounded-3xl flex flex-col items-center justify-center px-6 py-20 text-center border-2 border-dashed">
          <div class="rounded-3xl bg-base-200 flex items-center justify-center w-24 h-24 mb-6">
            <ServerIcon class="text-base-content/50 w-12 h-12" />
          </div>
          <h3 class="text-base-content mb-3 font-serif text-2xl">No sites yet</h3>
          <p class="text-base-content/70 max-w-md text-base leading-relaxed">
            Sites are automatically added when you register in the Create plugin on your WordPress site, or you can add them from here!
          </p>
        </div>

        <!-- Sites Grid -->
        <div v-else class="flex flex-wrap gap-8">
          <article
            v-for="site in siteList"
            :key="site.id"
            class="bg-base-100 rounded-2xl border-base-300 w-70 border-1 overflow-hidden cursor-pointer"
            :class="[
              selectedSiteId === site.id ? 'border-primary' : '',
              site.pending ? 'opacity-75' : ''
            ]"
            @click="site.pending ? openVerifyModal(site) : selectSite(site.id)"
          >
            <div class="p-7">
              <!-- Site Header -->
              <div class="flex items-start justify-between gap-4 mb-6">
                <div class="flex-1 min-w-0">
                  <div class="flex flex-col gap-2">
                    <div v-if="site.pending" class="badge badge-sm badge-warning uppercase rounded-sm">
                      Pending
                    </div>
                    <div v-else class="badge badge-sm bg-amber-700 text-amber-50 border-amber-700 uppercase rounded-sm">
                      {{ getSiteTier(site.id) === 'pro' ? 'Pro' : 'Free' }}
                    </div>
                    <h3 class="text-base-content text-md font-serif italic truncate">
                      {{ site.name || site.url }}
                    </h3>
                  </div>
                  <a
                    :href="`https://${site.url}`"
                    target="_blank"
                    rel="noopener noreferrer"
                    class="text-base-content/70 font-light flex items-center gap-1.5 text-xs transition-colors duration-300"
                    @click.stop
                  >
                    {{ site.url }}
                    <ArrowTopRightOnSquareIcon class="w-3.5 h-3.5" />
                  </a>
                </div>

              </div>

              <!-- Pending Verification Notice -->
              <div v-if="site.pending" class="bg-warning/10 border-warning/20 rounded-xl p-4 mb-4 text-sm border">
                <p class="text-warning mb-2 font-medium">Verification Required</p>
                <p class="text-base-content/70 text-xs">Click to complete site verification</p>
              </div>

              <!-- Site Meta (only for verified sites) -->
              <div v-if="!site.pending" class="text-base-content/70 border-base-300 flex items-center gap-5 py-4 text-xs border-t-2 border-b-2">
                <span class="flex items-center gap-1.5">
                  <CodeBracketIcon class="size-3" />
                  Create {{ site.create_version ? site.create_version : 'Version Unknown' }}
                </span>
              </div>

              <!-- Site Actions -->
              <div class="flex items-center gap-3 mt-6">
                <button
                  v-if="site.pending"
                  @click.stop="openVerifyModal(site)"
                  class="btn btn-warning btn-sm"
                >
                  Verify Now
                </button>
                <button
                  v-else-if="getSiteTier(site.id) === 'free'"
                  @click.stop="selectSite(site.id); openModal()"
                  class="btn btn-primary"
                >
                  <SparklesIcon class="w-4 h-4" />
                  Upgrade
                </button>
              </div>
            </div>
          </article>
        </div>
      </section>
    </div>

    <!-- Add Site Modal -->
    <AddSiteModal
      :is-open="showAddSiteModal"
      :initial-url="initialSiteUrl || undefined"
      :initial-verification-code="initialVerificationCode || undefined"
      @close="closeAddSiteModal"
      @site-added="handleSiteAdded"
    />

    <!-- Verify Site Modal -->
    <VerifySiteModal
      :is-open="showVerifySiteModal"
      :site="pendingVerifySite"
      :initial-verification-code="verifyInitialCode || undefined"
      @close="closeVerifySiteModal"
      @verified="handleSiteVerified"
    />

    <!-- Site Already Verified Modal -->
    <SiteAlreadyVerifiedModal
      :is-open="showSiteAlreadyVerifiedModal"
      :site="alreadyVerifiedSite"
      @close="closeSiteAlreadyVerifiedModal"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import {
  ServerIcon,
  SparklesIcon,
  Cog6ToothIcon,
  ArrowTopRightOnSquareIcon,
  UsersIcon,
  CalendarDaysIcon,
  CodeBracketIcon,
  PlusIcon,
} from '@heroicons/vue/24/outline'
import { useSiteContext } from '~/composables/useSiteContext'
import { useAuthFetch } from '~/composables/useAuthFetch'
import { useUpgradeModal } from '~/composables/useUpgradeModal'
import { useAuth } from '~/composables/useAuth'
import { useAddSiteModal } from '~/composables/useAddSiteModal'
import { useVerifySiteModal } from '~/composables/useVerifySiteModal'
import { useSiteAlreadyVerifiedModal } from '~/composables/useSiteAlreadyVerifiedModal'

definePageMeta({
  middleware: 'auth',
  layout: 'admin'
})

const { selectedSiteId, selectedSite, sites, loadSites, selectSite } = useSiteContext()
const { openModal } = useUpgradeModal()
const { user } = useAuth()
const { showAddSiteModal, initialSiteUrl, initialVerificationCode, closeAddSiteModal, openAddSiteModal } = useAddSiteModal()
const {
  showVerifySiteModal,
  pendingSite: pendingVerifySite,
  initialVerificationCode: verifyInitialCode,
  openVerifySiteModal,
  closeVerifySiteModal
} = useVerifySiteModal()
const {
  showSiteAlreadyVerifiedModal,
  alreadyVerifiedSite,
  closeSiteAlreadyVerifiedModal
} = useSiteAlreadyVerifiedModal()

const siteList = ref<Array<any>>([])
const loading = ref(true)
const siteTiers = ref<Record<number, string>>({})
const siteTeamCounts = ref<Record<number, number>>({})
const scrollPosition = ref(0)

const handleSiteAdded = async (site: { id: number; url: string; name?: string }) => {
  // Reload sites to include the new verified site
  closeAddSiteModal()
  await loadDashboardData()
}

const openVerifyModal = (site: { id: number; url: string; name?: string }) => {
  openVerifySiteModal(site)
}

const handleSiteVerified = async (site: { id: number; url: string; name?: string }) => {
  // Reload sites to update the verified status
  closeVerifySiteModal()
  await loadDashboardData()
}



const greeting = computed(() => {
  const hour = new Date().getHours()
  if (hour < 12) return 'Good morning'
  if (hour < 17) return 'Good afternoon'
  if (hour < 22) return 'Good evening'
  return 'Working late'
})

const proSitesCount = computed(() => {
  return Object.values(siteTiers.value).filter(tier => tier === 'pro').length
})

const totalTeamMembers = computed(() => {
  return Object.values(siteTeamCounts.value).reduce((sum, count) => sum + count, 0)
})

const accountAgeDays = computed(() => {
  if (!user.value?.createdAt) return 0
  const created = new Date(user.value.createdAt)
  const now = new Date()
  const diffTime = Math.abs(now.getTime() - created.getTime())
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  return diffDays
})

const selectedSiteStats = computed(() => {
  if (!selectedSite.value) return null
  return {
    teamCount: siteTeamCounts.value[selectedSite.value.id] || 1
  }
})

const selectAndNavigate = async (siteId: number) => {
  selectSite(siteId)
  await navigateTo('/admin/settings')
}

const loadDashboardData = async () => {
  try {
    await loadSites()

    siteList.value = sites.value.map((site) => {
      site.url = site.url.replace('https://', '')
      site.url = site.url.replace('http://', '')
      return site
    })

    // Load subscription info and team counts for all sites in parallel
    const dataPromises = sites.value.map(async (site) => {
      // Load subscription tier
      try {
        const response = await useAuthFetch(`/api/v2/subscriptions/status/${site.id}`)
        if (response.success) {
          siteTiers.value[site.id] = response.tier || 'free'
        }
      } catch (error) {
        console.error(`Failed to load subscription for site ${site.id}:`, error)
        siteTiers.value[site.id] = 'free'
      }

      // Load team members count
      try {
        const teamResponse = await useAuthFetch(`/api/v2/sites/${site.id}/users`)
        if (teamResponse.success && teamResponse.users) {
          siteTeamCounts.value[site.id] = teamResponse.users.length
        }
      } catch (error) {
        console.error(`Failed to load team for site ${site.id}:`, error)
        siteTeamCounts.value[site.id] = 1
      }
    })

    await Promise.all(dataPromises)
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
  scrollPosition.value = window.scrollY

  const handleScroll = () => {
    scrollPosition.value = window.scrollY
  }
  window.addEventListener('scroll', handleScroll)
})

useHead({
  title: 'Dashboard - Create Studio',
  meta: [
    { name: 'description', content: 'Manage your Create Studio sites' }
  ]
})
</script>
