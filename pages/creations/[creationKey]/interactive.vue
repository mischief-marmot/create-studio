<template>
    <div class="max-h-dvh h-full w-full flex items-center justify-center bg-base-300 text-base-content z-[1111]">
        <!-- Show error message if loading failed -->
        <div v-if="creationError && !creation" class="text-center p-8">
            <h2 class="text-2xl font-bold text-error mb-4">Error Loading Recipe</h2>
            <p class="text-base-content mb-4">{{ creationError }}</p>
            <a href="/" class="btn btn-primary">Back to Home</a>
        </div>
        <!-- Show skeleton loader during SSR or while persistence is loading -->
        <RecipeSkeletonLoader v-else-if="!isHydrated || isLoadingPersistence || isLoadingCreation || !dataReady" />

        <!-- Responsive Card Container -->
        <div v-else ref="containerRef" class="md:w-full w-dvw md:max-w-lg md:max-h-256 h-dvh bg-base-100 flex flex-col md:mx-auto md:my-auto md:rounded-xl md:shadow-xl overflow-hidden" @mousedown="startDrag"
            @touchstart="startDrag">
            <!-- Top Figure Section - Collapsible Height -->
            <figure :class="[
                'relative overflow-hidden flex-shrink-0 -mb-6',
                isDragging ? '' : 'transition-all duration-300',
            ]" :style="{ height: `${imageHeightPx}px` }" @dblclick="toggleImageCollapse">
                <!-- Current Step Media or Default Image -->
                <template v-if="currentSlide === 0">
                    <!-- Intro Image -->
                    <RecipeMedia :image="creation?.image" :alt="creation?.name || 'Recipe'"
                        placeholder-class="from-primary/20 to-secondary/20 flex items-center justify-center"
                        placeholder-emoji="🍽️" />
                </template>
                <template v-else-if="currentSlide <= steps.length">
                    <!-- Step Media -->
                    <RecipeMedia :video="steps[currentSlide - 1]?.video"
                        :image="steps[currentSlide - 1]?.image || creation?.image"
                        :alt="steps[currentSlide - 1]?.name || `Step ${currentSlide - 1}`" :video-key="currentSlide"
                        placeholder-class="from-base-200 to-base-300 flex items-center justify-center"
                        placeholder-emoji="👩‍🍳" />
                </template>
                <template v-else>
                    <!-- Completion Image -->
                    <RecipeMedia :image="creation?.image" :alt="creation?.name || 'Recipe'"
                        placeholder-class="from-success/20 to-success/30 flex items-center justify-center"
                        placeholder-emoji="🎉" />
                </template>
            </figure>

            <!-- Middle Content Section - Scrollable with rounded top corners overlapping image -->
            <div class="flex-1 overflow-hidden flex flex-col relative z-10 bg-base-100 rounded-t-3xl">
                <!-- Draggable Handle -->
                <DraggableHandle @start-drag="startDrag" />
                <div class="carousel carousel-center w-full flex-1 overflow-x-auto snap-x snap-mandatory flex flex-row"
                    ref="carouselRef">
                    <!-- Intro Slide - Title, Description, Stats -->
                    <div id="slide0" class="carousel-item w-full snap-center flex-shrink-0">
                        <div class="p-6 space-y-4">
                            <div>
                                <h1 class="text-2xl font-bold mb-3">{{ creation?.name || 'Recipe' }}</h1>
                                <p v-if="creation?.description" v-html="creation?.description"
                                    class="text-base-content text-sm leading-relaxed"></p>
                            </div>
                            <div>
                                <h2 class="text-xl font-bold mb-4">Ingredients</h2>

                                <ul class="space-y-1">
                                    <li v-for="ingredient in (creation?.recipeIngredient || [])" :key="ingredient"
                                        class="flex items-start space-x-2">
                                        <span class="w-1.5 h-1.5 bg-gray-400 rounded-full mt-1.5 flex-shrink-0"></span>
                                        <span class="text-sm text-base-content">{{ ingredient }}</span>
                                    </li>
                                </ul>
                            </div>
                        </div>
                    </div>

                    <!-- Recipe Steps -->
                    <div v-for="(step, index) in steps" :key="`step-${index}`" :id="`slide${index + 1}`"
                        class="carousel-item w-full snap-center flex-shrink-0">
                        <div class="px-4 py-8 flex flex-col space-y-8 overflow-y-auto">
                            <div class="flex space-x-3 justify-start w-full items-center">
                                <div
                                    class="flex justify-center items-center grow-0 shrink-0 h-12 w-12 bg-primary text-primary-content rounded-md">
                                    <span class="text-3xl font-mono">{{ index + 1 }}</span>
                                </div>

                                <div class="text-lg text-base-content leading-tight" v-html="step.text"></div>
                            </div>

                            <!-- Step-specific supplies/ingredients -->
                            <div v-if="step.supply && step.supply.length > 0" class="box-gray">
                                <div class="flex justify-between cursor-pointer"
                                    @click="storageManager.toggleStepIngredientsVisibility()">
                                    <span class="font-medium text-base-content">Step Ingredients</span>
                                    <PlusIcon v-if="!currentRecipeState?.showStepIngredients"
                                        class="w-5 h-5" />
                                    <MinusIcon v-if="currentRecipeState?.showStepIngredients"
                                        class="w-5 h-5" />
                                </div>
                                <ul v-show="currentRecipeState?.showStepIngredients" class="space-y-1 mt-2">
                                    <li v-for="(supply, supplyIdx) in step.supply"
                                        :key="`step-${index}-supply-${supplyIdx}`">
                                        <label class="flex items-start space-x-3 text-base-content">
                                            <input type="checkbox" class="checkbox checkbox-lg"
                                                :checked="storageManager.isStepIngredientChecked(index, `${supply.name}`)"
                                                @change="storageManager.toggleStepIngredient(index, `${supply.name}`)" />
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
                    <div :id="`slide${totalSlides - 1}`" class="carousel-item w-full snap-center flex-shrink-0">
                        <div class="w-full px-4 py-6 flex flex-col h-full overflow-y-auto space-y-2">

                            <!-- Title and question -->
                            <div class="text-center">
                                <h2 class="text-2xl font-bold text-base-content">All done!</h2>
                                <p class="text-lg text-base-content/80">{{ reviewQuestionText }}</p>
                            </div>

                            <!-- Star rating -->
                            <div class="text-center pb-2">
                                <StarRating v-model="currentRating" @select="handleRatingSelect" />
                            </div>

                            <!-- Rating submitted message for high ratings -->
                            <div v-if="showRatingSubmittedMessage" role="alert" class="alert alert-success">
                                <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 shrink-0 stroke-current"
                                    fill="none" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <span>Rating submitted! You're a star! 😉<br /> Care to share more?
                                    (Optional)</span>
                            </div>

                            <!-- Rating not submitted message for low ratings -->
                            <div v-if="showLowRatingPrompt" role="alert" class="alert alert-error">
                                <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 shrink-0 stroke-current"
                                    fill="none" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                        d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <span>Before submitting your rating, would you please let us know what could have been
                                    better?</span>
                            </div>

                            <!-- Review Form -->
                            <form v-if="showReviewForm" @submit.prevent="handleFormSubmit"
                                class="flex-1 space-y-4 max-w-md mx-auto w-full">
                                <!-- Review Title -->
                                <div>
                                    <label for="reviewTitle"
                                        class="block text-sm font-medium text-base-content/90 mb-1">
                                        Review Title
                                    </label>
                                    <input id="reviewTitle" v-model="form.title" type="text" class="w-full input"
                                        :placeholder="titlePlaceholder" />
                                </div>

                                <!-- Review -->
                                <div>
                                    <label for="review" class="block text-sm font-medium text-base-content/90 mb-1">
                                        Review<span v-if="isFormRequired" class="text-red-600">*</span>
                                    </label>
                                    <textarea id="review" v-model="form.review" rows="3"
                                        class="w-full textarea resize-none" :placeholder="reviewPlaceholder"
                                        :required="isFormRequired" />
                                </div>

                                <!-- Name -->
                                <div>
                                    <label for="name" class="block text-sm font-medium text-base-content/90 mb-1">
                                        Name<span v-if="isFormRequired" class="text-red-600">*</span>
                                    </label>
                                    <input id="name" v-model="form.name" type="text" class="w-full input"
                                        placeholder="Your name" :required="isFormRequired" />
                                </div>

                                <!-- Email -->
                                <div>
                                    <label for="email" class="block text-sm font-medium text-base-content/90 mb-1">
                                        Email<span v-if="isFormRequired" class="text-red-600">*</span>
                                    </label>
                                    <input id="email" v-model="form.email" type="email" class="w-full input"
                                        placeholder="your@email.com" :required="isFormRequired" />
                                </div>

                                <!-- Submit button -->
                                <div class="justify-self-end">
                                    <button type="submit"
                                        :disabled="reviewSubmission.isSubmitting.value || (!isFormValid && isFormRequired)"
                                        class="btn btn-primary btn-lg">
                                        <span v-if="reviewSubmission.isSubmitting.value">Submitting...</span>
                                        <span v-else-if="existingReview">Update Review</span>
                                        <span v-else>Submit Review</span>
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Bottom Navigation Controls - Fixed -->
            <div class="flex-shrink-0 bg-base-200 border-t border-base-300 relative">
                <!-- Active Timers Panel -->
                <ActiveTimers v-if="showActiveTimers" @close="showActiveTimers = false" />

                <!-- Ingredients Dropdown Panel (only shows after slide 0) -->
                <div v-if="showIngredients && currentSlide > 0"
                    class="absolute bottom-[120%] left-0 right-0 mx-auto bg-base-300 border-[0.25px] border-base-100/60 shadow-xl overflow-y-auto max-w-[90%] rounded-2xl z-50">
                    <div class="p-4">
                        <div class="flex items-center justify-between mb-3">
                            <h3 class="font-semibold text-base">Ingredients</h3>
                            <button @click="showIngredients = false" class="p-1 cursor-pointer">
                                <XMarkIcon class="w-5 h-5" />
                            </button>
                        </div>
                        <ul class="space-y-1">
                            <li v-for="(ingredient, idx) in (creation?.recipeIngredient || [])" :key="`ing-${idx}`">
                                {{ ingredient }}
                            </li>
                        </ul>
                    </div>
                </div>

                <!-- Navigation Controls -->
                <div class="p-4">
                    <div v-if="currentSlide === 0" class="flex items-center justify-between">
                        <!-- First slide - original layout -->
                        <div class="w-16"></div>

                        <!-- Progress Indicator -->
                        <div class="flex-1 flex justify-center items-center">
                            <div class="text-xs text-base-content">Or swipe to start cooking! →</div>
                        </div>

                        <!-- Begin Button -->
                        <button @click="nextSlide"
                            class="px-6 py-2 bg-primary text-primary-content rounded-full text-sm font-medium hover:bg-gray-800 flex items-center space-x-2 cursor-pointer">
                            <span>Begin</span>
                            <ChevronDoubleRightIcon class="w-5 h-5" />
                        </button>
                    </div>
                    <div v-else class="flex items-center justify-between">
                        <!-- After slide 0 - with ingredients button -->
                        <!-- Previous Button -->
                        <button @click="previousSlide"
                            class="flex items-center space-x-2 text-base-content cursor-pointer">
                            <ChevronDoubleLeftIcon class="w-5 h-5" />
                            <span class="text-sm">Back</span>
                        </button>

                        <!-- Ingredients Button -->
                        <button @click="showIngredients = !showIngredients"
                            class="flex items-center space-x-2 px-4 py-2 text-base-content hover:bg-gray-100 rounded-lg transition-colors cursor-pointer">
                            <!-- Ingredients Icon SVG -->
                            <QueueListIcon class="w-5 h-5" />
                            <span class="text-sm font-medium">Ingredients</span>
                        </button>

                        <!-- Next Button -->
                        <button v-if="currentSlide < totalSlides - 1" @click="nextSlide"
                            class="flex items-center space-x-2 text-base-content cursor-pointer">
                            <span class="text-sm">Next</span>
                            <ChevronDoubleRightIcon class="w-5 h-5" />
                        </button>
                        <div v-else class="w-16"></div>
                    </div>
                </div>
            </div>
            <div class="flex-shrink-0 bg-base-300 text-base-content h-20 2-full p-2">
                <div class="border-dashed border-2 border-gray-400 rounded-md h-full flex items-center justify-center">
                    <span>Advertisement</span>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import type { HowTo, HowToStep } from '~/types/schema-org';
