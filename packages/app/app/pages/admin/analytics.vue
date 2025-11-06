<template>
  <NuxtLayout name="admin">
    <div class="min-h-screen bg-base-100">
      <main>
        <header>
          <!-- Secondary navigation -->
          <nav class="border-b border-base-300 flex py-4 overflow-x-auto">
            <ul role="list" class="gap-x-6 text-sm/6 sm:px-6 lg:px-8 flex flex-none min-w-full px-4 font-semibold text-base-content/60">
              <li>
                <a href="/admin/analytics" class="text-primary">Analytics</a>
              </li>
              <li>
                <a href="/admin/reporting" class="text-base-content/60 hover:text-primary">Reporting</a>
              </li>
            </ul>
          </nav>

          <!-- Heading with Date Range Selector -->
          <div class="gap-x-8 gap-y-4 bg-base-200/50 sm:flex-row sm:items-center sm:px-6 lg:px-8 flex flex-col items-start justify-between px-4 py-4">
            <div>
              <div class="gap-x-3 flex items-center">
                <div class="bg-success/10 flex-none p-1 text-success rounded-full">
                  <div class="size-2 bg-current rounded-full"></div>
                </div>
                <h1 class="gap-x-3 text-base/7 flex">
                  <span class="font-semibold text-base-content">Analytics Dashboard</span>
                </h1>
              </div>
              <p class="text-xs/6 mt-2 text-base-content/60">Track API usage, interactive mode engagement, and user behavior</p>
            </div>

            <!-- Date Range Controls -->
            <div class="flex items-end gap-4">
              <div>
                <label class="text-base-content/70 block mb-2 text-xs font-medium">Start Date</label>
                <input
                  v-model="startDate"
                  type="date"
                  class="input input-sm input-bordered"
                />
              </div>
              <div>
                <label class="text-base-content/70 block mb-2 text-xs font-medium">End Date</label>
                <input
                  v-model="endDate"
                  type="date"
                  class="input input-sm input-bordered"
                />
              </div>
              <button
                @click="fetchAnalytics"
                class="btn btn-sm btn-primary"
                :disabled="loading"
              >
                <span v-if="loading" class="loading loading-spinner loading-xs"></span>
                {{ loading ? 'Loading...' : 'Load Data' }}
              </button>
            </div>
          </div>

          <!-- Stats Grid -->
          <div v-if="data" class="bg-base-200/50 sm:grid-cols-2 lg:grid-cols-4 grid grid-cols-1">
            <div class="border-t border-base-300 px-4 py-6 sm:px-6 lg:px-8">
              <p class="text-sm/6 font-medium text-base-content/60">v1 API Calls</p>
              <p class="gap-x-2 flex items-baseline mt-2">
                <span class="text-4xl font-semibold tracking-tight text-warning">{{ data.apiUsage.v1Total }}</span>
              </p>
            </div>
            <div class="border-t sm:border-l border-base-300 px-4 py-6 sm:px-6 lg:px-8">
              <p class="text-sm/6 font-medium text-base-content/60">v2 API Calls</p>
              <p class="gap-x-2 flex items-baseline mt-2">
                <span class="text-4xl font-semibold tracking-tight text-success">{{ data.apiUsage.v2Total }}</span>
              </p>
            </div>
            <div class="border-t lg:border-l border-base-300 px-4 py-6 sm:px-6 lg:px-8">
              <p class="text-sm/6 font-medium text-base-content/60">Active Sessions</p>
              <p class="gap-x-2 flex items-baseline mt-2">
                <span class="text-4xl font-semibold tracking-tight text-base-content">{{ data.interactive.totalSessions }}</span>
              </p>
            </div>
            <div class="border-t sm:border-l border-base-300 px-4 py-6 sm:px-6 lg:px-8">
              <p class="text-sm/6 font-medium text-base-content/60">Unique Users</p>
              <p class="gap-x-2 flex items-baseline mt-2">
                <span class="text-4xl font-semibold tracking-tight text-base-content">{{ data.interactive.uniqueUsers }}</span>
              </p>
            </div>
          </div>
        </header>

        <!-- Loading State -->
        <div v-if="loading && !data" class="flex items-center justify-center py-12">
          <span class="loading loading-spinner loading-lg"></span>
        </div>

        <!-- Empty State -->
        <div v-else-if="!data" class="py-12 text-center">
          <p class="text-base-content/60">Select a date range and click "Load Data" to view analytics</p>
        </div>

        <!-- Analytics Details -->
        <div v-else class="pt-11 border-t border-base-300">
          <div class="sm:px-6 lg:px-8 px-4 space-y-8 pb-8">
            <!-- API Usage Section -->
            <div class="card bg-base-200 shadow-xl">
              <div class="card-body">
                <h2 class="card-title mb-4 text-2xl">API Version Usage</h2>
                <div class="alert alert-info mb-4">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" class="shrink-0 w-6 h-6 stroke-current"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                  <span>Tracking v1 usage to determine when it can be deprecated</span>
                </div>

                <div class="stats stats-vertical lg:stats-horizontal shadow">
                  <div class="stat">
                    <div class="stat-title">v1 API Calls</div>
                    <div class="stat-value text-warning">{{ data.apiUsage.v1Total }}</div>
                    <div class="stat-desc">Legacy API version</div>
                  </div>

                  <div class="stat">
                    <div class="stat-title">v2 API Calls</div>
                    <div class="stat-value text-success">{{ data.apiUsage.v2Total }}</div>
                    <div class="stat-desc">Current API version</div>
                  </div>

                  <div class="stat">
                    <div class="stat-title">v1 Percentage</div>
                    <div class="stat-value text-sm">{{ v1Percentage }}%</div>
                    <div class="stat-desc">Of total API calls</div>
                  </div>
                </div>

                <!-- Endpoint Breakdown -->
                <div class="mt-6">
                  <h3 class="mb-3 text-lg font-semibold">v1 Endpoint Breakdown</h3>
                  <div class="overflow-x-auto">
                    <table class="table-zebra table">
                      <thead>
                        <tr>
                          <th>Endpoint</th>
                          <th>Calls</th>
                          <th>Errors</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr v-for="(count, endpoint) in data.apiUsage.v1Endpoints" :key="endpoint">
                          <td class="font-mono text-sm">{{ endpoint }}</td>
                          <td>{{ count.count }}</td>
                          <td>
                            <span v-if="count.errors" class="badge badge-error">{{ count.errors }}</span>
                            <span v-else class="badge badge-ghost">0</span>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>

            <!-- Interactive Mode Engagement -->
            <div class="card bg-base-200 shadow-xl">
              <div class="card-body">
                <h2 class="card-title mb-4 text-2xl">Interactive Mode Engagement</h2>

                <div class="stats stats-vertical lg:stats-horizontal shadow">
                  <div class="stat">
                    <div class="stat-title">Total Sessions</div>
                    <div class="stat-value">{{ data.interactive.totalSessions }}</div>
                    <div class="stat-desc">Across all sites</div>
                  </div>

                  <div class="stat">
                    <div class="stat-title">Unique Users</div>
                    <div class="stat-value">{{ data.interactive.uniqueUsers }}</div>
                    <div class="stat-desc">Anonymous tracked users</div>
                  </div>

                  <div class="stat">
                    <div class="stat-title">Avg Session Duration</div>
                    <div class="stat-value text-sm">{{ formatDuration(data.interactive.avgDuration) }}</div>
                    <div class="stat-desc">Time in interactive mode</div>
                  </div>

                  <div class="stat">
                    <div class="stat-title">Page View Rate</div>
                    <div class="stat-value text-sm">{{ pageViewPercentage }}%</div>
                    <div class="stat-desc">{{ data.interactive.pagesViewed }} / {{ data.interactive.totalPages }} pages</div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Timer Analytics -->
            <div class="card bg-base-200 shadow-xl">
              <div class="card-body">
                <h2 class="card-title mb-4 text-2xl">Timer Usage</h2>

                <div class="stats stats-vertical lg:stats-horizontal shadow">
                  <div class="stat">
                    <div class="stat-title">Timers Started</div>
                    <div class="stat-value">{{ data.timers.started }}</div>
                  </div>

                  <div class="stat">
                    <div class="stat-title">Timers Completed</div>
                    <div class="stat-value text-success">{{ data.timers.completed }}</div>
                  </div>

                  <div class="stat">
                    <div class="stat-title">Completion Rate</div>
                    <div class="stat-value text-sm">{{ timerCompletionRate }}%</div>
                    <div class="stat-desc">Completed / Started</div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Rating Analytics -->
            <div class="card bg-base-200 shadow-xl">
              <div class="card-body">
                <h2 class="card-title mb-4 text-2xl">Rating Analytics</h2>

                <div class="stats stats-vertical lg:stats-horizontal shadow">
                  <div class="stat">
                    <div class="stat-title">Screens Shown</div>
                    <div class="stat-value">{{ data.ratings.screensShown }}</div>
                  </div>

                  <div class="stat">
                    <div class="stat-title">Ratings Submitted</div>
                    <div class="stat-value text-success">{{ data.ratings.submitted }}</div>
                  </div>

                  <div class="stat">
                    <div class="stat-title">Conversion Rate</div>
                    <div class="stat-value text-sm">{{ ratingConversionRate }}%</div>
                    <div class="stat-desc">Submitted / Shown</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  </NuxtLayout>
</template>

<script setup lang="ts">
definePageMeta({
  layout: false,
  middleware: 'auth' // Ensure only authenticated users can access
})

const startDate = ref('')
const endDate = ref('')
const loading = ref(false)
const data = ref<any>(null)

// Set default dates (last 7 days)
onMounted(() => {
  const today = new Date()
  const weekAgo = new Date(today)
  weekAgo.setDate(today.getDate() - 7)

  endDate.value = today.toISOString().split('T')[0]
  startDate.value = weekAgo.toISOString().split('T')[0]
})

// Fetch analytics data
const fetchAnalytics = async () => {
  loading.value = true

  try {
    const response = await $fetch('/api/analytics/dashboard', {
      params: {
        startDate: startDate.value,
        endDate: endDate.value
      }
    })

    data.value = response
  } catch (error) {
    console.error('Error fetching analytics:', error)
    // TODO: Show error toast
  } finally {
    loading.value = false
  }
}

// Computed values
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

// Format duration helper
const formatDuration = (seconds: number) => {
  if (seconds < 60) return `${seconds}s`
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ${seconds % 60}s`
  const hours = Math.floor(minutes / 60)
  return `${hours}h ${minutes % 60}m`
}
</script>
