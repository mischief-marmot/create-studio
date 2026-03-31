<template>
  <div class="min-h-screen">
    <div class="px-6 py-8 max-w-[1400px] mx-auto">
      <!-- Page Header -->
      <div class="mb-8">
        <div class="flex items-center gap-2 text-xs font-medium tracking-widest uppercase mb-2">
          <span class="text-base-content/50">CRM</span>
          <span class="text-base-content/30">&middot;</span>
          <span class="text-base-content/40">Publisher Intelligence</span>
        </div>
        <div class="flex items-center justify-between">
          <h1 class="text-4xl text-base-content" style="font-family: 'Instrument Serif', serif; font-weight: 400; letter-spacing: -0.02em; line-height: 1.1;">
            Leads
          </h1>
          <button
            class="btn btn-primary btn-sm"
            :disabled="scraping"
            @click="runScrape"
          >
            <span v-if="scraping" class="loading loading-spinner loading-xs"></span>
            <svg v-else class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99" />
            </svg>
            {{ scraping ? 'Scraping...' : 'Scrape sellers.json' }}
          </button>
          <button
            class="btn btn-outline btn-sm"
            :disabled="probing"
            @click="runProbe"
          >
            <span v-if="probing" class="loading loading-spinner loading-xs"></span>
            <svg v-else class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 013 12c0-1.605.42-3.113 1.157-4.418" />
            </svg>
            {{ probing ? 'Probing...' : 'Probe WordPress (100)' }}
          </button>
          <button
            class="btn btn-outline btn-sm"
            :disabled="enriching"
            @click="runEnrich"
          >
            <span v-if="enriching" class="loading loading-spinner loading-xs"></span>
            <svg v-else class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 0 0-2.455 2.456Z" />
            </svg>
            {{ enriching ? 'Enriching...' : 'Enrich (100)' }}
          </button>
        </div>
      </div>

      <!-- Sub Navigation -->
      <div class="flex gap-1 mb-6">
        <NuxtLink to="/crm/leads" class="btn btn-sm" :class="'btn-primary'">Leads</NuxtLink>
        <NuxtLink to="/crm/outreach" class="btn btn-sm btn-ghost">Outreach</NuxtLink>
        <NuxtLink to="/crm/pipeline" class="btn btn-sm btn-ghost">Pipeline</NuxtLink>
      </div>

      <!-- Stats Cards -->
      <div v-if="stats" class="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        <div class="bg-base-100 rounded-xl border border-base-300/50 p-4 shadow-sm">
          <div class="text-2xl font-bold text-base-content">{{ stats.publishers.total.toLocaleString() }}</div>
          <div class="text-xs text-base-content/50 uppercase tracking-wider mt-1">Total Publishers</div>
        </div>
        <div class="bg-base-100 rounded-xl border border-base-300/50 p-4 shadow-sm">
          <div class="text-2xl font-bold text-base-content">{{ stats.publishers.wordpress.toLocaleString() }}</div>
          <div class="text-xs text-base-content/50 uppercase tracking-wider mt-1">WordPress</div>
        </div>
        <div class="bg-base-100 rounded-xl border border-base-300/50 p-4 shadow-sm">
          <div class="text-2xl font-bold text-base-content">{{ stats.contacts.withEmail.toLocaleString() }}</div>
          <div class="text-xs text-base-content/50 uppercase tracking-wider mt-1">With Email</div>
        </div>
        <div class="bg-base-100 rounded-xl border border-base-300/50 p-4 shadow-sm">
          <div class="text-2xl font-bold text-base-content">{{ stats.outreach.total.toLocaleString() }}</div>
          <div class="text-xs text-base-content/50 uppercase tracking-wider mt-1">Outreach</div>
        </div>
      </div>

      <!-- Filters -->
      <div class="bg-base-100 rounded-xl border border-base-300/50 p-6 shadow-sm mb-6">
        <div class="flex flex-col sm:flex-row gap-4">
          <div class="flex-1">
            <AdminSearchInput
              v-model="searchQuery"
              placeholder="Search by domain..."
              :debounce="300"
              @search="handleSearch"
            />
          </div>
          <div class="flex gap-2">
            <AdminFilterDropdown
              v-model="statusFilter"
              :options="statusOptions"
              label="Status"
              @change="handleFilterChange"
            />
            <AdminFilterDropdown
              v-model="wordpressFilter"
              :options="wordpressOptions"
              label="WordPress"
              @change="handleFilterChange"
            />
          </div>
        </div>
      </div>

      <!-- Publishers Table -->
      <div class="bg-base-100 rounded-xl border border-base-300/50 shadow-sm hover:shadow-md hover:border-base-300 transition-all duration-300">
        <!-- Loading -->
        <div v-if="loading" class="flex items-center justify-center py-16">
          <div class="flex flex-col items-center gap-4">
            <span class="loading loading-spinner loading-lg text-primary"></span>
            <p class="text-sm text-base-content/50 font-light tracking-wide">Loading leads...</p>
          </div>
        </div>

        <!-- Error -->
        <div v-else-if="error" class="flex flex-col items-center justify-center py-16 text-center px-6">
          <div class="inline-flex items-center justify-center w-16 h-16 rounded-full bg-error/10 border border-error/20 mb-4">
            <svg class="w-8 h-8 text-error" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 class="text-xl text-base-content mb-2" style="font-family: 'Instrument Serif', serif;">Unable to Load Leads</h3>
          <p class="text-sm text-base-content/60 mb-4">{{ error }}</p>
          <button class="btn btn-outline btn-sm" @click="fetchPublishers">Try Again</button>
        </div>

        <!-- Table -->
        <div v-else-if="publishers.length > 0">
          <div class="overflow-x-auto">
            <table class="w-full">
              <thead>
                <tr class="border-b border-base-300/50">
                  <th class="text-left py-4 px-6 text-xs font-medium text-base-content/50 uppercase tracking-wider">Domain</th>
                  <th class="text-left py-4 px-6 text-xs font-medium text-base-content/50 uppercase tracking-wider">Ad Networks</th>
                  <th class="text-left py-4 px-6 text-xs font-medium text-base-content/50 uppercase tracking-wider">WordPress</th>
                  <th class="text-left py-4 px-6 text-xs font-medium text-base-content/50 uppercase tracking-wider">Category</th>
                  <th class="text-left py-4 px-6 text-xs font-medium text-base-content/50 uppercase tracking-wider">Posts</th>
                  <th class="text-left py-4 px-6 text-xs font-medium text-base-content/50 uppercase tracking-wider">Status</th>
                  <th class="text-left py-4 px-6 text-xs font-medium text-base-content/50 uppercase tracking-wider">Scraped</th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="pub in publishers"
                  :key="pub.id"
                  class="border-b border-base-300/30 last:border-b-0 hover:bg-base-50 transition-colors cursor-pointer"
                >
                  <td class="py-4 px-6">
                    <div class="font-medium text-base-content">{{ pub.domain }}</div>
                    <div v-if="pub.siteName" class="text-sm text-base-content/50 truncate max-w-[200px]">{{ pub.siteName }}</div>
                  </td>
                  <td class="py-4 px-6">
                    <div class="flex flex-wrap gap-1">
                      <span
                        v-for="network in (pub.adNetworks as string[] || [])"
                        :key="network"
                        class="badge badge-sm badge-outline"
                      >
                        {{ network }}
                      </span>
                    </div>
                  </td>
                  <td class="py-4 px-6">
                    <div class="flex items-center gap-1.5">
                      <template v-if="pub.isWordpress">
                        <svg class="w-4 h-4 text-success" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span class="text-sm text-base-content/70">Yes</span>
                      </template>
                      <template v-else-if="pub.scrapeStatus === 'pending'">
                        <span class="text-sm text-base-content/40">&mdash;</span>
                      </template>
                      <template v-else>
                        <span class="text-sm text-base-content/50">No</span>
                      </template>
                    </div>
                  </td>
                  <td class="py-4 px-6">
                    <span v-if="pub.siteCategory" class="badge badge-sm" :class="categoryBadgeClass(pub.siteCategory)">
                      {{ pub.siteCategory }}
                    </span>
                    <span v-else class="text-sm text-base-content/40">&mdash;</span>
                  </td>
                  <td class="py-4 px-6">
                    <span v-if="pub.postCount" class="text-sm font-medium text-base-content">{{ pub.postCount.toLocaleString() }}</span>
                    <span v-else class="text-sm text-base-content/40">&mdash;</span>
                  </td>
                  <td class="py-4 px-6">
                    <span class="badge badge-sm" :class="statusBadgeClass(pub.scrapeStatus)">
                      {{ pub.scrapeStatus }}
                    </span>
                  </td>
                  <td class="py-4 px-6">
                    <span v-if="pub.lastScrapedAt" class="text-sm text-base-content/70">{{ formatDate(pub.lastScrapedAt) }}</span>
                    <span v-else class="text-sm text-base-content/40">&mdash;</span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- Pagination -->
          <div
            v-if="pagination.totalPages > 1"
            class="border-t border-base-300/50 px-6 py-4 flex items-center justify-between"
          >
            <div class="text-base-content/60 text-sm">
              Showing {{ startIndex + 1 }} to {{ Math.min(endIndex, pagination.total) }} of {{ pagination.total.toLocaleString() }} leads
            </div>
            <div class="flex items-center gap-2">
              <button
                class="btn btn-sm btn-ghost"
                :disabled="pagination.page === 1"
                @click="handlePageChange(pagination.page - 1)"
                aria-label="Previous page"
              >
                <svg class="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <div class="flex items-center gap-1">
                <button
                  v-for="page in visiblePages"
                  :key="page"
                  class="btn btn-sm"
                  :class="page === pagination.page ? 'btn-primary' : 'btn-ghost'"
                  @click="handlePageChange(page)"
                >
                  {{ page }}
                </button>
              </div>
              <button
                class="btn btn-sm btn-ghost"
                :disabled="pagination.page === pagination.totalPages"
                @click="handlePageChange(pagination.page + 1)"
                aria-label="Next page"
              >
                <svg class="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        <!-- Empty State -->
        <div v-else class="flex flex-col items-center justify-center py-16 text-center px-6">
          <div class="inline-flex items-center justify-center w-16 h-16 rounded-full bg-base-200 text-base-content/30 mb-4">
            <svg class="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 013 12c0-1.605.42-3.113 1.157-4.418" />
            </svg>
          </div>
          <h3 class="text-xl text-base-content mb-2" style="font-family: 'Instrument Serif', serif;">No Leads Yet</h3>
          <p class="text-sm text-base-content/50 mb-4">Run a sellers.json scrape to discover publishers</p>
          <button class="btn btn-primary btn-sm" :disabled="scraping" @click="runScrape">
            Scrape sellers.json
          </button>
        </div>
      </div>

      <!-- Scrape Result Toast -->
      <div v-if="scrapeResult" class="toast toast-end toast-bottom">
        <div class="alert" :class="scrapeResult.success ? 'alert-success' : 'alert-error'">
          <span>{{ scrapeResult.message }}</span>
          <button class="btn btn-ghost btn-xs" @click="scrapeResult = null">✕</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'

