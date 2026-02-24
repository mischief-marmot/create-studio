<template>
    <div class="cs-split-wrapper cs:h-full cs:w-full cs:flex cs:flex-col cs:bg-base-100 cs:text-base-content">
        <!-- Error state -->
        <div v-if="creationError && !creation" class="cs:text-center cs:p-8">
            <h2 class="cs:text-2xl cs:font-bold cs:text-error cs:mb-4">Error Loading Recipe</h2>
            <p>{{ creationError }}</p>
        </div>

        <!-- Loading state -->
        <div v-if="isLoadingCreation || !dataReady" class="cs:flex cs:items-center cs:justify-center cs:h-full">
            <LogoSolo class="cs:size-16 cs:animate-pulse" />
        </div>

        <!-- Main split layout - Desktop -->
        <div v-if="dataReady && !isMobile" class="cs-split-container cs:flex cs:flex-row cs:h-full cs:w-full cs:overflow-hidden">
            <!-- Sidebar -->
            <aside class="cs-split-sidebar cs:w-72 cs:flex-shrink-0 cs:flex cs:flex-col cs:overflow-y-auto cs:border-r cs:border-base-300 cs:p-4 cs:space-y-4">
                <!-- Recipe title -->
                <h1 class="cs:text-xl cs:font-bold">{{ creation?.name }}</h1>

                <!-- Supplies label + ingredient list -->
                <div>
                    <h2 class="cs:text-base cs:font-semibold cs:mb-2">{{ suppliesLabel }}</h2>

                    <!-- Grouped ingredients -->
                    <template v-if="adjustedIngredientsGroups">
                        <div v-for="(ingredients, groupName) in adjustedIngredientsGroups" :key="groupName" class="cs:mb-3">
                            <h4 v-if="groupName && groupName !== 'mv-has-no-group'" class="cs:text-sm cs:font-semibold cs:mb-1">{{ groupName }}</h4>
                            <ul class="cs:space-y-1">
                                <li v-for="(ingredient, idx) in ingredients" :key="`${groupName}-${idx}`">
                                    <IngredientText :ingredient="ingredient" />
                                </li>
                            </ul>
                        </div>
                    </template>

                    <!-- Flat ingredient list -->
                    <ul v-else class="cs:space-y-1">
                        <li v-for="(ingredient, idx) in adjustedIngredients" :key="`ing-${idx}`">
                            <IngredientText :ingredient="ingredient" />
                        </li>
                    </ul>
                </div>

                <!-- Step navigation dots -->
                <div class="cs:flex cs:flex-col cs:gap-2 cs:mt-auto">
                    <button
                        v-for="(step, idx) in steps"
                        :key="`dot-${idx}`"
                        class="cs-split-step-dot cs:w-3 cs:h-3 cs:rounded-full cs:border cs:border-base-content"
                        :class="currentSlide === idx + 1 ? 'cs:bg-primary' : 'cs:bg-base-300'"
                        @click="goToSlide(idx + 1)"
                        :aria-label="`Go to step ${idx + 1}`"
                    />
                </div>
            </aside>

            <!-- Main content area -->
            <main class="cs-split-main cs:flex-1 cs:flex cs:flex-col cs:overflow-y-auto cs:p-6 cs:space-y-4">
                <!-- Step counter -->
                <div v-if="currentSlide >= 1 && currentSlide <= steps.length" class="cs:text-sm cs:text-base-content/70 cs:font-medium">
                    Step {{ currentSlide }} of {{ steps.length }}
                </div>

                <!-- Current step content -->
                <div v-if="currentSlide >= 1 && currentSlide <= steps.length" class="cs:flex cs:items-start cs:gap-3">
                    <div class="cs-interactive-step-number cs:flex-shrink-0">
                        {{ currentSlide }}
                    </div>
                    <StepText
                        :text="steps[currentSlide - 1]?.text || ''"
                        :links="steps[currentSlide - 1]?.links"
                        class="cs:text-lg cs:leading-snug"
                    />
                </div>

                <!-- Intro slide content -->
                <div v-else-if="currentSlide === 0">
                    <h1 class="cs:text-2xl cs:font-bold cs:mb-2">{{ creation?.name }}</h1>
                    <p v-if="creation?.description" v-html="creation?.description" class="cs:text-sm cs:leading-relaxed" />
                </div>

                <!-- Completion slide -->
                <div v-else class="cs:text-center cs:py-8">
                    <h2 class="cs:text-2xl cs:font-bold">All done!</h2>
                    <StarRating v-model="currentRating" @select="handleRatingSelect" />
                </div>

                <!-- Navigation controls -->
                <div class="cs:flex cs:items-center cs:justify-between cs:mt-auto cs:pt-4">
                    <button
                        v-if="currentSlide > 0"
                        @click="previousSlide"
                        class="cs-interactive-nav-btn"
                    >
                        Back
                    </button>
                    <div v-else class="cs:w-16" />

                    <button
                        v-if="currentSlide < totalSlides - 1"
                        @click="nextSlide"
                        class="cs-interactive-nav-btn"
                    >
                        Next
                    </button>
                    <div v-else class="cs:w-16" />
                </div>
            </main>
        </div>

        <!-- Mobile layout -->
        <div v-if="dataReady && isMobile" class="cs-split-mobile cs:flex cs:flex-col cs:h-full cs:overflow-hidden">
            <!-- Step counter -->
            <div v-if="currentSlide >= 1 && currentSlide <= steps.length" class="cs:px-4 cs:pt-4 cs:text-sm cs:font-medium cs:text-base-content/70">
                Step {{ currentSlide }} of {{ steps.length }}
            </div>

            <!-- Current step content -->
            <div class="cs:flex-1 cs:overflow-y-auto cs:p-4">
                <div v-if="currentSlide >= 1 && currentSlide <= steps.length" class="cs:flex cs:items-start cs:gap-3">
                    <div class="cs-interactive-step-number cs:flex-shrink-0">
                        {{ currentSlide }}
                    </div>
                    <StepText
                        :text="steps[currentSlide - 1]?.text || ''"
                        :links="steps[currentSlide - 1]?.links"
                        class="cs:text-lg cs:leading-snug"
                    />
                </div>

                <div v-else-if="currentSlide === 0">
                    <h1 class="cs:text-2xl cs:font-bold cs:mb-2">{{ creation?.name }}</h1>
                    <p v-if="creation?.description" v-html="creation?.description" class="cs:text-sm cs:leading-relaxed" />
                </div>

                <div v-else class="cs:text-center cs:py-8">
                    <h2 class="cs:text-2xl cs:font-bold">All done!</h2>
                </div>
            </div>

            <!-- Mobile tab bar -->
            <div class="cs-split-tabs cs:flex cs:border-t cs:border-base-300 cs:bg-base-200">
                <button
                    class="cs:flex-1 cs:py-3 cs:text-sm cs:font-medium"
                    :class="mobileActiveTab === 'steps' ? 'cs:text-primary' : 'cs:text-base-content/70'"
                    @click="mobileActiveTab = 'steps'"
                >
                    Steps
                </button>
                <button
                    class="cs:flex-1 cs:py-3 cs:text-sm cs:font-medium"
                    :class="mobileActiveTab === 'ingredients' ? 'cs:text-primary' : 'cs:text-base-content/70'"
                    @click="mobileActiveTab = 'ingredients'"
                >
                    {{ suppliesLabel }}
                </button>
            </div>
        </div>

        <!-- Timer Warning Modal -->
        <TimerWarningModal ref="timerWarningModalRef" @accept="handleTimerWarningAccept" @decline="handleTimerWarningDecline" />
    </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, provide } from 'vue'
