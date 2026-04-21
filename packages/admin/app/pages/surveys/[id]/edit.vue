<template>
  <div class="min-h-screen">
    <div class="px-6 py-8 max-w-[1400px] mx-auto">
      <!-- Header -->
      <div class="mb-8">
        <div class="flex items-center gap-2 text-xs font-medium tracking-widest uppercase mb-2">
          <NuxtLink to="/surveys" class="text-base-content/50 hover:text-base-content transition-colors">Surveys</NuxtLink>
          <span class="text-base-content/30">&middot;</span>
          <span class="text-base-content/40">Edit</span>
        </div>
        <div class="flex items-center justify-between gap-4">
          <h1 class="text-4xl text-base-content" style="font-family: 'Instrument Serif', serif; font-weight: 400; letter-spacing: -0.02em; line-height: 1.1;">
            Edit Survey
          </h1>
          <div v-if="survey" class="flex items-center gap-2">
            <a
              :href="previewUrl"
              target="_blank"
              rel="noopener noreferrer"
              class="btn btn-sm btn-outline gap-2"
            >
              <svg class="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
              Preview
            </a>
            <button class="btn btn-sm btn-error btn-outline gap-2" @click="deleteModalOpen = true">
              <svg class="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              Delete
            </button>
          </div>
        </div>
      </div>

      <!-- Loading -->
      <div v-if="loading" class="flex items-center justify-center py-16">
        <div class="flex flex-col items-center gap-4">
          <span class="loading loading-spinner loading-lg text-primary"></span>
          <p class="text-sm text-base-content/50 font-light tracking-wide">Loading survey...</p>
        </div>
      </div>

      <!-- Not Found -->
      <div v-else-if="notFound" class="bg-base-100 rounded-xl border border-base-300/50 p-10 shadow-sm flex flex-col items-center justify-center text-center">
        <div class="inline-flex items-center justify-center w-16 h-16 rounded-full bg-base-200 text-base-content/30 mb-4">
          <svg class="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h3 class="text-xl text-base-content mb-2" style="font-family: 'Instrument Serif', serif;">Survey not found</h3>
        <NuxtLink to="/surveys" class="btn btn-sm btn-outline mt-4">Back to Surveys</NuxtLink>
      </div>

      <!-- Error (non-404) -->
      <div v-else-if="loadError" class="alert alert-error mb-6">
        <span>{{ loadError }}</span>
      </div>

      <!-- Form -->
      <div v-else-if="survey" class="space-y-4">
        <!-- Save error -->
        <div v-if="saveError" class="alert alert-error">
          <span>{{ saveError }}</span>
        </div>

        <div class="bg-base-100 rounded-xl border border-base-300/50 p-6 shadow-sm">
          <div class="space-y-6">
            <!-- Slug -->
            <div>
              <label class="block text-xs font-medium text-base-content/60 uppercase tracking-wider mb-2">Slug</label>
              <input
                v-model="form.slug"
                type="text"
                required
                class="input input-bordered w-full font-mono text-sm"
                :class="{ 'input-error': slugError }"
                placeholder="publisher-feedback"
              />
              <p v-if="slugError" class="text-xs text-error mt-1">{{ slugError }}</p>
            </div>

            <!-- Title -->
            <div>
              <label class="block text-xs font-medium text-base-content/60 uppercase tracking-wider mb-2">Title</label>
              <input
                v-model="form.title"
                type="text"
                required
                class="input input-bordered w-full"
                placeholder="Publisher Feedback Survey"
              />
            </div>

            <!-- Description -->
            <div>
              <label class="block text-xs font-medium text-base-content/60 uppercase tracking-wider mb-2">Description</label>
              <textarea
                v-model="form.description"
                rows="3"
                class="textarea textarea-bordered w-full"
                placeholder="Brief description of what this survey is for..."
              ></textarea>
            </div>

            <!-- Status -->
            <div>
              <label class="block text-xs font-medium text-base-content/60 uppercase tracking-wider mb-2">Status</label>
              <select v-model="form.status" class="select select-bordered w-full max-w-xs">
                <option value="draft">Draft</option>
                <option value="active">Active</option>
                <option value="closed">Closed</option>
              </select>
            </div>

            <!-- Requires Auth toggle -->
            <div>
              <label class="cursor-pointer flex items-start gap-3">
                <input
                  v-model="form.requires_auth"
                  type="checkbox"
                  class="toggle toggle-primary mt-0.5"
                />
                <div class="flex-1">
                  <div class="text-sm font-medium text-base-content">Requires Create account</div>
                  <div class="text-xs text-base-content/60 mt-0.5">
                    When enabled, only logged-in Create Studio users can take this survey. Responses will be linked to the user's account and selected site.
                  </div>
                </div>
              </label>
            </div>

            <!-- Max completions -->
            <div>
              <label class="block text-xs font-medium text-base-content/60 uppercase tracking-wider mb-2">Completion Limit</label>
              <div class="flex items-center gap-3">
                <input
                  v-model="form.max_completions"
                  type="number"
                  min="1"
                  step="1"
                  class="input input-bordered w-40"
                  :class="{ 'input-error': maxCompletionsError }"
                  placeholder="Unlimited"
                />
                <span v-if="completedSoFar !== null && form.max_completions" class="text-xs text-base-content/60">
                  {{ completedSoFar }} completed &middot;
                  <span :class="spotsLeft !== null && spotsLeft <= 0 ? 'text-error font-semibold' : ''">
                    {{ spotsLeft !== null && spotsLeft > 0 ? `${spotsLeft} spot${spotsLeft === 1 ? '' : 's'} left` : 'limit reached' }}
                  </span>
                </span>
              </div>
              <p v-if="maxCompletionsError" class="text-xs text-error mt-1">{{ maxCompletionsError }}</p>
              <p v-else class="text-xs text-base-content/50 mt-1">
                Leave blank for unlimited. When set, the public survey page shows "X spots left" and blocks new submissions once the cap is reached.
              </p>
            </div>

            <!-- Promotion JSON -->
            <div>
              <label class="block text-xs font-medium text-base-content/60 uppercase tracking-wider mb-2">Promotion (JSON)</label>
              <textarea
                v-model="form.promotion"
                rows="5"
                class="textarea textarea-bordered w-full"
                :class="{ 'textarea-error': promotionError }"
                style="font-family: ui-monospace, monospace; font-size: 0.8125rem;"
                placeholder='{ "discount": "50% off", "delivery": "Code shown on thank-you screen" }'
                @blur="validatePromotion"
              ></textarea>
              <p v-if="promotionError" class="text-xs text-error mt-1">{{ promotionError }}</p>
            </div>

            <!-- Definition JSON -->
            <div>
              <label class="block text-xs font-medium text-base-content/60 uppercase tracking-wider mb-2">Definition (SurveyJS JSON)</label>
              <textarea
                v-model="form.definition"
                rows="20"
                class="textarea textarea-bordered w-full min-h-[480px]"
                :class="{ 'textarea-error': definitionError }"
                style="font-family: ui-monospace, monospace; font-size: 0.8125rem;"
                @blur="validateDefinition"
              ></textarea>
              <p v-if="definitionError" class="text-xs text-error mt-1">{{ definitionError }}</p>
              <p v-else class="text-xs text-base-content/50 mt-1">Must be a valid SurveyJS JSON object with a <code class="font-mono">pages</code> array.</p>
            </div>

            <!-- Save -->
            <div class="flex justify-end pt-2">
              <button
                class="btn btn-primary gap-2"
                :disabled="!canSave || saving"
                @click="save"
              >
                <span v-if="saving" class="loading loading-spinner loading-xs"></span>
                {{ saving ? 'Saving...' : 'Save' }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Toast -->
    <div v-if="showToast" class="alert alert-success fixed bottom-4 right-4 w-auto shadow-lg">
      <svg class="size-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
      </svg>
      <span>Survey saved</span>
    </div>

    <!-- Delete Modal -->
    <dialog class="modal" :class="{ 'modal-open': deleteModalOpen }">
      <div class="modal-box">
        <h3 class="text-2xl mb-2" style="font-family: 'Instrument Serif', serif;">Delete this survey?</h3>
        <p class="text-base-content/70 text-sm">This will remove all responses. This action cannot be undone.</p>
        <div v-if="deleteError" class="alert alert-error mt-4">
          <span>{{ deleteError }}</span>
        </div>
        <div class="modal-action">
          <button class="btn btn-ghost" :disabled="deleting" @click="deleteModalOpen = false">Cancel</button>
          <button class="btn btn-error gap-2" :disabled="deleting" @click="confirmDelete">
            <span v-if="deleting" class="loading loading-spinner loading-xs"></span>
            {{ deleting ? 'Deleting...' : 'Delete Survey' }}
          </button>
        </div>
      </div>
      <div class="modal-backdrop" @click="deleteModalOpen = false"></div>
    </dialog>
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

interface Survey {
  id: number
  slug: string
  title: string
  description: string | null
  status: string
  promotion: unknown
  definition: unknown
  requires_auth: boolean
  max_completions: number | null
  createdAt: string
}

const loading = ref(true)
const notFound = ref(false)
const loadError = ref<string | null>(null)
const survey = ref<Survey | null>(null)
const completedSoFar = ref<number | null>(null)

const form = ref({
  slug: '',
  title: '',
  description: '',
  status: 'draft',
  requires_auth: false,
  max_completions: '' as string | number,
  promotion: '',
  definition: '',
})

const promotionError = ref<string | null>(null)
const definitionError = ref<string | null>(null)

const saving = ref(false)
const saveError = ref<string | null>(null)
const showToast = ref(false)

const deleteModalOpen = ref(false)
const deleting = ref(false)
const deleteError = ref<string | null>(null)

const runtimeConfig = useRuntimeConfig()
const previewUrl = computed(() => {
  const base = (runtimeConfig.public?.mainAppUrl as string) || 'https://create.studio'
  return `${base.replace(/\/$/, '')}/survey/${form.value.slug}`
})

const SLUG_RE = /^[a-z0-9-]+$/
const slugError = computed<string | null>(() => {
  const s = form.value.slug.trim()
  if (!s) return 'Slug is required'
  if (!SLUG_RE.test(s)) return 'Slug can only contain lowercase letters, numbers, and hyphens'
  return null
})
const maxCompletionsError = computed<string | null>(() => {
  const raw = form.value.max_completions
  if (raw === '' || raw === null || raw === undefined) return null
  const n = Number(raw)
  if (!Number.isInteger(n) || n < 1) return 'Must be a whole number 1 or greater'
  return null
})
const spotsLeft = computed<number | null>(() => {
  const raw = form.value.max_completions
  if (raw === '' || raw === null || raw === undefined) return null
  const n = Number(raw)
  if (!Number.isInteger(n) || n < 1) return null
  if (completedSoFar.value === null) return null
  return Math.max(0, n - completedSoFar.value)
})
const canSave = computed(() => {
  if (!form.value.title.trim()) return false
  if (slugError.value) return false
  if (maxCompletionsError.value) return false
  return !promotionError.value && !definitionError.value
})

function formatJson(value: unknown): string {
  if (value == null) return ''
  if (typeof value === 'string') {
    try {
      return JSON.stringify(JSON.parse(value), null, 2)
    } catch {
      return value
    }
  }
  return JSON.stringify(value, null, 2)
}

function validatePromotion() {
  const val = form.value.promotion.trim()
  if (!val) {
    promotionError.value = null
    return
  }
  try {
    JSON.parse(val)
    promotionError.value = null
  } catch (err: any) {
    promotionError.value = `Invalid JSON: ${err.message}`
  }
}

function validateDefinition() {
  const val = form.value.definition.trim()
  if (!val) {
    definitionError.value = 'Definition is required'
    return
  }
  try {
    const parsed = JSON.parse(val)
    if (!parsed || typeof parsed !== 'object' || !Array.isArray((parsed as any).pages)) {
      definitionError.value = 'Definition must be an object with a `pages` array'
      return
    }
    definitionError.value = null
  } catch (err: any) {
    definitionError.value = `Invalid JSON: ${err.message}`
  }
}

async function fetchSurvey() {
  loading.value = true
  notFound.value = false
  loadError.value = null

  try {
    const res = await $fetch<{ survey: Survey; stats?: { completed: number } }>(`/api/admin/surveys/${surveyId}`)
    survey.value = res.survey
    completedSoFar.value = res.stats?.completed ?? null
    form.value = {
      slug: res.survey.slug || '',
      title: res.survey.title || '',
      description: res.survey.description || '',
      status: res.survey.status || 'draft',
      requires_auth: !!res.survey.requires_auth,
      max_completions: res.survey.max_completions ?? '',
      promotion: formatJson(res.survey.promotion),
      definition: formatJson(res.survey.definition),
    }
    validatePromotion()
    validateDefinition()
  } catch (err: any) {
    if (err?.statusCode === 404 || err?.status === 404) {
      notFound.value = true
    } else {
      console.error('Failed to fetch survey:', err)
      loadError.value = err?.data?.message || 'Failed to load survey'
    }
  } finally {
    loading.value = false
  }
}

async function save() {
  validatePromotion()
  validateDefinition()
  if (!canSave.value) return

  saving.value = true
  saveError.value = null

  try {
    const body: Record<string, any> = {
      slug: form.value.slug,
      title: form.value.title,
      description: form.value.description,
      status: form.value.status,
      requires_auth: form.value.requires_auth,
      definition: JSON.parse(form.value.definition),
    }
    const promotionTrim = form.value.promotion.trim()
    body.promotion = promotionTrim ? JSON.parse(promotionTrim) : null
    body.max_completions = form.value.max_completions === '' || form.value.max_completions === null
      ? null
      : Number(form.value.max_completions)

    const res = await $fetch<{ survey: Survey }>(`/api/admin/surveys/${surveyId}`, {
      method: 'PATCH',
      body,
    })
    survey.value = res.survey
    showToast.value = true
    setTimeout(() => { showToast.value = false }, 3000)
  } catch (err: any) {
    console.error('Failed to save survey:', err)
    saveError.value = err?.data?.message || err?.statusMessage || 'Failed to save survey'
  } finally {
    saving.value = false
  }
}

async function confirmDelete() {
  deleting.value = true
  deleteError.value = null

  try {
    await $fetch(`/api/admin/surveys/${surveyId}`, { method: 'DELETE' })
    await navigateTo('/surveys')
  } catch (err: any) {
    console.error('Failed to delete survey:', err)
    deleteError.value = err?.data?.message || 'Failed to delete survey'
  } finally {
    deleting.value = false
  }
}

onMounted(fetchSurvey)
</script>
