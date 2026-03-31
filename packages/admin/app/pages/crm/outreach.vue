<template>
  <div class="min-h-screen">
    <div class="px-6 py-8 max-w-[1400px] mx-auto">
      <!-- Page Header -->
      <div class="mb-8">
        <div class="flex items-center gap-2 text-xs font-medium tracking-widest uppercase mb-2">
          <span class="text-base-content/50">CRM</span>
          <span class="text-base-content/30">&middot;</span>
          <span class="text-base-content/40">Contact Management</span>
        </div>
        <div class="flex items-center justify-between">
          <h1 class="text-4xl text-base-content" style="font-family: 'Instrument Serif', serif; font-weight: 400; letter-spacing: -0.02em; line-height: 1.1;">
            Outreach
          </h1>
          <button
            class="btn btn-primary btn-sm"
            :disabled="generating"
            @click="generateOutreach"
          >
            <span v-if="generating" class="loading loading-spinner loading-xs"></span>
            <SparklesIcon v-else class="w-4 h-4" />
            {{ generating ? 'Generating...' : 'Generate Outreach' }}
          </button>
        </div>
      </div>

      <!-- Sub Navigation -->
      <div class="flex gap-1 mb-6">
        <NuxtLink to="/crm/leads" class="btn btn-sm btn-ghost">Leads</NuxtLink>
        <NuxtLink to="/crm/outreach" class="btn btn-sm btn-primary">Outreach</NuxtLink>
        <NuxtLink to="/crm/pipeline" class="btn btn-sm btn-ghost">Pipeline</NuxtLink>
      </div>

      <!-- Segment Tabs -->
      <div class="flex flex-wrap gap-1 mb-6">
        <button
          class="btn btn-sm"
          :class="segmentFilter === null ? 'btn-primary' : 'btn-ghost'"
          @click="setSegmentFilter(null)"
        >
          All
          <span v-if="segmentCounts" class="ml-1 text-xs opacity-60">({{ totalCount }})</span>
        </button>
        <button
          v-for="seg in segmentTabs"
          :key="seg.value"
          class="btn btn-sm"
          :class="segmentFilter === seg.value ? 'btn-primary' : 'btn-ghost'"
          @click="setSegmentFilter(seg.value)"
        >
          {{ seg.label }}
          <span v-if="segmentCounts" class="ml-1 text-xs opacity-60">({{ segmentCounts[seg.value] || 0 }})</span>
        </button>
      </div>

      <!-- Filters -->
      <div class="bg-base-100 rounded-xl border border-base-300/50 p-6 shadow-sm mb-6">
        <div class="flex flex-col sm:flex-row gap-4">
          <div class="flex-1">
            <AdminSearchInput
              v-model="searchQuery"
              placeholder="Search by name, email, or domain..."
              :debounce="300"
              @search="handleSearch"
            />
          </div>
        </div>
      </div>

      <!-- Outreach Table -->
      <div class="bg-base-100 rounded-xl border border-base-300/50 shadow-sm hover:shadow-md hover:border-base-300 transition-all duration-300">
        <!-- Loading -->
        <div v-if="loading" class="flex items-center justify-center py-16">
          <div class="flex flex-col items-center gap-4">
            <span class="loading loading-spinner loading-lg text-primary"></span>
            <p class="text-sm text-base-content/50 font-light tracking-wide">Loading outreach records...</p>
          </div>
        </div>

        <!-- Error -->
        <div v-else-if="error" class="flex flex-col items-center justify-center py-16 text-center px-6">
          <div class="inline-flex items-center justify-center w-16 h-16 rounded-full bg-error/10 border border-error/20 mb-4">
            <ExclamationCircleIcon class="w-8 h-8 text-error" />
          </div>
          <h3 class="text-xl text-base-content mb-2" style="font-family: 'Instrument Serif', serif;">Unable to Load Outreach</h3>
          <p class="text-sm text-base-content/60 mb-4">{{ error }}</p>
          <button class="btn btn-outline btn-sm" @click="fetchOutreach">Try Again</button>
        </div>

        <!-- Table -->
        <div v-else-if="outreachRecords.length > 0">
          <div class="overflow-x-auto">
            <table class="w-full">
              <thead>
                <tr class="border-b border-base-300/50">
                  <th class="text-left py-4 px-6 text-xs font-medium text-base-content/50 uppercase tracking-wider">Contact</th>
                  <th class="text-left py-4 px-6 text-xs font-medium text-base-content/50 uppercase tracking-wider">Segment</th>
                  <th class="text-left py-4 px-6 text-xs font-medium text-base-content/50 uppercase tracking-wider">Stage</th>
                  <th class="text-left py-4 px-6 text-xs font-medium text-base-content/50 uppercase tracking-wider">Rating</th>
                  <th class="text-left py-4 px-6 text-xs font-medium text-base-content/50 uppercase tracking-wider">Notes</th>
                  <th class="text-left py-4 px-6 text-xs font-medium text-base-content/50 uppercase tracking-wider">Updated</th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="record in outreachRecords"
                  :key="record.id"
                  class="border-b border-base-300/30 last:border-b-0 hover:bg-base-50 transition-colors cursor-pointer"
                  @click="openDrawer(record)"
                >
                  <!-- Contact -->
                  <td class="py-4 px-6">
                    <div class="flex items-center gap-3">
                      <img
                        v-if="record.contactEmail"
                        :src="getGravatarUrl(record.contactEmail, 32)"
                        class="w-8 h-8 rounded-full flex-shrink-0"
                        alt=""
                      />
                      <div class="w-8 h-8 rounded-full bg-base-200 flex items-center justify-center flex-shrink-0" v-else>
                        <UserIcon class="w-4 h-4 text-base-content/30" />
                      </div>
                      <div class="min-w-0">
                        <div class="font-medium text-base-content truncate">{{ record.contactName || 'Unknown' }}</div>
                        <div class="text-xs text-base-content/50 truncate">
                          <span v-if="record.contactEmail">{{ record.contactEmail }}</span>
                          <span v-if="record.contactEmail && record.publisherDomain"> &middot; </span>
                          <span v-if="record.publisherDomain">{{ record.publisherDomain }}</span>
                        </div>
                      </div>
                    </div>
                  </td>

                  <!-- Segment -->
                  <td class="py-4 px-6">
                    <span v-if="record.segment" class="badge badge-sm" :class="segmentBadgeClass(record.segment)">
                      {{ segmentLabel(record.segment) }}
                    </span>
                    <span v-else class="text-sm text-base-content/40">&mdash;</span>
                  </td>

                  <!-- Stage (pipeline dots) -->
                  <td class="py-4 px-6">
                    <div class="flex items-center gap-0">
                      <template v-for="(s, idx) in stages" :key="s">
                        <div
                          class="w-2.5 h-2.5 rounded-full"
                          :class="stageIndex(record.stage) >= idx ? 'bg-primary' : 'bg-base-300'"
                          :title="s"
                        ></div>
                        <div
                          v-if="idx < stages.length - 1"
                          class="w-3 h-0.5"
                          :class="stageIndex(record.stage) > idx ? 'bg-primary' : 'bg-base-300'"
                        ></div>
                      </template>
                    </div>
                  </td>

                  <!-- Rating -->
                  <td class="py-4 px-6">
                    <div v-if="record.rating" class="text-sm text-amber-500 tracking-tight">
                      <span v-for="i in 5" :key="i">{{ i <= record.rating ? '\u2605' : '\u2606' }}</span>
                    </div>
                    <span v-else class="text-sm text-base-content/40">&mdash;</span>
                  </td>

                  <!-- Notes -->
                  <td class="py-4 px-6">
                    <span v-if="record.notes" class="text-sm text-base-content/70 truncate block max-w-[200px]">
                      {{ record.notes.length > 30 ? record.notes.slice(0, 30) + '...' : record.notes }}
                    </span>
                    <span v-else class="text-sm text-base-content/40">&mdash;</span>
                  </td>

                  <!-- Updated -->
                  <td class="py-4 px-6">
                    <span v-if="record.updatedAt" class="text-sm text-base-content/70">{{ relativeDate(record.updatedAt) }}</span>
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
              Showing {{ startIndex + 1 }} to {{ Math.min(endIndex, pagination.total) }} of {{ pagination.total.toLocaleString() }} records
            </div>
            <div class="flex items-center gap-2">
              <button
                class="btn btn-sm btn-ghost"
                :disabled="pagination.page === 1"
                @click="handlePageChange(pagination.page - 1)"
                aria-label="Previous page"
              >
                <ChevronLeftIcon class="size-4" />
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
                <ChevronRightIcon class="size-4" />
              </button>
            </div>
          </div>
        </div>

        <!-- Empty State -->
        <div v-else class="flex flex-col items-center justify-center py-16 text-center px-6">
          <div class="inline-flex items-center justify-center w-16 h-16 rounded-full bg-base-200 text-base-content/30 mb-4">
            <EnvelopeIcon class="w-8 h-8" />
          </div>
          <h3 class="text-xl text-base-content mb-2" style="font-family: 'Instrument Serif', serif;">No Outreach Records</h3>
          <p class="text-sm text-base-content/50 mb-4">Generate outreach records from your enriched leads to start tracking contact stages.</p>
          <button class="btn btn-primary btn-sm" :disabled="generating" @click="generateOutreach">
            Generate Outreach
          </button>
        </div>
      </div>

      <!-- Toast -->
      <div v-if="toastMessage" class="toast toast-end toast-bottom">
        <div class="alert" :class="toastMessage.success ? 'alert-success' : 'alert-error'">
          <span>{{ toastMessage.message }}</span>
          <button class="btn btn-ghost btn-xs" @click="toastMessage = null">
            <XMarkIcon class="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>

    <!-- Drawer Overlay -->
    <Transition name="fade">
      <div
        v-if="drawerOpen"
        class="fixed inset-0 bg-black/30 z-30"
        @click="closeDrawer"
      ></div>
    </Transition>

    <!-- Outreach Detail Drawer -->
    <div
      class="fixed top-0 right-0 w-[520px] max-w-full h-screen bg-base-100 border-l border-base-300 z-[31] flex flex-col transition-transform duration-250 ease-out overflow-y-auto"
      :class="drawerOpen ? 'translate-x-0' : 'translate-x-full'"
    >
      <template v-if="selectedRecord">
        <!-- Drawer Header -->
        <div class="px-6 py-5 border-b border-base-300/50 flex items-center justify-between sticky top-0 bg-base-100 z-[1]">
          <div class="min-w-0">
            <div class="text-lg font-semibold text-base-content truncate">
              {{ selectedRecord.contactName || 'Unknown Contact' }}
            </div>
            <p v-if="selectedRecord.contactEmail" class="text-sm text-base-content/50 truncate">{{ selectedRecord.contactEmail }}</p>
          </div>
          <button class="btn btn-ghost btn-sm btn-square flex-shrink-0" @click="closeDrawer">
            <XMarkIcon class="w-5 h-5" />
          </button>
        </div>

        <!-- Drawer Body -->
        <div class="p-6 flex-1 space-y-6">
          <!-- Contact Info -->
          <div>
            <div class="text-xs font-medium text-base-content/50 uppercase tracking-wider mb-2">Contact</div>
            <div class="bg-base-200/50 rounded-lg p-3 flex items-start gap-3">
              <img
                v-if="selectedRecord.contactEmail"
                :src="getGravatarUrl(selectedRecord.contactEmail, 48)"
                class="w-12 h-12 rounded-full flex-shrink-0"
                alt=""
              />
              <div class="w-12 h-12 rounded-full bg-base-200 flex items-center justify-center flex-shrink-0" v-else>
                <UserIcon class="w-6 h-6 text-base-content/30" />
              </div>
              <div class="space-y-1 min-w-0">
                <div class="font-medium text-base-content text-sm">
                  {{ selectedRecord.contactName || 'Unknown' }}
                </div>
                <div v-if="selectedRecord.contactEmail" class="flex items-center gap-2">
                  <EnvelopeIcon class="w-3.5 h-3.5 text-base-content/40 flex-shrink-0" />
                  <a :href="`mailto:${selectedRecord.contactEmail}`" class="text-sm text-primary hover:underline">
                    {{ selectedRecord.contactEmail }}
                  </a>
                </div>
                <div v-if="selectedRecord.publisherDomain" class="flex items-center gap-2">
                  <GlobeAltIcon class="w-3.5 h-3.5 text-base-content/40 flex-shrink-0" />
                  <a :href="`https://${selectedRecord.publisherDomain}`" target="_blank" rel="noopener noreferrer" class="text-sm text-primary hover:underline flex items-center gap-1">
                    {{ selectedRecord.publisherDomain }}
                    <LinkIcon class="w-3 h-3 text-base-content/30" />
                  </a>
                </div>
                <div class="flex items-center gap-2 mt-1">
                  <span v-if="selectedRecord.segment" class="badge badge-sm" :class="segmentBadgeClass(selectedRecord.segment)">
                    {{ segmentLabel(selectedRecord.segment) }}
                  </span>
                  <span v-if="selectedRecord.contactSource" class="badge badge-sm badge-outline">
                    {{ selectedRecord.contactSource.replace(/_/g, ' ') }}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <!-- Create Studio -->
          <div v-if="selectedRecord.publisherStudioData">
            <div class="text-xs font-medium text-base-content/50 uppercase tracking-wider mb-2">Create Studio</div>
            <div class="bg-primary/5 border border-primary/20 rounded-lg p-3 space-y-2">
              <div class="flex items-center justify-between">
                <span class="text-sm font-medium text-base-content">Create User</span>
                <div class="flex gap-1.5">
                  <span v-if="selectedRecord.publisherStudioData.isActive" class="badge badge-xs badge-success">Active</span>
                  <span v-else class="badge badge-xs badge-ghost">Inactive</span>
                  <span v-if="selectedRecord.publisherStudioData.isLegacy" class="badge badge-xs badge-warning">Legacy</span>
                  <span v-else class="badge badge-xs badge-info">v2.0+</span>
                </div>
              </div>
              <div class="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span class="text-base-content/40">Version</span>
                  <div class="font-medium text-base-content">{{ selectedRecord.publisherStudioData.createVersion || 'Unknown' }}</div>
                </div>
                <div>
                  <span class="text-base-content/40">Subscription</span>
                  <div class="font-medium text-base-content capitalize">{{ selectedRecord.publisherStudioData.subscriptionTier || 'Free' }}</div>
                </div>
              </div>
            </div>
          </div>

          <!-- Stage Selector -->
          <div>
            <div class="text-xs font-medium text-base-content/50 uppercase tracking-wider mb-3">Stage</div>
            <div class="flex items-center gap-0">
              <template v-for="(s, idx) in stages" :key="s">
                <button
                  class="flex flex-col items-center gap-1 group"
                  @click="updateStage(s)"
                  :title="s"
                >
                  <div
                    class="w-4 h-4 rounded-full border-2 transition-colors cursor-pointer"
                    :class="stageIndex(selectedRecord.stage) >= idx
                      ? 'bg-primary border-primary'
                      : 'bg-base-100 border-base-300 group-hover:border-primary/50'"
                  ></div>
                  <span class="text-[10px] text-base-content/50 capitalize">{{ s }}</span>
                </button>
                <div
                  v-if="idx < stages.length - 1"
                  class="w-8 h-0.5 mb-4"
                  :class="stageIndex(selectedRecord.stage) > idx ? 'bg-primary' : 'bg-base-300'"
                ></div>
              </template>
            </div>
          </div>

          <!-- Rating -->
          <div>
            <div class="text-xs font-medium text-base-content/50 uppercase tracking-wider mb-2">Rating</div>
            <div class="flex items-center gap-1">
              <button
                v-for="i in 5"
                :key="i"
                class="text-2xl transition-colors cursor-pointer hover:scale-110"
                :class="i <= (selectedRecord.rating || 0) ? 'text-amber-500' : 'text-base-300 hover:text-amber-300'"
                @click="updateRating(i)"
              >
                {{ i <= (selectedRecord.rating || 0) ? '\u2605' : '\u2606' }}
              </button>
            </div>
          </div>

          <!-- Notes -->
          <div>
            <div class="text-xs font-medium text-base-content/50 uppercase tracking-wider mb-2">Notes</div>
            <textarea
              v-model="drawerNotes"
              class="textarea textarea-bordered w-full min-h-[120px] text-sm"
              placeholder="Add notes about this contact..."
              @blur="saveNotes"
            ></textarea>
          </div>

          <!-- Publisher Link -->
          <div v-if="selectedRecord.publisherId">
            <NuxtLink
              :to="`/crm/leads?publisher=${selectedRecord.publisherId}`"
              class="text-sm text-primary hover:underline flex items-center gap-1"
            >
              View in Leads
              <ChevronRightIcon class="w-4 h-4" />
            </NuxtLink>
          </div>
        </div>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { getGravatarUrl } from '~/composables/useAvatar'
