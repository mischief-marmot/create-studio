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
            <!-- Interactive Mode Engagement Charts -->
            <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <!-- Sessions Chart -->
              <div class="bg-base-100 rounded-xl border border-base-300/50 p-6 shadow-sm hover:shadow-md hover:border-base-300 transition-all duration-300">
                <div class="flex items-baseline justify-between mb-4">
                  <div>
                    <div class="text-2xl text-base-content" style="font-family: 'Instrument Serif', serif; font-weight: 400;">
                      {{ formatNumber(interactiveData.interactive.totalSessions) }}
                    </div>
                    <div class="text-xs text-base-content/50 mt-0.5">Total Sessions</div>
                  </div>
                </div>
                <div class="h-32 flex items-end gap-px" v-if="interactiveData.timeSeries?.sessions?.length > 1">
                  <div
                    v-for="(point, i) in interactiveData.timeSeries.sessions"
                    :key="i"
                    class="flex-1 min-w-0 group relative h-full flex items-end"
                  >
                    <div
                      class="w-full rounded-t bg-primary/70 hover:bg-primary transition-colors cursor-default"
                      :style="{ height: barHeight(point.value, interactiveData.timeSeries.sessions) }"
                    ></div>
                    <div class="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 px-2 py-1 bg-base-300 text-base-content text-xs rounded shadow-sm opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
                      {{ formatDate(point.date) }}: {{ point.value }}
                    </div>
                  </div>
                </div>
                <div v-else class="h-32 flex items-center justify-center text-xs text-base-content/30">
                  {{ singlePointLabel(interactiveData.timeSeries?.sessions, 'sessions') }}
                </div>
              </div>

              <!-- Unique Sites Chart -->
              <div class="bg-base-100 rounded-xl border border-base-300/50 p-6 shadow-sm hover:shadow-md hover:border-base-300 transition-all duration-300">
                <div class="flex items-baseline justify-between mb-4">
                  <div>
                    <div class="text-2xl text-base-content" style="font-family: 'Instrument Serif', serif; font-weight: 400;">
                      {{ formatNumber(interactiveData.interactive.uniqueDomains) }}
                    </div>
                    <div class="text-xs text-base-content/50 mt-0.5">Unique Sites</div>
                  </div>
                </div>
                <div class="h-32 flex items-end gap-px" v-if="interactiveData.timeSeries?.uniqueSites?.length > 1">
                  <div
                    v-for="(point, i) in interactiveData.timeSeries.uniqueSites"
                    :key="i"
                    class="flex-1 min-w-0 group relative h-full flex items-end"
                  >
                    <div
                      class="w-full rounded-t bg-secondary/70 hover:bg-secondary transition-colors cursor-default"
                      :style="{ height: barHeight(point.value, interactiveData.timeSeries.uniqueSites) }"
                    ></div>
                    <div class="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 px-2 py-1 bg-base-300 text-base-content text-xs rounded shadow-sm opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
                      {{ formatDate(point.date) }}: {{ point.value }} sites
                    </div>
                  </div>
                </div>
                <div v-else class="h-32 flex items-center justify-center text-xs text-base-content/30">
                  {{ singlePointLabel(interactiveData.timeSeries?.uniqueSites, 'sites') }}
                </div>
              </div>

              <!-- Page Completion Chart (area chart) -->
              <div class="bg-base-100 rounded-xl border border-base-300/50 p-6 shadow-sm hover:shadow-md hover:border-base-300 transition-all duration-300">
                <div class="flex items-baseline justify-between mb-4">
                  <div>
                    <div class="text-2xl text-base-content" style="font-family: 'Instrument Serif', serif; font-weight: 400;">
                      {{ interactiveData.interactive.completionRate.toFixed(1) }}%
                    </div>
                    <div class="text-xs text-base-content/50 mt-0.5">Page Completion</div>
                    <div class="text-xs text-base-content/40">
                      {{ formatNumber(interactiveData.interactive.totalPageViews) }} pages viewed
                    </div>
                  </div>
                </div>
                <div class="h-32 relative" v-if="interactiveData.timeSeries?.pageCompletion?.length > 1">
                  <svg class="w-full h-full" preserveAspectRatio="none" :viewBox="`0 0 ${interactiveData.timeSeries.pageCompletion.length - 1} 100`">
                    <polygon
                      :points="areaPoints(interactiveData.timeSeries.pageCompletion, 100)"
                      class="fill-success/20"
                    />
                    <polyline
                      :points="linePoints(interactiveData.timeSeries.pageCompletion, 100)"
                      class="stroke-success"
                      fill="none"
                      stroke-width="1.5"
                      vector-effect="non-scaling-stroke"
                      stroke-linejoin="round"
                    />
                  </svg>
                  <!-- Hover zones -->
                  <div class="absolute inset-0 flex">
                    <div
                      v-for="(point, i) in interactiveData.timeSeries.pageCompletion"
                      :key="i"
                      class="flex-1 group relative"
                    >
                      <div class="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 px-2 py-1 bg-base-300 text-base-content text-xs rounded shadow-sm opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
                        {{ formatDate(point.date) }}: {{ point.value }}%
                      </div>
                      <div class="absolute bottom-0 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-success opacity-0 group-hover:opacity-100 transition-opacity" :style="{ bottom: point.value + '%' }"></div>
                    </div>
                  </div>
                </div>
                <div v-else class="h-32 flex items-center justify-center text-xs text-base-content/30">
                  {{ singlePointLabel(interactiveData.timeSeries?.pageCompletion, '%') }}
                </div>
              </div>

              <!-- Avg Session Duration Chart (line chart) -->
              <div class="bg-base-100 rounded-xl border border-base-300/50 p-6 shadow-sm hover:shadow-md hover:border-base-300 transition-all duration-300">
                <div class="flex items-baseline justify-between mb-4">
                  <div>
                    <div class="text-2xl text-base-content" style="font-family: 'Instrument Serif', serif; font-weight: 400;">
                      {{ formatDuration(interactiveData.interactive.avgSessionDuration) }}
                    </div>
                    <div class="text-xs text-base-content/50 mt-0.5">Avg Session Duration</div>
                  </div>
                </div>
                <div class="h-32 relative" v-if="interactiveData.timeSeries?.avgDuration?.length > 1">
                  <svg class="w-full h-full" preserveAspectRatio="none" :viewBox="`0 0 ${interactiveData.timeSeries.avgDuration.length - 1} 100`">
                    <polygon
                      :points="areaPoints(interactiveData.timeSeries.avgDuration)"
                      class="fill-warning/15"
                    />
                    <polyline
                      :points="linePoints(interactiveData.timeSeries.avgDuration)"
                      class="stroke-warning"
                      fill="none"
                      stroke-width="1.5"
                      vector-effect="non-scaling-stroke"
                      stroke-linejoin="round"
                    />
                  </svg>
                  <!-- Hover zones -->
                  <div class="absolute inset-0 flex">
                    <div
                      v-for="(point, i) in interactiveData.timeSeries.avgDuration"
                      :key="i"
                      class="flex-1 group relative"
                    >
                      <div class="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 px-2 py-1 bg-base-300 text-base-content text-xs rounded shadow-sm opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
                        {{ formatDate(point.date) }}: {{ formatDuration(point.value) }}
                      </div>
                    </div>
                  </div>
                </div>
                <div v-else class="h-32 flex items-center justify-center text-xs text-base-content/30">
                  {{ singlePointLabel(interactiveData.timeSeries?.avgDuration, 'seconds') }}
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
                            {{ roundRate(data.conversionRate) }}%
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
              <p class="text-sm text-info">Historical view — v1/v2 API call sampling stopped on 2026-04-27. Numbers reflect data captured before that date.</p>
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

