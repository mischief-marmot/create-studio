<template>
    <div class="h-dvh w-full flex items-center justify-center bg-base-100 text-base-content">
        <!-- Show skeleton loader during SSR or while persistence is loading -->
        <!-- <RecipeSkeletonLoader v-if="!isHydrated || isLoadingPersistence" /> -->
        <RecipeSkeletonLoader v-if="false" />

        <!-- Mobile-optimized Card Container -->
        <div v-else class="w-full max-w-md h-full bg-base-100 shadow-xl flex flex-col">
            <!-- Fullscreen toggle button -->
            <button @click="toggleFullscreen"
                class="absolute top-4 right-4 z-20 w-10 h-10 bg-base-200/80 text-base-content backdrop-blur-sm rounded-full flex items-center justify-center shadow-lg hover:bg-base-100/80 transition-colors">
                <ArrowsPointingOutIcon v-if="!isFullscreen" class="w-5 h-5" />
                <ArrowsPointingInIcon v-else class="w-5 h-5" />
            </button>
            <!-- Top Figure Section - Collapsible Height -->
            <figure :class="[
                    'relative rounded-b-3xl shadow-xl overflow-hidden flex-shrink-0',
                    isDragging ? '' : 'transition-all duration-300',
                    isImageCollapsed ? 'h-12' : ''
                ]" :style="{ height: `${imageHeight}%` }" @dblclick="toggleImageCollapse">
                <!-- Current Step Media or Default Image -->
                <template v-if="currentSlide === 0">
                    <!-- Intro Image -->
                    <RecipeMedia :image="creation.image" :alt="creation.name"
                        placeholder-class="from-primary/20 to-secondary/20 flex items-center justify-center"
                        placeholder-emoji="🍽️" />
                </template>
                <template v-else-if="currentSlide <= steps.length">
                    <!-- Step Media -->
                    <RecipeMedia :video="steps[currentSlide - 1]?.video"
                        :image="steps[currentSlide - 1]?.image || creation?.image"
                        :alt="steps[currentSlide - 1].name || `Step ${currentSlide - 1}`" :video-key="currentSlide"
                        placeholder-class="from-base-200 to-base-300 flex items-center justify-center"
                        placeholder-emoji="👩‍🍳" />
                </template>
                <template v-else>
                    <!-- Completion Image -->
                    <RecipeMedia :image="creation.image" :alt="creation.name"
                        placeholder-class="from-success/20 to-success/30 flex items-center justify-center"
                        placeholder-emoji="🎉" />
                </template>

                <!-- Draggable Handle -->
                <DraggableHandle @start-drag="startDrag" @drag="onDrag" @end-drag="endDrag" />
            </figure>

            <!-- Middle Content Section - Scrollable -->
            <div class="flex-1 overflow-hidden flex flex-col">
                <div class="carousel w-full flex-1" ref="carouselRef">
                    <!-- Intro Slide - Title, Description, Stats -->
                    <div id="slide0" class="carousel-item w-full">
                        <div class="p-6 space-y-4">
                            <div>
                                <h1 class="text-2xl font-bold mb-3">{{ creation.name }}</h1>
                                <p v-if="creation.description" v-html="creation.description"
                                    class="text-base-content text-sm leading-relaxed"></p>
                            </div>
                            <div>
                                <h2 class="text-xl font-bold mb-4">Ingredients</h2>

                                <ul class="space-y-1">
                                    <li v-for="ingredient in creation.recipeIngredient" :key="ingredient"
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
                        class="carousel-item w-full">
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
                                <div class="flex justify-between cursor-pointer" @click="toggleStepIngredients">
                                    <span class="font-medium text-neutral-content">Step Ingredients</span>
                                    <PlusIcon v-if="!showStepIngredients" class="w-5 h-5" />
                                    <MinusIcon v-if="showStepIngredients" class="w-5 h-5" />
                                </div>
                                <ul v-show="showStepIngredients" class="space-y-1 mt-2">
                                    <li v-for="(supply, supplyIdx) in step.supply"
                                        :key="`step-${index}-supply-${supplyIdx}`">
                                        <label class="flex items-start space-x-3 text-neutral-content">
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
                    <div :id="`slide${totalSlides - 1}`" class="carousel-item w-full">
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
                            <p class="text-lg font-semibold mb-6">{{ creation.name }}</p>

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
                    class="absolute bottom-[120%] left-0 right-0 mx-auto bg-base-300 border-[0.25px] border-base-100/60 shadow-xl overflow-y-auto max-w-[90%] rounded-2xl">
                    <div class="p-4">
                        <div class="flex items-center justify-between mb-3">
                            <h3 class="font-semibold text-base">Ingredients</h3>
                            <button @click="showIngredients = false" class="p-1 cursor-pointer">
                                <XMarkIcon class="w-5 h-5" />
                            </button>
                        </div>
                        <ul class="space-y-1">
                            <li v-for="(ingredient, idx) in creation.recipeIngredient" :key="`ing-${idx}`">
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
const { getImageUrl, getVideoUrl, formatDuration } = useRecipeUtils();

