<template>
    <div class="cs:h-full cs:w-full cs:flex cs:md:flex-col cs:items-center cs:justify-center cs:bg-base-300 cs:text-base-content">
        <!-- Timer Warning Modal -->
        <TimerWarningModal ref="timerWarningModalRef" @accept="handleTimerWarningAccept" @decline="handleTimerWarningDecline" />

        <!-- Show error message if loading failed -->
        <div v-if="creationError && !creation" class="cs:text-center cs:p-8">
            <h2 class="cs:text-2xl cs:font-bold cs:text-error cs:mb-4">Error Loading Recipe</h2>
            <p class="cs:text-base-content cs:mb-4">{{ creationError }}</p>
        </div>

        <!-- Show skeleton loader while loading -->
        <RecipeSkeletonLoader v-if="!isHydrated || isLoadingCreation || !dataReady" />

        <!-- Unified Responsive Container -->
        <div v-if="dataReady" ref="containerRef"
            :class="[ 'cs:w-full cs:h-full cs:bg-base-100 cs:flex cs:flex-col cs:overflow-hidden cs:relative', 'cs:md:flex-row cs:md:max-w-7xl cs:md:max-h-[720px] cs:md:mx-auto cs:md:my-auto cs:md:gap-8' ]"
            @mousedown="startDrag"
            @touchstart="startDrag">

            <!-- Skeleton overlay during initial positioning -->
            <div v-if="isLoadingPersistence" class="cs:absolute cs:inset-0 cs:z-50 cs:md:rounded-xl cs:overflow-hidden">
                <RecipeSkeletonLoader />
            </div>

            <!-- Figure Section - Collapsible on mobile, fixed on desktop -->
            <figure :class="[ 'cs:relative cs:overflow-hidden cs:flex-shrink-0', 'cs:md:w-2/5 cs:md:h-full cs:md:mb-auto', isMobile ? 'cs:-mb-6' : '', isDragging ? '' : 'cs:transition-all cs:duration-300', ]" :style="isMobile ? { height: `${imageHeightPx}px` } : {}" @dblclick="toggleImageCollapse">
                <!-- Current Step Media or Default Image -->
                <template v-if="currentSlide === 0">
                    <!-- Intro Image -->
                    <RecipeMedia :image="creation?.image" :alt="creation?.name || 'Recipe'"
                        placeholder-class="cs:from-primary/20 cs:to-secondary/20 cs:flex cs:items-center cs:justify-center"
                        placeholder-emoji="🍽️" />
                </template>
                <template v-else-if="currentSlide <= steps.length">
                    <!-- Step Media -->
                    <RecipeMedia :video="steps[currentSlide - 1]?.video"
                        :image="steps[currentSlide - 1]?.image || creation?.image"
                        :alt="steps[currentSlide - 1]?.name || `Step ${currentSlide - 1}`" :video-key="currentSlide"
                        placeholder-class="cs:from-base-200 cs:to-base-300 cs:flex cs:items-center cs:justify-center"
                        placeholder-emoji="👩‍🍳" />
                </template>
                <template v-else>
                    <!-- Completion Image -->
                    <RecipeMedia :image="creation?.image" :alt="creation?.name || 'Recipe'"
                        placeholder-class="cs:from-success/20 cs:to-success/30 cs:flex cs:items-center cs:justify-center"
                        placeholder-emoji="🎉" />
                </template>
            </figure>

            <!-- Content Section - Scrollable with rounded top corners on mobile, side panel on desktop -->
            <div :class="[ 'cs:flex-1 cs:overflow-hidden cs:flex cs:flex-col cs:relative cs:z-10 cs:bg-base-100 cs:rounded-t-3xl cs:h-full cs:w-full', 'cs:md:rounded-none cs:md:w-3/5 cs:md:max-h-4/5 cs:md:mb-auto cs:md:z-0' ]">
                <!-- Draggable Handle - Mobile only -->
                <DraggableHandle v-if="isMobile" @start-drag="startDrag" />
                <div class="cs:carousel cs:carousel-center cs:w-full cs:flex-1 cs:overflow-x-auto cs:snap-x cs:snap-mandatory cs:flex cs:flex-row"
                    ref="carouselRef">
                    <!-- Intro Slide - Title, Description, Stats -->
                    <div id="slide0" class="cs:carousel-item cs:w-full cs:snap-center cs:flex-shrink-0">
                        <div class="cs:p-6 cs:space-y-4">
                            <div>
                                <h1 class="cs:text-2xl cs:font-bold cs:mb-3">{{ creation?.name || 'Recipe' }}</h1>
                                <p v-if="creation?.description" v-html="creation?.description"
                                    class="cs:text-base-content cs:text-sm cs:leading-relaxed"></p>
                                <div v-if="adjustedYield" class="cs:mt-2 cs:text-sm cs:text-base-content/80">
                                    <span class="cs:font-semibold">Yield:</span> {{ adjustedYield }}
                                </div>
                            </div>
                            <div>
                                <h2 class="cs:text-xl cs:font-bold cs:mb-4">
                                    {{ suppliesLabel }}
                                    <span v-if="servingsMultiplier !== 1" class="cs:text-sm cs:font-normal cs:text-base-content/70">
                                        ({{ servingsMultiplier }}x)
                                    </span>
                                </h2>

                                <ul class="cs:space-y-1">
                                    <li v-for="supply in adjustedIngredients" :key="supply"
                                        class="cs:flex cs:items-start cs:space-x-2">
                                        <span class="cs:w-1.5 cs:h-1.5 cs:bg-gray-400 cs:rounded-full cs:mt-1.5 cs:flex-shrink-0"></span>
                                        <span class="cs:text-sm cs:text-base-content">{{ supply }}</span>
                                    </li>
                                </ul>
                            </div>
                        </div>
                    </div>

                    <!-- Recipe Steps -->
                    <div v-for="(step, index) in steps" :key="`step-${index}`" :id="`slide${index + 1}`"
                        class="cs:carousel-item cs:w-full cs:snap-center cs:flex-shrink-0">
                        <div class="cs:px-4 cs:py-8 cs:flex cs:flex-col cs:space-y-8 cs:overflow-y-auto">
                            <div class="cs:flex cs:space-x-3 cs:justify-start cs:w-full cs:items-center">
                                <div
                                    class="cs:flex cs:justify-center cs:items-center cs:grow-0 cs:shrink-0 cs:h-14 cs:w-14 cs:bg-primary cs:text-primary-content cs:rounded-md">
                                    <span class="cs:text-3xl cs:font-mono">{{ index + 1 }}</span>
                                </div>

                                <div class="cs:text-lg cs:text-base-content cs:leading-tight" v-html="step.text"></div>
                            </div>

                            <!-- Step-specific supplies -->
                            <div v-if="step.supply && step.supply.length > 0" class="cs:box-gray">
                                <div class="cs:flex cs:justify-between cs:cursor-pointer"
                                    @click="storageManager.toggleStepSuppliesVisibility()">
                                    <span class="cs:font-medium cs:text-base-content">Step Supplies</span>
                                    <PlusIcon v-if="!currentCreationState?.showStepSupplies"
                                        class="cs:w-5 cs:h-5" />
                                    <MinusIcon v-if="currentCreationState?.showStepSupplies"
                                        class="cs:w-5 cs:h-5" />
                                </div>
                                <ul v-show="currentCreationState?.showStepSupplies" class="cs:space-y-1 cs:mt-2">
                                    <li v-for="(supply, supplyIdx) in step.supply"
                                        :key="`step-${index}-supply-${supplyIdx}`">
                                        <label class="cs:flex cs:items-start cs:space-x-3 cs:text-base-content">
                                            <input type="checkbox" class="cs:checkbox cs:checkbox-lg"
                                                :checked="storageManager.isStepSupplyChecked(index, `${supply.name}`)"
                                                @change="storageManager.toggleStepSupply(index, `${supply.name}`)" />
                                            <span>{{ supply.name }}</span>
                                        </label>
                                    </li>
                                </ul>
                            </div>
                            <!-- Timer -->
                            <RecipeTimer v-if="step.timer" :timer="step.timer" :timer-id="`step-${index + 1}-timer`"
                                :step-index="index + 1" />
                        </div>
                    </div>

                    <!-- Review Prompt Slide -->
                    <div :id="`slide${totalSlides - 1}`" class="cs:carousel-item cs:w-full cs:snap-center cs:flex-shrink-0">
                        <div class="cs:w-full cs:px-4 cs:py-6 cs:flex cs:flex-col cs:h-full cs:overflow-y-auto cs:space-y-2">

                            <!-- Title and question -->
                            <div class="cs:text-center">
                                <h2 class="cs:text-2xl cs:font-bold cs:text-base-content">All done!</h2>
                                <p class="cs:text-lg cs:text-base-content/80">{{ reviewQuestionText }}</p>
                            </div>

                            <!-- Star rating -->
                            <div class="cs:text-center cs:pb-2">
                                <StarRating v-model="currentRating" @select="handleRatingSelect" />
                            </div>

                            <!-- Rating submitted message for high ratings -->
                            <div v-if="showRatingSubmittedMessage" role="alert" class="cs:alert cs:alert-success">
                                <svg xmlns="http://www.w3.org/2000/svg" class="cs:h-6 cs:w-6 cs:shrink-0 cs:stroke-current"
                                    fill="none" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <span>Rating submitted! You're a star! 😉<br /> Care to share more?
                                    (Optional)</span>
                            </div>

                            <!-- Rating not submitted message for low ratings -->
                            <div v-if="showLowRatingPrompt" role="alert" class="cs:alert cs:alert-error">
                                <svg xmlns="http://www.w3.org/2000/svg" class="cs:h-6 cs:w-6 cs:shrink-0 cs:stroke-current"
                                    fill="none" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                        d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <span>Before submitting your rating, would you please let us know what could have been
                                    better?</span>
                            </div>

                            <!-- Review Form -->
                            <form v-if="showReviewForm" @submit.prevent="handleFormSubmit"
                                class="cs:flex-1 cs:space-y-4 cs:max-w-md cs:mx-auto cs:w-full">
                                <!-- Review Title -->
                                <div>
                                    <label for="reviewTitle"
                                        class="cs:block cs:text-sm cs:font-medium cs:text-base-content/90 cs:mb-1">
                                        Review Title
                                    </label>
                                    <input id="reviewTitle" v-model="form.title" type="text" class="cs:w-full cs:input"
                                        :placeholder="titlePlaceholder" />
                                </div>

                                <!-- Review -->
                                <div>
                                    <label for="review" class="cs:block cs:text-sm cs:font-medium cs:text-base-content/90 cs:mb-1">
                                        Review<span class="cs:text-red-600">*</span>
                                    </label>
                                    <textarea id="review" v-model="form.review" rows="3"
                                        class="cs:w-full cs:textarea cs:resize-none" :placeholder="reviewPlaceholder"
                                        required />
                                </div>

                                <!-- Name -->
                                <div>
                                    <label for="name" class="cs:block cs:text-sm cs:font-medium cs:text-base-content/90 cs:mb-1">
                                        Name<span class="cs:text-red-600">*</span>
                                    </label>
                                    <input id="name" v-model="form.name" type="text" class="cs:w-full cs:input"
                                        placeholder="Your name" required />
                                </div>

                                <!-- Email -->
                                <div>
                                    <label for="email" class="cs:block cs:text-sm cs:font-medium cs:text-base-content/90 cs:mb-1">
                                        Email<span class="cs:text-red-600">*</span>
                                    </label>
                                    <input id="email" v-model="form.email" type="email" class="cs:w-full cs:input"
                                        placeholder="your@email.com" required />
                                </div>

                                <!-- Submit button -->
                                <div class="cs:justify-self-end">
                                    <button type="submit"
                                        :disabled="reviewSubmission.isSubmitting.value || (!isFormValid)"
                                        class="cs:btn cs:btn-primary cs:btn-lg">
                                        <span v-if="reviewSubmission.isSubmitting.value">Submitting...</span>
                                        <span v-else-if="existingReview && form.review.length ">Update Review</span>
                                        <span v-else>Submit Review</span>
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Bottom Navigation Controls - Fixed at bottom for both mobile and desktop -->
            <div :class="[ 'cs:flex-shrink-0 cs:bg-base-200 cs:border-t cs:border-base-300 cs:relative', 'cs:md:absolute cs:md:bottom-0 cs:md:left-0 cs:md:right-0 cs:md:w-full' ]">
                <div v-if="!finalHideAttribution" class="cs:hidden cs:absolute cs:md:block cs:top-1/2 cs:-translate-y-1/2 cs:left-6 cs:text-xs cs:lg:text-sm">
                    Powered by <a href="https://create.studio/"><LogoSolo class="cs:size-5 cs:md:size-6 cs:inline-block cs:ml-1" /></a>
                </div>
                <!-- Active Timers Panel -->
                <ActiveTimers v-if="showActiveTimers" @close="showActiveTimers = false" />

                <!-- Supplies Dropdown Panel (only shows after slide 0) -->
                <div v-if="showSupplies && currentSlide > 0"
                    class="cs:absolute cs:bottom-[120%] cs:left-0 cs:right-0 cs:mx-auto cs:bg-base-300 cs:border-[0.25px] cs:border-base-100/60 cs:shadow-xl cs:overflow-y-auto cs:max-w-[90%] cs:sm:max-w-lg cs:rounded-2xl cs:z-50">
                    <div class="cs:p-4">
                        <div class="cs:flex cs:items-center cs:justify-between cs:mb-3">
                            <h3 class="cs:font-semibold cs:text-base">
                                {{ suppliesLabel }}
                                <span v-if="servingsMultiplier !== 1" class="cs:text-sm cs:font-normal cs:text-base-content/70">
                                    ({{ servingsMultiplier }}x)
                                </span>
                            </h3>
                            <button @click="showSupplies = false" class="cs:p-1 cs:cursor-pointer">
                                <XMarkIcon class="cs:w-5 cs:h-5" />
                            </button>
                        </div>
                        <ul class="cs:space-y-1">
                            <li v-for="(supply, idx) in adjustedIngredients" :key="`sup-${idx}`">
                                {{ supply }}
                            </li>
                        </ul>
                    </div>
                </div>

                <!-- Navigation Controls -->
                <div class="cs:p-4 cs:w-full cs:max-w-2xl cs:mx-auto ">
                    <div v-if="currentSlide === 0" class="cs:flex cs:items-center cs:justify-between">
                        <!-- First slide - original layout -->
                        <div class="cs:w-16"></div>

                        <!-- Progress Indicator -->
                        <div class="cs:flex-1 cs:flex cs:justify-center cs:items-center">
                            <div class="cs:text-xs cs:text-base-content">Swipe <span class="cs:hidden cs:md:inline-block">or scroll</span> to begin! →</div>
                        </div>

                        <!-- Begin Button -->
                        <button @click="nextSlide"
                            class="cs:px-6 cs:py-2 cs:bg-primary cs:text-primary-content cs:rounded-full cs:text-sm cs:font-medium cs:hover:bg-gray-800 cs:flex cs:items-center cs:space-x-2 cs:cursor-pointer">
                            <span>Begin</span>
                            <ChevronDoubleRightIcon class="cs:w-5 cs:h-5" />
                        </button>
                    </div>
                    <div v-else class="cs:flex cs:items-center cs:justify-between cs:sm:justify-evenly">
                        <!-- After slide 0 - with supplies button -->
                        <!-- Previous Button -->
                        <button @click="previousSlide"
                            class="cs:flex cs:items-center cs:space-x-2 cs:text-base-content cs:cursor-pointer">
                            <ChevronDoubleLeftIcon class="cs:w-5 cs:h-5" />
                            <span class="cs:text-sm">Back</span>
                        </button>

                        <!-- Supplies Button -->
                        <button @click="showSupplies = !showSupplies"
                            class="cs:flex cs:items-center cs:space-x-2 cs:px-4 cs:py-2 cs:bg-primary cs:text-primary-content cs:hover:bg-primary/80 cs:rounded-lg cs:transition-colors cs:cursor-pointer">
                            <!-- Supplies Icon SVG -->
                            <QueueListIcon class="cs:w-5 cs:h-5" />
                            <span class="cs:text-sm cs:font-medium">{{ showSupplies ? 'Hide' : 'Show' }} {{ suppliesLabel }}</span>
                        </button>

                        <!-- Next Button -->
                        <button v-if="currentSlide < totalSlides - 1" @click="nextSlide"
                            class="cs:flex cs:items-center cs:space-x-2 cs:text-base-content cs:cursor-pointer">
                            <span class="cs:text-sm">Next</span>
                            <ChevronDoubleRightIcon class="cs:w-5 cs:h-5" />
                        </button>
                        <div v-else class="cs:w-16"></div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted, provide, nextTick, reactive } from 'vue'
