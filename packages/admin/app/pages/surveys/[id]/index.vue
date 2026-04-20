<template>
  <div class="min-h-screen">
    <div class="px-6 py-8 max-w-[1400px] mx-auto">
      <!-- Header -->
      <div class="mb-8">
        <div class="flex items-center gap-2 text-xs font-medium tracking-widest uppercase mb-2">
          <NuxtLink to="/surveys" class="text-base-content/50 hover:text-base-content transition-colors">Surveys</NuxtLink>
          <span class="text-base-content/30">&middot;</span>
          <span class="text-base-content/40">Results</span>
        </div>
        <div class="flex items-center justify-between">
          <div>
            <h1 class="text-4xl text-base-content" style="font-family: 'Instrument Serif', serif; font-weight: 400; letter-spacing: -0.02em; line-height: 1.1;">
              {{ surveyInfo?.title || 'Survey Results' }}
            </h1>
            <p v-if="surveyInfo" class="text-base-content/60 mt-2">
              <span class="font-mono text-sm">{{ surveyInfo.slug }}</span>
              &middot;
              <span class="badge badge-sm" :class="surveyInfo.status === 'active' ? 'badge-success' : 'badge-ghost'">{{ surveyInfo.status }}</span>
            </p>
          </div>
          <button
            v-if="responses.length"
            class="btn btn-sm btn-outline gap-2"
            :disabled="exporting"
            @click="exportCsv"
          >
            <span v-if="exporting" class="loading loading-spinner loading-xs"></span>
            <svg v-else class="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            {{ exporting ? 'Exporting...' : 'Export CSV' }}
          </button>
        </div>
      </div>

      <!-- NPS Stats -->
      <div v-if="stats" class="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
        <div class="bg-base-100 rounded-xl border border-base-300/50 p-5 shadow-sm">
          <div class="text-xs font-medium text-base-content/50 uppercase tracking-wider mb-1">Responses</div>
          <div class="text-3xl text-base-content" style="font-family: 'Instrument Serif', serif;">{{ stats.completed }}</div>
        </div>
        <div class="bg-base-100 rounded-xl border border-base-300/50 p-5 shadow-sm">
          <div class="text-xs font-medium text-base-content/50 uppercase tracking-wider mb-1">NPS Score</div>
          <div class="text-3xl" :class="{
            'text-success': stats.nps.score > 30,
            'text-warning': stats.nps.score >= 0 && stats.nps.score <= 30,
            'text-error': stats.nps.score < 0,
          }" style="font-family: 'Instrument Serif', serif;">{{ stats.nps.score }}</div>
          <div class="text-xs text-base-content/40 mt-1">avg {{ stats.nps.average }}/10</div>
        </div>
        <div class="bg-base-100 rounded-xl border border-base-300/50 p-5 shadow-sm">
          <div class="text-xs font-medium text-base-content/50 uppercase tracking-wider mb-1">Promoters</div>
          <div class="text-3xl text-success" style="font-family: 'Instrument Serif', serif;">{{ stats.nps.promoters }}</div>
          <div class="text-xs text-base-content/40 mt-1">9-10</div>
        </div>
        <div class="bg-base-100 rounded-xl border border-base-300/50 p-5 shadow-sm">
          <div class="text-xs font-medium text-base-content/50 uppercase tracking-wider mb-1">Passives</div>
          <div class="text-3xl text-warning" style="font-family: 'Instrument Serif', serif;">{{ stats.nps.passives }}</div>
          <div class="text-xs text-base-content/40 mt-1">7-8</div>
        </div>
        <div class="bg-base-100 rounded-xl border border-base-300/50 p-5 shadow-sm">
          <div class="text-xs font-medium text-base-content/50 uppercase tracking-wider mb-1">Detractors</div>
          <div class="text-3xl text-error" style="font-family: 'Instrument Serif', serif;">{{ stats.nps.detractors }}</div>
          <div class="text-xs text-base-content/40 mt-1">0-6</div>
        </div>
      </div>

      <!-- Responses Table Card -->
      <div class="bg-base-100 rounded-xl border border-base-300/50 shadow-sm hover:shadow-md hover:border-base-300 transition-all duration-300">
        <!-- Loading -->
        <div v-if="loading" class="flex items-center justify-center py-16">
          <div class="flex flex-col items-center gap-4">
            <span class="loading loading-spinner loading-lg text-primary"></span>
            <p class="text-sm text-base-content/50 font-light tracking-wide">Loading survey responses...</p>
          </div>
        </div>

        <!-- Error -->
        <div v-else-if="error" class="flex items-center justify-center py-16">
          <div class="max-w-md text-center space-y-6">
            <div class="inline-flex items-center justify-center w-16 h-16 rounded-full bg-error/10 border border-error/20">
              <svg class="w-8 h-8 text-error" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div class="space-y-2">
              <h3 class="text-xl text-base-content" style="font-family: 'Instrument Serif', serif;">Unable to Load Responses</h3>
              <p class="text-sm text-base-content/60 leading-relaxed">{{ error }}</p>
            </div>
            <button class="btn btn-outline btn-sm" @click="fetchSurvey">Try Again</button>
          </div>
        </div>

        <!-- Table -->
        <div v-else-if="responses.length > 0">
          <div class="overflow-x-auto">
            <table class="w-full">
              <thead>
                <tr class="border-b border-base-300/50">
                  <th class="text-left py-4 px-6 text-xs font-medium text-base-content/50 uppercase tracking-wider w-10"></th>
                  <th class="text-left py-4 px-6 text-xs font-medium text-base-content/50 uppercase tracking-wider">Date</th>
                  <th class="text-left py-4 px-6 text-xs font-medium text-base-content/50 uppercase tracking-wider">NPS</th>
                  <th class="text-left py-4 px-6 text-xs font-medium text-base-content/50 uppercase tracking-wider">Site Type</th>
                  <th class="text-left py-4 px-6 text-xs font-medium text-base-content/50 uppercase tracking-wider">Traffic</th>
                  <th class="text-left py-4 px-6 text-xs font-medium text-base-content/50 uppercase tracking-wider">Ad Network</th>
                  <th class="text-left py-4 px-6 text-xs font-medium text-base-content/50 uppercase tracking-wider">Email</th>
                  <th class="text-left py-4 px-6 text-xs font-medium text-base-content/50 uppercase tracking-wider">Site</th>
                  <th class="text-left py-4 px-6 text-xs font-medium text-base-content/50 uppercase tracking-wider">Follow-up</th>
                </tr>
              </thead>
              <tbody>
                <template v-for="response in responses" :key="response.id">
                  <tr
                    class="border-b border-base-300/30 last:border-b-0 hover:bg-base-50 transition-colors cursor-pointer"
                    @click="toggleExpand(response.id)"
                  >
                    <td class="py-4 px-6">
                      <span class="text-base-content/40 text-xs">{{ expandedIds.has(response.id) ? '▼' : '▶' }}</span>
                    </td>
                    <td class="py-4 px-6">
                      <span class="text-sm text-base-content/70">{{ formatDate(response.createdAt) }}</span>
                    </td>
                    <td class="py-4 px-6">
                      <span
                        v-if="response.response_data?.nps_score != null"
                        class="badge badge-sm"
                        :class="getNpsClass(response.response_data.nps_score)"
                      >
                        {{ response.response_data.nps_score }} &middot; {{ getNpsLabel(response.response_data.nps_score) }}
                      </span>
                    </td>
                    <td class="py-4 px-6">
                      <span class="text-sm text-base-content">{{ response.response_data?.site_type || '—' }}</span>
                    </td>
                    <td class="py-4 px-6">
                      <span class="text-sm text-base-content/70">{{ response.response_data?.monthly_sessions || '—' }}</span>
                    </td>
                    <td class="py-4 px-6">
                      <span class="text-sm text-base-content/70">{{ response.response_data?.ad_network || '—' }}</span>
                    </td>
                    <td class="py-4 px-6">
                      <span class="text-sm text-base-content/70">{{ response.respondent_email || '—' }}</span>
                    </td>
                    <td class="py-4 px-6">
                      <div v-if="response.site_url" class="flex flex-col text-sm">
                        <span class="text-base-content truncate max-w-[200px]">{{ response.site_name || response.site_url }}</span>
                        <span v-if="response.site_name" class="text-xs text-base-content/50 truncate max-w-[200px]">{{ response.site_url }}</span>
                      </div>
                      <span v-else class="text-base-content/40 text-sm">—</span>
                    </td>
                    <td class="py-4 px-6">
                      <span
                        v-if="response.response_data?.followup_call_optin === 'Yes'"
                        class="badge badge-success badge-sm"
                      >Yes</span>
                      <span v-else class="text-base-content/40 text-sm">No</span>
                    </td>
                  </tr>
                  <!-- Expanded Detail Row -->
                  <tr v-if="expandedIds.has(response.id)">
                    <td colspan="9" class="bg-base-200/50 px-6 py-5 border-b border-base-300/30">
                      <div class="grid gap-x-8 gap-y-3 md:grid-cols-2 lg:grid-cols-3">
                        <div v-for="(value, key) in response.response_data" :key="key">
                          <div class="text-xs font-medium text-base-content/40 uppercase tracking-wider mb-0.5">
                            {{ String(key).replace(/_/g, ' ') }}
                          </div>
                          <div class="text-sm text-base-content">
                            {{ Array.isArray(value) ? value.join(', ') : value }}
                          </div>
                        </div>
                      </div>
                    </td>
                  </tr>
                </template>
              </tbody>
            </table>
          </div>

          <!-- Pagination -->
          <div v-if="pagination.totalPages > 1" class="border-t border-base-300/50 px-6 py-4 flex items-center justify-between">
            <div class="text-base-content/60 text-sm">
              Showing {{ startIndex + 1 }} to {{ Math.min(endIndex, pagination.total) }} of {{ pagination.total }}
            </div>
            <div class="flex items-center gap-2">
              <button class="btn btn-sm btn-ghost" :disabled="pagination.page === 1" @click="goToPage(pagination.page - 1)">Prev</button>
              <button
                v-for="p in visiblePages"
                :key="p"
                class="btn btn-sm"
                :class="p === pagination.page ? 'btn-primary' : 'btn-ghost'"
                @click="goToPage(p)"
              >
                {{ p }}
              </button>
              <button class="btn btn-sm btn-ghost" :disabled="pagination.page === pagination.totalPages" @click="goToPage(pagination.page + 1)">Next</button>
            </div>
          </div>
        </div>

        <!-- Empty -->
        <div v-else class="flex flex-col items-center justify-center py-16 text-center">
          <div class="inline-flex items-center justify-center w-16 h-16 rounded-full bg-base-200 text-base-content/30 mb-4">
            <svg class="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </div>
          <h3 class="text-lg text-base-content mb-1" style="font-family: 'Instrument Serif', serif;">No Responses Yet</h3>
          <p class="text-sm text-base-content/50">Share the survey link with publishers to start collecting responses</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'

