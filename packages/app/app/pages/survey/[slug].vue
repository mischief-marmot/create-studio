<script setup lang="ts">
import { Model } from 'survey-core'
import 'survey-core/survey-core.css'

definePageMeta({
  layout: false,
})

const route = useRoute()
const slug = route.params.slug as string

const { data: surveyData, error: fetchError } = useLazyFetch(`/api/v2/surveys/${slug}`)

const { user, loggedIn } = useAuth()
const { sites, selectedSiteId, loadSites, selectSite } = useSiteContext()

const surveyModel = ref<any>(null)
const isCompleted = ref(false)
const promotion = ref<Record<string, any> | null>(null)
const submitError = ref('')
const answeredCount = ref(0)
const totalQuestions = ref(0)
const sitesLoaded = ref(false)

const survey = computed(() => surveyData.value?.survey)
const authenticated = computed(() => surveyData.value?.authenticated ?? false)
const requiresAuth = computed(() => !!survey.value?.requires_auth)

// Readiness check: for requires_auth surveys we need a logged-in user with a selected site
const authGateReady = computed(() => {
  if (!requiresAuth.value) return true
  return loggedIn.value && !!selectedSiteId.value
})

// Reason the survey can't start yet (null if all good)
const authGateBlocker = computed<'needs_login' | 'no_sites' | 'needs_site_select' | null>(() => {
  if (!requiresAuth.value) return null
  if (!loggedIn.value) return 'needs_login'
  if (sitesLoaded.value && sites.value.length === 0) return 'no_sites'
  if (sitesLoaded.value && !selectedSiteId.value) return 'needs_site_select'
  return null
})

const loginHref = computed(() => `/auth/login?redirect=${encodeURIComponent(`/survey/${slug}`)}`)

const SECONDS_PER_QUESTION = 15
const estimatedMinutesRemaining = computed(() => {
  const remaining = Math.max(0, totalQuestions.value - answeredCount.value)
  const seconds = remaining * SECONDS_PER_QUESTION
  const minutes = Math.ceil(seconds / 60)
  if (remaining === 0) return null
  if (minutes <= 1) return '< 1 min left'
  return `~${minutes} min left`
})

const progressPercent = computed(() => {
  if (!totalQuestions.value) return 0
  return Math.min(100, Math.round((answeredCount.value / totalQuestions.value) * 100))
})

const currentQuestionType = ref('')
const currentChoiceCount = ref(0)

