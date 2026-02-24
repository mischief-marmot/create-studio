<template>
  <div class="cs-cinematic">
    <!-- Slides -->
    <div
      v-for="(slide, index) in allSlides"
      :key="`cinematic-slide-${index}`"
      class="cs-cinematic-slide"
      :class="{ 'cs-cinematic-slide--active': currentSlide === index }"
    >
      <!-- Intro Slide -->
      <template v-if="index === 0">
        <div class="cs-cinematic-intro">
          <h1 class="cs-cinematic-title">{{ creation?.name }}</h1>
          <p class="cs-cinematic-cta">Swipe up to begin</p>
          <button class="cs-cinematic-begin-btn" @click="nextSlide">Begin</button>
        </div>
      </template>

      <!-- Step Slides -->
      <template v-else-if="index > 0 && index <= steps.length">
        <div class="cs-cinematic-step">
          <StepText
            :text="steps[index - 1]?.text || ''"
            :links="steps[index - 1]?.links"
          />
        </div>
      </template>

      <!-- Review Slide -->
      <template v-else>
        <div class="cs-cinematic-review">
          <h2>All done!</h2>
          <p>{{ reviewQuestionText }}</p>
          <StarRating v-model="currentRating" @select="handleRatingSelect" />
        </div>
      </template>
    </div>

    <!-- Progress Dots -->
    <div class="cs-cinematic-progress">
      <span
        v-for="(_, index) in allSlides"
        :key="`dot-${index}`"
        class="cs-cinematic-progress-dot"
        :class="{ 'cs-cinematic-progress-dot--active': currentSlide === index }"
        @click="goToSlide(index)"
      />
    </div>

    <!-- Ingredients Toggle Button -->
    <button class="cs-cinematic-ingredients-btn" @click="showIngredientsOverlay = !showIngredientsOverlay">
      {{ suppliesLabel }}
    </button>

    <!-- Ingredients Overlay -->
    <div v-if="showIngredientsOverlay" class="cs-cinematic-ingredients-overlay">
      <ul>
        <li v-for="(ingredient, idx) in adjustedIngredients" :key="`ing-${idx}`">
          <IngredientText :ingredient="ingredient" />
        </li>
      </ul>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useInteractiveCreation } from '../composables/useInteractiveCreation'
import { useInteractiveNavigation } from '../composables/useInteractiveNavigation'
import { useInteractiveIngredients } from '../composables/useInteractiveIngredients'
import { useInteractiveReview } from '../composables/useInteractiveReview'
import { useSharedTimerManager } from '../composables/useSharedTimerManager'
import { useAnalytics } from '../composables/useAnalytics'
import IngredientText from './IngredientText.vue'
import StepText from './StepText.vue'
import StarRating from './StarRating.vue'

interface Props {
  creationId?: string
  domain?: string
  baseUrl?: string
  hideAttribution?: boolean
  cacheBust?: boolean
  disableRatingSubmission?: boolean
  config?: {
    creationId: string
    domain: string
    baseUrl?: string
    hideAttribution?: boolean
    cacheBust?: boolean
    disableRatingSubmission?: boolean
    unitConversion?: {
      enabled: boolean
      default_system: 'auto' | 'us_customary' | 'metric'
      source_system: 'us_customary' | 'metric'
      label: string
      conversions: Record<string, { amount: string; unit: string; max_amount?: string | null }>
    }
  }
}

const props = withDefaults(defineProps<Props>(), {
  baseUrl: '',
  hideAttribution: false,
  cacheBust: false,
  disableRatingSubmission: false,
})

// Resolve config values (support both direct props and config wrapper)
const finalCreationId = computed(() => props.config?.creationId || props.creationId || '')
const finalDomain = computed(() => props.config?.domain || props.domain || '')
const finalBaseUrl = computed(() => props.config?.baseUrl || props.baseUrl || '')
const finalCacheBust = computed(() => props.config?.cacheBust ?? props.cacheBust ?? false)
const finalDisableRatingSubmission = computed(
  () => props.config?.disableRatingSubmission ?? props.disableRatingSubmission ?? false
)
const finalSiteUrl = computed(() => {
  const domain = finalDomain.value
  if (domain === 'localhost') return 'http://localhost:8074'
  if (domain.endsWith('.test')) return `http://${domain}`
  const protocol = typeof window !== 'undefined' ? window.location.protocol : 'https:'
  return `${protocol}//${domain}`
})

// Analytics
const analytics = useAnalytics({
  baseUrl: finalBaseUrl.value,
  domain: finalDomain.value,
  creationId: finalCreationId.value,
  isDemo: finalDisableRatingSubmission.value,
})

// Timer manager
const timerManager = useSharedTimerManager({ storageManager: null })

// Creation data
const { creation, isLoadingCreation, creationError, dataReady, steps, suppliesLabel: creationSuppliesLabel, loadCreationData } =
  useInteractiveCreation({
    creationId: finalCreationId,
    siteUrl: finalSiteUrl,
    baseUrl: finalBaseUrl,
    cacheBust: finalCacheBust,
  })

// Navigation
const { currentSlide, totalSlides, goToSlide, nextSlide, previousSlide } = useInteractiveNavigation({ steps })

// Ingredients
const servingsMultiplier = computed(() => 1)
const resolvedUnitConversionConfig = computed(() => null)
const activeUnitSystem = ref<any>(null)

const { suppliesLabel, adjustedIngredients, adjustedIngredientsGroups, adjustedYield } =
  useInteractiveIngredients({
    creation: computed(() => creation.value as any),
    servingsMultiplier,
    resolvedUnitConversionConfig,
    activeUnitSystem,
  })

// Review
const imageHeight = ref(25)
const { currentRating, reviewQuestionText, handleRatingSelect, handleFormSubmit, hasSubmittedRating, hasSubmittedReview, existingReview, form, showRatingSubmittedMessage, showLowRatingPrompt, showReviewForm, isFormValid, loadExistingReview, reviewSubmission } =
  useInteractiveReview({
    creationId: finalCreationId,
    siteUrl: finalSiteUrl,
    disableRatingSubmission: finalDisableRatingSubmission,
    analytics,
    imageHeight,
  })

// Ingredients overlay state
const showIngredientsOverlay = ref(false)

// All slides array for v-for (intro + steps + review)
const allSlides = computed(() => {
  const count = totalSlides.value
  return Array.from({ length: count }, (_, i) => i)
})

onMounted(() => {
  loadCreationData()
  timerManager.restoreTimersFromStore()
})
</script>