import { QueueListIcon } from '@heroicons/vue/24/outline';
import { ChevronDoubleLeftIcon, ChevronDoubleRightIcon, MinusIcon, PlusIcon, XMarkIcon } from '@heroicons/vue/20/solid';
import { SharedStorageManager } from '@create-studio/shared';
import { useSharedTimerManager } from '../composables/useSharedTimerManager.js';
import { useRecipeUtils } from '../composables/useRecipeUtils.js';
import { useReviewStorage } from '../composables/useReviewStorage.js';
import { useReviewSubmission } from '../composables/useReviewSubmission.js';
import TimerWarningModal from './TimerWarningModal.vue';
import { HowTo, HowToStep } from '@create-studio/shared';

interface Props {
  creationId?: string
  domain?: string
  baseUrl?: string
  hideAttribution?: boolean
  cacheBust?: boolean
  // Support SDK mounting with config wrapper
  config?: {
    creationId: string
    domain: string
    baseUrl?: string
    hideAttribution?: boolean
    cacheBust?: boolean
  }
}

const props = withDefaults(defineProps<Props>(), {
  baseUrl: '',
  hideAttribution: false,
  cacheBust: false
})

// Use config wrapper if provided (from SDK), otherwise use direct props
const finalCreationId = computed(() => props.config?.creationId || props.creationId || '')
const finalDomain = computed(() => props.config?.domain || props.domain || '')
const finalBaseUrl = computed(() => props.config?.baseUrl || props.baseUrl || '')
const finalHideAttribution = computed(() => props.config?.hideAttribution ?? props.hideAttribution ?? false)
const finalCacheBust = computed(() => props.config?.cacheBust ?? props.cacheBust ?? false)