function initSurvey(definition: Record<string, any>, surveyId: number) {
  const model = new Model(definition)

  // Typeform mode: one question at a time
  model.questionsOnPageMode = 'questionPerPage'

  const updateProgress = () => {
    const inputs = model.getAllQuestions().filter((q: any) => q.hasInput)
    totalQuestions.value = inputs.length
    answeredCount.value = inputs.filter((q: any) => !q.isEmpty()).length
  }

  const updateCurrentQuestion = () => {
    const q = model.currentPage?.questions?.[0]
    if (q) {
      currentQuestionType.value = q.getType()
      currentChoiceCount.value = q.visibleChoices?.length || 0
    }
  }

  updateProgress()

  const AUTO_ADVANCE_TYPES = new Set(['radiogroup', 'rating', 'dropdown', 'boolean'])

  model.onValueChanged.add((sender: any, options: any) => {
    updateProgress()
    const q = sender.getQuestionByName(options.name)
    if (q && AUTO_ADVANCE_TYPES.has(q.getType())) {
      setTimeout(() => {
        if (!sender.isLastPage) sender.nextPage()
      }, 350)
    }
  })

  model.onCurrentPageChanged.add(() => {
    updateProgress()
    updateCurrentQuestion()
    // Auto-focus the first interactive element on the new page
    nextTick(() => {
      setTimeout(() => {
        const el = document.querySelector<HTMLElement>(
          '.sd-question textarea, .sd-question input[type="text"], .sd-question input[type="email"], .sd-question .sd-rating__item, .sd-question .sd-selectbase__label, .sd-question input[type="radio"], .sd-question select'
        )
        el?.focus({ preventScroll: true })
      }, 400)
    })
  })

  // Keyboard shortcuts
  const handleKeyDown = (e: KeyboardEvent) => {
    if (!surveyModel.value || isCompleted.value) return
    const page = model.currentPage
    if (!page?.questions?.length) return
    const q = page.questions[0]
    const qType = q.getType()

    // Enter → advance (Shift+Enter → newline in text fields)
    if (e.key === 'Enter') {
      if ((qType === 'comment' || qType === 'text') && document.activeElement?.tagName === 'TEXTAREA') {
        if (!e.shiftKey) {
          e.preventDefault()
          if (!model.isLastPage) model.nextPage()
          else model.completeLastPage()
        }
        return
      }
      e.preventDefault()
      if (!model.isLastPage) model.nextPage()
      else model.completeLastPage()
      return
    }

    // Letter keys → radiogroup / checkbox selection
    if ((qType === 'radiogroup' || qType === 'checkbox') && e.key.length === 1 && /^[a-z]$/i.test(e.key)) {
      // Don't capture if user is typing in a text field
      if (document.activeElement?.tagName === 'TEXTAREA' || document.activeElement?.tagName === 'INPUT') return
      const idx = e.key.toLowerCase().charCodeAt(0) - 97
      const choices = q.visibleChoices
      if (idx >= 0 && idx < choices.length) {
        if (qType === 'checkbox') {
          const current = Array.isArray(q.value) ? [...q.value] : []
          const val = choices[idx].value
          const i = current.indexOf(val)
          if (i >= 0) current.splice(i, 1)
          else current.push(val)
          q.value = current
        } else {
          q.value = choices[idx].value
        }
      }
      return
    }

    // Number keys → rating
    if (qType === 'rating' && /^[0-9]$/.test(e.key)) {
      if (document.activeElement?.tagName === 'TEXTAREA' || document.activeElement?.tagName === 'INPUT') return
      const num = parseInt(e.key)
      if (num >= (q.rateMin ?? 0) && num <= (q.rateMax ?? 10)) {
        q.value = num
      }
      return
    }
  }

  document.addEventListener('keydown', handleKeyDown)
  // Clean up on unmount
  onUnmounted(() => document.removeEventListener('keydown', handleKeyDown))

  updateCurrentQuestion()

  model.onComplete.add(async (sender: any) => {
    try {
      submitError.value = ''
      const body: Record<string, any> = {
        response_data: sender.data,
        respondent_email: sender.data.followup_email || undefined,
        completed: true,
      }
      if (requiresAuth.value) {
        body.site_id = selectedSiteId.value
      }
      const response = await $fetch(`/api/v2/surveys/${surveyId}/responses`, {
        method: 'POST',
        body,
      })

      if (response.promotion) {
        promotion.value = response.promotion
      }
      isCompleted.value = true
    } catch (err: any) {
      submitError.value = err?.data?.error || 'Failed to submit survey. Please try again.'
      sender.clear(false, true) // Re-show last page so user can retry
    }
  })

  surveyModel.value = model
}

// Load the user's sites as soon as we know the survey needs auth and the user is logged in
watch([requiresAuth, loggedIn], async ([needsAuth, isLogged]) => {
  if (needsAuth && isLogged && !sitesLoaded.value && import.meta.client) {
    await loadSites()
    sitesLoaded.value = true
  }
}, { immediate: true })

// Initialize the SurveyJS model once we have everything we need
watch([survey, authGateReady], ([s, ready]) => {
  if (s?.definition && !surveyModel.value && ready && import.meta.client) {
    initSurvey(s.definition, s.id)
  }
}, { immediate: true })

useHead({
  title: survey.value?.title || 'Survey',
})
</script>

