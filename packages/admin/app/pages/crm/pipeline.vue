<template>
  <div class="min-h-screen">
    <div class="px-6 py-8 max-w-[1400px] mx-auto">
      <!-- Page Header -->
      <div class="mb-8">
        <div class="flex items-center gap-2 text-xs font-medium tracking-widest uppercase mb-2">
          <span class="text-base-content/50">CRM</span>
          <span class="text-base-content/30">&middot;</span>
          <span class="text-base-content/40">Scraping Pipeline</span>
        </div>
        <h1 class="text-4xl text-base-content" style="font-family: 'Instrument Serif', serif; font-weight: 400; letter-spacing: -0.02em; line-height: 1.1;">
          Pipeline
        </h1>
      </div>

      <!-- Sub Navigation -->
      <div class="flex gap-1 mb-6">
        <NuxtLink to="/crm/leads" class="btn btn-sm btn-ghost">Leads</NuxtLink>
        <NuxtLink to="/crm/outreach" class="btn btn-sm btn-ghost">Outreach</NuxtLink>
        <NuxtLink to="/crm/pipeline" class="btn btn-sm btn-primary">Pipeline</NuxtLink>
      </div>

      <!-- Ad Networks -->
      <div class="bg-base-100 rounded-xl border border-base-300/50 shadow-sm mb-6">
        <div class="px-6 py-4 border-b border-base-300/50">
          <h2 class="text-sm font-semibold text-base-content uppercase tracking-wider">Ad Networks</h2>
        </div>
        <div v-if="stats" class="overflow-x-auto">
          <table class="w-full">
            <thead>
              <tr class="border-b border-base-300/50">
                <th class="text-left py-3 px-6 text-xs font-medium text-base-content/50 uppercase tracking-wider">Network</th>
                <th class="text-left py-3 px-6 text-xs font-medium text-base-content/50 uppercase tracking-wider">Publishers</th>
                <th class="text-left py-3 px-6 text-xs font-medium text-base-content/50 uppercase tracking-wider">Last Fetched</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="network in stats.networks"
                :key="network.slug"
                class="border-b border-base-300/30 last:border-b-0"
              >
                <td class="py-3 px-6">
                  <div class="font-medium text-base-content">{{ network.name }}</div>
                  <div class="text-xs text-base-content/40 font-mono">{{ network.slug }}</div>
                </td>
                <td class="py-3 px-6">
                  <span class="text-sm font-medium text-base-content">{{ (network.publisherCount || 0).toLocaleString() }}</span>
                </td>
                <td class="py-3 px-6">
                  <span v-if="network.lastFetchedAt" class="text-sm text-base-content/70">{{ formatDate(network.lastFetchedAt) }}</span>
                  <span v-else class="text-sm text-base-content/40">Never</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <div v-else class="flex items-center justify-center py-8">
          <span class="loading loading-spinner loading-md text-primary"></span>
        </div>
      </div>

      <!-- Scrape Status Breakdown -->
      <div v-if="stats" class="bg-base-100 rounded-xl border border-base-300/50 shadow-sm mb-6">
        <div class="px-6 py-4 border-b border-base-300/50">
          <h2 class="text-sm font-semibold text-base-content uppercase tracking-wider">Publisher Status Breakdown</h2>
        </div>
        <div class="p-6">
          <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            <div
              v-for="(count, status) in stats.publishers.byStatus"
              :key="status"
              class="text-center p-3 rounded-lg bg-base-200/50"
            >
              <div class="text-xl font-bold text-base-content">{{ count.toLocaleString() }}</div>
              <div class="text-xs text-base-content/50 mt-1">{{ status }}</div>
            </div>
          </div>
        </div>
      </div>

      <!-- Recent Jobs -->
      <div class="bg-base-100 rounded-xl border border-base-300/50 shadow-sm">
        <div class="px-6 py-4 border-b border-base-300/50 flex items-center justify-between">
          <h2 class="text-sm font-semibold text-base-content uppercase tracking-wider">Recent Jobs</h2>
          <div class="flex items-center gap-2">
            <button
              v-if="hasStalledJobs"
              class="btn btn-warning btn-xs"
              :disabled="resettingStalled"
              @click="resetStalled"
            >
              <span v-if="resettingStalled" class="loading loading-spinner loading-xs"></span>
              Reset Stalled
            </button>
            <button class="btn btn-ghost btn-xs" @click="fetchJobs">Refresh</button>
          </div>
        </div>

        <!-- Loading -->
        <div v-if="jobsLoading" class="flex items-center justify-center py-12">
          <span class="loading loading-spinner loading-md text-primary"></span>
        </div>

        <!-- Jobs Table -->
        <div v-else-if="jobs.length > 0" class="overflow-x-auto">
          <table class="w-full">
            <thead>
              <tr class="border-b border-base-300/50">
                <th class="text-left py-3 px-6 text-xs font-medium text-base-content/50 uppercase tracking-wider">Type</th>
                <th class="text-left py-3 px-6 text-xs font-medium text-base-content/50 uppercase tracking-wider">Status</th>
                <th class="text-left py-3 px-6 text-xs font-medium text-base-content/50 uppercase tracking-wider">Progress</th>
                <th class="text-left py-3 px-6 text-xs font-medium text-base-content/50 uppercase tracking-wider">Started</th>
                <th class="text-left py-3 px-6 text-xs font-medium text-base-content/50 uppercase tracking-wider">Completed</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="job in jobs"
                :key="job.id"
                class="border-b border-base-300/30 last:border-b-0"
              >
                <td class="py-3 px-6">
                  <span class="badge badge-sm badge-outline">{{ job.type }}</span>
                </td>
                <td class="py-3 px-6">
                  <div class="flex items-center gap-2">
                    <span class="badge badge-sm" :class="jobStatusClass(job.status)">{{ jobStatusLabel(job.status) }}</span>
                    <span v-if="jobStage(job.status)" class="text-xs text-base-content/50 font-medium uppercase tracking-wider">
                      {{ jobStage(job.status) }}
                    </span>
                  </div>
                </td>
                <td class="py-3 px-6">
                  <div class="flex items-center gap-2">
                    <span class="text-sm text-base-content">{{ job.completedCount || 0 }}</span>
                    <span class="text-sm text-base-content/40">/</span>
                    <span class="text-sm text-base-content/60">{{ job.totalCount || 0 }}</span>
                    <span v-if="job.failedCount" class="text-xs text-error">({{ job.failedCount }} failed)</span>
                    <span v-if="job.totalCount && job.status.startsWith('running')" class="text-xs text-base-content/40">
                      ({{ Math.round(((job.completedCount || 0) / job.totalCount) * 100) }}%)
                    </span>
                  </div>
                </td>
                <td class="py-3 px-6">
                  <span v-if="job.startedAt" class="text-sm text-base-content/70">{{ formatDateTime(job.startedAt) }}</span>
                  <span v-else class="text-sm text-base-content/40">&mdash;</span>
                </td>
                <td class="py-3 px-6">
                  <span v-if="job.completedAt" class="text-sm text-base-content/70">{{ formatDateTime(job.completedAt) }}</span>
                  <span v-else class="text-sm text-base-content/40">&mdash;</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Empty -->
        <div v-else class="flex flex-col items-center justify-center py-12 text-center px-6">
          <h3 class="text-lg text-base-content/60 mb-1" style="font-family: 'Instrument Serif', serif;">No Jobs Yet</h3>
          <p class="text-sm text-base-content/40">Scrape jobs will appear here after you run the pipeline</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'