definePageMeta({
  layout: 'admin',
})

const route = useRoute()
const surveyId = route.params.id as string

interface SurveyResponse {
  id: number
  survey_id: number
  user_id: number | null
  site_id: number | null
  respondent_email: string | null
  response_data: Record<string, any> | null
  completed: boolean
  createdAt: string
  site_name: string | null
  site_url: string | null
}

interface Pagination {
  page: number
  limit: number
  total: number
  totalPages: number
}

const loading = ref(false)
const error = ref<string | null>(null)
const surveyInfo = ref<any>(null)
const stats = ref<any>(null)
const responses = ref<SurveyResponse[]>([])
const pagination = ref<Pagination>({ page: 1, limit: 50, total: 0, totalPages: 0 })
const expandedIds = ref(new Set<number>())

const startIndex = computed(() => (pagination.value.page - 1) * pagination.value.limit)
const endIndex = computed(() => startIndex.value + pagination.value.limit)

const visiblePages = computed(() => {
  const pages: number[] = []
  const maxVisible = 5
  let start = Math.max(1, pagination.value.page - Math.floor(maxVisible / 2))
  const end = Math.min(pagination.value.totalPages, start + maxVisible - 1)
  if (end - start < maxVisible - 1) {
    start = Math.max(1, end - maxVisible + 1)
  }
  for (let i = start; i <= end; i++) pages.push(i)
  return pages
})