<template>
  <div class="min-h-screen bg-base-100">
    <!-- Sticky top progress bar — spans full viewport width -->
    <ClientOnly>
      <div
        v-if="surveyModel && !isCompleted && totalQuestions > 0"
        class="survey-sticky-progress"
      >
        <div class="survey-sticky-progress__meta">
          <span class="survey-sticky-progress__count">
            {{ answeredCount }} <span class="opacity-50">/ {{ totalQuestions }}</span>
            <span v-if="requiresAuth && loggedIn && sites.length > 0" class="opacity-40 ml-2">
              &middot; {{ sites.find(s => s.id === selectedSiteId)?.name || sites.find(s => s.id === selectedSiteId)?.url || '' }}
            </span>
          </span>
          <span v-if="estimatedMinutesRemaining" class="survey-sticky-progress__time">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
            {{ estimatedMinutesRemaining }}
          </span>
        </div>
        <div class="survey-sticky-progress__bar">
          <div
            class="survey-sticky-progress__fill"
            :style="{ width: progressPercent + '%' }"
          />
        </div>
      </div>
    </ClientOnly>

    <div class="mx-auto max-w-3xl px-4 py-4">
      <!-- Loading -->
      <div v-if="!surveyData && !fetchError" class="flex justify-center py-20">
        <span class="loading loading-spinner loading-lg" />
      </div>

      <!-- Error: survey not found -->
      <div v-else-if="fetchError || !survey" class="text-center py-20">
        <h1 class="text-3xl font-bold mb-4">Survey Not Available</h1>
        <p class="text-base-content/70">This survey is no longer active or doesn't exist.</p>
      </div>

      <!-- Completed: thank you -->
      <div v-else-if="isCompleted" class="text-center py-20">
        <div class="mb-6 text-6xl">🎉</div>
        <h1 class="text-3xl font-bold mb-4">Thank you!</h1>
        <p class="text-lg text-base-content/80 mb-8">
          This genuinely shapes what I build next.
        </p>
        <div v-if="promotion" class="card bg-base-200 shadow-lg mx-auto max-w-md">
          <div class="card-body text-center">
            <h2 class="card-title justify-center text-xl">{{ promotion.discount }}</h2>
            <p class="text-base-content/70 text-sm">{{ promotion.delivery }}</p>
          </div>
        </div>
      </div>

      <!-- Auth gate: needs login -->
      <div v-else-if="authGateBlocker === 'needs_login'" class="py-16">
        <div class="card bg-base-200 border border-base-300 max-w-xl mx-auto">
          <div class="card-body">
            <h1 class="text-3xl mb-2" style="font-family: 'Instrument Serif', serif; font-weight: 400; letter-spacing: -0.02em;">
              {{ survey?.title }}
            </h1>
            <p v-if="survey?.description" class="text-base-content/70 mb-6">{{ survey.description }}</p>
            <div class="bg-base-100 rounded-xl p-4 mb-6 border border-base-300">
              <p class="text-sm text-base-content/80">
                <strong>Sign in required.</strong> This survey is for current Create Studio users, so we can connect your feedback to your site.
              </p>
            </div>
            <div class="flex gap-2">
              <NuxtLink :to="loginHref" class="btn btn-primary">Log in to continue</NuxtLink>
              <NuxtLink :to="`/auth/register?redirect=${encodeURIComponent(`/survey/${slug}`)}`" class="btn btn-ghost">Create an account</NuxtLink>
            </div>
          </div>
        </div>
      </div>

      <!-- Auth gate: no sites -->
      <div v-else-if="authGateBlocker === 'no_sites'" class="py-16">
        <div class="card bg-base-200 border border-base-300 max-w-xl mx-auto">
          <div class="card-body">
            <h1 class="text-3xl mb-2" style="font-family: 'Instrument Serif', serif; font-weight: 400; letter-spacing: -0.02em;">
              {{ survey?.title }}
            </h1>
            <p class="text-base-content/70 mb-6">
              You need a connected Create site to take this survey. Install the Create plugin and verify your site first.
            </p>
            <NuxtLink to="/admin" class="btn btn-primary w-fit">Go to dashboard</NuxtLink>
          </div>
        </div>
      </div>

      <!-- Survey -->
      <template v-else>
        <div v-if="submitError" class="alert alert-error mb-4">
          <span>{{ submitError }}</span>
        </div>

        <ClientOnly>
          <div class="survey-create-theme survey-typeform-mode">
            <SurveyComponent v-if="surveyModel" :model="surveyModel" />
          </div>
          <template #fallback>
            <div class="flex justify-center py-10">
              <span class="loading loading-spinner loading-lg" />
            </div>
          </template>
        </ClientOnly>

        <!-- Keyboard hint bar -->
        <ClientOnly>
          <div v-if="surveyModel && !isCompleted" class="survey-keyboard-hint">
            <template v-if="currentQuestionType === 'radiogroup' || currentQuestionType === 'dropdown'">
              <span><kbd>A</kbd>–<kbd>{{ String.fromCharCode(64 + Math.min(currentChoiceCount, 26)) }}</kbd> select</span>
              <span class="survey-keyboard-hint__sep">&middot;</span>
            </template>
            <template v-else-if="currentQuestionType === 'checkbox'">
              <span><kbd>A</kbd>–<kbd>{{ String.fromCharCode(64 + Math.min(currentChoiceCount, 26)) }}</kbd> toggle</span>
              <span class="survey-keyboard-hint__sep">&middot;</span>
            </template>
            <template v-else-if="currentQuestionType === 'rating'">
              <span>Press a <kbd>number</kbd> to rate</span>
              <span class="survey-keyboard-hint__sep">&middot;</span>
            </template>
            <template v-else-if="currentQuestionType === 'comment' || currentQuestionType === 'text'">
              <span><kbd>Shift</kbd>+<kbd>Enter</kbd> newline</span>
              <span class="survey-keyboard-hint__sep">&middot;</span>
            </template>
            <span><kbd>Enter ↵</kbd> continue</span>
          </div>
        </ClientOnly>
      </template>
    </div>
  </div>
