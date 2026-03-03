<template>
  <div class="min-h-screen">
    <!-- Analytics Content -->
    <div class="px-6 py-8 max-w-[1400px] mx-auto">
      <!-- Header -->
      <div class="mb-12">
        <div class="flex items-center gap-2 text-xs font-medium tracking-widest uppercase mb-2">
          <span class="text-base-content/50">Reporting</span>
          <span class="text-base-content/30">&middot;</span>
          <span class="text-base-content/40">Usage Data</span>
        </div>
        <div class="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-6">
          <div>
            <h1 class="text-4xl text-base-content" style="font-family: 'Instrument Serif', serif; font-weight: 400; letter-spacing: -0.02em; line-height: 1.1;">
              Analytics
            </h1>
            <p class="text-sm text-base-content/50 mt-2">Track API usage, interactive mode engagement, and user behavior</p>
          </div>

          <!-- Date Range Controls -->
          <div class="flex items-end gap-3">
            <div>
              <label class="text-xs font-medium text-base-content/60 block mb-1.5">Start Date</label>
              <input
                v-model="startDate"
                type="date"
                class="input input-sm input-bordered bg-base-100 text-sm"
              />
            </div>
            <div>
              <label class="text-xs font-medium text-base-content/60 block mb-1.5">End Date</label>
              <input
                v-model="endDate"
                type="date"
                class="input input-sm input-bordered bg-base-100 text-sm"
              />
            </div>
          </div>
        </div>
      </div>

      <!-- Tab Navigation -->
      <div role="tablist" class="tabs tabs-bordered mb-8">
        <button
          role="tab"
          class="tab"
          :class="{ 'tab-active': activeTab === 'interactive' }"
          @click="switchTab('interactive')"
        >
          Interactive Mode
        </button>
        <button
          role="tab"
          class="tab"
          :class="{ 'tab-active': activeTab === 'api-usage' }"
          @click="switchTab('api-usage')"
        >
          API Version Usage
        </button>
      </div>

      <!-- Interactive Mode Tab -->
      <div v-show="activeTab === 'interactive'">
        <!-- Loading -->
        <div v-if="interactiveLoading" class="flex items-center justify-center min-h-[40vh]">
          <div class="flex flex-col items-center gap-4">
            <span class="loading loading-spinner loading-lg text-primary"></span>
            <p class="text-sm text-base-content/50 font-light tracking-wide">Loading interactive analytics...</p>
          </div>
        </div>

        <!-- Error -->
        <div v-else-if="interactiveError" class="flex items-center justify-center min-h-[40vh]">
          <div class="max-w-md text-center space-y-6">
            <div class="inline-flex items-center justify-center w-16 h-16 rounded-full bg-error/10 border border-error/20">
              <svg class="w-8 h-8 text-error" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div class="space-y-2">
              <h3 class="text-xl text-base-content" style="font-family: 'Instrument Serif', serif;">Unable to Load</h3>
              <p class="text-sm text-base-content/60 leading-relaxed">{{ interactiveError }}</p>
            </div>
            <button class="btn btn-outline btn-sm" @click="fetchInteractive">
              Try Again
            </button>
          </div>
        </div>

        <!-- Empty State -->
        <div v-else-if="!interactiveData" class="flex items-center justify-center min-h-[40vh]">
          <div class="text-center space-y-4">
            <ChartBarIcon class="w-12 h-12 text-base-content/20 mx-auto" />
            <p class="text-sm text-base-content/50">Select a date range to view interactive mode analytics</p>
            <button class="btn btn-sm btn-primary" @click="fetchInteractive">Load Data</button>
          </div>
        </div>

        <!-- Interactive Data -->
        <template v-else>
          <!-- Top Stats -->
          <div class="bg-base-100 rounded-xl border border-base-300/50 p-6 shadow-sm mb-8">
            <div class="grid grid-cols-2 lg:grid-cols-4 gap-6">
              <div class="space-y-1">
                <div class="text-3xl text-base-content" style="font-family: 'Instrument Serif', serif; font-weight: 400;">
                  {{ formatNumber(interactiveData.interactive.totalSessions) }}
                </div>
                <div class="text-sm text-base-content/60">Active Sessions</div>
              </div>
              <div class="space-y-1">
                <div class="text-3xl text-base-content" style="font-family: 'Instrument Serif', serif; font-weight: 400;">
                  {{ formatNumber(interactiveData.interactive.uniqueUsers) }}
                </div>
                <div class="text-sm text-base-content/60">Unique Users</div>
              </div>
              <div class="space-y-1">
                <div class="text-3xl text-base-content" style="font-family: 'Instrument Serif', serif; font-weight: 400;">
                  {{ formatDuration(interactiveData.interactive.avgDuration) }}
                </div>
                <div class="text-sm text-base-content/60">Avg Duration</div>
              </div>
              <div class="space-y-1">
                <div class="text-3xl text-base-content" style="font-family: 'Instrument Serif', serif; font-weight: 400;">
                  {{ pageViewPercentage }}%
                </div>
                <div class="text-sm text-base-content/60">Page View Rate</div>
              </div>
            </div>
          </div>

          <div class="space-y-8">
            <!-- Interactive Mode Engagement -->
            <div class="bg-base-100 rounded-xl border border-base-300/50 p-6 shadow-sm hover:shadow-md hover:border-base-300 transition-all duration-300">
              <h2 class="text-lg text-base-content mb-6" style="font-family: 'Instrument Serif', serif; font-weight: 400; letter-spacing: -0.01em;">
                Interactive Mode Engagement
              </h2>

              <div class="grid grid-cols-2 lg:grid-cols-4 gap-6">
                <div class="space-y-1">
                  <div class="text-2xl text-base-content" style="font-family: 'Instrument Serif', serif; font-weight: 400;">
                    {{ formatNumber(interactiveData.interactive.totalSessions) }}
                  </div>
                  <div class="text-xs text-base-content/50">Total Sessions</div>
                  <div class="text-xs text-base-content/40">Across all sites</div>
                </div>
                <div class="space-y-1">
                  <div class="text-2xl text-base-content" style="font-family: 'Instrument Serif', serif; font-weight: 400;">
                    {{ formatNumber(interactiveData.interactive.uniqueUsers) }}
                  </div>
                  <div class="text-xs text-base-content/50">Unique Users</div>
                  <div class="text-xs text-base-content/40">Anonymous tracked users</div>
                </div>
                <div class="space-y-1">
                  <div class="text-2xl text-base-content" style="font-family: 'Instrument Serif', serif; font-weight: 400;">
                    {{ formatDuration(interactiveData.interactive.avgDuration) }}
                  </div>
                  <div class="text-xs text-base-content/50">Avg Session Duration</div>
                  <div class="text-xs text-base-content/40">Time in interactive mode</div>
                </div>
                <div class="space-y-1">
                  <div class="text-2xl text-base-content" style="font-family: 'Instrument Serif', serif; font-weight: 400;">
                    {{ pageViewPercentage }}%
                  </div>
                  <div class="text-xs text-base-content/50">Page View Rate</div>
                  <div class="text-xs text-base-content/40">{{ interactiveData.interactive.pagesViewed }} / {{ interactiveData.interactive.totalPages }} pages</div>
                </div>
              </div>
            </div>

            <!-- Timer Usage -->
            <div class="bg-base-100 rounded-xl border border-base-300/50 p-6 shadow-sm hover:shadow-md hover:border-base-300 transition-all duration-300">
              <h2 class="text-lg text-base-content mb-6" style="font-family: 'Instrument Serif', serif; font-weight: 400; letter-spacing: -0.01em;">
                Timer Usage
              </h2>

              <div class="grid grid-cols-3 gap-6">
                <div class="space-y-1">
                  <div class="text-2xl text-base-content" style="font-family: 'Instrument Serif', serif; font-weight: 400;">
                    {{ formatNumber(interactiveData.timers.started) }}
                  </div>
                  <div class="text-xs text-base-content/50">Timers Started</div>
                </div>
                <div class="space-y-1">
                  <div class="text-2xl text-success" style="font-family: 'Instrument Serif', serif; font-weight: 400;">
                    {{ formatNumber(interactiveData.timers.completed) }}
                  </div>
                  <div class="text-xs text-base-content/50">Timers Completed</div>
                </div>
                <div class="space-y-1">
                  <div class="text-2xl text-base-content" style="font-family: 'Instrument Serif', serif; font-weight: 400;">
                    {{ timerCompletionRate }}%
                  </div>
                  <div class="text-xs text-base-content/50">Completion Rate</div>
                  <div class="text-xs text-base-content/40">Completed / Started</div>
                </div>
              </div>
            </div>

            <!-- Rating Analytics -->
            <div class="bg-base-100 rounded-xl border border-base-300/50 p-6 shadow-sm hover:shadow-md hover:border-base-300 transition-all duration-300">
              <h2 class="text-lg text-base-content mb-6" style="font-family: 'Instrument Serif', serif; font-weight: 400; letter-spacing: -0.01em;">
                Rating Analytics
              </h2>

              <div class="grid grid-cols-3 gap-6">
                <div class="space-y-1">
                  <div class="text-2xl text-base-content" style="font-family: 'Instrument Serif', serif; font-weight: 400;">
                    {{ formatNumber(interactiveData.ratings.screensShown) }}
                  </div>
                  <div class="text-xs text-base-content/50">Screens Shown</div>
                </div>
                <div class="space-y-1">
                  <div class="text-2xl text-success" style="font-family: 'Instrument Serif', serif; font-weight: 400;">
                    {{ formatNumber(interactiveData.ratings.submitted) }}
                  </div>
                  <div class="text-xs text-base-content/50">Ratings Submitted</div>
                </div>
                <div class="space-y-1">
                  <div class="text-2xl text-base-content" style="font-family: 'Instrument Serif', serif; font-weight: 400;">
                    {{ ratingConversionRate }}%
                  </div>
                  <div class="text-xs text-base-content/50">Conversion Rate</div>
                  <div class="text-xs text-base-content/40">Submitted / Shown</div>
                </div>
              </div>
            </div>

            <!-- CTA Variant Performance -->
            <div class="bg-base-100 rounded-xl border border-base-300/50 p-6 shadow-sm hover:shadow-md hover:border-base-300 transition-all duration-300">
              <h2 class="text-lg text-base-content mb-2" style="font-family: 'Instrument Serif', serif; font-weight: 400; letter-spacing: -0.01em;">
                CTA Variant Performance
              </h2>
              <p class="text-xs text-base-content/40 mb-6">Which call-to-action variant users clicked to enter interactive mode</p>

              <div class="grid grid-cols-2 gap-6 mb-8">
                <div class="space-y-1">
                  <div class="text-2xl text-base-content" style="font-family: 'Instrument Serif', serif; font-weight: 400;">
                    {{ formatNumber(interactiveData.cta.total) }}
                  </div>
                  <div class="text-xs text-base-content/50">Total Activations</div>
                  <div class="text-xs text-base-content/40">Across all variants</div>
                </div>
              </div>

              <div v-if="interactiveData.cta.total > 0" class="space-y-3">
                <div
                  v-for="(count, variant) in interactiveData.cta.variants"
                  :key="variant"
                  class="flex items-center gap-4"
                >
                  <div class="font-mono text-xs text-base-content/60 w-28 shrink-0">{{ variant }}</div>
                  <div class="flex-1 bg-base-200 rounded-full h-1.5 overflow-hidden">
                    <div
                      class="bg-primary h-full rounded-full transition-all duration-500"
                      :style="{ width: `${interactiveData.cta.total > 0 ? Math.round((count / interactiveData.cta.total) * 100) : 0}%` }"
                    ></div>
                  </div>
                  <div class="text-sm text-base-content/70 w-16 text-right shrink-0">
                    {{ formatNumber(count) }} <span class="text-base-content/40 text-xs">({{ interactiveData.cta.total > 0 ? Math.round((count / interactiveData.cta.total) * 100) : 0 }}%)</span>
                  </div>
                </div>
              </div>
              <div v-else class="text-sm text-base-content/40 text-center py-4">
                No CTA activation data for this period
              </div>
            </div>
          </div>
        </template>
      </div>

      <!-- API Usage Tab -->
      <div v-show="activeTab === 'api-usage'">
        <!-- Loading -->
        <div v-if="apiLoading" class="flex items-center justify-center min-h-[40vh]">
          <div class="flex flex-col items-center gap-4">
            <span class="loading loading-spinner loading-lg text-primary"></span>
            <p class="text-sm text-base-content/50 font-light tracking-wide">Loading API usage data...</p>
          </div>
        </div>

        <!-- Error -->
        <div v-else-if="apiError" class="flex items-center justify-center min-h-[40vh]">
          <div class="max-w-md text-center space-y-6">
            <div class="inline-flex items-center justify-center w-16 h-16 rounded-full bg-error/10 border border-error/20">
              <svg class="w-8 h-8 text-error" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div class="space-y-2">
              <h3 class="text-xl text-base-content" style="font-family: 'Instrument Serif', serif;">Unable to Load</h3>
              <p class="text-sm text-base-content/60 leading-relaxed">{{ apiError }}</p>
            </div>
            <button class="btn btn-outline btn-sm" @click="fetchApiUsage">
              Try Again
            </button>
          </div>
        </div>

        <!-- Empty State -->
        <div v-else-if="!apiData" class="flex items-center justify-center min-h-[40vh]">
          <div class="text-center space-y-4">
            <ChartBarIcon class="w-12 h-12 text-base-content/20 mx-auto" />
            <p class="text-sm text-base-content/50">Select a date range to view API version usage</p>
            <button class="btn btn-sm btn-primary" @click="fetchApiUsage">Load Data</button>
          </div>
        </div>

        <!-- API Data -->
        <template v-else>
          <!-- Top Stats -->
          <div class="bg-base-100 rounded-xl border border-base-300/50 p-6 shadow-sm mb-8">
            <div class="grid grid-cols-2 lg:grid-cols-3 gap-6">
              <div class="space-y-1">
                <div class="text-3xl text-warning" style="font-family: 'Instrument Serif', serif; font-weight: 400;">
                  {{ formatNumber(apiData.v1Total) }}
                </div>
                <div class="text-sm text-base-content/60">v1 API Calls</div>
              </div>
              <div class="space-y-1">
                <div class="text-3xl text-success" style="font-family: 'Instrument Serif', serif; font-weight: 400;">
                  {{ formatNumber(apiData.v2Total) }}
                </div>
                <div class="text-sm text-base-content/60">v2 API Calls</div>
              </div>
              <div class="space-y-1">
                <div class="text-3xl text-base-content" style="font-family: 'Instrument Serif', serif; font-weight: 400;">
                  {{ v1Percentage }}%
                </div>
                <div class="text-sm text-base-content/60">v1 Percentage</div>
              </div>
            </div>
          </div>

          <!-- API Version Usage Details -->
          <div class="bg-base-100 rounded-xl border border-base-300/50 p-6 shadow-sm hover:shadow-md hover:border-base-300 transition-all duration-300">
            <h2 class="text-lg text-base-content mb-6" style="font-family: 'Instrument Serif', serif; font-weight: 400; letter-spacing: -0.01em;">
              API Version Usage
            </h2>

            <div class="bg-info/5 border border-info/20 rounded-lg px-4 py-3 mb-6">
              <p class="text-sm text-info">Tracking v1 usage to determine when it can be deprecated</p>
            </div>

            <div class="grid grid-cols-3 gap-6 mb-8">
              <div class="space-y-1">
                <div class="text-2xl text-warning" style="font-family: 'Instrument Serif', serif; font-weight: 400;">
                  {{ formatNumber(apiData.v1Total) }}
                </div>
                <div class="text-xs text-base-content/50">v1 API Calls</div>
                <div class="text-xs text-base-content/40">Legacy API version</div>
              </div>
              <div class="space-y-1">
                <div class="text-2xl text-success" style="font-family: 'Instrument Serif', serif; font-weight: 400;">
                  {{ formatNumber(apiData.v2Total) }}
                </div>
                <div class="text-xs text-base-content/50">v2 API Calls</div>
                <div class="text-xs text-base-content/40">Current API version</div>
              </div>
              <div class="space-y-1">
                <div class="text-2xl text-base-content" style="font-family: 'Instrument Serif', serif; font-weight: 400;">
                  {{ v1Percentage }}%
                </div>
                <div class="text-xs text-base-content/50">v1 Percentage</div>
                <div class="text-xs text-base-content/40">Of total API calls</div>
              </div>
            </div>

            <!-- Endpoint Breakdown -->
            <div v-if="Object.keys(apiData.v1Endpoints).length > 0">
              <h3 class="text-sm font-medium text-base-content/70 uppercase tracking-wider mb-3">v1 Endpoint Breakdown</h3>
              <div class="overflow-x-auto">
                <table class="table table-sm w-full">
                  <thead>
                    <tr class="border-b border-base-300/50">
                      <th class="text-xs font-medium text-base-content/50 uppercase tracking-wider">Endpoint</th>
                      <th class="text-xs font-medium text-base-content/50 uppercase tracking-wider">Calls</th>
                      <th class="text-xs font-medium text-base-content/50 uppercase tracking-wider">Errors</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="(count, endpoint) in apiData.v1Endpoints" :key="endpoint" class="border-b border-base-300/30 hover:bg-base-200/30">
                      <td class="font-mono text-sm text-base-content/80">{{ endpoint }}</td>
                      <td class="text-sm">{{ formatNumber(count.count) }}</td>
                      <td>
                        <span v-if="count.errors" class="badge badge-error badge-sm">{{ count.errors }}</span>
                        <span v-else class="text-sm text-base-content/30">0</span>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
            <div v-else class="text-sm text-base-content/40 text-center py-4">
              No v1 endpoint data for this period
            </div>
          </div>
        </template>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { ChartBarIcon } from '@heroicons/vue/24/outline'