function toggleExpand(id: number) {
  if (expandedIds.value.has(id)) {
    expandedIds.value.delete(id)
  } else {
    expandedIds.value.add(id)
  }
}

function getNpsLabel(score: number) {
  if (score >= 9) return 'Promoter'
  if (score >= 7) return 'Passive'
  return 'Detractor'
}

function getNpsClass(score: number) {
  if (score >= 9) return 'badge-success'
  if (score >= 7) return 'badge-warning'
  return 'badge-error'
}

function formatDate(dateString: string): string {
  if (!dateString) return '—'
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  if (diffDays === 0) return 'Today'
  if (diffDays === 1) return 'Yesterday'
  if (diffDays < 7) return `${diffDays} days ago`
  return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
}

async function fetchSurvey() {
  loading.value = true
  error.value = null

  try {
    const params = new URLSearchParams()
    params.append('page', pagination.value.page.toString())
    params.append('limit', pagination.value.limit.toString())

    const res = await $fetch<any>(`/api/admin/surveys/${surveyId}?${params.toString()}`)
    surveyInfo.value = res.survey
    stats.value = res.stats
    responses.value = res.responses
    pagination.value = res.pagination
  } catch (err: any) {
    console.error('Failed to fetch survey:', err)
    error.value = err?.data?.message || 'Failed to load survey responses'
  } finally {
    loading.value = false
  }
}