</template>

<style>
/* Create Studio theme for SurveyJS — maps SurveyJS CSS variables to DaisyUI theme tokens */
.survey-create-theme {
  /* Surface colors */
  --sjs-general-backcolor: transparent;
  --sjs-general-backcolor-dim: transparent;
  --sjs-general-backcolor-dim-light: transparent;
  --sjs-general-backcolor-dim-dark: var(--color-base-200);
  --sjs-question-background: var(--color-base-200);
  --sjs-header-backcolor: transparent;

  /* Text colors */
  --sjs-general-forecolor: var(--color-base-content);
  --sjs-general-forecolor-light: color-mix(in oklab, var(--color-base-content) 70%, transparent);
  --sjs-general-dim-forecolor: var(--color-base-content);
  --sjs-general-dim-forecolor-light: color-mix(in oklab, var(--color-base-content) 60%, transparent);

  /* Primary / accent */
  --sjs-primary-backcolor: var(--color-primary);
  --sjs-primary-backcolor-light: color-mix(in oklab, var(--color-primary) 10%, transparent);
  --sjs-primary-backcolor-dark: color-mix(in oklab, var(--color-primary) 85%, black);
  --sjs-primary-forecolor: var(--color-primary-content);
  --sjs-primary-forecolor-light: var(--color-primary-content);

  /* Borders */
  --sjs-border-default: color-mix(in oklab, var(--color-base-content) 10%, transparent);
  --sjs-border-light: color-mix(in oklab, var(--color-base-content) 6%, transparent);
  --sjs-border-inside: color-mix(in oklab, var(--color-base-content) 8%, transparent);

  /* Special / status */
  --sjs-special-red: var(--color-error);
  --sjs-special-red-light: color-mix(in oklab, var(--color-error) 10%, transparent);
  --sjs-special-green: var(--color-success);
  --sjs-special-green-light: color-mix(in oklab, var(--color-success) 10%, transparent);

  /* Shadows / radius */
  --sjs-corner-radius: 12px;
  --sjs-base-unit: 8px;
  --sjs-shadow-small: 0 1px 2px rgb(0 0 0 / 0.04);
  --sjs-shadow-medium: 0 4px 12px rgb(0 0 0 / 0.08);
  --sjs-shadow-inner: none;

  /* Font */
  --sjs-font-family: inherit;
}

/* Root survey container — remove all default backgrounds */
.survey-create-theme .sd-root-modern,
.survey-create-theme .sd-container-modern,
.survey-create-theme .sd-body,
.survey-create-theme .sd-body__page,
.survey-create-theme .sd-header,
.survey-create-theme .sd-title.sd-container-modern__title {
  background: transparent !important;
  box-shadow: none !important;
  padding: 0 !important;
}

.survey-create-theme .sd-input {
  border: 1px solid var(--sjs-border-default);
  box-shadow: var(--sjs-shadow-small);
}

/* Header / title — editorial serif display */
.survey-create-theme .sd-header {
  padding: 0 0 2rem 0;
}
.survey-create-theme .sd-header__text .sd-title,
.survey-create-theme .sd-header__text h3 {
  font-family: "Instrument Serif", Georgia, "Times New Roman", serif;
  font-weight: 400;
  font-size: clamp(2rem, 5vw, 3rem);
  line-height: 1.05;
  letter-spacing: -0.02em;
  color: var(--color-base-content);
  margin: 0 0 0.75rem 0;
}
.survey-create-theme .sd-header__text .sd-description {
  font-family: "Satoshi", -apple-system, BlinkMacSystemFont, sans-serif;
  color: color-mix(in oklab, var(--color-base-content) 65%, transparent);
  font-size: 1rem;
  line-height: 1.5;
  max-width: 60ch;
}