interface TimeSeriesPoint {
  date: string
  value: number
}

interface InteractiveAnalytics {
  interactive: {
    totalSessions: number
    uniqueDomains: number
    completionRate: number
    totalPageViews: number
    avgSessionDuration: number
  }
  timeSeries: {
    sessions: TimeSeriesPoint[]
    uniqueSites: TimeSeriesPoint[]
    avgDuration: TimeSeriesPoint[]
    pageCompletion: TimeSeriesPoint[]
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
  const today = new Date()
  endDate.value = today.toISOString().split('T')[0]
  const thirtyDaysAgo = new Date(today)
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
  startDate.value = thirtyDaysAgo.toISOString().split('T')[0]

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
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return secs > 0 ? `${mins}m ${secs}s` : `${mins}m`
}

const formatDate = (dateStr: string): string => {
  const d = new Date(dateStr + 'T00:00:00')
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

/**
 * Calculate bar height as percentage of the max value in the series.
 * Minimum 2px so zero-value bars are still visible.
 */
const barHeight = (value: number, series: TimeSeriesPoint[]): string => {
  const max = Math.max(...series.map(p => p.value))
  if (max === 0) return '2px'
  const pct = (value / max) * 100
  return `${Math.max(pct, 1.5)}%`
}

/**
 * For percentage metrics (0-100), scale against 100 rather than the max.
 */
const percentBarHeight = (value: number): string => {
  return `${Math.max(value, 1.5)}%`
}

/**
 * Generate SVG polyline points from time series data.
 * X = index (0 to n-1), Y = inverted value (SVG Y-axis is top-down).
 * If maxVal is provided, scale against it; otherwise scale against series max.
 */
const linePoints = (series: TimeSeriesPoint[], maxVal?: number): string => {
  const max = maxVal ?? Math.max(...series.map(p => p.value))
  if (max === 0) return series.map((_, i) => `${i},100`).join(' ')
  return series
    .map((p, i) => `${i},${100 - (p.value / max) * 100}`)
    .join(' ')
}

/**
 * Generate SVG polygon points (closed area under the line).
 */
const areaPoints = (series: TimeSeriesPoint[], maxVal?: number): string => {
  const line = linePoints(series, maxVal)
  const lastX = series.length - 1
  return `0,100 ${line} ${lastX},100`
}

const roundRate = (value: number): string => {
  return (Math.round(value * 1000) / 1000).toFixed(3)
}

const singlePointLabel = (series: TimeSeriesPoint[] | undefined, unit: string): string => {
  if (!series || series.length === 0) return 'No daily data'
  const first = series[0]!
  if (series.length === 1) return `${first.value} ${unit} on ${formatDate(first.date)}`
  return 'No daily data'
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