// Initialize recipe interaction store
const recipeStore = useRecipeInteractionStore();

// Provide timer manager at the page level so it persists across slides
const timerManager = useTimerManager();
provide('timerManager', timerManager);

// Get recipe from fixtures
const recipeData = recipesById[parseInt(id) as keyof typeof recipesById];
const creation: HowTo = transformJsonLdToHowTo(recipeData);

// Get steps as HowToStep array for template usage
const steps = creation.step as HowToStep[];
const totalSlides = steps.length + 2; // intro + steps + completion

// Reactive state with defaults - will be updated client-side
const currentSlide = ref(0);
const carouselRef = ref<HTMLElement>();
const showIngredients = ref(false);
const showActiveTimers = ref(false);
const showStepIngredients = ref(false);

// Loading and ready state - start loading only on client side
const isLoadingPersistence = ref(false);
const isHydrated = ref(false);

// Image collapse state with defaults
const imageHeight = ref(25);
const isImageCollapsed = ref(false);
const isDragging = ref(false);
const dragStartY = ref(0);
const dragStartHeight = ref(0);
const MIN_HEIGHT = 10; // Minimum 10% height when collapsed
const MAX_HEIGHT = 33; // Maximum 33% height when expanded
const COLLAPSED_THRESHOLD = 15; // Below 15% is considered collapsed

// Client-side only: Initialize loading and persistence
onMounted(async () => {
  console.log('Component mounted, starting loading state for recipe:', id); // Debug log
  
  // Set hydrated and show loading state
  isHydrated.value = true;
  isLoadingPersistence.value = true;
  
  // Delay to ensure skeleton is visible before loading
  await new Promise(resolve => setTimeout(resolve, 100));
  
  const recipeProgress = recipeStore.initializeRecipe(id);
  console.log('Recipe progress:', recipeProgress); // Debug log
  
  // Restore persisted state
  currentSlide.value = recipeProgress.currentStep;
  imageHeight.value = recipeProgress.imageHeight;
  isImageCollapsed.value = recipeProgress.isImageCollapsed;
  console.log('Restored state - slide:', currentSlide.value, 'imageHeight:', imageHeight.value); // Debug log
  
  // Clear any duplicate timers first
  recipeStore.clearDuplicateTimers();
  
  // Restore timers from store
  timerManager.restoreTimersFromStore();
  
  // Set up watchers after initial load
  watch(currentSlide, (newSlide) => {
    console.log('Slide changed to:', newSlide); // Debug log
    recipeStore.setCurrentStep(newSlide);
  });
  
  watch([imageHeight, isImageCollapsed], ([height, collapsed]) => {
    recipeStore.setImageState(height, collapsed);
  });
  
  // Add minimum loading time to ensure skeleton is visible
  await new Promise(resolve => setTimeout(resolve, 1500));
  
  // Hide loading state after everything is set up
  await nextTick();
  isLoadingPersistence.value = false;
  
  // Wait for DOM to be ready, then navigate to persisted slide if not on intro
  await nextTick();
  if (currentSlide.value > 0) {
    console.log('Navigating to persisted slide:', currentSlide.value); // Debug log
    goToSlide(currentSlide.value, true); // Use immediate navigation to avoid scrolling through slides
  }
});

// Auto-show active timers panel when timers become active
watch(() => timerManager.hasActiveTimers.value, (hasActive) => {
    if (hasActive) {
        showActiveTimers.value = true;
        showIngredients.value = false; // Close ingredients panel if open
    }
});