const { formatDuration } = useRecipeUtils();

// Initialize shared storage manager
const storageManager = new SharedStorageManager();

// Initialize timer manager with local storage
const timerManager = useSharedTimerManager({
    storageManager,
    baseUrl: finalBaseUrl.value,
    creationId: finalCreationId.value
});
provide('timerManager', timerManager);

// Timer warning modal ref
const timerWarningModalRef = ref<any>(null);
const pendingTimerCallback = ref<(() => void) | null>(null);

// Check if timer warning has been shown this session
const hasShownTimerWarning = () => {
    if (typeof sessionStorage === 'undefined') return false;
    return sessionStorage.getItem('timerWarningSeen') === 'true';
};

// Provide timer warning request function to child components
const requestTimerWarning = (callback: () => void) => {
    console.log('⏱️  [InteractiveExperience] Request timer warning for user');

    // If user has already seen the warning this session, just start the timer
    if (hasShownTimerWarning()) {
        console.log('✅ Timer warning already shown this session, starting timer');
        callback();
        return;
    }

    // Store the callback to execute after user accepts
    pendingTimerCallback.value = callback;

    if (timerWarningModalRef.value) {
        timerWarningModalRef.value.show();
    } else {
        console.error('❌ [InteractiveExperience] timerWarningModalRef is null');
        // Fallback: start timer anyway
        callback();
    }
};
provide('requestTimerWarning', requestTimerWarning);

