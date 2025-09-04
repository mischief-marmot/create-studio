<template>
    <div class="h-dvh w-full flex items-center justify-center bg-base-100 text-base-content">
        <!-- Show error message if loading failed -->
        <div v-if="creationError && !creation" class="text-center p-8">
            <h2 class="text-2xl font-bold text-error mb-4">Error Loading Recipe</h2>
            <p class="text-base-content mb-4">{{ creationError }}</p>
            <a href="/" class="btn btn-primary">Back to Home</a>
        </div>
        <!-- Show skeleton loader during SSR or while persistence is loading -->
        <RecipeSkeletonLoader v-else-if="!isHydrated || isLoadingPersistence || isLoadingCreation || !dataReady" />
        <!-- <RecipeSkeletonLoader v-if="false" /> -->

        <!-- Mobile-optimized Card Container -->
        <div v-else class="w-full max-w-md h-full bg-base-100 flex flex-col"
            @mousedown="startDrag"
            @touchstart="startDrag">
            <!-- Fullscreen toggle button -->
            <!-- <button @click="toggleFullscreen"
                class="absolute top-4 right-4 z-20 w-10 h-10 bg-base-200/80 text-base-content backdrop-blur-sm rounded-full flex items-center justify-center shadow-lg hover:bg-base-100/80 transition-colors">
                <ArrowsPointingOutIcon v-if="!isFullscreen" class="w-5 h-5" />
                <ArrowsPointingInIcon v-else class="w-5 h-5" />
            </button> -->
            <!-- Top Figure Section - Collapsible Height -->
            <figure :class="[
                    'relative overflow-hidden flex-shrink-0 -mb-6',
                    isDragging ? '' : 'transition-all duration-300',
                ]" :style="{ height: `${imageHeight}%` }" @dblclick="toggleImageCollapse">
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
                <div class="carousel carousel-center w-full flex-1 overflow-x-auto snap-x snap-mandatory flex flex-row" ref="carouselRef">
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
                                <div class="flex justify-between cursor-pointer" @click="recipeStore.toggleStepIngredientsVisibility()">
                                    <span class="font-medium text-base-content">Step Ingredients</span>
                                    <PlusIcon v-if="!recipeStore.currentProgress?.showStepIngredients" class="w-5 h-5" />
                                    <MinusIcon v-if="recipeStore.currentProgress?.showStepIngredients" class="w-5 h-5" />
                                </div>
                                <ul v-show="recipeStore.currentProgress?.showStepIngredients" class="space-y-1 mt-2">
                                    <li v-for="(supply, supplyIdx) in step.supply"
                                        :key="`step-${index}-supply-${supplyIdx}`">
                                        <label class="flex items-start space-x-3 text-base-content">
                                            <input type="checkbox" class="checkbox checkbox-lg"
                                                :checked="recipeStore.currentProgress?.checkedStepIngredients?.get(index)?.has(`${supply.name}`) || false"
                                                @change="recipeStore.toggleStepIngredient(index, `${supply.name}`)" />
                                            <span>{{ supply.name }}</span>
                                        </label>
                                    </li>
                                </ul>
                            </div>

                            <!-- Timer -->
                            <RecipeTimer v-if="step.timer" :timer="step.timer" :timer-id="`step-${index}-timer`"
                                :step-index="index" />

                            <!-- Notes -->
                            <div v-if="step.notes && step.notes.length > 0" class="mt-3 space-y-2">
                                <div v-for="note in step.notes" :key="note.text"
                                    class="bg-blue-50 border border-blue-200 rounded-lg p-3 flex items-start space-x-2">
                                    <svg class="w-5 h-5 flex-shrink-0 text-blue-600 mt-0.5" fill="none"
                                        stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                            d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                                    </svg>
                                    <span class="text-sm text-blue-700">{{ note.text }}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Completion Slide -->
                    <div :id="`slide${totalSlides - 1}`" class="carousel-item w-full snap-center flex-shrink-0">
                        <div class="p-6 flex flex-col justify-center items-center text-center h-full">
                            <!-- Success Icon -->
                            <div class="w-20 h-20 mb-4 bg-green-100 rounded-full flex items-center justify-center">
                                <svg class="w-10 h-10 text-green-600" fill="none" stroke="currentColor"
                                    viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                        d="M5 13l4 4L19 7"></path>
                                </svg>
                            </div>

                            <h2 class="text-2xl font-bold text-green-600 mb-2">Congratulations!</h2>
                            <p class="text-base mb-2">You've completed making</p>
                            <p class="text-lg font-semibold mb-6">{{ creation?.name || 'Recipe' }}</p>

                            <div class="space-y-2 mb-6">
                                <p class="text-sm">Time to enjoy your delicious creation! 🎉</p>
                                <p class="text-xs text-gray-500">Don't forget to share a photo of your finished dish!
                                </p>
                            </div>

                            <div class="flex flex-col sm:flex-row gap-2">
                                <button @click="goToSlide(0)"
                                    class="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">Start
                                    Over</button>
                                <a href="/" class="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">Browse
                                    More Recipes</a>
                            </div>
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
            <div class="flex-shrink-0 bg-gray-300 h-20 2-full p-2">
                <div class="border-dashed border-2 border-gray-400 rounded-md h-full flex items-center justify-center">
                    <span>Advertisement</span>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import type { HowTo, HowToStep } from '~/types/schema-org';