import { SharedStorageManager } from '@create-studio/shared'
import { useInteractiveCreation } from '../composables/useInteractiveCreation'
import { useInteractiveNavigation } from '../composables/useInteractiveNavigation'
import { useInteractiveIngredients } from '../composables/useInteractiveIngredients'
import { useInteractiveImage } from '../composables/useInteractiveImage'
import { useInteractiveReview } from '../composables/useInteractiveReview'
import { useSharedTimerManager } from '../composables/useSharedTimerManager'
import { useAnalytics } from '../composables/useAnalytics'
import LogoSolo from './Logo/Solo.vue'
import IngredientText from './IngredientText.vue'
import StepText from './StepText.vue'
import StarRating from './StarRating.vue'
import TimerWarningModal from './TimerWarningModal.vue'

// ─── Props ────────────────────────────────────────────────────────────────────

interface Props {
    creationId?: string
    domain?: string
    baseUrl?: string
    hideAttribution?: boolean
    cacheBust?: boolean
    disableRatingSubmission?: boolean
    isMobile?: boolean
    config?: {
        creationId: string
        domain: string
        baseUrl?: string
        hideAttribution?: boolean
        cacheBust?: boolean
        disableRatingSubmission?: boolean
    }
}

const props = withDefaults(defineProps<Props>(), {
    baseUrl: '',
    hideAttribution: false,
    cacheBust: false,
    disableRatingSubmission: false,
    isMobile: false,
})