import { QueueListIcon } from '@heroicons/vue/24/outline';
import { ChevronDoubleLeftIcon, ChevronDoubleRightIcon, MinusIcon, PlusIcon, XMarkIcon } from '@heroicons/vue/20/solid';
import { SharedStorageManager } from '~/lib/shared-storage/shared-storage-manager';
import { parseCreationKey } from '~/utils/domain';
import { useSharedTimerManager } from '~/composables/useSharedTimerManager';

const route = useRoute();

const creationKey = route.params.creationKey as string;
const { formatDuration } = useRecipeUtils();
// Parse creation key to get domain and creation ID
const creationInfo = parseCreationKey(creationKey);
if (!creationInfo) {
    throw createError({
        statusCode: 404,
        statusMessage: 'Invalid creation key'
    });
}

const { domain, creationId } = creationInfo;

// Initialize shared storage manager
const storageManager = new SharedStorageManager();

// Initialize timer manager with storage manager
const timerManager = useSharedTimerManager(storageManager);
provide('timerManager', timerManager);

const cacheBust = route.query.cache_bust === 'true';

// Recipe data - will be populated from API or fixtures
const creation = ref<HowTo | null>(null);
const isLoadingCreation = ref(false);
const creationError = ref<string | null>(null);

// Get current recipe state from shared storage
const currentRecipeState = computed(() => storageManager.getCurrentRecipeState());

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
const showIngredients = ref(false);
const showActiveTimers = ref(false);

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