import {
  SparklesIcon,
  GlobeAltIcon,
  EnvelopeIcon,
  XMarkIcon,
  ExclamationCircleIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  LinkIcon,
  UserIcon,
} from '@heroicons/vue/24/outline'

definePageMeta({
  layout: 'admin'
})

interface OutreachRecord {
  id: number
  contactType: string
  publisherId: number | null
  userId: number | null
  segment: string | null
  status: string
  stage: string
  rating: number | null
  notes: string | null
  lastContactedAt: string | null
  createdAt: string
  updatedAt: string | null
  // Joined fields
  publisherDomain: string | null
  publisherSiteName: string | null
  publisherSiteCategory: string | null
  publisherStudioData: any | null
  contactEmail: string | null
  contactName: string | null
  contactSource: string | null
}

interface Pagination {
  page: number
  limit: number
  total: number
  totalPages: number
}

const stages = ['queued', 'contacted', 'responded', 'engaged'] as const

const segmentTabs = [
  { value: 'legacy', label: 'Legacy' },
  { value: 'current', label: 'v2.0+' },
  { value: 'pro', label: 'Pro' },
  { value: 'inactive', label: 'Inactive' },
  { value: 'wprm', label: 'WPRM' },
  { value: 'competitor', label: 'Competitor' },
  { value: 'no_recipe_plugin', label: 'No Recipe' },
  { value: 'other', label: 'Other' },
]