const toggleStepIngredients = async () => showStepIngredients.value = !showStepIngredients.value;

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
    if (index >= 0 && index < totalSlides) {
        currentSlide.value = index;
        if (carouselRef.value) {
            const targetSlide = carouselRef.value.querySelector(`#slide${index}`) as HTMLElement;
            if (targetSlide) {
                targetSlide.scrollIntoView({ 
                    behavior: immediate ? 'instant' : 'smooth', 
                    block: 'nearest', 
                    inline: 'start' 
                });
            }
        }
    }
};

const nextSlide = () => {
    if (currentSlide.value < totalSlides - 1) {
        goToSlide(currentSlide.value + 1);
    }
};

const previousSlide = () => {
    if (currentSlide.value > 0) {
        goToSlide(currentSlide.value - 1);
    }
};

// Detect scroll position to update current slide for touch navigation
const updateCurrentSlideFromScroll = () => {
    if (!carouselRef.value) return;
    
    const carousel = carouselRef.value;
    const scrollLeft = carousel.scrollLeft;
    const slideWidth = carousel.clientWidth;
    const newIndex = Math.round(scrollLeft / slideWidth);
    
    if (newIndex !== currentSlide.value && newIndex >= 0 && newIndex < totalSlides) {
        currentSlide.value = newIndex;
    }
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
    
    // Scroll detection for touch navigation
    const handleScroll = () => {
        updateCurrentSlideFromScroll();
    };
    // Fullscreen change detection
    const handleFullscreenChange = () => {
        isFullscreen.value = !!(document.fullscreenElement || 
                                (document as any).webkitFullscreenElement);
    };
    
    // Drag event handlers
    const handleMouseMove = (event: MouseEvent) => onDrag(event);
    const handleTouchMove = (event: TouchEvent) => onDrag(event);
    const handleDragEnd = () => endDrag();
    
    document.addEventListener('keydown', handleKeydown);
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    
    // Add drag event listeners
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('touchmove', handleTouchMove, { passive: false });
    document.addEventListener('mouseup', handleDragEnd);
    document.addEventListener('touchend', handleDragEnd);
    
    if (carouselRef.value) {
        carouselRef.value.addEventListener('scroll', handleScroll, { passive: true });
    }
    
    onUnmounted(() => {
        document.removeEventListener('keydown', handleKeydown);
        document.removeEventListener('fullscreenchange', handleFullscreenChange);
        document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
        
        // Remove drag event listeners
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('touchmove', handleTouchMove);
        document.removeEventListener('mouseup', handleDragEnd);
        document.removeEventListener('touchend', handleDragEnd);
        
        if (carouselRef.value) {
            carouselRef.value.removeEventListener('scroll', handleScroll);
        }
    });
});

// Drag handlers for collapsible image
const startDrag = (event: MouseEvent | TouchEvent) => {
    isDragging.value = true;
    dragStartY.value = event.type.includes('touch') 
        ? (event as TouchEvent).touches[0].clientY 
        : (event as MouseEvent).clientY;
    dragStartHeight.value = imageHeight.value;
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
        newHeight = Math.max(MIN_HEIGHT, Math.min(MAX_HEIGHT, newHeight));
        
        imageHeight.value = newHeight;
        isImageCollapsed.value = newHeight <= COLLAPSED_THRESHOLD;
    });
};

const endDrag = () => {
    if (!isDragging.value) return;
    
    isDragging.value = false;
    
    // Snap to collapsed or expanded state
    if (imageHeight.value <= COLLAPSED_THRESHOLD) {
        imageHeight.value = MIN_HEIGHT;
        isImageCollapsed.value = true;
    } else if (imageHeight.value < 20) {
        // Snap to default if between collapsed and default
        imageHeight.value = 25;
        isImageCollapsed.value = false;
    }
};

// Toggle image collapse state (for double-click/double-tap)
const toggleImageCollapse = () => {
    isDragging.value = false; // Prevent conflict with drag state
    if (isImageCollapsed.value) {
        // Expand to default height
        imageHeight.value = 25;
        isImageCollapsed.value = false;
    } else {
        // Collapse to minimum height
        imageHeight.value = MIN_HEIGHT;
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