definePageMeta({
  layout: 'admin'
})

interface Publisher {
  id: number
  domain: string
  siteName: string | null
  adNetworks: string[] | null
  isWordpress: boolean
  restApiAvailable: boolean
  siteCategory: string | null
  postCount: number | null
  scrapeStatus: string
  scrapeError: string | null
  lastScrapedAt: string | null
  contactId: number | null
  createStudioSiteId: number | null
  createdAt: string
}

interface Pagination {
  page: number
  limit: number
  total: number
  totalPages: number
}

interface Stats {
  publishers: { total: number; wordpress: number; byStatus: Record<string, number> }
  contacts: { total: number; withEmail: number }
  outreach: { total: number }
  networks: Array<{ slug: string; name: string; publisherCount: number; lastFetchedAt: string | null }>
}

// State
const publishers = ref<Publisher[]>([])
const pagination = ref<Pagination>({ page: 1, limit: 50, total: 0, totalPages: 0 })
const loading = ref(false)
const error = ref<string | null>(null)
const stats = ref<Stats | null>(null)
const scraping = ref(false)
const probing = ref(false)
const enriching = ref(false)
const scrapeResult = ref<{ success: boolean; message: string } | null>(null)

// Filters
const searchQuery = ref('')
const statusFilter = ref<string | number | null>(null)
const wordpressFilter = ref<string | number | null>(null)