// State
const outreachRecords = ref<OutreachRecord[]>([])
const pagination = ref<Pagination>({ page: 1, limit: 50, total: 0, totalPages: 0 })
const segmentCounts = ref<Record<string, number> | null>(null)
const loading = ref(false)
const error = ref<string | null>(null)
const generating = ref(false)
const toastMessage = ref<{ success: boolean; message: string } | null>(null)

// Filters
const searchQuery = ref('')
const segmentFilter = ref<string | null>(null)

// Drawer
const drawerOpen = ref(false)
const selectedRecord = ref<OutreachRecord | null>(null)
const drawerNotes = ref('')

// Pagination helpers
const startIndex = computed(() => (pagination.value.page - 1) * pagination.value.limit)
const endIndex = computed(() => startIndex.value + pagination.value.limit)

const totalCount = computed(() => {
  if (!segmentCounts.value) return 0
  return Object.values(segmentCounts.value).reduce((sum, n) => sum + n, 0)
})

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

// Helpers
const segmentBadgeClass = (segment: string): string => {
  const map: Record<string, string> = {
    legacy: 'badge-error',
    current: 'badge-info',
    pro: 'badge-primary',
    inactive: 'badge-ghost',
    wprm: 'badge-success',
    competitor: 'badge-warning',
    no_recipe_plugin: 'badge-accent',
    other: 'badge-ghost',
  }
  return map[segment] || 'badge-ghost'
}

