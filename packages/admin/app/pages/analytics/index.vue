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
            <button
              class="btn btn-sm btn-outline"
              :class="{ 'btn-disabled': rollupRunning }"
              @click="runRollup"
            >
              <span v-if="rollupRunning" class="loading loading-spinner loading-xs"></span>
              <span v-else>Run Rollup</span>
            </button>
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
                    {{ formatNumber(interactiveData.interactive.uniqueDomains) }}
                  </div>
                  <div class="text-xs text-base-content/50">Unique Sites</div>
                  <div class="text-xs text-base-content/40">Distinct domains with sessions</div>
                </div>
                <div class="space-y-1">
                  <div class="text-2xl text-base-content" style="font-family: 'Instrument Serif', serif; font-weight: 400;">
                    {{ interactiveData.interactive.completionRate.toFixed(1) }}%
                  </div>
                  <div class="text-xs text-base-content/50">Completion Rate</div>
                  <div class="text-xs text-base-content/40">Sessions completed / started</div>
                </div>
                <div class="space-y-1">
                  <div class="text-2xl text-base-content" style="font-family: 'Instrument Serif', serif; font-weight: 400;">
                    {{ formatNumber(interactiveData.interactive.totalPageViews) }}
                  </div>
                  <div class="text-xs text-base-content/50">Total Page Views</div>
                  <div class="text-xs text-base-content/40">Extrapolated from 10% sample</div>
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
              <p class="text-xs text-base-content/40 mb-6">Renders vs activations per CTA variant — conversion rate = activations / renders</p>

              <div class="grid grid-cols-3 gap-6 mb-8">
                <div class="space-y-1">
                  <div class="text-2xl text-base-content" style="font-family: 'Instrument Serif', serif; font-weight: 400;">
                    {{ formatNumber(interactiveData.cta.totalRenders) }}
                  </div>
                  <div class="text-xs text-base-content/50">Total Renders</div>
                  <div class="text-xs text-base-content/40">Times a CTA was shown</div>
                </div>
                <div class="space-y-1">
                  <div class="text-2xl text-success" style="font-family: 'Instrument Serif', serif; font-weight: 400;">
                    {{ formatNumber(interactiveData.cta.totalActivations) }}
                  </div>
                  <div class="text-xs text-base-content/50">Total Activations</div>
                  <div class="text-xs text-base-content/40">Times a CTA was clicked</div>
                </div>
                <div class="space-y-1">
                  <div class="text-2xl text-base-content" style="font-family: 'Instrument Serif', serif; font-weight: 400;">
                    {{ overallCtaConversionRate }}%
                  </div>
                  <div class="text-xs text-base-content/50">Overall Conversion</div>
                  <div class="text-xs text-base-content/40">Activations / Renders</div>
                </div>
              </div>

              <div v-if="interactiveData.cta.totalRenders > 0 || interactiveData.cta.totalActivations > 0">
                <div class="overflow-x-auto">
                  <table class="table table-sm w-full">
                    <thead>
                      <tr class="border-b border-base-300/50">
                        <th class="text-xs font-medium text-base-content/50 uppercase tracking-wider">Variant</th>
                        <th class="text-xs font-medium text-base-content/50 uppercase tracking-wider text-right">Renders</th>
                        <th class="text-xs font-medium text-base-content/50 uppercase tracking-wider text-right">Activations</th>
                        <th class="text-xs font-medium text-base-content/50 uppercase tracking-wider text-right">Conversion</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr
                        v-for="(data, variant) in interactiveData.cta.variants"
                        :key="variant"
                        class="border-b border-base-300/30 hover:bg-base-200/30"
                      >
                        <td class="font-mono text-sm text-base-content/80">{{ variant }}</td>
                        <td class="text-sm text-right">{{ formatNumber(data.renders) }}</td>
                        <td class="text-sm text-right">{{ formatNumber(data.activations) }}</td>
                        <td class="text-sm text-right">
                          <span :class="data.conversionRate > 0 ? 'text-success' : 'text-base-content/40'">
                            {{ data.conversionRate }}%
                          </span>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
              <div v-else class="text-sm text-base-content/40 text-center py-4">
                No CTA data for this period
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
    uniqueDomains: number
    completionRate: number
    totalPageViews: number
  }
  timers: {
    started: number
    completed: number
    completionRate: number
  }
  ratings: {
    screensShown: number
    submitted: number
    conversionRate: number
  }
  cta: {
    totalActivations: number
    totalRenders: number
    variants: Record<string, { renders: number; activations: number; conversionRate: number }>
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

// Rollup state
const rollupRunning = ref(false)

const runRollup = async () => {
  rollupRunning.value = true
  try {
    const result = await $fetch<{ datesProcessed: string[]; summariesWritten: number; errors: string[] }>('/api/admin/analytics/rollup', {
      method: 'POST',
    })
    const errorNote = result.errors.length > 0 ? ` (${result.errors.length} errors)` : ''
    const daysNote = result.datesProcessed.length > 0
      ? `${result.datesProcessed.length} day(s): ${result.datesProcessed[0]} → ${result.datesProcessed[result.datesProcessed.length - 1]}`
      : 'already up to date'
    alert(`Rollup complete — ${daysNote}, ${result.summariesWritten} summaries written${errorNote}`)
    // Refresh current tab data
    if (activeTab.value === 'interactive') fetchInteractive()
    else fetchApiUsage()
  } catch (err: any) {
    alert(`Rollup failed: ${err?.message || 'Unknown error'}`)
  } finally {
    rollupRunning.value = false
  }
}

onMounted(() => {
  const today = new Date().toISOString().split('T')[0]
  startDate.value = today
  endDate.value = today

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


const v1Percentage = computed(() => {
  if (!apiData.value) return 0
  const total = apiData.value.v1Total + apiData.value.v2Total
  if (total === 0) return 0
  return Math.round((apiData.value.v1Total / total) * 100)
})

const timerCompletionRate = computed(() => {
  if (!interactiveData.value) return 0
  return Math.round(interactiveData.value.timers.completionRate)
})

const ratingConversionRate = computed(() => {
  if (!interactiveData.value) return 0
  return Math.round(interactiveData.value.ratings.conversionRate)
})

const overallCtaConversionRate = computed(() => {
  if (!interactiveData.value || interactiveData.value.cta.totalRenders === 0) return 0
  return Math.round((interactiveData.value.cta.totalActivations / interactiveData.value.cta.totalRenders) * 10000) / 100
})
</script>