/* Page title (block names like "NPS", "Who you are") */
.survey-create-theme .sd-page__title {
  font-family: "Instrument Serif", Georgia, serif;
  font-weight: 400;
  font-size: 1.5rem;
  letter-spacing: -0.01em;
  color: var(--color-base-content);
  margin-bottom: 1rem;
}

/* Question cards — transparent in typeform mode, elevated in normal mode */
.survey-create-theme .sd-question {
  background: var(--color-base-200);
  border: 1px solid color-mix(in oklab, var(--color-base-content) 6%, transparent);
  border-radius: 12px;
  padding: 1.5rem !important;
  margin-bottom: 1rem;
  box-shadow: 0 1px 2px rgb(0 0 0 / 0.03);
}
.survey-typeform-mode .sd-question {
  background: transparent !important;
  border: none !important;
  box-shadow: none !important;
  padding: 0 !important;
  margin-bottom: 0 !important;
}
.survey-create-theme .sd-question__title,
.survey-create-theme .sd-question__title span {
  font-weight: 500;
  font-size: 1.5rem;
  color: var(--color-base-content);
  margin-bottom: 1rem;
}
.survey-typeform-mode .sd-question__title {
  font-size: clamp(1.25rem, 3vw, 1.75rem);
  font-weight: 400;
  line-height: 1.3;
  margin-bottom: 1.5rem;
}
.survey-typeform-mode .sd-rating .sd-rating__item-text,
.survey-typeform-mode .sd-item .sd-item__control-label,
.survey-typeform-mode .sd-selectbase__label {
  font-size: 1.5rem;
}
.survey-typeform-mode .sd-input {
  font-size: 1.5rem;
  padding: 1rem;
}

/* Hide SurveyJS's built-in progress bar — we render our own sticky bar */
.survey-create-theme .sd-progress,
.survey-create-theme .sd-body__progress {
  display: none !important;
}

/* Mobile — shrink rating buttons so 11 NPS items fit one row, tighten card */
@media (max-width: 640px) {
  .survey-create-theme .sd-rating .sd-rating__min-text, 
  .survey-create-theme .sd-rating .sd-rating__max-text {
    margin: 0 !important;
  }
  .survey-create-theme .sd-rating .sd-rating__item--fixed-size {
    min-width: 0;
  }
  .survey-create-theme .sd-rating .sd-rating__item--fixed-size span {
    font-size: 1.25rem;
  }
  .survey-create-theme .sd-rating .sd-rating__item-text {
    font-size: 1.125rem;
    padding: 0;
  }
  .survey-create-theme .sd-rating .sd-rating__min-text,
  .survey-create-theme .sd-rating .sd-rating__max-text {
    font-size: 0.75rem;
  }
  .survey-create-theme .sd-rating fieldset {
    padding-top: 1.75rem;
  }
  .survey-create-theme .sd-page__title {
    font-size: 1.25rem;
  }
}

/* Sticky top progress bar — full viewport width, brand gradient fill */
.survey-sticky-progress {
  position: sticky;
  top: 0;
  left: 0;
  right: 0;
  z-index: 40;
  width: 100%;
  background: color-mix(in oklab, var(--color-base-100) 90%, transparent);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  border-bottom: 1px solid color-mix(in oklab, var(--color-base-content) 8%, transparent);
}
.survey-sticky-progress__bar {
  position: relative;
  width: 100%;
  height: 3.5vh;
  background: color-mix(in oklab, var(--color-base-content) 6%, transparent);
  overflow: hidden;
}
.survey-sticky-progress__fill {
  height: 100%;
  background: linear-gradient(
    115deg,
    #fff1be 28%,
    #ee87cb 70%,
    #b060ff 100%
  );
  background-size: 100% 100%;
  transition: width 0.4s ease;
}
.survey-sticky-progress__meta {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  max-width: 48rem;
  margin: 0 auto;
  padding: 0.5rem 1rem;
  font-size: 0.8125rem;
  color: color-mix(in oklab, var(--color-base-content) 70%, transparent);
}
.survey-sticky-progress__count {
  font-weight: 500;
  font-variant-numeric: tabular-nums;
}
.survey-sticky-progress__time {
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.125rem 0.625rem;
  border-radius: 999px;
  background: color-mix(in oklab, var(--color-primary) 12%, transparent);
  color: var(--color-base-content);
  font-weight: 500;
  white-space: nowrap;
}
.survey-sticky-progress__time svg {
  width: 0.8125rem;
  height: 0.8125rem;
  opacity: 0.7;
}