// Handle timer warning modal actions
const handleTimerWarningAccept = () => {
    console.log('✅ [InteractiveExperience] User accepted timer warning');

    // Execute the pending timer start callback
    if (pendingTimerCallback.value) {
        pendingTimerCallback.value();
        pendingTimerCallback.value = null;
    }
};

const handleTimerWarningDecline = () => {
    console.log('❌ [InteractiveExperience] User declined timer warning');
    pendingTimerCallback.value = null;
};

// Recipe data - will be populated from API
const creation = ref<HowTo | null>(null);
const isLoadingCreation = ref(false);
const creationError = ref<string | null>(null);

// Get current creation state from shared storage (reactive)
const currentCreationState = ref<any>(null);

// Function to refresh creation state
const refreshCreationState = () => {
    currentCreationState.value = storageManager.getCurrentCreationState();
};

// Dynamic label based on creation type
const suppliesLabel = computed(() => {
    return creation.value?.['@type'] === 'Recipe' ? 'Ingredients' : 'Supplies';
});

// Get servings multiplier from storage
const servingsMultiplier = computed(() => {
    return currentCreationState.value?.servingsMultiplier || 1;
});

// Adjust ingredients based on servings multiplier
const adjustedIngredients = computed(() => {
    if (!creation.value?.recipeIngredient || servingsMultiplier.value === 1) {
        return creation.value?.recipeIngredient || [];
    }

    return creation.value.recipeIngredient.map(ingredient => {
        return adjustIngredientAmount(ingredient, servingsMultiplier.value);
    });
});

// Adjust yield based on servings multiplier
const adjustedYield = computed(() => {
    if (!creation.value?.yield || servingsMultiplier.value === 1) {
        return creation.value?.yield;
    }

    const originalYield = creation.value.yield;

    // Parse the yield (e.g., "8 servings", "12 cookies", or "Yield: 4")
    let yieldMatch = originalYield.match(/^(\d+(?:\.\d+)?)\s*(.*)$/); // "4 servings"

    if (!yieldMatch) {
        yieldMatch = originalYield.match(/^(.*?):\s*(\d+(?:\.\d+)?)\s*(.*)$/); // "Yield: 4"
        if (yieldMatch) {
            const prefix = yieldMatch[1]; // "Yield"
            const originalNumber = parseFloat(yieldMatch[2]);
            const unit = yieldMatch[3]; // remaining text
            const newNumber = originalNumber * servingsMultiplier.value;

            // Format the number (remove unnecessary decimals)
            const formattedNumber = newNumber % 1 === 0 ? newNumber.toString() : newNumber.toFixed(1);

            return `${prefix}: ${formattedNumber} ${unit}`.trim();
        }
    }

    if (yieldMatch) {
        const originalNumber = parseFloat(yieldMatch[1]);
        const unit = yieldMatch[2];
        const newNumber = originalNumber * servingsMultiplier.value;

        // Format the number (remove unnecessary decimals)
        const formattedNumber = newNumber % 1 === 0 ? newNumber.toString() : newNumber.toFixed(1);

        return `${formattedNumber} ${unit}`.trim();
    }

    return originalYield;
});