definePageMeta({
  layout: 'admin',
})

interface ApiUsageData {
  v1Total: number
  v2Total: number
  v1Endpoints: Record<string, { count: number; errors: number }>
}

interface InteractiveAnalytics {
  interactive: {
    totalSessions: number
    uniqueUsers: number
    avgDuration: number
    pagesViewed: number
    totalPages: number
  }
  timers: {
    started: number
    completed: number
  }
  ratings: {
    screensShown: number
    submitted: number
  }
  cta: {
    total: number
    variants: Record<string, number>
  }
}

const startDate = ref('')
const endDate = ref('')
const activeTab = ref<'interactive' | 'api-usage'>('interactive')

// Interactive mode state
const interactiveLoading = ref(false)
const interactiveError = ref<string | null>(null)
const interactiveData = ref<InteractiveAnalytics | null>(null)

// API usage state
const apiLoading = ref(false)
const apiError = ref<string | null>(null)
const apiData = ref<ApiUsageData | null>(null)

onMounted(() => {
  const today = new Date()
  const weekAgo = new Date(today)
  weekAgo.setDate(today.getDate() - 7)

  endDate.value = today.toISOString().split('T')[0]
  startDate.value = weekAgo.toISOString().split('T')[0]

  // Only auto-load the interactive tab (the default)
  fetchInteractive()
})

