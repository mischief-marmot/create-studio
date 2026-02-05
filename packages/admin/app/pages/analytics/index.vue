<template>
  <div class="min-h-screen">
    <!-- Loading State -->
    <div v-if="loading && !data" class="flex items-center justify-center min-h-[60vh]">
      <div class="flex flex-col items-center gap-4">
        <span class="loading loading-spinner loading-lg text-primary"></span>
        <p class="text-sm text-base-content/50 font-light tracking-wide">Loading analytics...</p>
      </div>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="flex items-center justify-center min-h-[60vh]">
      <div class="max-w-md text-center space-y-6">
        <div class="inline-flex items-center justify-center w-16 h-16 rounded-full bg-error/10 border border-error/20">
          <svg class="w-8 h-8 text-error" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <div class="space-y-2">
          <h3 class="text-xl text-base-content" style="font-family: 'Instrument Serif', serif;">Unable to Load Analytics</h3>
          <p class="text-sm text-base-content/60 leading-relaxed">{{ error }}</p>
        </div>
        <button class="btn btn-outline btn-sm" @click="fetchAnalytics">
          Try Again
        </button>
      </div>
    </div>

    <!-- Analytics Content -->
    <div v-else class="px-6 py-8 max-w-[1400px] mx-auto">
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
              class="btn btn-sm btn-primary"
              :disabled="loading"
              @click="fetchAnalytics"
            >
              <span v-if="loading" class="loading loading-spinner loading-xs"></span>
              {{ loading ? 'Loading...' : 'Load Data' }}
            </button>
          </div>
        </div>
      </div>

      <!-- Empty State -->
      <div v-if="!data" class="flex items-center justify-center min-h-[40vh]">
        <div class="text-center space-y-4">
          <ChartBarIcon class="w-12 h-12 text-base-content/20 mx-auto" />
          <p class="text-sm text-base-content/50">Select a date range and click "Load Data" to view analytics</p>
        </div>
      </div>

      <template v-else>
        <!-- Top-Level Stats -->
        <div class="bg-base-100 rounded-xl border border-base-300/50 p-6 shadow-sm mb-8">
          <div class="grid grid-cols-2 lg:grid-cols-4 gap-6">
            <div class="space-y-1">
              <div class="text-3xl text-warning" style="font-family: 'Instrument Serif', serif; font-weight: 400;">
                {{ formatNumber(data.apiUsage.v1Total) }}
              </div>
              <div class="text-sm text-base-content/60">v1 API Calls</div>
            </div>
            <div class="space-y-1">
              <div class="text-3xl text-success" style="font-family: 'Instrument Serif', serif; font-weight: 400;">
                {{ formatNumber(data.apiUsage.v2Total) }}
              </div>
              <div class="text-sm text-base-content/60">v2 API Calls</div>
            </div>
            <div class="space-y-1">
              <div class="text-3xl text-base-content" style="font-family: 'Instrument Serif', serif; font-weight: 400;">
                {{ formatNumber(data.interactive.totalSessions) }}
              </div>
              <div class="text-sm text-base-content/60">Active Sessions</div>
            </div>
            <div class="space-y-1">
              <div class="text-3xl text-base-content" style="font-family: 'Instrument Serif', serif; font-weight: 400;">
                {{ formatNumber(data.interactive.uniqueUsers) }}
              </div>
              <div class="text-sm text-base-content/60">Unique Users</div>
            </div>
          </div>
        </div>

        <div class="space-y-8">
          <!-- API Version Usage -->
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
                  {{ formatNumber(data.apiUsage.v1Total) }}
                </div>
                <div class="text-xs text-base-content/50">v1 API Calls</div>
                <div class="text-xs text-base-content/40">Legacy API version</div>
              </div>
              <div class="space-y-1">
                <div class="text-2xl text-success" style="font-family: 'Instrument Serif', serif; font-weight: 400;">
                  {{ formatNumber(data.apiUsage.v2Total) }}
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
            <div v-if="Object.keys(data.apiUsage.v1Endpoints).length > 0">
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
                    <tr v-for="(count, endpoint) in data.apiUsage.v1Endpoints" :key="endpoint" class="border-b border-base-300/30 hover:bg-base-200/30">
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

          <!-- Interactive Mode Engagement -->
          <div class="bg-base-100 rounded-xl border border-base-300/50 p-6 shadow-sm hover:shadow-md hover:border-base-300 transition-all duration-300">
            <h2 class="text-lg text-base-content mb-6" style="font-family: 'Instrument Serif', serif; font-weight: 400; letter-spacing: -0.01em;">
              Interactive Mode Engagement
            </h2>

            <div class="grid grid-cols-2 lg:grid-cols-4 gap-6">
              <div class="space-y-1">
                <div class="text-2xl text-base-content" style="font-family: 'Instrument Serif', serif; font-weight: 400;">
                  {{ formatNumber(data.interactive.totalSessions) }}
                </div>
                <div class="text-xs text-base-content/50">Total Sessions</div>
                <div class="text-xs text-base-content/40">Across all sites</div>
              </div>
              <div class="space-y-1">
                <div class="text-2xl text-base-content" style="font-family: 'Instrument Serif', serif; font-weight: 400;">
                  {{ formatNumber(data.interactive.uniqueUsers) }}
                </div>
                <div class="text-xs text-base-content/50">Unique Users</div>
                <div class="text-xs text-base-content/40">Anonymous tracked users</div>
              </div>
              <div class="space-y-1">
                <div class="text-2xl text-base-content" style="font-family: 'Instrument Serif', serif; font-weight: 400;">
                  {{ formatDuration(data.interactive.avgDuration) }}
                </div>
                <div class="text-xs text-base-content/50">Avg Session Duration</div>
                <div class="text-xs text-base-content/40">Time in interactive mode</div>
              </div>
              <div class="space-y-1">
                <div class="text-2xl text-base-content" style="font-family: 'Instrument Serif', serif; font-weight: 400;">
                  {{ pageViewPercentage }}%
                </div>
                <div class="text-xs text-base-content/50">Page View Rate</div>
                <div class="text-xs text-base-content/40">{{ data.interactive.pagesViewed }} / {{ data.interactive.totalPages }} pages</div>
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
                  {{ formatNumber(data.timers.started) }}
                </div>
                <div class="text-xs text-base-content/50">Timers Started</div>
              </div>
              <div class="space-y-1">
                <div class="text-2xl text-success" style="font-family: 'Instrument Serif', serif; font-weight: 400;">
                  {{ formatNumber(data.timers.completed) }}
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
                  {{ formatNumber(data.ratings.screensShown) }}
                </div>
                <div class="text-xs text-base-content/50">Screens Shown</div>
              </div>
              <div class="space-y-1">
                <div class="text-2xl text-success" style="font-family: 'Instrument Serif', serif; font-weight: 400;">
                  {{ formatNumber(data.ratings.submitted) }}
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
        </div>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { ChartBarIcon } from '@heroicons/vue/24/outline'

