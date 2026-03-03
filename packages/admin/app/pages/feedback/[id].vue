<template>
  <div class="min-h-screen">
    <div class="px-6 py-8 max-w-[1200px] mx-auto">
      <!-- Back button -->
      <div class="mb-6">
        <NuxtLink to="/feedback" class="btn btn-ghost btn-sm gap-2">
          <svg class="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
          </svg>
          Back to Feedback
        </NuxtLink>
      </div>

      <!-- Loading -->
      <div v-if="loading" class="flex items-center justify-center py-16">
        <div class="flex flex-col items-center gap-4">
          <span class="loading loading-spinner loading-lg text-primary"></span>
          <p class="text-sm text-base-content/50">Loading report...</p>
        </div>
      </div>

      <!-- Error -->
      <div v-else-if="error" class="flex items-center justify-center py-16">
        <div class="max-w-md text-center space-y-4">
          <h3 class="text-xl text-base-content" style="font-family: 'Instrument Serif', serif;">Failed to Load Report</h3>
          <p class="text-sm text-base-content/60">{{ error }}</p>
          <button class="btn btn-outline btn-sm" @click="fetchReport">Try Again</button>
        </div>
      </div>

      <!-- Report Detail -->
      <div v-else-if="report">
        <!-- Header -->
        <div class="mb-8">
          <div class="flex items-center gap-2 text-xs font-medium tracking-widest uppercase mb-2">
            <span class="text-base-content/50">Feedback</span>
            <span class="text-base-content/30">/</span>
            <span class="text-base-content/50">#{{ report.id }}</span>
          </div>
          <div class="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h1 class="text-3xl text-base-content" style="font-family: 'Instrument Serif', serif; font-weight: 400; letter-spacing: -0.02em; line-height: 1.1;">
                {{ report.site_name || 'Unknown Site' }}
              </h1>
              <p class="text-base-content/60 mt-1">
                Reported {{ formatDate(report.createdAt) }}
                <span v-if="report.site_url" class="text-base-content/40"> &middot; {{ report.site_url }}</span>
              </p>
            </div>
            <span class="badge badge-lg" :class="getStatusBadgeClass(report.status)">
              {{ report.status }}
            </span>
          </div>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <!-- Main content (2 cols) -->
          <div class="lg:col-span-2 space-y-6">
            <!-- Error Details -->
            <div class="bg-base-100 rounded-xl border border-base-300/50 shadow-sm p-6">
              <h2 class="text-lg font-semibold text-base-content mb-4" style="font-family: 'Instrument Serif', serif;">Error Details</h2>
              <div class="space-y-4">
                <div>
                  <label class="text-xs font-medium text-base-content/50 uppercase tracking-wider">Error Message</label>
                  <pre class="mt-1 p-4 bg-base-200 rounded-lg text-sm overflow-auto max-h-[200px] whitespace-pre-wrap break-words font-mono">{{ report.error_message }}</pre>
                </div>
                <div v-if="report.stack_trace">
                  <label class="text-xs font-medium text-base-content/50 uppercase tracking-wider">Stack Trace</label>
                  <pre class="mt-1 p-4 bg-base-200 rounded-lg text-xs overflow-auto max-h-[300px] whitespace-pre-wrap break-words font-mono">{{ report.stack_trace }}</pre>
                </div>
                <div v-if="report.component_stack">
                  <label class="text-xs font-medium text-base-content/50 uppercase tracking-wider">Component Stack</label>
                  <pre class="mt-1 p-4 bg-base-200 rounded-lg text-xs overflow-auto max-h-[200px] whitespace-pre-wrap break-words font-mono">{{ report.component_stack }}</pre>
                </div>
              </div>
            </div>

            <!-- User Message -->
            <div v-if="report.user_message" class="bg-base-100 rounded-xl border border-base-300/50 shadow-sm p-6">
              <h2 class="text-lg font-semibold text-base-content mb-4" style="font-family: 'Instrument Serif', serif;">User Message</h2>
              <p class="text-base-content/80 whitespace-pre-wrap">{{ report.user_message }}</p>
            </div>

            <!-- Screenshot -->
            <div v-if="report.screenshot_base64" class="bg-base-100 rounded-xl border border-base-300/50 shadow-sm p-6">
              <h2 class="text-lg font-semibold text-base-content mb-4" style="font-family: 'Instrument Serif', serif;">Screenshot</h2>
              <img
                :src="report.screenshot_base64"
                alt="Error screenshot"
                class="max-w-full rounded-lg border border-base-300/50"
              />
            </div>
          </div>

          <!-- Sidebar (1 col) -->
          <div class="space-y-6">
            <!-- Environment Info -->
            <div class="bg-base-100 rounded-xl border border-base-300/50 shadow-sm p-6">
              <h2 class="text-lg font-semibold text-base-content mb-4" style="font-family: 'Instrument Serif', serif;">Environment</h2>
              <dl class="space-y-3">
                <div v-if="report.create_version">
                  <dt class="text-xs font-medium text-base-content/50 uppercase tracking-wider">Create Version</dt>
                  <dd class="text-sm text-base-content mt-0.5">{{ report.create_version }}</dd>
                </div>
                <div v-if="report.wp_version">
                  <dt class="text-xs font-medium text-base-content/50 uppercase tracking-wider">WordPress</dt>
                  <dd class="text-sm text-base-content mt-0.5">{{ report.wp_version }}</dd>
                </div>
                <div v-if="report.php_version">
                  <dt class="text-xs font-medium text-base-content/50 uppercase tracking-wider">PHP</dt>
                  <dd class="text-sm text-base-content mt-0.5">{{ report.php_version }}</dd>
                </div>
                <div v-if="report.current_url">
                  <dt class="text-xs font-medium text-base-content/50 uppercase tracking-wider">URL</dt>
                  <dd class="text-sm text-base-content mt-0.5 break-all">{{ report.current_url }}</dd>
                </div>
                <div v-if="report.browser_info">
                  <dt class="text-xs font-medium text-base-content/50 uppercase tracking-wider">Browser</dt>
                  <dd class="text-xs text-base-content/70 mt-0.5 break-all">{{ parseBrowserInfo(report.browser_info) }}</dd>
                </div>
              </dl>
            </div>

            <!-- Copy All -->
            <div class="bg-base-100 rounded-xl border border-base-300/50 shadow-sm p-6">
              <button
                class="btn btn-outline btn-sm w-full gap-2"
                @click="copyAll"
              >
                <svg v-if="!copySuccess" class="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                <svg v-else class="size-4 text-success" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                </svg>
                {{ copySuccess ? 'Copied!' : 'Copy All Details' }}
              </button>
            </div>

            <!-- Status Controls -->
            <div class="bg-base-100 rounded-xl border border-base-300/50 shadow-sm p-6">
              <h2 class="text-lg font-semibold text-base-content mb-4" style="font-family: 'Instrument Serif', serif;">Manage</h2>
              <div class="space-y-4">
                <div class="form-control">
                  <label class="label">
                    <span class="label-text text-xs font-medium uppercase tracking-wider">Status</span>
                  </label>
                  <select v-model="editStatus" class="select select-bordered select-sm w-full">
                    <option value="new">New</option>
                    <option value="acknowledged">Acknowledged</option>
                    <option value="resolved">Resolved</option>
                  </select>
                </div>
                <div class="form-control">
                  <label class="label">
                    <span class="label-text text-xs font-medium uppercase tracking-wider">Admin Notes</span>
                  </label>
                  <textarea
                    v-model="editNotes"
                    class="textarea textarea-bordered w-full h-24 text-sm"
                    placeholder="Internal notes about this report..."
                  ></textarea>
                </div>
                <button
                  class="btn btn-primary btn-sm w-full"
                  :disabled="saving"
                  @click="saveChanges"
                >
                  <span v-if="saving" class="loading loading-spinner loading-xs"></span>
                  Save Changes
                </button>
                <p v-if="saveSuccess" class="text-xs text-success text-center">Saved successfully</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'

