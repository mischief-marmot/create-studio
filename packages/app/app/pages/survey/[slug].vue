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

// Welcome / progress persistence state
const hasStarted = ref(false)
const responseId = ref<number | null>(null)
// Opaque per-response token required on PATCH for public surveys so the
// auto-increment response id can't be used as a bearer token by attackers.
const draftToken = ref<string | null>(null)
const draftResponse = ref<any>(null) // existing incomplete response (if any)
const completedResponse = ref<any>(null) // existing completed response (if any)
const draftLookupDone = ref(false)
const isStarting = ref(false)
const isUpgrading = ref(false)
const upgradeError = ref<string>('')
const codeCopied = ref(false)

async function copyCode() {
  if (!promotion.value?.code) return
  try {
    await navigator.clipboard.writeText(promotion.value.code)
    codeCopied.value = true
    setTimeout(() => { codeCopied.value = false }, 2000)
  } catch {
    // Clipboard API failed silently — user can still see the code
  }
}

async function startUpgrade() {
  if (isUpgrading.value) return
  const s = survey.value
  if (!s || !selectedSiteId.value) return
  isUpgrading.value = true
  upgradeError.value = ''
  try {
    const res = await $fetch<{ url: string }>(`/api/v2/surveys/${s.id}/checkout`, {
      method: 'POST',
      body: { site_id: selectedSiteId.value },
    })
    if (res.url) window.location.href = res.url
  } catch (err: any) {
    upgradeError.value = err?.data?.error || 'Could not start checkout. Please try again.'
    isUpgrading.value = false
  }
}

const survey = computed(() => surveyData.value?.survey)
const authenticated = computed(() => surveyData.value?.authenticated ?? false)
const requiresAuth = computed(() => !!survey.value?.requires_auth)

// Ticks every minute so countdowns drift smoothly across hour/day boundaries
// without blasting re-renders. Only mounts on client.
const now = ref(Date.now())
let nowTimer: ReturnType<typeof setInterval> | null = null
onMounted(() => {
  now.value = Date.now()
  nowTimer = setInterval(() => { now.value = Date.now() }, 60_000)
})
onUnmounted(() => {
  if (nowTimer) clearInterval(nowTimer)
})

function formatCountdown(target: string | null | undefined, verb: 'Closes' | 'Expires'): { text: string; urgent: boolean; past: boolean } | null {
  if (!target) return null
  const end = Date.parse(target)
  if (isNaN(end)) return null
  const diff = end - now.value
  if (diff <= 0) {
    return { text: verb === 'Closes' ? 'Closed' : 'Expired', urgent: false, past: true }
  }
  const mins = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)
  const urgent = hours < 48
  if (days >= 2) return { text: `${verb} in ${days} days`, urgent, past: false }
  if (hours >= 24) return { text: `${verb} tomorrow`, urgent, past: false }
  if (hours >= 2) return { text: `${verb} in ${hours} hours`, urgent, past: false }
  if (mins >= 2) return { text: `${verb} in ${mins} min`, urgent, past: false }
  return { text: `${verb} soon`, urgent, past: false }
}

const surveyCloseCountdown = computed(() => formatCountdown((survey.value?.definition as any)?.closes_at, 'Closes'))
const discountExpiryCountdown = computed(() => formatCountdown((promotion.value as any)?.expires_at, 'Expires'))

// Urgency badge for "only N spots left" — only shown when the survey has a
// `max_completions` cap. `urgent` flips under ~20% remaining or 10 absolute,
// whichever is smaller, so single-digit caps don't look like false alarms.
const spotsRemainingBadge = computed<{ text: string; urgent: boolean; exhausted: boolean } | null>(() => {
  const s = survey.value as any
  if (!s || s.max_completions == null || s.spots_remaining == null) return null
  const remaining: number = s.spots_remaining
  const total: number = s.max_completions
  if (remaining <= 0) return { text: 'All spots taken', urgent: false, exhausted: true }
  const urgentThreshold = Math.max(1, Math.min(10, Math.ceil(total * 0.2)))
  const urgent = remaining <= urgentThreshold
  return {
    text: remaining === 1 ? 'Only 1 spot left' : `Only ${remaining} spots left`,
    urgent,
    exhausted: false,
  }
})
const spotsExhausted = computed(() => spotsRemainingBadge.value?.exhausted === true)

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

let updateCurrentQuestionFn: (() => void) | null = null

// Delegate to SurveyJS's own nav buttons — they trigger Vue's re-render pipeline
// correctly for questionPerPage mode. Calling the model methods directly
// mutates state without updating the rendered DOM.
function goPrev() {
  const btn = document.querySelector<HTMLElement>('.sd-navigation__prev-btn')
  if (btn) btn.click()
  setTimeout(() => updateCurrentQuestionFn?.(), 80)
}
function goNext() {
  const btn = document.querySelector<HTMLElement>('.sd-navigation__next-btn, .sd-navigation__complete-btn')
  if (btn) btn.click()
  setTimeout(() => updateCurrentQuestionFn?.(), 80)
}

const currentQuestionType = ref('')
const currentChoiceCount = ref(0)
const currentRatingMin = ref(0)
const currentRatingMax = ref(10)
const isFirstPage = ref(true)
const isLastPage = ref(false)