definePageMeta({
  layout: 'admin',
})

interface AnalyticsDashboard {
  apiUsage: {
    v1Total: number
    v2Total: number
    v1Endpoints: Record<string, { count: number; errors: number }>
  }
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
}

const startDate = ref('')
const endDate = ref('')
const loading = ref(false)
const error = ref<string | null>(null)
const data = ref<AnalyticsDashboard | null>(null)

onMounted(() => {
  const today = new Date()
  const weekAgo = new Date(today)
  weekAgo.setDate(today.getDate() - 7)

  endDate.value = today.toISOString().split('T')[0]
  startDate.value = weekAgo.toISOString().split('T')[0]

  fetchAnalytics()
})

const fetchAnalytics = async () => {
  loading.value = true
  error.value = null

  try {
    const response = await $fetch<AnalyticsDashboard>('/api/admin/analytics/dashboard', {
      params: {
        startDate: startDate.value,
        endDate: endDate.value,
      },
    })
    data.value = response
  } catch (err: any) {
    error.value = err?.message || 'Failed to load analytics data'
    console.error('Error fetching analytics:', err)
  } finally {
    loading.value = false
  }
}

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
  if (!data.value) return 0
  const total = data.value.apiUsage.v1Total + data.value.apiUsage.v2Total
  if (total === 0) return 0
  return Math.round((data.value.apiUsage.v1Total / total) * 100)
})

const pageViewPercentage = computed(() => {
  if (!data.value || data.value.interactive.totalPages === 0) return 0
  return Math.round((data.value.interactive.pagesViewed / data.value.interactive.totalPages) * 100)
})

const timerCompletionRate = computed(() => {
  if (!data.value || data.value.timers.started === 0) return 0
  return Math.round((data.value.timers.completed / data.value.timers.started) * 100)
})

const ratingConversionRate = computed(() => {
  if (!data.value || data.value.ratings.screensShown === 0) return 0
  return Math.round((data.value.ratings.submitted / data.value.ratings.screensShown) * 100)
})
</script>