definePageMeta({
  layout: 'admin'
})

interface BrowserInfo {
  userAgent: string
  platform: string
  language: string
}

interface FeedbackReportDetail {
  id: number
  site_id: number
  error_message: string
  stack_trace: string | null
  component_stack: string | null
  create_version: string | null
  wp_version: string | null
  php_version: string | null
  browser_info: BrowserInfo | string | null
  current_url: string | null
  user_message: string | null
  screenshot_base64: string | null
  status: string
  admin_notes: string | null
  createdAt: string
  updatedAt: string
  site_name: string | null
  site_url: string | null
}

const route = useRoute()
const report = ref<FeedbackReportDetail | null>(null)
const loading = ref(false)
const error = ref<string | null>(null)
const saving = ref(false)
const saveSuccess = ref(false)
const copySuccess = ref(false)

const editStatus = ref('new')
const editNotes = ref('')

const fetchReport = async () => {
  loading.value = true
  error.value = null

  try {
    const id = route.params.id
    const data = await $fetch<FeedbackReportDetail>(`/api/admin/feedback/${id}`)
    report.value = data
    editStatus.value = data.status
    editNotes.value = data.admin_notes || ''
  } catch (err: any) {
    console.error('Failed to fetch feedback report:', err)
    error.value = err?.data?.message || 'Failed to load report.'
  } finally {
    loading.value = false
  }
}