// Helper function to adjust ingredient amounts
function adjustIngredientAmount(ingredient: string, multiplier: number): string {
    // Extract amount from ingredient text
    const amountMatch = ingredient.match(/^([\d\s\/\.\-]+)(.*)$/);
    if (!amountMatch) return ingredient;

    const numericPart = amountMatch[1].trim();
    const restOfIngredient = amountMatch[2].trim();

    const adjustedAmount = calculateAdjustedAmount(numericPart, multiplier);
    if (adjustedAmount) {
        return `${adjustedAmount} ${restOfIngredient}`;
    }

    return ingredient;
}

// Calculate adjusted amount (reusing logic from ServingsAdjuster)
function calculateAdjustedAmount(amount: string, multiplier: number): string | null {
    // Check for mixed fractions first (e.g., "2 1/4")
    if (/^\d+\s+\d+\/\d+$/.test(amount)) {
        return adjustFraction(amount, multiplier);
    }

    // Handle simple fractions (e.g., "1/2")
    if (amount.includes('/')) {
        return adjustFraction(amount, multiplier);
    }

    // Handle ranges
    if (amount.includes('-')) {
        const parts = amount.split('-').map(p => p.trim());
        const adjustedParts = parts.map(part => {
            if (part.includes('/')) {
                return adjustFraction(part, multiplier) || part;
            }
            const num = parseFloat(part);
            if (!isNaN(num)) {
                return formatNumber(num * multiplier);
            }
            return part;
        });
        return adjustedParts.join('-');
    }

    // Handle regular numbers
    const num = parseFloat(amount);
    if (!isNaN(num)) {
        return formatNumber(num * multiplier);
    }

    return null;
}

function adjustFraction(fraction: string, multiplier: number): string | null {
    // Handle mixed fractions like "2 1/4"
    const mixedMatch = fraction.match(/^(\d+)\s+(\d+)\/(\d+)$/);
    if (mixedMatch) {
        const whole = parseInt(mixedMatch[1]);
        const numerator = parseInt(mixedMatch[2]);
        const denominator = parseInt(mixedMatch[3]);
        const decimal = whole + (numerator / denominator);
        const adjusted = decimal * multiplier;
        return decimalToFraction(adjusted);
    }

    // Handle simple fractions like "1/2"
    const simpleMatch = fraction.match(/^(\d+)\/(\d+)$/);
    if (simpleMatch) {
        const numerator = parseInt(simpleMatch[1]);
        const denominator = parseInt(simpleMatch[2]);
        const decimal = numerator / denominator;
        const adjusted = decimal * multiplier;
        return decimalToFraction(adjusted);
    }

    return null;
}

function decimalToFraction(decimal: number): string {
    const whole = Math.floor(decimal);
    const remainder = decimal - whole;

    if (remainder === 0) {
        return whole.toString();
    }

    // Common fractions
    const fractions = [
        { value: 0.125, str: '1/8' },
        { value: 0.25, str: '1/4' },
        { value: 0.333, str: '1/3' },
        { value: 0.375, str: '3/8' },
        { value: 0.5, str: '1/2' },
        { value: 0.625, str: '5/8' },
        { value: 0.666, str: '2/3' },
        { value: 0.75, str: '3/4' },
        { value: 0.875, str: '7/8' }
    ];

    // Find closest fraction
    let closest = fractions[0];
    let minDiff = Math.abs(remainder - fractions[0].value);

    for (const frac of fractions) {
        const diff = Math.abs(remainder - frac.value);
        if (diff < minDiff) {
            minDiff = diff;
            closest = frac;
        }
    }

    // If difference is too large, use decimal
    if (minDiff > 0.05) {
        return formatNumber(decimal);
    }

    if (whole > 0) {
        return `${whole} ${closest.str}`;
    }

    return closest.str;
}

function formatNumber(num: number): string {
    // Remove unnecessary decimals
    if (num % 1 === 0) {
        return num.toString();
    }

    // Round to 2 decimal places
    return (Math.round(num * 100) / 100).toString();
}

// Get steps as HowToStep array for template usage
const steps = computed(() => {
    if (!creation.value) return [];
    return creation.value.step as HowToStep[];
});
const totalSlides = computed(() => steps.value.length + 2); // intro + steps + completion

// Reactive state with defaults - will be updated client-side
const currentSlide = ref(0);
const carouselRef = ref<HTMLElement>();
const containerRef = ref<HTMLElement>();
const showSupplies = ref(false);
const showActiveTimers = ref(false);

// Mobile detection
const isMobile = ref(false);

// Loading and ready state - start loading only on client side
const isLoadingPersistence = ref(false);
const isHydrated = ref(false);
const dataReady = computed(() => !isLoadingCreation.value && creation.value !== null);

// Image collapse state with defaults
const imageHeight = ref(25);
const isImageCollapsed = ref(false);
const isDragging = ref(false);
const dragStartY = ref(0);
const dragStartHeight = ref(0);

// Calculate pixel height based on container height - Mobile only
const imageHeightPx = computed(() => {
    if (!isMobile.value) return 0; // Desktop doesn't use dynamic height
    if (!containerRef.value) return 150; // Default fallback
    const containerHeight = containerRef.value.offsetHeight || 600;
    return Math.round((imageHeight.value / 100) * containerHeight);
});

// Calculate minimum height to offset the cs:-mb-6 (-24px) margin
const getMinHeightPercent = () => {
    const viewportHeight = window.innerHeight;
    return (24 / viewportHeight) * 100; // 24px as percentage of viewport height
};
const MIN_HEIGHT = ref(3); // Will be calculated dynamically
const MAX_HEIGHT = 35; // Maximum 35% height when expanded
const COLLAPSED_THRESHOLD = 10; // Threshold for collapsed state