function goToPage(page: number) {
  if (page >= 1 && page <= pagination.value.totalPages) {
    pagination.value.page = page
    fetchSurvey()
  }
}

const exporting = ref(false)

async function exportCsv() {
  if (exporting.value) return
  exporting.value = true

  try {
    // Fetch ALL responses (the table view is paginated — but export should cover everything)
    const params = new URLSearchParams()
    params.append('page', '1')
    params.append('limit', '1000')
    const res = await $fetch<{ responses: SurveyResponse[]; pagination: Pagination }>(
      `/api/admin/surveys/${surveyId}?${params.toString()}`
    )
    const all = res.responses || []
    if (!all.length) return

    const allKeys = new Set<string>()
    all.forEach(r => {
      if (r.response_data) Object.keys(r.response_data).forEach(k => allKeys.add(k))
    })

    const headers = ['id', 'email', 'site', 'completed', 'createdAt', ...Array.from(allKeys)]
    const rows = all.map(r => {
      const row: string[] = [
        String(r.id),
        r.respondent_email || '',
        r.site_url || '',
        String(r.completed),
        r.createdAt || '',
      ]
      allKeys.forEach(k => {
        const val = r.response_data?.[k]
        row.push(Array.isArray(val) ? val.join('; ') : String(val ?? ''))
      })
      return row
    })

    const csv = [
      headers.join(','),
      ...rows.map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')),
    ].join('\n')

    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `survey-${surveyId}-responses-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  } catch (err) {
    console.error('CSV export failed:', err)
  } finally {
    exporting.value = false
  }
}

onMounted(fetchSurvey)
</script>