// ─── Resolved prop values ─────────────────────────────────────────────────────

const finalCreationId = computed(() => props.config?.creationId || props.creationId || '')
const finalDomain = computed(() => props.config?.domain || props.domain || '')
const finalBaseUrl = computed(() => props.config?.baseUrl || props.baseUrl || '')
const finalDisableRatingSubmission = computed(() => props.config?.disableRatingSubmission ?? props.disableRatingSubmission ?? false)
const finalCacheBust = computed(() => props.config?.cacheBust ?? props.cacheBust ?? false)

const finalSiteUrl = computed(() => {
    const domain = finalDomain.value
    if (domain === 'localhost') return 'http://localhost:8074'
    if (domain.endsWith('.test')) return `http://${domain}`
    const protocol = typeof window !== 'undefined' ? window.location.protocol : 'https:'
    return `${protocol}//${domain}`
})

// ─── Analytics ───────────────────────────────────────────────────────────────

const analytics = useAnalytics({
    baseUrl: finalBaseUrl.value,
    domain: finalDomain.value,
    creationId: finalCreationId.value,
    isDemo: finalDisableRatingSubmission.value,
})

// ─── Storage & timer manager ──────────────────────────────────────────────────

const storageManager = new SharedStorageManager()

const timerManager = useSharedTimerManager({
    storageManager,
    baseUrl: finalBaseUrl.value,
    creationId: finalCreationId.value,
})

provide('timerManager', timerManager)
provide('analytics', analytics)

// ─── Timer warning modal ──────────────────────────────────────────────────────

const timerWarningModalRef = ref<any>(null)
const pendingTimerCallback = ref<(() => void) | null>(null)

const requestTimerWarning = (callback: () => void) => {
    pendingTimerCallback.value = callback
    if (timerWarningModalRef.value) {
        timerWarningModalRef.value.show()
    } else {
        callback()
    }
}
provide('requestTimerWarning', requestTimerWarning)

const handleTimerWarningAccept = () => {
    if (pendingTimerCallback.value) {
        pendingTimerCallback.value()
        pendingTimerCallback.value = null
    }
}

const handleTimerWarningDecline = () => {
    pendingTimerCallback.value = null
}

// ─── Creation data ────────────────────────────────────────────────────────────

const { creation, isLoadingCreation, creationError, dataReady, steps, suppliesLabel, loadCreationData } =
    useInteractiveCreation({
        creationId: finalCreationId,
        siteUrl: finalSiteUrl,
        baseUrl: finalBaseUrl,
        cacheBust: finalCacheBust,
    })

// ─── Navigation ───────────────────────────────────────────────────────────────

const { currentSlide, totalSlides, goToSlide, nextSlide, previousSlide } = useInteractiveNavigation({ steps })

// ─── Ingredients ─────────────────────────────────────────────────────────────

const servingsMultiplier = computed(() => 1)
const resolvedUnitConversionConfig = computed(() => null)
const activeUnitSystem = ref<any>(null)

const { adjustedIngredients, adjustedIngredientsGroups } = useInteractiveIngredients({
    creation: computed(() => creation.value as any),
    servingsMultiplier,
    resolvedUnitConversionConfig,
    activeUnitSystem,
})

// ─── Image ────────────────────────────────────────────────────────────────────

const containerRef = ref<HTMLElement>()
const isMobileProp = computed(() => props.isMobile)

const { imageHeight, startDrag } = useInteractiveImage({
    isMobile: isMobileProp as any,
    containerRef,
})

// ─── Review ───────────────────────────────────────────────────────────────────

const {
    currentRating,
    handleRatingSelect,
    loadExistingReview,
} = useInteractiveReview({
    creationId: finalCreationId,
    siteUrl: finalSiteUrl,
    disableRatingSubmission: finalDisableRatingSubmission,
    analytics,
    imageHeight,
})

// ─── Mobile tab state ─────────────────────────────────────────────────────────

const mobileActiveTab = ref<'steps' | 'ingredients'>('steps')

// ─── Init ─────────────────────────────────────────────────────────────────────

onMounted(async () => {
    await loadCreationData()
    timerManager.restoreTimersFromStore()
    loadExistingReview()
})
</script>