// Load creation data
async function loadCreationData() {
    isLoadingCreation.value = true;
    const site_url = finalDomain.value === 'localhost'? 'http://localhost:8074' : `https://${finalDomain.value}`;

    try {
        // Use injected fetch if available (for Nuxt context), otherwise use global fetch
        const fetchFn = typeof $fetch !== 'undefined' ? $fetch : fetch;

        if (fetchFn === fetch) {
            // Using global fetch
            const response = await fetch(`${finalBaseUrl.value}/api/v2/fetch-creation`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    site_url,
                    creation_id: parseInt(finalCreationId.value),
                    cache_bust: finalCacheBust.value
                })
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();
            creation.value = data;
        } else {
            // Using Nuxt $fetch
            const data = await fetchFn<HowTo>('/api/v2/fetch-creation', {
                method: 'POST',
                body: {
                    site_url,
                    creation_id: parseInt(finalCreationId.value),
                    cache_bust: finalCacheBust.value
                }
            });
            creation.value = data;
        }
    } catch (error: any) {
        console.error('Failed to fetch creation:', error);
        creationError.value = error?.statusMessage || error?.message || 'Failed to load creation data';
    } finally {
        isLoadingCreation.value = false;
    }
}

// Client-side only: Initialize loading and persistence
onMounted(async () => {
    // Set up cleanup before any async operations
    let stateRefreshInterval: NodeJS.Timeout;
    onUnmounted(() => {
        if (stateRefreshInterval) {
            clearInterval(stateRefreshInterval);
        }
    });

    // Detect if device is mobile/tablet
    isMobile.value = window.matchMedia('(max-width: 768px)').matches;

    // Listen for screen size changes
    const mediaQuery = window.matchMedia('(max-width: 768px)');
    const handleMediaChange = (e: MediaQueryListEvent) => {
        isMobile.value = e.matches;
    };
    mediaQuery.addEventListener('change', handleMediaChange);

    onUnmounted(() => {
        mediaQuery.removeEventListener('change', handleMediaChange);
    });

    // Calculate minimum height based on viewport
    MIN_HEIGHT.value = getMinHeightPercent();

    // Set hydrated and show loading state
    isHydrated.value = true;
    isLoadingPersistence.value = true;

    // Load creation data first
    await loadCreationData();

    if (!creation.value) {
        isLoadingPersistence.value = false;
        return;
    }

    // Initialize creation in shared storage
    const initKey = storageManager.initializeCreation(finalDomain.value, finalCreationId.value);

    // Update reactive creation state
    refreshCreationState();
    const creationState = currentCreationState.value;

    // Request servings multiplier from parent window if we're in an iframe
    try {
      const parentMultiplier = await storageManager.requestServingsMultiplierFromParent(initKey);

      if (parentMultiplier !== 1 && creationState?.servingsMultiplier !== parentMultiplier) {
        // Update local storage with parent's multiplier
        storageManager.setServingsMultiplier(initKey, parentMultiplier);
        refreshCreationState();
      }
    } catch (error) {
      // Silent fail for parent communication
    }


    if (creationState) {
        // Restore persisted state
        currentSlide.value = creationState.currentStep;
        imageHeight.value = creationState.imageHeight;
        isImageCollapsed.value = creationState.isImageCollapsed;
    }

    // Restore timers from storage
    timerManager.restoreTimersFromStore();

    // Set up watchers after initial load
    watch(currentSlide, (newSlide) => {
        storageManager.setCurrentStep(newSlide);
    });

    watch([imageHeight, isImageCollapsed], ([height, collapsed]) => {
        storageManager.setImageState(height, collapsed);
    });

    // Wait for DOM to be fully ready, then navigate to persisted slide if not on intro
    await nextTick();

    if (currentSlide.value > 0) {
        // Ensure cs:carousel ref is available before navigation
        if (carouselRef.value) {
            goToSlide(currentSlide.value, true); // Use immediate navigation to avoid scrolling through slides
        } else {
            // Retry after another tick if cs:carousel ref not ready
            await nextTick();
            if (carouselRef.value) {
                goToSlide(currentSlide.value, true);
            }
        }
    }

    // Hide skeleton overlay after scrolling is complete
    isLoadingPersistence.value = false;

    // Set up periodic refresh of creation state to detect external changes
    stateRefreshInterval = setInterval(async () => {
        const currentState = currentCreationState.value;

        // Check parent window for updated servings multiplier
        try {
            const parentMultiplier = await storageManager.requestServingsMultiplierFromParent(initKey);
            if (currentState?.servingsMultiplier !== parentMultiplier) {
                storageManager.setServingsMultiplier(initKey, parentMultiplier);
                refreshCreationState();
            }
        } catch (error) {
            // Fallback to local storage check
            const latestState = storageManager.getCurrentCreationState();
            if (currentState?.servingsMultiplier !== latestState?.servingsMultiplier) {
                refreshCreationState();
            }
        }
    }, 1000); // Check every second
});

// Navigation functions
const goToSlide = (index: number, immediate = false) => {
    if (index >= 0 && index < totalSlides.value) {
        isScrolling = true;
        currentSlide.value = index;
        if (carouselRef.value) {
            const targetSlide = carouselRef.value.querySelector(`#slide${index}`) as HTMLElement;
            if (targetSlide) {
                targetSlide.scrollIntoView({
                    behavior: immediate ? 'instant' : 'smooth',
                    block: 'nearest',
                    inline: 'start'
                });
                // Reset scrolling flag after animation completes
                setTimeout(() => {
                    isScrolling = false;
                }, immediate ? 50 : 500);
            } else {
                isScrolling = false;
            }
        } else {
            isScrolling = false;
        }
    }
};

const nextSlide = () => {
    if (currentSlide.value < totalSlides.value - 1) {
        goToSlide(currentSlide.value + 1);
    }
};

const previousSlide = () => {
    if (currentSlide.value > 0) {
        goToSlide(currentSlide.value - 1);
    }
};