definePageMeta({
  layout: 'admin'
})

interface Stats {
  publishers: { total: number; wordpress: number; byStatus: Record<string, number> }
  contacts: { total: number; withEmail: number }
  outreach: { total: number }
  networks: Array<{ slug: string; name: string; publisherCount: number; lastFetchedAt: string | null }>
}

interface ScrapeJob {
  id: number
  type: string
  status: string
  totalCount: number
  completedCount: number
  failedCount: number
  startedAt: string | null
  completedAt: string | null
  createdAt: string
  updatedAt: string | null
}

const stats = ref<Stats | null>(null)
const jobs = ref<ScrapeJob[]>([])
const jobsLoading = ref(false)
let pollInterval: ReturnType<typeof setInterval> | null = null

const hasRunningJobs = computed(() => jobs.value.some((j) => j.status.startsWith('running')))
const hasStalledJobs = computed(() => {
  const oneMinuteAgo = new Date(Date.now() - 60 * 1000).toISOString()
  return jobs.value.some((j) => j.status.startsWith('running') && j.updatedAt && j.updatedAt < oneMinuteAgo)
})
const resettingStalled = ref(false)

const fetchStats = async () => {
  try {
    stats.value = await $fetch<Stats>('/api/admin/pipeline/stats')
  } catch {
    // Non-critical
  }
}

const fetchJobs = async () => {
  jobsLoading.value = true
  try {
    const response = await $fetch<{ data: ScrapeJob[] }>('/api/admin/pipeline/jobs?limit=20')
    jobs.value = response.data

    // Auto-poll: start polling when running jobs exist, stop when they finish
    if (hasRunningJobs.value && !pollInterval) {
      pollInterval = setInterval(async () => {
        try {
          const resp = await $fetch<{ data: ScrapeJob[] }>('/api/admin/pipeline/jobs?limit=20')
          jobs.value = resp.data
          // Also refresh stats while jobs are running
          await fetchStats()
        } catch { /* ignore */ }

        // Stop polling when no more running jobs
        if (!hasRunningJobs.value && pollInterval) {
          clearInterval(pollInterval)
          pollInterval = null
        }
      }, 3000)
    }
  } catch {
    // Non-critical
  } finally {
    jobsLoading.value = false
  }
}

const resetStalled = async () => {
  resettingStalled.value = true
  try {
    await $fetch('/api/admin/pipeline/reset-stalled', { method: 'POST' })
    await fetchJobs()
  } catch {
    // ignore
  } finally {
    resettingStalled.value = false
  }
}

const jobStatusClass = (status: string): string => {
  if (status.startsWith('running')) return 'badge-info badge-outline'
  const map: Record<string, string> = {
    queued: 'badge-ghost',
    completed: 'badge-success badge-outline',
    failed: 'badge-error badge-outline',
  }
  return map[status] || 'badge-ghost'
}

const jobStatusLabel = (status: string): string => {
  if (status.startsWith('running')) return 'running'
  return status
}

const jobStage = (status: string): string | null => {
  if (!status.includes(':')) return null
  const stage = status.split(':')[1]
  const labels: Record<string, string> = {
    probe: 'Probing WordPress',
    enrich: 'Enriching',
    contacts: 'Scraping Contacts',
  }
  return labels[stage || ''] || stage || null
}

const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
}

const formatDateTime = (dateString: string): string => {
  return new Date(dateString).toLocaleString('en-US', {
    month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit',
  })
}

onMounted(() => {
  fetchStats()
  fetchJobs()
})

onUnmounted(() => {
  if (pollInterval) {
    clearInterval(pollInterval)
    pollInterval = null
  }
})
</script>