const statusOptions = [
  { value: 'pending', label: 'Pending' },
  { value: 'plugins_scraped', label: 'Plugins Scraped' },
  { value: 'enriched', label: 'Enriched' },
  { value: 'contacts_scraped', label: 'Contacts Scraped' },
  { value: 'complete', label: 'Complete' },
  { value: 'failed', label: 'Failed' },
]

const wordpressOptions = [
  { value: 'true', label: 'WordPress' },
]

// Pagination helpers
const startIndex = computed(() => (pagination.value.page - 1) * pagination.value.limit)
const endIndex = computed(() => startIndex.value + pagination.value.limit)

const visiblePages = computed(() => {
  const pages: number[] = []
  const maxVisible = 5
  let start = Math.max(1, pagination.value.page - Math.floor(maxVisible / 2))
  let end = Math.min(pagination.value.totalPages, start + maxVisible - 1)
  if (end - start < maxVisible - 1) {
    start = Math.max(1, end - maxVisible + 1)
  }
  for (let i = start; i <= end; i++) {
    pages.push(i)
  }
  return pages
})

// Fetch
const fetchPublishers = async () => {
  loading.value = true
  error.value = null

  try {
    const params = new URLSearchParams()
    params.append('page', pagination.value.page.toString())
    params.append('limit', pagination.value.limit.toString())

    if (searchQuery.value) params.append('search', searchQuery.value)
    if (statusFilter.value) params.append('status', statusFilter.value.toString())
    if (wordpressFilter.value) params.append('wordpress', wordpressFilter.value.toString())

    const response = await $fetch<{ data: Publisher[]; pagination: Pagination }>(
      `/api/admin/pipeline/publishers?${params.toString()}`
    )

    publishers.value = response.data
    pagination.value = response.pagination
  } catch (err: any) {
    error.value = err?.data?.message || 'Failed to load leads.'
  } finally {
    loading.value = false
  }
}