import { recipesById } from '~/fixtures/recipes/clean';
import { QueueListIcon } from '@heroicons/vue/24/outline';
import { ArrowsPointingInIcon, ArrowsPointingOutIcon, ChevronDoubleLeftIcon, ChevronDoubleRightIcon, MinusIcon, PlusIcon, XMarkIcon } from '@heroicons/vue/20/solid';
import { useRecipeInteractionStore } from '~/stores/recipeInteraction';

const route = useRoute();
const id = route.params.id as string;
const { formatDuration } = useRecipeUtils();

// Initialize recipe interaction store
const recipeStore = useRecipeInteractionStore();

// Provide timer manager at the page level so it persists across slides
const timerManager = useTimerManager();
provide('timerManager', timerManager);

// Check for external site_url parameter
const siteUrl = route.query.site_url as string | undefined;
const cacheBust = route.query.cache_bust === 'true';

// Recipe data - will be populated from API or fixtures
const creation = ref<HowTo | null>(null);
const isLoadingCreation = ref(false);
const creationError = ref<string | null>(null);

// Get steps as HowToStep array for template usage
const steps = computed(() => {
  if (!creation.value) return [];
  return creation.value.step as HowToStep[];
});
const totalSlides = computed(() => steps.value.length + 2); // intro + steps + completion

// Reactive state with defaults - will be updated client-side
const currentSlide = ref(0);
const carouselRef = ref<HTMLElement>();
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
  if (siteUrl) {
    // Fetch from external API
    isLoadingCreation.value = true;
    try {
      const data = await $fetch<HowTo>('/api/fetch-creation', {
        method: 'POST',
        body: {
          site_url: siteUrl,
          creation_id: parseInt(id),
          cache_bust: cacheBust
        }
      });
      creation.value = data;
    } catch (error: any) {
      console.error('Failed to fetch creation:', error);
      creationError.value = error?.statusMessage || 'Failed to load creation data';
      // Fallback to fixtures if available
      const recipeData = recipesById[parseInt(id) as keyof typeof recipesById];
      if (recipeData) {
        creation.value = transformJsonLdToHowTo(recipeData);
      }
    } finally {
      isLoadingCreation.value = false;
    }
  } else {
    // Use local fixtures
    const recipeData = recipesById[parseInt(id) as keyof typeof recipesById];
    if (recipeData) {
      creation.value = transformJsonLdToHowTo(recipeData);
    } else {
      creationError.value = 'Recipe not found';
    }
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
  
  // Delay to ensure skeleton is visible before loading
  await new Promise(resolve => setTimeout(resolve, 100));
  
  const recipeProgress = recipeStore.initializeRecipe(id);
  
  // Restore persisted state
  currentSlide.value = recipeProgress.currentStep;
  imageHeight.value = recipeProgress.imageHeight;
  isImageCollapsed.value = recipeProgress.isImageCollapsed;
  
  // Clear any duplicate timers first
  recipeStore.clearDuplicateTimers();
  
  // Restore timers from store
  timerManager.restoreTimersFromStore();
  
  // Set up watchers after initial load
  watch(currentSlide, (newSlide) => {
    recipeStore.setCurrentStep(newSlide);
  });
  
  watch([imageHeight, isImageCollapsed], ([height, collapsed]) => {
    recipeStore.setImageState(height, collapsed);
  });
  
  // Add minimum loading time to ensure skeleton is visible
  await new Promise(resolve => setTimeout(resolve, 800));
  
  // Hide loading state after everything is set up
  await nextTick();
  isLoadingPersistence.value = false;
  
  // Wait for DOM to be ready, then navigate to persisted slide if not on intro
  await nextTick();
  if (currentSlide.value > 0) {
    goToSlide(currentSlide.value, true); // Use immediate navigation to avoid scrolling through slides
  }
});

// Auto-show active timers panel when timers become active
watchEffect(() => {
    const hasActive = timerManager.hasActiveTimers.value;
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
        if (event.key === 'ArrowRight' || event.key === ' ') {
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
    
    // We'll set up carousel listeners in a separate watcher
    
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
        const viewportHeight = window.innerHeight;
        const deltaPercent = (deltaY / viewportHeight) * 100;
        
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

</script>