const saveChanges = async () => {
  if (!report.value) return
  saving.value = true
  saveSuccess.value = false

  try {
    await $fetch(`/api/admin/feedback/${report.value.id}`, {
      method: 'PATCH',
      body: {
        status: editStatus.value,
        admin_notes: editNotes.value,
      },
    })
    report.value.status = editStatus.value
    report.value.admin_notes = editNotes.value
    saveSuccess.value = true
    setTimeout(() => { saveSuccess.value = false }, 3000)
  } catch (err: any) {
    console.error('Failed to update report:', err)
    alert(err?.data?.message || 'Failed to save changes.')
  } finally {
    saving.value = false
  }
}

const copyAll = async () => {
  if (!report.value) return
  const r = report.value

  const lines = [
    `Feedback Report #${r.id}`,
    `${'='.repeat(40)}`,
    ``,
    `Site:             ${r.site_name || 'Unknown'}`,
    `Site URL:         ${r.site_url || 'N/A'}`,
    `Status:           ${r.status}`,
    `Reported:         ${formatDate(r.createdAt)}`,
    ``,
    `--- Environment ---`,
    `Create Version:   ${r.create_version || 'N/A'}`,
    `WordPress:        ${r.wp_version || 'N/A'}`,
    `PHP:              ${r.php_version || 'N/A'}`,
    `Page URL:         ${r.current_url || 'N/A'}`,
    `Browser:          ${parseBrowserInfo(r.browser_info)}`,
    ``,
    `--- Error ---`,
    r.error_message,
  ]

  if (r.stack_trace) {
    lines.push(``, `--- Stack Trace ---`, r.stack_trace)
  }

  if (r.component_stack) {
    lines.push(``, `--- Component Stack ---`, r.component_stack)
  }

  if (r.user_message) {
    lines.push(``, `--- User Message ---`, r.user_message)
  }

  if (r.admin_notes) {
    lines.push(``, `--- Admin Notes ---`, r.admin_notes)
  }

  await navigator.clipboard.writeText(lines.join('\n'))
  copySuccess.value = true
  setTimeout(() => { copySuccess.value = false }, 2000)
}

onMounted(() => {
  fetchReport()
})

const formatDate = (dateString: string): string => {
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

const parseBrowserInfo = (info: BrowserInfo | string | null): string => {
  if (!info) return 'Unknown'
  if (typeof info === 'string') {
    try {
      const parsed = JSON.parse(info) as BrowserInfo
      return parsed.userAgent || 'Unknown'
    } catch {
      return info
    }
  }
  return info.userAgent || 'Unknown'
}

const getStatusBadgeClass = (status: string): string => {
  const map: Record<string, string> = {
    new: 'badge-info',
    acknowledged: 'badge-warning',
    resolved: 'badge-success',
  }
  return map[status] || 'badge-ghost'
}
</script>
