<template>
  <div class="min-h-screen">
    <div class="px-6 py-8 max-w-[1400px] mx-auto">
      <!-- Header -->
      <div class="mb-8">
        <div class="flex items-center gap-2 text-xs font-medium tracking-widest uppercase mb-2">
          <NuxtLink to="/surveys" class="text-base-content/50 hover:text-base-content transition-colors">Surveys</NuxtLink>
          <span class="text-base-content/30">&middot;</span>
          <span class="text-base-content/40">New</span>
        </div>
        <div class="flex items-center justify-between">
          <h1 class="text-4xl text-base-content" style="font-family: 'Instrument Serif', serif; font-weight: 400; letter-spacing: -0.02em; line-height: 1.1;">
            New Survey
          </h1>
          <div class="flex items-center gap-2">
            <NuxtLink to="/surveys" class="btn btn-sm btn-ghost">Cancel</NuxtLink>
            <button
              class="btn btn-sm btn-primary gap-2"
              :disabled="!canSubmit || submitting"
              @click="submit"
            >
              <span v-if="submitting" class="loading loading-spinner loading-xs"></span>
              Create Survey
            </button>
          </div>
        </div>
      </div>

      <!-- Submit error -->
      <div v-if="submitError" class="alert alert-error mb-4">
        <span>{{ submitError }}</span>
      </div>

      <!-- Form Card -->
      <div class="bg-base-100 rounded-xl border border-base-300/50 shadow-sm p-6 space-y-6">
        <!-- Slug -->
        <div>
          <label class="block text-xs font-medium text-base-content/60 uppercase tracking-wider mb-2">Slug</label>
          <input
            v-model="form.slug"
            type="text"
            class="input input-bordered w-full font-mono text-sm"
            :class="{ 'input-error': slugError }"
            placeholder="my-survey-slug"
          />
          <p v-if="slugError" class="text-xs text-error mt-1">{{ slugError }}</p>
        </div>

        <!-- Title -->
        <div>
          <label class="block text-xs font-medium text-base-content/60 uppercase tracking-wider mb-2">Title</label>
          <input
            v-model="form.title"
            type="text"
            class="input input-bordered w-full"
            placeholder="Survey title"
          />
        </div>

        <!-- Description -->
        <div>
          <label class="block text-xs font-medium text-base-content/60 uppercase tracking-wider mb-2">Description</label>
          <textarea
            v-model="form.description"
            class="textarea textarea-bordered w-full"
            rows="3"
            placeholder="Optional description"
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

        <!-- Promotion JSON -->
        <div>
          <label class="block text-xs font-medium text-base-content/60 uppercase tracking-wider mb-2">Promotion (JSON)</label>
          <textarea
            v-model="promotionText"
            class="textarea textarea-bordered w-full"
            :class="{ 'textarea-error': promotionError }"
            rows="5"
            style="font-family: ui-monospace, monospace; font-size: 0.8125rem;"
          ></textarea>
          <p v-if="promotionError" class="text-xs text-error mt-1">{{ promotionError }}</p>
        </div>

        <!-- Definition JSON -->
        <div>
          <label class="block text-xs font-medium text-base-content/60 uppercase tracking-wider mb-2">Definition (SurveyJS JSON)</label>
          <textarea
            v-model="definitionText"
            class="textarea textarea-bordered w-full min-h-[480px]"
            :class="{ 'textarea-error': definitionError }"
            rows="20"
            style="font-family: ui-monospace, monospace; font-size: 0.8125rem;"
          ></textarea>
          <p v-if="definitionError" class="text-xs text-error mt-1">{{ definitionError }}</p>
          <p v-else class="text-xs text-base-content/50 mt-1">Must be a valid SurveyJS JSON object with a <code class="font-mono">pages</code> array.</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, reactive } from 'vue'

definePageMeta({
  layout: 'admin',
})

const STARTER_DEFINITION = {
  title: '',
  description: '',
  showProgressBar: 'top',
  progressBarType: 'questions',
  pages: [
    {
      name: 'page1',
      elements: [],
    },
  ],
}

const form = reactive({
  slug: '',
  title: '',
  description: '',
  status: 'draft',
  requires_auth: false,
})

const promotionText = ref(JSON.stringify({}, null, 2))
const definitionText = ref(JSON.stringify(STARTER_DEFINITION, null, 2))

const submitting = ref(false)
const submitError = ref<string | null>(null)
const slugConflictError = ref<string | null>(null)

const SLUG_RE = /^[a-z0-9-]+$/
const slugError = computed<string | null>(() => {
  if (slugConflictError.value) return slugConflictError.value
  const s = form.slug.trim()
  if (!s) return null // Empty is OK until submit — don't nag immediately
  if (!SLUG_RE.test(s)) return 'Slug can only contain lowercase letters, numbers, and hyphens'
  return null
})

const parsedPromotion = computed(() => {
  try {
    return { ok: true as const, value: JSON.parse(promotionText.value) }
  } catch (err: any) {
    return { ok: false as const, error: err?.message || 'Invalid JSON' }
  }
})

const parsedDefinition = computed(() => {
  try {
    return { ok: true as const, value: JSON.parse(definitionText.value) }
  } catch (err: any) {
    return { ok: false as const, error: err?.message || 'Invalid JSON' }
  }
})

const promotionError = computed(() => {
  if (!parsedPromotion.value.ok) return parsedPromotion.value.error
  const val = parsedPromotion.value.value
  if (val === null || typeof val !== 'object' || Array.isArray(val)) {
    return 'Promotion must be a JSON object'
  }
  return null
})

const definitionError = computed(() => {
  if (!parsedDefinition.value.ok) return parsedDefinition.value.error
  const val = parsedDefinition.value.value
  if (val === null || typeof val !== 'object' || Array.isArray(val)) {
    return 'Definition must be a JSON object'
  }
  if (!Array.isArray(val.pages)) {
    return 'Definition must include a "pages" array'
  }
  return null
})

const canSubmit = computed(() => {
  return (
    form.slug.trim().length > 0 &&
    SLUG_RE.test(form.slug.trim()) &&
    form.title.trim().length > 0 &&
    !promotionError.value &&
    !definitionError.value
  )
})

async function submit() {
  if (!canSubmit.value || submitting.value) return
  submitting.value = true
  submitError.value = null
  slugConflictError.value = null

  try {
    const body: Record<string, any> = {
      slug: form.slug.trim(),
      title: form.title.trim(),
      status: form.status,
      requires_auth: form.requires_auth,
      definition: parsedDefinition.value.ok ? parsedDefinition.value.value : undefined,
      promotion: parsedPromotion.value.ok ? parsedPromotion.value.value : undefined,
    }
    if (form.description.trim()) {
      body.description = form.description.trim()
    }

    const response = await $fetch<{ data: { id: number } }>('/api/admin/surveys', {
      method: 'POST',
      body,
    })

    await navigateTo(`/surveys/${response.data.id}/edit`)
  } catch (err: any) {
    const status = err?.statusCode || err?.response?.status
    if (status === 409) {
      slugConflictError.value = 'This slug is already taken'
    } else {
      submitError.value = err?.data?.message || err?.message || 'Failed to create survey'
    }
  } finally {
    submitting.value = false
  }
}
</script>