function initSurvey(definition: Record<string, any>, surveyId: number, initialData?: Record<string, any>) {
  const model = new Model(definition)

  // Typeform mode: one question at a time
  model.questionsOnPageMode = 'questionPerPage'

  // Hydrate from a saved draft if we have one, and jump to the first unanswered
  // question before the Vue component mounts (no visible animation)
  if (initialData && Object.keys(initialData).length > 0) {
    model.data = initialData
    const allQs = model.getAllQuestions().filter((q: any) => q.hasInput && q.isVisible)
    const firstUnanswered = allQs.find((q: any) => q.isEmpty())
    if (firstUnanswered) {
      // Seek to the page containing the first unanswered question, then set it
      // as the currentSingleQuestion so questionPerPage mode renders the right one.
      try {
        const targetPage = firstUnanswered.page
        if (targetPage) model.currentPage = targetPage
        if ('currentSingleQuestion' in model) {
          ;(model as any).currentSingleQuestion = firstUnanswered
        }
      } catch {
        // Fall back silently — user will start from the beginning
      }
    }
  }

  const updateProgress = () => {
    const inputs = model.getAllQuestions().filter((q: any) => q.hasInput)
    totalQuestions.value = inputs.length
    answeredCount.value = inputs.filter((q: any) => !q.isEmpty()).length
  }

  const updateCurrentQuestion = () => {
    // In questionPerPage mode, track boundaries by the currently-displayed question.
    // `currentSingleQuestion` is set by SurveyJS; fall back to first visible question on page.
    const cur = (model as any).currentSingleQuestion || model.currentPage?.questions?.[0]
    const allVisible = model.getAllQuestions().filter((q: any) => q.isVisible)
    const idx = cur ? allVisible.findIndex((q: any) => q === cur) : -1
    isFirstPage.value = idx <= 0
    isLastPage.value = idx === allVisible.length - 1
    nextTick(() => {
      setTimeout(() => {
        const hasRating = document.querySelectorAll('.sd-rating__item').length > 0
        const selectItems = document.querySelectorAll<HTMLElement>('.sd-selectbase__item')
        const hasRadio = selectItems.length > 0
        const hasTextarea = !!document.querySelector('.sd-question textarea')
        const hasTextInput = !!document.querySelector('.sd-question input[type="text"], .sd-question input[type="email"]')
        const hasRanking = !!document.querySelector('.sd-ranking')

        // Inject letter badge elements INSIDE the label so clicks on the badge
        // bubble through the native <label> → toggle the radio/checkbox input.
        selectItems.forEach((item, i) => {
          if (item.querySelector('.survey-letter-badge')) return
          const label = item.querySelector<HTMLElement>('.sd-selectbase__label')
          const target: HTMLElement = label || item
          const badge = document.createElement('span')
          badge.className = 'survey-letter-badge'
          badge.textContent = String.fromCharCode(65 + i)
          target.prepend(badge)
        })

        // Inject letter badges into rating items only when the scale exceeds what
        // number keys can reach (e.g. NPS 0–10 needs 'K' for 10). For 1–9 scales
        // the visible number IS the shortcut — skip badges to avoid redundancy.
        const ratingItemsForBadges = document.querySelectorAll<HTMLElement>('.sd-rating__item')
        const needsLetterBadges = ratingItemsForBadges.length > 9
        ratingItemsForBadges.forEach((item, i) => {
          // Clean up any stale badges if the scale changed pages
          if (!needsLetterBadges) {
            item.querySelector('.survey-letter-badge--rating')?.remove()
            return
          }
          if (item.querySelector('.survey-letter-badge')) return
          const badge = document.createElement('span')
          badge.className = 'survey-letter-badge survey-letter-badge--rating'
          badge.textContent = String.fromCharCode(65 + i)
          item.prepend(badge)
        })

        if (hasRating) {
          currentQuestionType.value = 'rating'
          const ratingItems = document.querySelectorAll('.sd-rating__item')
          currentChoiceCount.value = ratingItems.length
          // Derive min/max from the rendered number buttons
          const nums: number[] = []
          ratingItems.forEach(el => {
            const t = el.querySelector('.sd-rating__item-text')?.getAttribute('data-text')
            if (t != null && /^-?\d+$/.test(t)) nums.push(parseInt(t))
          })
          if (nums.length) {
            currentRatingMin.value = Math.min(...nums)
            currentRatingMax.value = Math.max(...nums)
          }
        } else if (hasRadio) {
          currentQuestionType.value = 'radiogroup'
          currentChoiceCount.value = selectItems.length
        } else if (hasTextarea) {
          currentQuestionType.value = 'comment'
          currentChoiceCount.value = 0
        } else if (hasTextInput) {
          currentQuestionType.value = 'text'
          currentChoiceCount.value = 0
        } else if (hasRanking) {
          currentQuestionType.value = 'ranking'
          currentChoiceCount.value = 0
        } else {
          currentQuestionType.value = ''
          currentChoiceCount.value = 0
        }
      }, 150)
    })
  }

  updateProgress()
  updateCurrentQuestionFn = updateCurrentQuestion

  const AUTO_ADVANCE_TYPES = new Set(['radiogroup', 'rating', 'dropdown', 'boolean'])

  // Debounced autosave — patches the draft response as the user answers
  let saveTimer: ReturnType<typeof setTimeout> | null = null
  const queueAutosave = (sender: any) => {
    if (!responseId.value) return
    if (saveTimer) clearTimeout(saveTimer)
    saveTimer = setTimeout(async () => {
      try {
        await $fetch(`/api/v2/surveys/${surveyId}/responses/${responseId.value}`, {
          method: 'PATCH',
          body: { response_data: sender.data, draft_token: draftToken.value || undefined },
        })
      } catch {
        // Silent fail — next value change will retry
      }
    }, 600)
  }

  model.onValueChanged.add((sender: any, options: any) => {
    updateProgress()
    queueAutosave(sender)
    const q = sender.getQuestionByName(options.name)
    if (q && AUTO_ADVANCE_TYPES.has(q.getType())) {
      setTimeout(() => {
        const btn = document.querySelector<HTMLElement>('.sd-navigation__next-btn, .sd-navigation__complete-btn')
        if (btn) btn.click()
        setTimeout(() => { updateProgress(); updateCurrentQuestion() }, 50)
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

  // Keyboard shortcuts — DOM-driven so they work regardless of SurveyJS type reporting
  const isTextFocused = () => {
    const ae = document.activeElement as HTMLInputElement | null
    return ae?.tagName === 'TEXTAREA' || (ae?.tagName === 'INPUT' && ae.type !== 'radio' && ae.type !== 'checkbox')
  }

  const handleKeyDown = (e: KeyboardEvent) => {
    if (!surveyModel.value || isCompleted.value) return

    // Up arrow → go back to previous question
    // ← / → → navigate between questions
    if ((e.key === 'ArrowLeft' || e.key === 'ArrowUp') && !isTextFocused()) {
      e.preventDefault()
      goPrev()
      return
    }
    if ((e.key === 'ArrowRight' || e.key === 'ArrowDown') && !isTextFocused()) {
      e.preventDefault()
      goNext()
      return
    }

    // Enter → advance (Shift+Enter → newline in text fields)
    if (e.key === 'Enter') {
      if (document.activeElement?.tagName === 'TEXTAREA') {
        if (!e.shiftKey) {
          e.preventDefault()
          goNext()
        }
        return
      }
      e.preventDefault()
      goNext()
      return
    }

    // Don't capture keys if typing in a text field
    if (isTextFocused()) return

    // Number keys → try rating items first
    if (/^[0-9]$/.test(e.key)) {
      const ratingItems = document.querySelectorAll<HTMLElement>('.sd-rating__item')
      if (ratingItems.length > 0) {
        e.preventDefault()
        e.stopPropagation()
        const num = e.key
        for (const item of ratingItems) {
          const text = item.querySelector('.sd-rating__item-text')?.getAttribute('data-text')
          if (text === num) {
            item.querySelector<HTMLElement>('input')?.click()
            break
          }
        }
        return
      }
    }

    // Letter keys → try radio/checkbox items first, then rating items
    if (e.key.length === 1 && /^[a-z]$/i.test(e.key)) {
      const idx = e.key.toLowerCase().charCodeAt(0) - 97
      const selectItems = document.querySelectorAll<HTMLElement>('.sd-selectbase__item')
      if (selectItems.length > 0) {
        e.preventDefault()
        e.stopPropagation()
        if (idx >= 0 && idx < selectItems.length) {
          selectItems[idx].querySelector<HTMLElement>('input')?.click()
        }
        return
      }
      // Fall back to rating items (A = first number, B = second, etc.)
      const ratingItems = document.querySelectorAll<HTMLElement>('.sd-rating__item')
      if (ratingItems.length > 0) {
        e.preventDefault()
        e.stopPropagation()
        if (idx >= 0 && idx < ratingItems.length) {
          ratingItems[idx].querySelector<HTMLElement>('input')?.click()
        }
        return
      }
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
      let response: any
      if (responseId.value) {
        // Finalize the existing draft
        if (draftToken.value) body.draft_token = draftToken.value
        response = await $fetch(`/api/v2/surveys/${surveyId}/responses/${responseId.value}`, {
          method: 'PATCH',
          body,
        })
      } else {
        // Fallback (shouldn't happen once draft flow is wired): create a fresh response
        if (requiresAuth.value) body.site_id = selectedSiteId.value
        response = await $fetch(`/api/v2/surveys/${surveyId}/responses`, {
          method: 'POST',
          body,
        })
      }

      if (response?.promotion) {
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

// For authed surveys: look up any existing response state for this user+site.
// Completed → lock to success screen. Draft → offer Resume on welcome.
watch([survey, authGateReady, selectedSiteId], async ([s, ready, siteId]) => {
  if (!s || !ready || !import.meta.client || draftLookupDone.value) return
  if (!requiresAuth.value) { draftLookupDone.value = true; return }
  try {
    const url = `/api/v2/surveys/${s.id}/responses/draft${siteId ? `?site_id=${siteId}` : ''}`
    const res = await $fetch<{ draft: any; completed: any; promotion: any }>(url)
    draftResponse.value = res.draft || null
    completedResponse.value = res.completed || null
    if (res.completed) {
      isCompleted.value = true
      if (res.promotion) promotion.value = res.promotion
    }
  } catch {
    draftResponse.value = null
    completedResponse.value = null
  } finally {
    draftLookupDone.value = true
  }
}, { immediate: true })

// Percent complete for the draft — shown on welcome screen as "Resume"
const draftProgressText = computed(() => {
  const data = draftResponse.value?.response_data
  if (!data) return ''
  const n = Object.keys(data).length
  return n > 0 ? `${n} answered` : ''
})

// Press Enter on the welcome screen to start
if (import.meta.client) {
  const welcomeKeyHandler = (e: KeyboardEvent) => {
    if (hasStarted.value || isCompleted.value) return
    if (authGateBlocker.value) return
    if (e.key !== 'Enter') return
    // Ignore Enter when a text field or select is focused
    const ae = document.activeElement as HTMLElement | null
    if (ae && ['INPUT', 'TEXTAREA', 'SELECT'].includes(ae.tagName)) return
    e.preventDefault()
    if (survey.value) startSurvey()
  }
  document.addEventListener('keydown', welcomeKeyHandler)
  onUnmounted(() => document.removeEventListener('keydown', welcomeKeyHandler))
}

async function startSurvey() {
  if (isStarting.value) return
  isStarting.value = true
  try {
    const s = survey.value
    if (!s) return
    // Re-use draft if one exists, otherwise create a new one
    if (draftResponse.value?.id) {
      responseId.value = draftResponse.value.id
      draftToken.value = draftResponse.value.draft_token || null
    } else {
      const body: Record<string, any> = {}
      if (requiresAuth.value) body.site_id = selectedSiteId.value
      const res = await $fetch<{ response: { id: number; draft_token?: string } }>(`/api/v2/surveys/${s.id}/responses/draft`, {
        method: 'POST',
        body,
      })
      responseId.value = res.response.id
      draftToken.value = res.response.draft_token || null
    }
    hasStarted.value = true
    // Initialize the SurveyJS model now that the user has committed to starting
    if (!surveyModel.value) {
      initSurvey(s.definition, s.id, draftResponse.value?.response_data || undefined)
    }
  } catch (err: any) {
    submitError.value = err?.data?.error || 'Could not start survey'
  } finally {
    isStarting.value = false
  }
}

// NOTE: the old `initSurvey` watcher ran automatically. We no longer auto-init;
// the user clicks Start / Resume on the welcome screen to kick it off.

useHead({
  title: survey.value?.title || 'Survey',
})
</script>

<template>
  <div class="min-h-screen bg-base-100">
    <!-- Sticky top progress bar — spans full viewport width -->
    <ClientOnly>
      <div
        v-if="hasStarted && surveyModel && !isCompleted && totalQuestions > 0"
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

      <!-- Completed: thank you + discount code + Upgrade now -->
      <div v-else-if="isCompleted" class="survey-success">
        <h1 class="survey-success__title">Thank you!</h1>
        <p class="survey-success__subtitle">
          Your responses have been sent
        </p>

        <div v-if="promotion" class="survey-success__card">
          <h2 class="survey-success__offer">{{ promotion.discount }}</h2>
          <p v-if="promotion.code" class="survey-success__code-label">Your code:</p>
          <div v-if="promotion.code" class="survey-success__code-row">
            <code class="survey-success__code">{{ promotion.code }}</code>
            <button
              class="survey-success__copy"
              :title="codeCopied ? 'Copied!' : 'Copy code'"
              @click="copyCode"
            >
              <svg v-if="!codeCopied" class="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              <svg v-else class="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
              </svg>
              {{ codeCopied ? 'Copied' : 'Copy' }}
            </button>
          </div>

          <p
            v-if="discountExpiryCountdown"
            class="survey-success__expiry"
            :class="{ 'survey-success__expiry--urgent': discountExpiryCountdown.urgent }"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
            {{ discountExpiryCountdown.text }}
          </p>

          <button
            v-if="promotion.code && requiresAuth"
            class="survey-success__upgrade"
            :disabled="isUpgrading"
            @click="startUpgrade"
          >
            <span v-if="isUpgrading" class="loading loading-spinner loading-sm"></span>
            {{ isUpgrading ? 'Redirecting…' : 'Upgrade now' }}
            <span v-if="!isUpgrading">→</span>
          </button>

          <p v-if="upgradeError" class="survey-success__error">{{ upgradeError }}</p>
          <p v-else-if="promotion.code_instructions" class="survey-success__hint">{{ promotion.code_instructions }}</p>
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

      <!-- Spots exhausted — friendly "you just missed it" state. Respondents
           with an existing draft can still resume and finish (we won't block
           them mid-way), so fall through to the welcome screen in that case. -->
      <div v-else-if="spotsExhausted && !draftResponse" class="py-16">
        <div class="card bg-base-200 border border-base-300 max-w-xl mx-auto">
          <div class="card-body text-center">
            <h1 class="text-3xl mb-2" style="font-family: 'Instrument Serif', serif; font-weight: 400; letter-spacing: -0.02em;">
              Just missed it
            </h1>
            <p class="text-base-content/70 mb-2">
              This survey was limited to {{ (survey as any)?.max_completions }} respondents and we've hit the cap.
            </p>
            <p class="text-sm text-base-content/50">
              Thanks for your interest — watch for future surveys.
            </p>
          </div>
        </div>
      </div>

      <!-- Welcome screen -->
      <div v-else-if="!hasStarted" class="survey-welcome">
        <h1 class="survey-welcome__title">{{ survey?.title }}</h1>
        <p v-if="survey?.description" class="survey-welcome__description">
          {{ survey.description }}
        </p>

        <div class="survey-welcome__meta">
          <span class="survey-welcome__chip">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
            ~10 min
          </span>
          <span
            v-if="surveyCloseCountdown"
            class="survey-welcome__chip survey-welcome__chip--countdown"
            :class="{ 'survey-welcome__chip--urgent': surveyCloseCountdown.urgent }"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
              <line x1="16" y1="2" x2="16" y2="6" />
              <line x1="8" y1="2" x2="8" y2="6" />
              <line x1="3" y1="10" x2="21" y2="10" />
            </svg>
            {{ surveyCloseCountdown.text }}
          </span>
          <span
            v-if="spotsRemainingBadge && !spotsRemainingBadge.exhausted"
            class="survey-welcome__chip survey-welcome__chip--countdown"
            :class="{ 'survey-welcome__chip--urgent': spotsRemainingBadge.urgent }"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
              <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
            {{ spotsRemainingBadge.text }}
          </span>
          <span v-if="draftResponse" class="survey-welcome__chip survey-welcome__chip--progress">
            {{ draftProgressText }} so far
          </span>
        </div>

        <!-- Site picker (only for user-authed surveys with 2+ sites) -->
        <div v-if="requiresAuth && loggedIn && sites.length >= 2" class="survey-welcome__site">
          <label for="welcome-site" class="survey-welcome__label">Responding on behalf of</label>
          <select
            id="welcome-site"
            class="survey-welcome__select"
            :value="selectedSiteId"
            @change="(e) => selectSite(Number((e.target as HTMLSelectElement).value))"
          >
            <option v-for="site in sites" :key="site.id" :value="site.id">
              {{ site.name || site.url }}
            </option>
          </select>
        </div>
        <div v-else-if="requiresAuth && loggedIn && sites.length === 1" class="survey-welcome__site-note">
          Responding as <strong>{{ sites[0].name || sites[0].url }}</strong>
        </div>

        <div v-if="submitError" class="alert alert-error my-4">
          <span>{{ submitError }}</span>
        </div>

        <button
          class="survey-welcome__start"
          :disabled="isStarting"
          @click="startSurvey"
        >
          <span v-if="isStarting" class="loading loading-spinner loading-xs"></span>
          {{ draftResponse ? 'Resume survey' : 'Start survey' }}
          <span class="survey-welcome__arrow">→</span>
        </button>
        <p class="survey-welcome__hint">
          press <kbd>Enter ↵</kbd>
        </p>
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

        <!-- Bottom bar: counter · shortcuts · nav arrows -->
        <ClientOnly>
          <div v-if="hasStarted && surveyModel && !isCompleted" class="survey-bottom-bar">
            <span class="survey-bottom-bar__count">
              {{ answeredCount }} of {{ totalQuestions }}
            </span>

            <div class="survey-shortcuts">
              <!-- Radiogroup / Dropdown -->
              <span v-if="currentQuestionType === 'radiogroup' || currentQuestionType === 'dropdown'" class="survey-shortcut">
                <span class="survey-shortcut__group">
                  <kbd>A</kbd><span class="survey-shortcut__dash">–</span><kbd>{{ String.fromCharCode(64 + Math.min(currentChoiceCount, 26)) }}</kbd>
                </span>
                select
              </span>
              <!-- Checkbox -->
              <span v-else-if="currentQuestionType === 'checkbox'" class="survey-shortcut">
                <span class="survey-shortcut__group">
                  <kbd>A</kbd><span class="survey-shortcut__dash">–</span><kbd>{{ String.fromCharCode(64 + Math.min(currentChoiceCount, 26)) }}</kbd>
                </span>
                toggle
              </span>
              <!-- Rating — numbers when they fit on single keys, letters for NPS -->
              <span v-else-if="currentQuestionType === 'rating'" class="survey-shortcut">
                <span class="survey-shortcut__group">
                  <template v-if="currentChoiceCount > 9">
                    <kbd>A</kbd><span class="survey-shortcut__dash">–</span><kbd>{{ String.fromCharCode(64 + Math.min(currentChoiceCount, 26)) }}</kbd>
                  </template>
                  <template v-else>
                    <kbd>{{ currentRatingMin }}</kbd><span class="survey-shortcut__dash">–</span><kbd>{{ currentRatingMax }}</kbd>
                  </template>
                </span>
                rate
              </span>
              <!-- Text/comment -->
              <span v-else-if="currentQuestionType === 'comment' || currentQuestionType === 'text'" class="survey-shortcut">
                <span class="survey-shortcut__group"><kbd>Shift</kbd>+<kbd>↵</kbd></span>
                new line
              </span>

              <span class="survey-shortcut">
                <kbd>Enter ↵</kbd>
                continue
              </span>

              <span class="survey-shortcut">
                <span class="survey-shortcut__group"><kbd>←</kbd><kbd>→</kbd></span>
                navigate
              </span>
            </div>

            <div class="survey-nav-arrows">
              <button
                class="survey-nav-arrow"
                :disabled="isFirstPage"
                aria-label="Previous"
                @click="goPrev"
              >←</button>
              <button
                class="survey-nav-arrow"
                aria-label="Next"
                @click="goNext"
              >→</button>
            </div>
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
.survey-create-theme .sd-header__text .sd-description,
.survey-create-theme .sd-description span {
  font-family: "Satoshi", -apple-system, BlinkMacSystemFont, sans-serif;
  color: color-mix(in oklab, var(--color-base-content) 85%, transparent);
  font-size: 1.25rem;
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

/* Error message — respect the question's container width */
.survey-typeform-mode .sd-question__erbox,
.survey-typeform-mode .sd-element__erbox {
  margin: 0.75rem 0 0 0 !important;
  border-radius: 8px;
  position: static !important;
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
.survey-typeform-mode {
  padding-bottom: 5.5rem;
}
/* Fill the viewport minus top progress bar + bottom nav bar so we can center */
.survey-typeform-mode,
.survey-typeform-mode .sd-root-modern,
.survey-typeform-mode .sd-container-modern {
  min-height: calc(100vh - 9rem); /* top sticky + bottom bar */
  display: flex;
  flex-direction: column;
}
/* The intermediate SurveyJS wrappers need to be flex so the body can grow */
.survey-typeform-mode .sd-root-modern__wrapper,
.survey-typeform-mode .sd-container-modern > form {
  display: flex;
  flex-direction: column;
  flex: 1;
}
.survey-typeform-mode .sv-components-row,
.survey-typeform-mode .sv-components-column--expandable {
  flex: 1;
}
.survey-typeform-mode .sd-body {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  padding: 0 !important;
}
.survey-typeform-mode .sd-body__page {
  padding-top: 0 !important;
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

/* Hide survey-level title/header in typeform mode — shown on welcome screen only.
   Scope to the container-level title to avoid hiding question titles. */
.survey-typeform-mode .sd-header,
.survey-typeform-mode .sd-container-modern__title,
.survey-typeform-mode .sd-root-modern > .sd-title {
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

/* Visually hide SurveyJS's own nav buttons but keep them in the DOM so our
   bottom-bar arrows can delegate to them (simulated click). */
.survey-typeform-mode .sd-navigation__next-btn,
.survey-typeform-mode .sd-navigation__prev-btn,
.survey-typeform-mode .sd-navigation__complete-btn {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
  opacity: 0;
  pointer-events: none;
}

/* Letter badges on radio/checkbox choices — injected as DOM elements */
.survey-typeform-mode .survey-letter-badge {
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
  flex-shrink: 0;
  color: color-mix(in oklab, var(--color-base-content) 60%, transparent);
  margin-right: 0.5rem;
  pointer-events: none;
}

/* Selected choice — letter badge highlighted */
.survey-typeform-mode .sd-item--checked .survey-letter-badge {
  background: var(--color-primary);
  border-color: var(--color-primary);
  color: var(--color-primary-content);
}

/* ─────────────────────────────────────────────────────────
   Typeform-mode: bordered choice cards + connected rating row
   ───────────────────────────────────────────────────────── */

/* Radio / checkbox — bordered card rows */
.survey-typeform-mode .sd-selectbase {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}
.survey-typeform-mode .sd-selectbase__item {
  display: flex !important;
  align-items: stretch;
  gap: 0;
  /* Padding moved to the inner label so the entire bordered area is a click target */
  padding: 0;
  border-radius: 8px;
  border: 1px solid color-mix(in oklab, var(--color-base-content) 12%, transparent);
  background: color-mix(in oklab, var(--color-base-content) 3%, transparent);
  transition: background-color 0.15s ease, border-color 0.15s ease;
  margin: 0;
  cursor: pointer;
}
.survey-typeform-mode .sd-selectbase__item:hover {
  border-color: color-mix(in oklab, var(--color-base-content) 25%, transparent);
  background: color-mix(in oklab, var(--color-base-content) 6%, transparent);
}
.survey-typeform-mode .sd-selectbase__item.sd-item--checked {
  border-color: var(--color-primary);
  background: color-mix(in oklab, var(--color-primary) 10%, transparent);
}
/* Hide the default radio/checkbox decorator — the letter badge is the control */
.survey-typeform-mode .sd-selectbase__item .sd-item__decorator {
  display: none;
}
/* Label fills the whole card so clicking anywhere inside toggles the input */
.survey-typeform-mode .sd-selectbase__item .sd-selectbase__label,
.survey-typeform-mode .sd-selectbase__item .sd-item__content {
  display: flex;
  align-items: center;
  gap: 0.875rem;
  padding: 0.875rem 1rem;
  flex: 1;
  cursor: pointer;
  margin: 0;
}
.survey-typeform-mode .sd-selectbase__item .sd-item__control-label {
  font-size: 1.0625rem;
  font-weight: 400;
  padding: 0;
}

/* Rating — connected button row */
.survey-typeform-mode .sd-rating fieldset {
  display: flex !important;
  flex-direction: row;
  align-items: stretch;
  padding: 1.75rem 0 0 0 !important;
  gap: 0;
  min-height: 0;
}
.survey-typeform-mode .sd-rating .sd-rating__item--fixed-size,
.survey-typeform-mode .sd-rating .sd-rating__item {
  flex: 1;
  min-width: 0;
  max-width: none;
  height: 3.5rem;
  width: auto !important;
  margin: 0;
  margin-left: -1px;
  border: 1px solid color-mix(in oklab, var(--color-base-content) 12%, transparent);
  background: color-mix(in oklab, var(--color-base-content) 3%, transparent);
  border-radius: 0;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: background-color 0.15s ease, border-color 0.15s ease;
  padding: 0;
}
.survey-typeform-mode .sd-rating fieldset > .sd-rating__item:first-of-type {
  border-radius: 8px 0 0 8px;
  margin-left: 0;
}
.survey-typeform-mode .sd-rating fieldset > .sd-rating__item:last-of-type {
  border-radius: 0 8px 8px 0;
}
.survey-typeform-mode .sd-rating .sd-rating__item:hover {
  background: color-mix(in oklab, var(--color-base-content) 8%, transparent);
  border-color: color-mix(in oklab, var(--color-base-content) 25%, transparent);
  z-index: 1;
}
.survey-typeform-mode .sd-rating .sd-rating__item--selected {
  background: var(--color-primary) !important;
  border-color: var(--color-primary) !important;
  color: var(--color-primary-content) !important;
  z-index: 2;
}
.survey-typeform-mode .sd-rating .sd-rating__item-text {
  font-size: 1rem;
  font-weight: 500;
}

/* Rating letter badge — hovering BELOW the number button, same styling as hint-bar kbds */
.survey-typeform-mode .sd-rating__item {
  position: relative;
  overflow: visible;
}
/* Reserve space below the row only when letter badges are present (NPS scale) */
.survey-typeform-mode .sd-rating fieldset:has(.survey-letter-badge--rating) {
  padding-bottom: 1rem !important;
}
.survey-typeform-mode .survey-letter-badge--rating {
  position: absolute;
  bottom: -0.6875rem; /* overlap bottom border, half the badge height */
  left: 50%;
  transform: translateX(-50%);
  margin: 0;
  z-index: 3;
  /* Match hint-bar kbd styling */
  min-width: 1.5rem;
  height: 1.375rem;
  padding: 0 0.375rem;
  width: auto;
  border-radius: 5px;
  border: 1px solid color-mix(in oklab, var(--color-base-content) 20%, transparent);
  /* Solid background so the button border doesn't show through */
  background: color-mix(in oklab, var(--color-base-100) 100%, var(--color-base-content) 6%);
  color: color-mix(in oklab, var(--color-base-content) 70%, transparent);
  font-size: 0.75rem;
  font-weight: 600;
  box-shadow: 0 1px 0 rgb(0 0 0 / 0.2);
  pointer-events: none;
}
.survey-typeform-mode .sd-rating__item--selected .survey-letter-badge--rating {
  background: var(--color-primary-content);
  border-color: var(--color-primary-content);
  color: var(--color-primary);
}

/* ─────────────────────────────────────────────────────────
   Success / thank-you screen
   ───────────────────────────────────────────────────────── */
.survey-success {
  max-width: 36rem;
  margin: 0 auto;
  padding: 4rem 1rem 3rem;
  text-align: center;
  animation: surveyFadeIn 0.4s ease;
}
.survey-success__emoji {
  font-size: 3.5rem;
  margin-bottom: 1rem;
}
.survey-success__title {
  font-family: "Instrument Serif", Georgia, serif;
  font-weight: 400;
  font-size: clamp(2rem, 5vw, 3rem);
  letter-spacing: -0.02em;
  line-height: 1.1;
  margin-bottom: 0.75rem;
  color: var(--color-base-content);
}
.survey-success__subtitle {
  font-size: 1.0625rem;
  color: color-mix(in oklab, var(--color-base-content) 65%, transparent);
  margin-bottom: 2.5rem;
}
.survey-success__card {
  background: color-mix(in oklab, var(--color-base-content) 4%, transparent);
  border: 1px solid color-mix(in oklab, var(--color-base-content) 10%, transparent);
  border-radius: 16px;
  padding: 2rem 1.5rem;
}
.survey-success__offer {
  font-family: "Instrument Serif", Georgia, serif;
  font-weight: 400;
  font-size: 1.5rem;
  letter-spacing: -0.01em;
  margin-bottom: 1.5rem;
  color: var(--color-base-content);
}
.survey-success__code-label {
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: color-mix(in oklab, var(--color-base-content) 50%, transparent);
  margin-bottom: 0.5rem;
}
.survey-success__code-row {
  display: flex;
  align-items: stretch;
  gap: 0.5rem;
  justify-content: center;
  margin-bottom: 1.5rem;
}
.survey-success__code {
  display: inline-flex;
  align-items: center;
  padding: 0.625rem 1.125rem;
  border-radius: 8px;
  background: color-mix(in oklab, var(--color-primary) 15%, transparent);
  border: 1px solid color-mix(in oklab, var(--color-primary) 40%, transparent);
  font-family: ui-monospace, monospace;
  font-size: 1.125rem;
  font-weight: 700;
  letter-spacing: 0.05em;
  color: var(--color-base-content);
}
.survey-success__copy {
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0 0.75rem;
  border-radius: 8px;
  border: 1px solid color-mix(in oklab, var(--color-base-content) 15%, transparent);
  background: transparent;
  color: color-mix(in oklab, var(--color-base-content) 75%, transparent);
  font-size: 0.8125rem;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.15s ease;
}
.survey-success__copy:hover {
  background: color-mix(in oklab, var(--color-base-content) 8%, transparent);
}
.survey-success__upgrade {
  display: inline-flex;
  align-items: center;
  gap: 0.625rem;
  padding: 0.875rem 1.75rem;
  border-radius: 10px;
  border: none;
  background: var(--color-primary);
  color: var(--color-primary-content);
  font-size: 1.0625rem;
  font-weight: 600;
  cursor: pointer;
  transition: filter 0.15s ease, transform 0.1s ease;
}
.survey-success__upgrade:hover:not(:disabled) { filter: brightness(1.1); }
.survey-success__upgrade:active:not(:disabled) { transform: scale(0.98); }
.survey-success__upgrade:disabled { opacity: 0.7; cursor: default; }
.survey-success__hint {
  margin-top: 1rem;
  font-size: 0.8125rem;
  color: color-mix(in oklab, var(--color-base-content) 50%, transparent);
}
.survey-success__expiry {
  display: flex;
  width: fit-content;
  align-items: center;
  gap: 0.4375rem;
  margin: 0 auto 1.25rem auto;
  padding: 0.3125rem 0.75rem;
  border-radius: 999px;
  background: color-mix(in oklab, var(--color-base-content) 6%, transparent);
  border: 1px solid color-mix(in oklab, var(--color-base-content) 12%, transparent);
  font-size: 0.875rem;
  font-weight: 500;
  color: color-mix(in oklab, var(--color-base-content) 75%, transparent);
}
.survey-success__expiry svg {
  width: 0.9375rem;
  height: 0.9375rem;
  opacity: 0.85;
}
.survey-success__expiry--urgent {
  background: color-mix(in oklab, var(--color-warning) 18%, transparent);
  border-color: color-mix(in oklab, var(--color-warning) 45%, transparent);
  color: var(--color-base-content);
}
.survey-success__expiry--urgent svg {
  opacity: 1;
  color: var(--color-warning);
}
.survey-success__error {
  margin-top: 1rem;
  font-size: 0.875rem;
  color: var(--color-error);
}

/* ─────────────────────────────────────────────────────────
   Welcome / onboarding screen
   ───────────────────────────────────────────────────────── */
.survey-welcome {
  min-height: calc(100vh - 4rem);
  display: flex;
  flex-direction: column;
  justify-content: center;
  max-width: 40rem;
  margin: 0 auto;
  padding: 2rem 0;
  animation: surveyFadeIn 0.4s ease;
}
.survey-welcome__title {
  font-family: "Instrument Serif", Georgia, serif;
  font-weight: 400;
  font-size: clamp(2.25rem, 5.5vw, 3.5rem);
  line-height: 1.05;
  letter-spacing: -0.02em;
  color: var(--color-base-content);
  margin: 0 0 1rem 0;
}
.survey-welcome__description {
  font-size: 1.125rem;
  color: color-mix(in oklab, var(--color-base-content) 70%, transparent);
  line-height: 1.5;
  margin: 0 0 1.5rem 0;
  max-width: 36rem;
}
.survey-welcome__meta {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-bottom: 2rem;
}
.survey-welcome__chip {
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.3125rem 0.75rem;
  border-radius: 999px;
  background: color-mix(in oklab, var(--color-base-content) 5%, transparent);
  border: 1px solid color-mix(in oklab, var(--color-base-content) 10%, transparent);
  font-size: 0.8125rem;
  color: color-mix(in oklab, var(--color-base-content) 70%, transparent);
  font-weight: 500;
}
.survey-welcome__chip svg {
  width: 0.875rem;
  height: 0.875rem;
  opacity: 0.6;
}
.survey-welcome__chip--progress {
  background: color-mix(in oklab, var(--color-primary) 15%, transparent);
  border-color: color-mix(in oklab, var(--color-primary) 30%, transparent);
  color: var(--color-base-content);
}
.survey-welcome__chip--countdown {
  background: color-mix(in oklab, var(--color-base-content) 8%, transparent);
  border-color: color-mix(in oklab, var(--color-base-content) 20%, transparent);
  color: color-mix(in oklab, var(--color-base-content) 90%, transparent);
  font-size: 0.875rem;
  font-weight: 600;
}
.survey-welcome__chip--countdown svg {
  opacity: 0.85;
}
.survey-welcome__chip--urgent {
  background: color-mix(in oklab, var(--color-warning) 18%, transparent);
  border-color: color-mix(in oklab, var(--color-warning) 45%, transparent);
  color: var(--color-base-content);
}
.survey-welcome__chip--urgent svg {
  opacity: 1;
  color: var(--color-warning);
}
.survey-welcome__site {
  margin-bottom: 1.75rem;
}
.survey-welcome__label {
  display: block;
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: color-mix(in oklab, var(--color-base-content) 55%, transparent);
  margin-bottom: 0.5rem;
}
.survey-welcome__select {
  padding: 0.625rem 0.875rem;
  border-radius: 8px;
  background: color-mix(in oklab, var(--color-base-content) 5%, transparent);
  border: 1px solid color-mix(in oklab, var(--color-base-content) 15%, transparent);
  color: var(--color-base-content);
  font-size: 1rem;
  font-family: inherit;
  min-width: 16rem;
  cursor: pointer;
}
.survey-welcome__site-note {
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.375rem 0.875rem;
  border-radius: 999px;
  background: color-mix(in oklab, var(--color-base-content) 5%, transparent);
  color: color-mix(in oklab, var(--color-base-content) 70%, transparent);
  font-size: 0.8125rem;
  margin-bottom: 1.75rem;
}
.survey-welcome__start {
  display: inline-flex;
  align-items: center;
  gap: 0.625rem;
  padding: 0.875rem 1.5rem;
  border-radius: 10px;
  border: none;
  background: var(--color-primary);
  color: var(--color-primary-content);
  font-size: 1.0625rem;
  font-weight: 600;
  cursor: pointer;
  transition: filter 0.15s ease, transform 0.1s ease;
  align-self: flex-start;
}
.survey-welcome__start:hover:not(:disabled) {
  filter: brightness(1.1);
}
.survey-welcome__start:active:not(:disabled) {
  transform: scale(0.98);
}
.survey-welcome__start:disabled {
  opacity: 0.6;
  cursor: default;
}
.survey-welcome__arrow {
  font-size: 1.25rem;
}
.survey-welcome__hint {
  margin: 0.75rem 0 0 0;
  font-size: 0.8125rem;
  color: color-mix(in oklab, var(--color-base-content) 45%, transparent);
}
.survey-welcome__hint kbd {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 1.75rem;
  height: 1.5rem;
  padding: 0 0.375rem;
  border-radius: 5px;
  border: 1px solid color-mix(in oklab, var(--color-base-content) 20%, transparent);
  background: color-mix(in oklab, var(--color-base-content) 6%, transparent);
  font-family: inherit;
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--color-base-content);
  margin: 0 0.125rem;
}

/* Bottom bar — counter · shortcuts · nav arrows */
.survey-bottom-bar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding: 1.125rem 1.5rem;
  background: color-mix(in oklab, var(--color-base-100) 95%, transparent);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border-top: 1px solid color-mix(in oklab, var(--color-base-content) 8%, transparent);
  z-index: 40;
}
.survey-bottom-bar__count {
  font-size: 0.9375rem;
  color: color-mix(in oklab, var(--color-base-content) 55%, transparent);
  font-variant-numeric: tabular-nums;
  flex-shrink: 0;
  min-width: 90px;
}

/* Shortcut hints in the middle */
.survey-shortcuts {
  display: flex;
  align-items: center;
  gap: 1.5rem;
  flex: 1;
  justify-content: center;
  flex-wrap: wrap;
}
.survey-shortcut {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
  color: color-mix(in oklab, var(--color-base-content) 75%, transparent);
}
.survey-shortcut kbd {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 1.75rem;
  height: 1.625rem;
  padding: 0 0.4375rem;
  border-radius: 5px;
  border: 1px solid color-mix(in oklab, var(--color-base-content) 20%, transparent);
  background: color-mix(in oklab, var(--color-base-content) 6%, transparent);
  font-family: inherit;
  font-size: 0.8125rem;
  font-weight: 600;
  color: var(--color-base-content);
  box-shadow: 0 1px 0 rgb(0 0 0 / 0.2);
}
.survey-shortcut__group {
  display: inline-flex;
  align-items: center;
  gap: 0.125rem;
}
.survey-shortcut__dash {
  color: color-mix(in oklab, var(--color-base-content) 30%, transparent);
  padding: 0 0.125rem;
}

/* Nav arrows on the right */
.survey-nav-arrows {
  display: flex;
  gap: 0.375rem;
  flex-shrink: 0;
  min-width: 90px;
  justify-content: flex-end;
}
.survey-nav-arrow {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2.5rem;
  height: 2.5rem;
  border-radius: 6px;
  border: 1px solid color-mix(in oklab, var(--color-base-content) 20%, transparent);
  background: transparent;
  color: var(--color-base-content);
  font-size: 1.25rem;
  cursor: pointer;
  transition: background-color 0.15s ease, border-color 0.15s ease;
}
.survey-nav-arrow:hover {
  background: color-mix(in oklab, var(--color-base-content) 8%, transparent);
  border-color: color-mix(in oklab, var(--color-base-content) 30%, transparent);
}
.survey-nav-arrow:disabled {
  opacity: 0.25;
  cursor: default;
}
.survey-nav-arrow:disabled:hover {
  background: transparent;
  border-color: color-mix(in oklab, var(--color-base-content) 20%, transparent);
}

/* Mobile: hide shortcut hints + letter badges (no keyboard on phone) */
@media (max-width: 640px) {
  .survey-shortcuts { display: none; }
  .survey-typeform-mode .survey-letter-badge,
  .survey-typeform-mode .survey-letter-badge--rating { display: none !important; }
  .survey-typeform-mode .sd-rating fieldset { padding-bottom: 0 !important; }
  .survey-bottom-bar { padding: 0.875rem 1rem; }
  .survey-bottom-bar__count { font-size: 0.875rem; min-width: auto; }
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