const segmentLabel = (segment: string): string => {
  const map: Record<string, string> = {
    legacy: 'Legacy',
    current: 'v2.0+',
    pro: 'Pro',
    inactive: 'Inactive',
    wprm: 'WPRM',
    competitor: 'Competitor',
    no_recipe_plugin: 'No Recipe',
    other: 'Other',
  }
  return map[segment] || segment
}

const stageIndex = (stage: string): number => {
  return stages.indexOf(stage as typeof stages[number])
}

const relativeDate = (dateString: string): string => {
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 1) return 'just now'
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays < 7) return `${diffDays}d ago`
  if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`
  return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
}

const setSegmentFilter = (value: string | null) => {
  segmentFilter.value = value
  pagination.value.page = 1
  fetchOutreach()
}

// Data fetching
const fetchOutreach = async () => {
  loading.value = true
  error.value = null

  try {
    const params = new URLSearchParams()
    params.append('page', pagination.value.page.toString())
    params.append('limit', '50')
    if (segmentFilter.value) params.append('segment', segmentFilter.value)
    if (searchQuery.value) params.append('search', searchQuery.value)

    const response = await $fetch<{
      data: OutreachRecord[]
      pagination: Pagination
      segmentCounts: Record<string, number>
    }>(`/api/admin/pipeline/outreach?${params}`)

    outreachRecords.value = response.data
    pagination.value = response.pagination
    segmentCounts.value = response.segmentCounts
  } catch (err: any) {
    error.value = err?.data?.message || 'Failed to load outreach records.'
  } finally {
    loading.value = false
  }
}

const generateOutreach = async () => {
  generating.value = true
  toastMessage.value = null

  try {
    const result = await $fetch<{ success: boolean; message?: string; generated?: number }>(
      '/api/admin/pipeline/outreach/generate',
      { method: 'POST' }
    )

    toastMessage.value = {
      success: true,
      message: result.message || `Generated ${result.generated || 0} outreach records.`,
    }

    await fetchOutreach()
  } catch (err: any) {
    toastMessage.value = {
      success: false,
      message: err?.data?.message || 'Failed to generate outreach records.',
    }
  } finally {
    generating.value = false
  }
}

const patchRecord = async (id: number, data: Partial<OutreachRecord>) => {
  try {
    const updated = await $fetch<OutreachRecord>(`/api/admin/pipeline/outreach/${id}`, {
      method: 'PATCH',
      body: data,
    })

    // Update in list
    const idx = outreachRecords.value.findIndex(r => r.id === id)
    if (idx !== -1) {
      outreachRecords.value[idx] = { ...outreachRecords.value[idx], ...updated }
    }

    // Update selected record
    if (selectedRecord.value?.id === id) {
      selectedRecord.value = { ...selectedRecord.value, ...updated }
    }
  } catch (err: any) {
    toastMessage.value = {
      success: false,
      message: err?.data?.message || 'Failed to update record.',
    }
  }
}

const updateStage = (stage: string) => {
  if (!selectedRecord.value) return
  selectedRecord.value = { ...selectedRecord.value, stage }
  patchRecord(selectedRecord.value.id, { stage } as Partial<OutreachRecord>)
}

const updateRating = (rating: number) => {
  if (!selectedRecord.value) return
  selectedRecord.value = { ...selectedRecord.value, rating }
  patchRecord(selectedRecord.value.id, { rating } as Partial<OutreachRecord>)
}

const saveNotes = () => {
  if (!selectedRecord.value) return
  if (drawerNotes.value === (selectedRecord.value.notes || '')) return
  selectedRecord.value = { ...selectedRecord.value, notes: drawerNotes.value }
  patchRecord(selectedRecord.value.id, { notes: drawerNotes.value } as Partial<OutreachRecord>)
}

// Drawer
const openDrawer = (record: OutreachRecord) => {
  selectedRecord.value = record
  drawerNotes.value = record.notes || ''
  drawerOpen.value = true
}

const closeDrawer = () => {
  drawerOpen.value = false
}

// Handlers
const handleSearch = () => { pagination.value.page = 1; fetchOutreach() }
const handlePageChange = (page: number) => {
  if (page >= 1 && page <= pagination.value.totalPages) {
    pagination.value.page = page
    fetchOutreach()
  }
}

// Watchers
watch(searchQuery, () => {
  pagination.value.page = 1
  fetchOutreach()
})

onMounted(() => {
  fetchOutreach()
})
</script>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