/* Radio + checkbox items — make decorators visible and add pointer cursor */
.survey-create-theme .sd-selectbase__item,
.survey-create-theme .sd-item {
  cursor: pointer;
}
.survey-create-theme .sd-selectbase__label,
.survey-create-theme .sd-item__content {
  cursor: pointer;
}
.survey-create-theme .sd-item__decorator {
  background-color: var(--color-base-100);
  border: 1px solid color-mix(in oklab, var(--color-base-content) 20%, transparent);
  box-shadow: none;
  transition: border-color 0.15s ease, background-color 0.15s ease;
}
.survey-create-theme .sd-item:hover .sd-item__decorator {
  border-color: color-mix(in oklab, var(--color-primary) 60%, transparent);
  background-color: color-mix(in oklab, var(--color-primary) 5%, var(--color-base-100));
}
.survey-create-theme .sd-item--checked .sd-item__decorator {
  background-color: var(--color-primary);
  border-color: var(--color-primary);
}
/* Radio dot */
.survey-create-theme .sd-radio .sd-item--checked .sd-item__decorator::after {
  content: '';
  display: block;
  width: 0.5rem;
  height: 0.5rem;
  border-radius: 999px;
  background: var(--color-primary-content);
}
/* Checkbox checkmark color */
.survey-create-theme .sd-checkbox--checked .sd-checkbox__svg {
  fill: var(--color-primary-content);
}

/* Rating — move min/max description labels to a row above the number buttons */
.survey-create-theme .sd-rating,
.survey-create-theme .sd-scrollable-container.sd-rating {
  width: 100%;
  display: block;
}
.survey-create-theme .sd-rating fieldset {
  display: flex;
  flex-wrap: nowrap;
  align-items: center;
  justify-content: space-between;
  gap: 0;
  padding: 2rem 0 0 0;
  border: 0;
  margin: 0;
  position: relative;
  width: 100%;
  min-height: 3.5rem;
}
.survey-create-theme .sd-rating .sd-rating__item {
  margin: 0;
  width: auto;
  background: transparent;
  box-shadow: none;
  border-radius: 8px;
  cursor: pointer;
  transition: background-color 0.15s ease, color 0.15s ease;
}
.survey-create-theme .sd-rating .sd-rating__item--allowhover:hover {
  background: color-mix(in oklab, var(--color-primary) 15%, transparent);
}
.survey-create-theme .sd-rating .sd-rating__item--selected {
  background: var(--color-primary);
  color: var(--color-primary-content);
}
.survey-create-theme .sd-rating .sd-rating__item--selected .sd-rating__item-text {
  color: var(--color-primary-content);
}
.survey-create-theme .sd-rating fieldset > legend {
  display: none;
}
.survey-create-theme .sd-rating .sd-rating__min-text,
.survey-create-theme .sd-rating .sd-rating__max-text {
  position: absolute;
  top: 0;
  color: color-mix(in oklab, var(--color-base-content) 60%, transparent);
  font-size: 0.975rem;
  margin: 0;
  padding: 0;
  border: 0;
}
.survey-create-theme .sd-rating .sd-rating__min-text {
  margin-right: var(--sjs-base-unit, var(--base-unit, 8px));
  margin-left: calc(2 * (var(--sjs-base-unit, var(--base-unit, 8px))));
  left: 0;
}
.survey-create-theme .sd-rating .sd-rating__max-text {
  margin-right: var(--sjs-base-unit, var(--base-unit, 8px));
  margin-left: calc(2 * (var(--sjs-base-unit, var(--base-unit, 8px))));
  right: 0;
}

/* Typeform mode — single-question view, vertically centered, fits viewport */
.survey-typeform-mode .sd-body {
  display: flex;
  flex-direction: column;
  justify-content: center;
  padding: 0 !important;
}
.survey-typeform-mode .sd-body__page {
  display: flex;
  flex-direction: column;
  justify-content: center;
  flex: 1;
  animation: surveyFadeIn 0.3s ease;
}
@keyframes surveyFadeIn {
  from { opacity: 0; transform: translateY(12px); }
  to { opacity: 1; transform: translateY(0); }
}

/* Hide survey header in typeform mode — title is redundant, progress bar identifies the survey */
.survey-typeform-mode .sd-header {
  display: none !important;
}