const fetchStats = async () => {
  try {
    stats.value = await $fetch<Stats>('/api/admin/pipeline/stats')
  } catch {
    // Non-critical, stats just won't show
  }
}

const runScrape = async () => {
  scraping.value = true
  scrapeResult.value = null

  try {
    const result = await $fetch<{
      success: boolean
      totalPublishers: number
      inserted: number
      updated: number
    }>('/api/admin/pipeline/scrape-sellers', { method: 'POST' })

    scrapeResult.value = {
      success: true,
      message: `Discovered ${result.totalPublishers.toLocaleString()} publishers (${result.inserted} new, ${result.updated} updated)`,
    }

    // Refresh data
    await Promise.all([fetchPublishers(), fetchStats()])
  } catch (err: any) {
    scrapeResult.value = {
      success: false,
      message: err?.data?.message || 'Scrape failed',
    }
  } finally {
    scraping.value = false
  }
}

const runProbe = async () => {
  probing.value = true
  scrapeResult.value = null

  try {
    const result = await $fetch<{
      success: boolean
      probed: number
      wordpress: number
      notWordpress: number
      failed: number
      newPluginsDiscovered: number
    }>('/api/admin/pipeline/probe-wordpress?limit=100', { method: 'POST' })

    scrapeResult.value = {
      success: true,
      message: `Probed ${result.probed} domains: ${result.wordpress} WordPress, ${result.notWordpress} not WP, ${result.failed} failed. ${result.newPluginsDiscovered} new plugins discovered.`,
    }

    await Promise.all([fetchPublishers(), fetchStats()])
  } catch (err: any) {
    scrapeResult.value = {
      success: false,
      message: err?.data?.message || 'Probe failed',
    }
  } finally {
    probing.value = false
  }
}

const runEnrich = async () => {
  enriching.value = true
  scrapeResult.value = null

  try {
    const result = await $fetch<{
      success: boolean
      enriched: number
      failed: number
      categories: Record<string, number>
    }>('/api/admin/pipeline/enrich-publishers?limit=100', { method: 'POST' })

    const catSummary = Object.entries(result.categories)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([cat, count]) => `${cat}: ${count}`)
      .join(', ')

    scrapeResult.value = {
      success: true,
      message: `Enriched ${result.enriched} publishers (${result.failed} failed). Categories: ${catSummary || 'none detected'}`,
    }

    await Promise.all([fetchPublishers(), fetchStats()])
  } catch (err: any) {
    scrapeResult.value = {
      success: false,
      message: err?.data?.message || 'Enrichment failed',
    }
  } finally {
    enriching.value = false
  }
}

// Handlers
const handleSearch = () => { pagination.value.page = 1; fetchPublishers() }
const handleFilterChange = () => { pagination.value.page = 1; fetchPublishers() }
const handlePageChange = (page: number) => {
  if (page >= 1 && page <= pagination.value.totalPages) {
    pagination.value.page = page
    fetchPublishers()
  }
}

// Helpers
const statusBadgeClass = (status: string): string => {
  const map: Record<string, string> = {
    pending: 'badge-ghost',
    plugins_scraped: 'badge-info badge-outline',
    enriched: 'badge-warning badge-outline',
    contacts_scraped: 'badge-accent badge-outline',
    complete: 'badge-success badge-outline',
    failed: 'badge-error badge-outline',
  }
  return map[status] || 'badge-ghost'
}

const categoryBadgeClass = (category: string): string => {
  const map: Record<string, string> = {
    food: 'badge-success badge-outline',
    diy: 'badge-info badge-outline',
    lifestyle: 'badge-warning badge-outline',
    travel: 'badge-accent badge-outline',
  }
  return map[category] || 'badge-outline'
}

const formatDate = (dateString: string): string => {
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
}

// Watchers
watch([searchQuery, statusFilter, wordpressFilter], () => {
  pagination.value.page = 1
  fetchPublishers()
})

onMounted(() => {
  fetchPublishers()
  fetchStats()
})
</script>