// Detect scroll position to update current slide for touch navigation
let scrollTimeout: NodeJS.Timeout | null = null;
let isScrolling = false;
const updateCurrentSlideFromScroll = () => {
    if (!carouselRef.value || isScrolling) return;

    const carousel = carouselRef.value;
    const scrollLeft = carousel.scrollLeft;
    const slideWidth = carousel.clientWidth;

    // Calculate which slide we're on based on scroll position
    const newIndex = Math.round(scrollLeft / slideWidth);

    if (newIndex !== currentSlide.value && newIndex >= 0 && newIndex < totalSlides.value) {
        currentSlide.value = newIndex;
    }
};

// Scroll detection for touch navigation
const handleScroll = () => {
    // Debounce scroll updates to avoid too many updates
    if (scrollTimeout) clearTimeout(scrollTimeout);
    scrollTimeout = setTimeout(() => {
        updateCurrentSlideFromScroll();
    }, 100);
};

// Handle scrollend event for more accurate detection with snap scrolling
const handleScrollEnd = () => {
    updateCurrentSlideFromScroll();
};

// Setup event listeners
onMounted(() => {
    // Keyboard navigation
    const handleKeydown = (event: KeyboardEvent) => {
        if (event.key === 'ArrowRight') {
            event.preventDefault();
            nextSlide();
        } else if (event.key === 'ArrowLeft') {
            event.preventDefault();
            previousSlide();
        }
    };

    // Viewport resize detection
    const handleResize = () => {
        MIN_HEIGHT.value = getMinHeightPercent();
    };

    document.addEventListener('keydown', handleKeydown);
    window.addEventListener('resize', handleResize);

    onUnmounted(() => {
        document.removeEventListener('keydown', handleKeydown);
        window.removeEventListener('resize', handleResize);

        if (carouselRef.value) {
            carouselRef.value.removeEventListener('scroll', handleScroll);
            if ('onscrollend' in carouselRef.value) {
                carouselRef.value.removeEventListener('scrollend', handleScrollEnd);
            }
        }
        if (scrollTimeout) {
            clearTimeout(scrollTimeout);
        }
    });
});

// Watch for cs:carousel ref to become available and add scroll listeners
watch(carouselRef, (newRef, oldRef) => {
    // Remove old listeners if they exist
    if (oldRef) {
        oldRef.removeEventListener('scroll', handleScroll);
        if ('onscrollend' in oldRef) {
            oldRef.removeEventListener('scrollend', handleScrollEnd);
        }
    }

    // Add new listeners
    if (newRef) {
        // Use setTimeout to ensure DOM is fully rendered
        setTimeout(() => {
            if (carouselRef.value) {
                carouselRef.value.addEventListener('scroll', handleScroll, { passive: true });
                // scrollend is more reliable for snap scrolling
                if ('onscrollend' in carouselRef.value) {
                    carouselRef.value.addEventListener('scrollend', handleScrollEnd, { passive: true });
                }
            }
        }, 100);
    }
}, { immediate: true });

// Drag handlers for collapsible image
const startDrag = (event: MouseEvent | TouchEvent) => {
    // Only allow drag on mobile
    if (!isMobile.value) {
        return;
    }

    const target = event.target as HTMLElement;
    const isFromHandle = target.closest('[data-draggable-handle="true"]');

    // Only allow drag from handle
    if (!isFromHandle) {
        return;
    }

    // Store initial position and detect vertical drag intent
    const startY = event.type.includes('touch')
        ? (event as TouchEvent).touches[0].clientY
        : (event as MouseEvent).clientY;
    const startX = event.type.includes('touch')
        ? (event as TouchEvent).touches[0].clientX
        : (event as MouseEvent).clientX;

    let hasMoved = false;
    let isVerticalDrag = false;

    const checkDragDirection = (e: MouseEvent | TouchEvent) => {
        if (hasMoved) return;

        const currentY = e.type.includes('touch')
            ? (e as TouchEvent).touches[0].clientY
            : (e as MouseEvent).clientY;
        const currentX = e.type.includes('touch')
            ? (e as TouchEvent).touches[0].clientX
            : (e as MouseEvent).clientX;

        const deltaY = Math.abs(currentY - startY);
        const deltaX = Math.abs(currentX - startX);

        // Only start drag if vertical movement is dominant
        if (deltaY > 10 || deltaX > 10) {
            hasMoved = true;
            if (deltaY > deltaX * 1.5) {
                // Vertical drag detected
                isVerticalDrag = true;
                isDragging.value = true;
                dragStartY.value = startY;
                dragStartHeight.value = imageHeight.value;
                // Prevent default only for vertical drags
                e.preventDefault();
            }
        }
    };

    // Add temporary move listener to detect drag direction
    const moveHandler = (e: MouseEvent | TouchEvent) => {
        if (!hasMoved) {
            checkDragDirection(e);
        }
        if (isVerticalDrag) {
            onDrag(e);
        }
    };

    const endHandler = () => {
        if (isVerticalDrag) {
            endDrag();
        }
        // Clean up listeners
        document.removeEventListener('mousemove', moveHandler);
        document.removeEventListener('touchmove', moveHandler);
        document.removeEventListener('mouseup', endHandler);
        document.removeEventListener('touchend', endHandler);
    };

    // Add temporary listeners
    document.addEventListener('mousemove', moveHandler);
    document.addEventListener('touchmove', moveHandler, { passive: false });
    document.addEventListener('mouseup', endHandler);
    document.addEventListener('touchend', endHandler);
};

const onDrag = (event: MouseEvent | TouchEvent) => {
    if (!isDragging.value) return;

    requestAnimationFrame(() => {
        const currentY = event.type.includes('touch')
            ? (event as TouchEvent).touches[0].clientY
            : (event as MouseEvent).clientY;

        const deltaY = currentY - dragStartY.value; // Positive deltaY = swipe down = expand
        const containerHeight = containerRef.value?.offsetHeight || window.innerHeight;
        const deltaPercent = (deltaY / containerHeight) * 100;

        let newHeight = dragStartHeight.value + deltaPercent;
        newHeight = Math.max(MIN_HEIGHT.value, Math.min(MAX_HEIGHT, newHeight));

        imageHeight.value = newHeight;
        // Update collapsed state based on current height (for dynamic margin adjustment)
        isImageCollapsed.value = newHeight <= COLLAPSED_THRESHOLD;
    });
};