const switchTab = (tab: 'interactive' | 'api-usage') => {
  activeTab.value = tab
  // Auto-fetch if this tab hasn't been loaded yet
  if (tab === 'api-usage' && !apiData.value && !apiLoading.value) {
    fetchApiUsage()
  }
  if (tab === 'interactive' && !interactiveData.value && !interactiveLoading.value) {
    fetchInteractive()
  }
}

const fetchInteractive = async () => {
  interactiveLoading.value = true
  interactiveError.value = null

  try {
    const response = await $fetch<InteractiveAnalytics>('/api/admin/analytics/interactive', {
      params: {
        startDate: startDate.value,
        endDate: endDate.value,
      },
    })
    interactiveData.value = response
  } catch (err: any) {
    interactiveError.value = err?.message || 'Failed to load interactive analytics'
    console.error('Error fetching interactive analytics:', err)
  } finally {
    interactiveLoading.value = false
  }
}

const fetchApiUsage = async () => {
  apiLoading.value = true
  apiError.value = null

  try {
    const response = await $fetch<ApiUsageData>('/api/admin/analytics/api-usage', {
      params: {
        startDate: startDate.value,
        endDate: endDate.value,
      },
    })
    apiData.value = response
  } catch (err: any) {
    apiError.value = err?.message || 'Failed to load API usage data'
    console.error('Error fetching API usage:', err)
  } finally {
    apiLoading.value = false
  }
}