/* Hide page title in typeform mode */
.survey-typeform-mode .sd-page__title {
  display: none;
}

/* Hide default prev button — we use Enter / keyboard */
.survey-typeform-mode .sd-navigation__prev-btn {
  display: none;
}

/* Make the Next/Complete button compact and inline */
.survey-typeform-mode .sd-navigation__next-btn,
.survey-typeform-mode .sd-navigation__complete-btn {
  margin-top: 1.5rem;
}

/* Letter badges on radio/checkbox choices */
.survey-typeform-mode .sd-selectbase__item {
  position: relative;
}
.survey-typeform-mode .sd-selectbase__item .sd-selectbase__label::before {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 1.5rem;
  height: 1.5rem;
  border-radius: 4px;
  border: 1px solid color-mix(in oklab, var(--color-base-content) 20%, transparent);
  background: var(--color-base-100);
  font-size: 0.75rem;
  font-weight: 600;
  margin-right: 0.5rem;
  flex-shrink: 0;
  color: color-mix(in oklab, var(--color-base-content) 60%, transparent);
}
.survey-typeform-mode .sd-selectbase__item:nth-child(1) .sd-selectbase__label::before { content: 'A'; }
.survey-typeform-mode .sd-selectbase__item:nth-child(2) .sd-selectbase__label::before { content: 'B'; }
.survey-typeform-mode .sd-selectbase__item:nth-child(3) .sd-selectbase__label::before { content: 'C'; }
.survey-typeform-mode .sd-selectbase__item:nth-child(4) .sd-selectbase__label::before { content: 'D'; }
.survey-typeform-mode .sd-selectbase__item:nth-child(5) .sd-selectbase__label::before { content: 'E'; }
.survey-typeform-mode .sd-selectbase__item:nth-child(6) .sd-selectbase__label::before { content: 'F'; }
.survey-typeform-mode .sd-selectbase__item:nth-child(7) .sd-selectbase__label::before { content: 'G'; }
.survey-typeform-mode .sd-selectbase__item:nth-child(8) .sd-selectbase__label::before { content: 'H'; }
.survey-typeform-mode .sd-selectbase__item:nth-child(9) .sd-selectbase__label::before { content: 'I'; }
.survey-typeform-mode .sd-selectbase__item:nth-child(10) .sd-selectbase__label::before { content: 'J'; }
.survey-typeform-mode .sd-selectbase__item:nth-child(11) .sd-selectbase__label::before { content: 'K'; }
.survey-typeform-mode .sd-selectbase__item:nth-child(12) .sd-selectbase__label::before { content: 'L'; }
.survey-typeform-mode .sd-selectbase__item:nth-child(13) .sd-selectbase__label::before { content: 'M'; }

/* Selected choice — letter badge highlighted */
.survey-typeform-mode .sd-item--checked .sd-selectbase__label::before {
  background: var(--color-primary);
  border-color: var(--color-primary);
  color: var(--color-primary-content);
}

/* Keyboard hint bar */
.survey-keyboard-hint {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  background: color-mix(in oklab, var(--color-base-100) 92%, transparent);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  border-top: 1px solid color-mix(in oklab, var(--color-base-content) 8%, transparent);
  font-size: 0.8125rem;
  color: color-mix(in oklab, var(--color-base-content) 50%, transparent);
  z-index: 40;
}
.survey-keyboard-hint kbd {
  display: inline-block;
  padding: 0.125rem 0.375rem;
  border-radius: 4px;
  border: 1px solid color-mix(in oklab, var(--color-base-content) 15%, transparent);
  background: color-mix(in oklab, var(--color-base-content) 5%, transparent);
  font-family: ui-monospace, monospace;
  font-size: 0.75rem;
  font-weight: 500;
  color: color-mix(in oklab, var(--color-base-content) 70%, transparent);
}
.survey-keyboard-hint__sep {
  opacity: 0.3;
}

/* Buttons */
.survey-create-theme .sd-btn {
  border-radius: 10px;
  font-weight: 500;
}
.survey-create-theme .sd-navigation__complete-btn,
.survey-create-theme .sd-navigation__next-btn {
  background: var(--color-primary);
  color: var(--color-primary-content);
}
.survey-create-theme .sd-navigation__complete-btn:hover,
.survey-create-theme .sd-navigation__next-btn:hover {
  background: color-mix(in oklab, var(--color-primary) 85%, black);
}
</style>