// Calculate pixel height based on container height
const imageHeightPx = computed(() => {
    if (!containerRef.value) return 150; // Default fallback
    const containerHeight = containerRef.value.offsetHeight || 600;
    return Math.round((imageHeight.value / 100) * containerHeight);
});

// Calculate minimum height to offset the -mb-6 (-24px) margin
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
    const site_url = process.env.NODE_ENV === 'development' ? 'http://localhost:8074' : `https://${domain}`;
    try {
        // Always fetch from API
        const data = await $fetch<HowTo>('/api/fetch-creation', {
            method: 'POST',
            body: {
                site_url,
                creation_id: parseInt(creationId),
                cache_bust: cacheBust
            }
        });
        creation.value = data;
    } catch (error: any) {
        console.error('Failed to fetch creation:', error);
        creationError.value = error?.statusMessage || 'Failed to load creation data';
    } finally {
        isLoadingCreation.value = false;
    }
}

// Client-side only: Initialize loading and persistence
onMounted(async () => {
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

    // Initialize recipe in shared storage
    storageManager.initializeRecipe(domain, creationId);
    const recipeState = storageManager.getCurrentRecipeState();


    if (recipeState) {
        // Restore persisted state
        currentSlide.value = recipeState.currentStep;
        imageHeight.value = recipeState.imageHeight;
        isImageCollapsed.value = recipeState.isImageCollapsed;
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

    // Wait for DOM to be ready, then navigate to persisted slide if not on intro
    await nextTick();
    if (currentSlide.value > 0) {
        goToSlide(currentSlide.value, true); // Use immediate navigation to avoid scrolling through slides
    }

    // Hide loading state after everything is set up
    await nextTick();
    isLoadingPersistence.value = false; 
});

// Auto-show active timers panel when timers become active
watchEffect(() => {
    const hasActive = timerManager?.hasActiveTimers.value || false;
    if (hasActive) {
        showActiveTimers.value = true;
        showIngredients.value = false; // Close ingredients panel if open
    }
});

// Full-screen functionality
const isFullscreen = ref(false);

const enterFullscreen = async () => {
    try {
        if (document.documentElement.requestFullscreen) {
            await document.documentElement.requestFullscreen();
        } else if ((document.documentElement as any).webkitRequestFullscreen) {
            await (document.documentElement as any).webkitRequestFullscreen();
        }
        isFullscreen.value = true;
    } catch (error) {
        console.log('Fullscreen not supported or denied:', error);
    }
};

const exitFullscreen = async () => {
    try {
        if (document.exitFullscreen) {
            await document.exitFullscreen();
        } else if ((document as any).webkitExitFullscreen) {
            await (document as any).webkitExitFullscreen();
        }
        isFullscreen.value = false;
    } catch (error) {
        console.log('Error exiting fullscreen:', error);
    }
};

const toggleFullscreen = () => {
    if (isFullscreen.value) {
        exitFullscreen();
    } else {
        enterFullscreen();
    }
};

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
    // Fullscreen change detection
    const handleFullscreenChange = () => {
        isFullscreen.value = !!(document.fullscreenElement ||
            (document as any).webkitFullscreenElement);

        // Recalculate MIN_HEIGHT when viewport changes due to fullscreen toggle
        setTimeout(() => {
            MIN_HEIGHT.value = getMinHeightPercent();
        }, 100); // Small delay to ensure viewport has updated
    };

    // Viewport resize detection
    const handleResize = () => {
        MIN_HEIGHT.value = getMinHeightPercent();
    };

    document.addEventListener('keydown', handleKeydown);
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    window.addEventListener('resize', handleResize);

    onUnmounted(() => {
        document.removeEventListener('keydown', handleKeydown);
        document.removeEventListener('fullscreenchange', handleFullscreenChange);
        document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
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

// Watch for carousel ref to become available and add scroll listeners
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
    const target = event.target as HTMLElement;
    const isFromHandle = target.closest('[data-draggable-handle="true"]');

    // If not in fullscreen and not from handle, ignore (to prevent page refresh conflicts)
    if (!isFullscreen.value && !isFromHandle) {
        return;
    }

    // In fullscreen: ignore buttons/inputs. Not in fullscreen: only allow handle
    if (isFullscreen.value) {
        // In fullscreen: ignore interactive elements but allow drag from anywhere else
        if (target.closest('button') || target.closest('a') || target.closest('input') || target.closest('textarea')) {
            return;
        }
    } else {
        // Not in fullscreen: only allow handle (already checked above)
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

// Toggle image collapse state (for double-click/double-tap)
const toggleImageCollapse = () => {
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

// Transform JSON-LD Recipe data to our HowTo format
function transformJsonLdToHowTo(data: any): HowTo {
    const recipe: HowTo = {
        '@context': 'https://schema.org',
        '@type': 'Recipe',
        name: data?.name || 'Recipe',
        description: data?.description || '',
        datePublished: data?.datePublished,
        dateModified: data?.dateModified,
        keywords: data?.keywords,
        yield: data?.recipeYield,
        prepTime: data?.prepTime,
        cookTime: data?.cookTime,
        totalTime: data?.totalTime,
        recipeCategory: data?.recipeCategory,
        recipeCuisine: data?.recipeCuisine,
        difficulty: 'medium',
        interactiveMode: true,
        step: []
    };

    // Add author if available
    if (data?.author) {
        recipe.author = data.author;
    }

    // Add images - handle both single image and array
    if (data?.image) {
        if (Array.isArray(data.image)) {
            // Use the largest image (usually the last one)
            recipe.image = {
                '@type': 'ImageObject',
                url: data.image[data.image.length - 1]
            };
        } else if (typeof data.image === 'string') {
            recipe.image = {
                '@type': 'ImageObject',
                url: data.image
            };
        } else if (data.image.url) {
            recipe.image = data.image;
        }
    }

    // Add nutrition info if available
    if (data?.nutrition) {
        recipe.nutrition = data.nutrition;
    }

    // Use recipeIngredient directly from JSON-LD
    if (data?.recipeIngredient && Array.isArray(data.recipeIngredient)) {
        recipe.recipeIngredient = data.recipeIngredient;

        // Transform to supply format as well for compatibility
        recipe.supply = data.recipeIngredient.map((ingredient: string) => ({
            '@type': 'HowToSupply' as const,
            name: ingredient
        }));
    }

    // Transform recipeInstructions to steps (proper JSON-LD structure with itemListElement)
    if (data?.recipeInstructions && Array.isArray(data.recipeInstructions)) {
        recipe.step = data.recipeInstructions.map((instruction: any, index: number) => {
            // Extract the main HowToDirection from itemListElement
            const howToDirection = instruction.itemListElement?.find((item: any) => item['@type'] === 'HowToDirection');
            const stepText = howToDirection?.text || instruction.text || instruction;

            const step: HowToStep = {
                '@type': 'HowToStep',
                name: instruction.name, // Keep name if it exists, otherwise undefined
                text: stepText,
                position: instruction.position || index + 1,
                image: instruction?.image || howToDirection?.image
            };

            // If the HowToDirection has a supply list, add it to the step
            if (howToDirection?.supply && Array.isArray(howToDirection.supply)) {
                step.supply = howToDirection.supply;
            }

            // Add sample timer for baking steps
            const text = stepText.toLowerCase();
            // Updated regex to handle ranges (e.g., "30-45 minutes" or "2 to 3 minutes") - takes first number
            const minuteMatch = text.match(/(\d+)(?:(?:-|(?:\s+to\s+))\d+)?\s*minutes?/);
            const hourMatch = text.match(/(\d+)(?:(?:-|(?:\s+to\s+))\d+)?\s*hours?/);

            if (minuteMatch || hourMatch) {
                const minutes = parseInt(minuteMatch?.[1] || '0');
                const hours = parseInt(hourMatch?.[1] || '0');
                let totalMinutes = minutes + hours * 60;
                let totalSeconds = totalMinutes * 60;

                let label;
                switch (true) {
                    case text.includes('bake'):
                        label = 'Bake';
                        break;
                    case text.includes('cook'):
                        label = 'Cook';
                        break;
                    case text.includes('cool'):
                        label = 'Cool';
                        break;
                    case text.includes('cream'):
                        label = 'Cream';
                        break;
                    case text.includes('prepare'):
                        label = 'Prepare';
                        break;
                    case text.includes('chill'):
                        label = 'Chill';
                        break;
                    case text.includes('rest'):
                        label = 'Rest';
                        break;
                    case text.includes('marinate'):
                        label = 'Marinate';
                        break;
                    case text.includes('simmer'):
                        label = 'Simmer';
                        break;
                    case text.includes('blend'):
                        label = 'Blend';
                        break;
                    case text.includes('boil'):
                        label = 'Boil';
                        break;
                    case text.includes('set'):
                        label = 'Set';
                        break;
                    default:
                        label = 'Cook';
                }
                step.timer = {
                    duration: totalSeconds,
                    label: `${label} ${formatDuration(totalSeconds)}`,
                    autoStart: false
                };
            }

            return step;
        });
    }

    return recipe;
}

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
    if (creationId) {
        const existing = getInitialState(creationId)
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
        }
    }
}

// Watch for currentSlide changes to shrink image when on completion slide
watch(currentSlide, (newSlide, oldSlide) => {
    if (newSlide === totalSlides.value - 1) {
        // On completion/review slide - shrink image for review form visibility
        imageHeight.value = 10
        loadExistingReview()
    } else if (oldSlide === totalSlides.value - 1) {
        // Coming back from review slide - restore to user's adjusted height
        const savedHeight = currentRecipeState.value?.imageHeight
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
    if (rating >= ratingThreshold && creationId && !hasSubmittedRating.value) {
        const result = await reviewSubmission.submit({
            creation: creationId,
            rating,
            type: 'review'
        }, `https://${domain}`)

        if (result.ok) {
            hasSubmittedRating.value = true
        }
    }

    // For low ratings, don't auto-submit - wait for form
}

const handleFormSubmit = async () => {
    if (!creationId) {
        console.warn('Cannot submit review: missing creation ID')
        return
    }

    // Build review data using MV state structure
    const reviewData = {
        creation: creationId,
        rating: currentRating.value,
        type: 'review',
        review_title: form.title.trim(),
        review_content: form.review.trim(),
        author_name: form.name.trim(),
        author_email: form.email.trim()
    }

    const result = await reviewSubmission.submit(reviewData, `https://${domain}`)

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

<style setup>
:root, [data-theme] {
    background-color: transparent;
}
</style>