const endDrag = () => {
    if (!isDragging.value) return;

    isDragging.value = false;

    // Update collapsed state based on current position without snapping
    isImageCollapsed.value = imageHeight.value <= COLLAPSED_THRESHOLD;
};

// Toggle image collapse state (for double-click/double-tap) - Mobile only
const toggleImageCollapse = () => {
    if (!isMobile.value) return;
    isDragging.value = false; // Prevent conflict with drag state
    if (isImageCollapsed.value) {
        // Expand to default height
        imageHeight.value = 25;
        isImageCollapsed.value = false;
    } else {
        // Collapse to minimum height (negative to push image up while keeping rounded corners)
        imageHeight.value = MIN_HEIGHT.value;
        isImageCollapsed.value = true;
    }
};

// === Review System ===
const ratingThreshold = 4 // Ratings >= 4 are considered positive
const currentRating = ref(0)
const hasSubmittedRating = ref(false)
const hasSubmittedReview = ref(false)
const existingReview = ref<any>(null)

// Form data
const form = reactive({
    title: '',
    review: '',
    name: '',
    email: ''
})

// Initialize review system
const { getInitialState } = useReviewStorage()
const reviewSubmission = useReviewSubmission()

// Check for existing review on mount and when form appears
const loadExistingReview = () => {
    if (finalCreationId.value) {
        const existing = getInitialState(finalCreationId.value)
        if (existing) {
            existingReview.value = existing
            currentRating.value = parseInt(existing.rating.toString())
            hasSubmittedRating.value = true
            hasSubmittedReview.value = !!(existing.review_content || existing.author_name)

            // Pre-fill form with existing data
            form.title = existing.review_title || ''
            form.review = existing.review_content || ''
            form.name = existing.author_name || ''
            form.email = existing.author_email || ''

            // If showing review form, shrink
            imageHeight.value = 10
        }
    }
}

// Watch for currentSlide changes to shrink image when on completion slide
watch(currentSlide, (newSlide, oldSlide) => {
    if (newSlide === totalSlides.value - 1) {
        // On completion/review slide - shrink image for review form visibility
        if (showReviewForm) {
            // If showing review form, shrink
            imageHeight.value = 10
        }
        loadExistingReview()
    } else if (oldSlide === totalSlides.value - 1) {
        // Coming back from review slide - restore to user's adjusted height
        const savedHeight = currentCreationState.value?.imageHeight
        if (savedHeight && savedHeight !== 10) {
            imageHeight.value = savedHeight
        }
        // If no saved height or it was the review height, keep current height (don't reset)
    }
    // For all other slide transitions, maintain the current imageHeight
})

onMounted(() => {
    loadExistingReview()
})

// Computed properties for review UI
const reviewQuestionText = computed(() => {
    if (currentRating.value === 0) {
        return 'How was it?'
    }
    return currentRating.value >= ratingThreshold ? 'How was it?' : 'What went wrong?'
})

const showRatingSubmittedMessage = computed(() => {
    return currentRating.value >= ratingThreshold && hasSubmittedRating.value && !hasSubmittedReview.value
})

const showLowRatingPrompt = computed(() => {
    return currentRating.value > 0 && currentRating.value < ratingThreshold && !hasSubmittedReview.value
})

const showReviewForm = computed(() => {
    return currentRating.value > 0 && (
        (currentRating.value >= ratingThreshold && hasSubmittedRating.value) ||
        (currentRating.value < ratingThreshold)
    )
})

const isFormRequired = computed(() => {
    return currentRating.value > 0 && currentRating.value < ratingThreshold
})

const isFormValid = computed(() => {
    if (!isFormRequired.value) return true
    // Use regex to check for non-whitespace characters without modifying the values
    const hasReview = /\S/.test(form.review)
    const hasName = /\S/.test(form.name)
    const hasEmail = /\S/.test(form.email)
    return hasReview && hasName && hasEmail
})

const titlePlaceholder = computed(() =>
    currentRating.value >= ratingThreshold ? 'Amazing recipe!' : 'Could be better...'
)

const reviewPlaceholder = computed(() =>
    currentRating.value >= ratingThreshold
        ? 'Tell others what you loved about this recipe...'
        : 'Help us understand what didn\'t work...'
)

// Review handling methods
const handleRatingSelect = async (rating: number) => {
    currentRating.value = rating

    // For high ratings, auto-submit rating
    if (rating >= ratingThreshold && finalCreationId.value && !hasSubmittedRating.value) {
        const result = await reviewSubmission.submit({
            creation: finalCreationId.value,
            rating,
            type: 'review'
        }, `https://${finalDomain.value}`)

        if (result.ok) {
            hasSubmittedRating.value = true
        }
    }

    // For low ratings, don't auto-submit - wait for form
}

const handleFormSubmit = async () => {
    if (!finalCreationId.value) {
        console.warn('Cannot submit review: missing creation ID')
        return
    }

    // Build review data using MV state structure
    const reviewData = {
        creation: finalCreationId.value,
        rating: currentRating.value,
        type: 'review',
        review_title: form.title.trim(),
        review_content: form.review.trim(),
        author_name: form.name.trim(),
        author_email: form.email.trim()
    }

    const result = await reviewSubmission.submit(reviewData, `https://${finalDomain.value}`)

    if (result.ok) {
        hasSubmittedReview.value = true
        hasSubmittedRating.value = true

        // Update existing review reference
        loadExistingReview()
    } else {
        // Handle error - could show toast notification
        console.error('Review submission failed:', reviewSubmission.submissionError.value)
    }
}
</script>