// When date range changes, clear cached data so it reloads on next tab switch
watch([startDate, endDate], () => {
  interactiveData.value = null
  apiData.value = null
})

const formatNumber = (value: number): string => {
  return value.toLocaleString()
}

const formatDuration = (seconds: number): string => {
  if (seconds < 60) return `${seconds}s`
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ${seconds % 60}s`
  const hours = Math.floor(minutes / 60)
  return `${hours}h ${minutes % 60}m`
}

const v1Percentage = computed(() => {
  if (!apiData.value) return 0
  const total = apiData.value.v1Total + apiData.value.v2Total
  if (total === 0) return 0
  return Math.round((apiData.value.v1Total / total) * 100)
})

const pageViewPercentage = computed(() => {
  if (!interactiveData.value || interactiveData.value.interactive.totalPages === 0) return 0
  return Math.round((interactiveData.value.interactive.pagesViewed / interactiveData.value.interactive.totalPages) * 100)
})

const timerCompletionRate = computed(() => {
  if (!interactiveData.value || interactiveData.value.timers.started === 0) return 0
  return Math.round((interactiveData.value.timers.completed / interactiveData.value.timers.started) * 100)
})

const ratingConversionRate = computed(() => {
  if (!interactiveData.value || interactiveData.value.ratings.screensShown === 0) return 0
  return Math.round((interactiveData.value.ratings.submitted / interactiveData.value.ratings.screensShown) * 100)
})
</script>
