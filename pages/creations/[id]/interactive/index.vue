<template>
    <div class="h-dvh w-full flex items-center justify-center bg-gray-100">
        <!-- Mobile-optimized Card Container -->
        <div class="w-full max-w-md h-full bg-white shadow-xl flex flex-col">
            <!-- Fullscreen toggle button -->
            <button @click="toggleFullscreen"
                class="absolute top-4 right-4 z-20 w-10 h-10 bg-white/80 backdrop-blur-sm rounded-full flex items-center justify-center shadow-lg hover:bg-white transition-colors">
                <svg v-if="!isFullscreen" class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                        d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4">
                    </path>
                </svg>
                <svg v-else class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                        d="M9 9l6 6m0-6l-6 6m12-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
            </button>
            <!-- Top Figure Section - Collapsible Height -->
            <figure
                :class="[
                    'relative rounded-b-3xl shadow-xl overflow-hidden flex-shrink-0',
                    isDragging ? '' : 'transition-all duration-300',
                    isImageCollapsed ? 'h-12' : ''
                ]"
                :style="{ height: `${imageHeight}%` }">
                <!-- Current Step Media or Default Image -->
                <template v-if="currentSlide === 0">
                    <!-- Intro Image -->
                    <img v-if="creation.image" :src="getImageUrl(creation.image)" :alt="creation.name"
                        class="h-full w-full object-cover" />
                    <div v-else
                        class="w-full h-full bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center">
                        <div class="text-6xl opacity-20">🍽️</div>
                    </div>
                </template>
                <template v-else-if="currentSlide <= steps.length + 1">
                    <!-- Step Media -->
                    <div v-if="steps[currentSlide - 1].video" class="w-full h-full">
                        <video :key="`video-${currentSlide}`" :src="getVideoUrl(steps[currentSlide - 1].video)"
                            :poster="getVideoThumbnail(steps[currentSlide - 1].video)"
                            class="w-full h-full object-cover" controls preload="metadata">
                            <source :src="getVideoUrl(steps[currentSlide - 1].video)" type="video/mp4">
                            Your browser does not support the video tag.
                        </video>
                    </div>
                    <img v-else-if="steps[currentSlide - 1].image" :src="getImageUrl(steps[currentSlide - 1].image)"
                        :alt="steps[currentSlide - 1].name || `Step ${currentSlide - 1}`"
                        class="w-full h-full object-cover" />
                    <!-- Fallback to main image if step has no media -->
                    <img v-else-if="creation.image" :src="getImageUrl(creation.image)" :alt="creation.name"
                        class="h-full w-full object-cover" />
                    <div v-else
                        class="w-full h-full bg-gradient-to-br from-base-200 to-base-300 flex items-center justify-center">
                        <div class="text-6xl opacity-20">👩‍🍳</div>
                    </div>
                </template>
                <template v-else>
                    <!-- Completion Image -->
                    <img v-if="creation.image" :src="getImageUrl(creation.image)" :alt="creation.name"
                        class="h-full w-full object-cover" />
                    <div v-else
                        class="w-full h-full bg-gradient-to-br from-success/20 to-success/30 flex items-center justify-center">
                        <div class="text-6xl opacity-20">🎉</div>
                    </div>
                </template>
                
                <!-- Draggable Handle -->
                <div 
                    @mousedown.prevent="startDrag"
                    @touchstart.prevent="startDrag"
                    @touchmove.prevent="onDrag"
                    @touchend.prevent="endDrag"
                    class="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-black/20 to-transparent flex items-end justify-center pb-2 cursor-ns-resize touch-none">
                    <div class="w-12 h-1 bg-white/80 rounded-full shadow-md"></div>
                </div>
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
                                    class="text-gray-700 text-sm leading-relaxed"></p>
                            </div>
                            <div>
                                <h2 class="text-xl font-bold mb-4">Ingredients</h2>

                                <ul class="space-y-1">
                                    <li v-for="ingredient in creation.recipeIngredient" :key="ingredient"
                                        class="flex items-start space-x-2">
                                        <span class="w-1.5 h-1.5 bg-gray-400 rounded-full mt-1.5 flex-shrink-0"></span>
                                        <span class="text-sm text-gray-700">{{ ingredient }}</span>
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
                                    class="flex justify-center items-center grow-0 shrink-0 h-12 w-12 bg-gray-900 text-gray-50 rounded-md">
                                    <span class="text-3xl font-mono">{{ index + 1 }}</span>
                                </div>

                                <div class="text-lg text-gray-700 leading-tight" v-html="step.text"></div>
                            </div>

                            <!-- Step-specific supplies/ingredients -->
                            <div v-if="step.supply && step.supply.length > 0"
                                class="box-gray">
                                <ul class="space-y-1">
                                    <li v-for="supply in step.supply" :key="supply.name">
                                        <label class="flex items-start space-x-3">
                                            <input type="checkbox" class="checkbox checkbox-lg bg-white border-[1px]" />
                                            <span>{{ supply.name }}</span>
                                        </label>
                                    </li>
                                </ul>
                            </div>

                            <!-- Timer -->
                            <div v-if="step.timer" 
                                class="box-gray flex justify-between">
                                <div class="flex items-center space-x-2">
                                    <svg class="w-5 h-5 text-gray-800" fill="none" stroke="currentColor"
                                        viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                            d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                                    </svg>
                                    <div class="flex flex-col leading-3 justify-center">
                                        <span class="font-medium italic">{{ step.timer.label }}</span>
                                        <span class="text-sm text-gray-500">{{ formatDuration(step.timer.duration) }}</span>
                                    </div>
                                </div>
                                <button
                                    class="btn btn-md h-auto py-3 shadow-none rounded-full font-normal uppercase text-black bg-gray-200 border-[0.5px] border-gray-400/60 flex justify-center items-center">
                                    <span class="leading-0">start</span>
                                    <span>
                                        <!-- play svg -->
                                        <svg version="1.1" xmlns="http://www.w3.org/2000/svg"
                                            viewBox="0 0 330 330" height="16" width="16"
                                            fill="currentColor">
                                            <path d="M37.728,328.12c2.266,1.256,4.77,1.88,7.272,1.88c2.763,0,5.522-0.763,7.95-2.28l240-149.999
	c4.386-2.741,7.05-7.548,7.05-12.72c0-5.172-2.664-9.979-7.05-12.72L52.95,2.28c-4.625-2.891-10.453-3.043-15.222-0.4
	C32.959,4.524,30,9.547,30,15v300C30,320.453,32.959,325.476,37.728,328.12z" />
                                        </svg>
                                    </span>
                                </button>

                            </div>

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
            <div class="flex-shrink-0 bg-white border-t border-gray-200 relative">
                <!-- Ingredients Dropdown Panel (only shows after slide 0) -->
                <div v-if="showIngredients && currentSlide > 0"
                    class="absolute bottom-[120%] left-0 right-0 mx-auto bg-white border-[0.25px] border-gray-300/60 shadow-xl overflow-y-auto max-w-[90%] rounded-2xl">
                    <div class="p-4">
                        <div class="flex items-center justify-between mb-3">
                            <h3 class="font-semibold text-base">Ingredients</h3>
                            <button @click="showIngredients = false" class="p-1 cursor-pointer">
                                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                        d="M6 18L18 6M6 6l12 12"></path>
                                </svg>
                            </button>
                        </div>
                        <ul>
                            <li v-for="ingredient in creation.recipeIngredient" :key="ingredient">{{ ingredient }}</li>
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
                            <div class="text-xs text-gray-500">Or swipe to start cooking! →</div>
                        </div>

                        <!-- Begin Button -->
                        <button @click="nextSlide"
                            class="px-6 py-2 bg-gray-900 text-white rounded-full text-sm font-medium hover:bg-gray-800 flex items-center space-x-2 cursor-pointer">
                            <span>Begin</span>
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7">
                                </path>
                            </svg>
                        </button>
                    </div>
                    <div v-else class="flex items-center justify-between">
                        <!-- After slide 0 - with ingredients button -->
                        <!-- Previous Button -->
                        <button @click="previousSlide" class="flex items-center space-x-2 text-gray-600 cursor-pointer">
                            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                    d="M15 19l-7-7 7-7"></path>
                            </svg>
                            <span class="text-sm">Back</span>
                        </button>

                        <!-- Ingredients Button -->
                        <button @click="showIngredients = !showIngredients"
                            class="flex items-center space-x-2 px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer">
                            <!-- Ingredients Icon SVG -->
                            <svg width="20" height="15" viewBox="0 0 20 15" fill="none"
                                xmlns="http://www.w3.org/2000/svg">
                                <line x1="2.40002" y1="1.01245" x2="20" y2="1.01245" stroke="currentColor"
                                    stroke-width="2" />
                                <line x1="2.40002" y1="7.41321" x2="20" y2="7.41321" stroke="currentColor"
                                    stroke-width="2" />
                                <line x1="2.40002" y1="13.814" x2="20" y2="13.814" stroke="currentColor"
                                    stroke-width="2" />
                                <line y1="1" x2="1.6" y2="1" stroke="currentColor" stroke-width="2" />
                                <line y1="7.40076" x2="1.6" y2="7.40076" stroke="currentColor" stroke-width="2" />
                                <line y1="13.8015" x2="1.6" y2="13.8015" stroke="currentColor" stroke-width="2" />
                            </svg>
                            <span class="text-sm font-medium">Ingredients</span>
                        </button>

                        <!-- Next Button -->
                        <button v-if="currentSlide < totalSlides - 1" @click="nextSlide"
                            class="flex items-center space-x-2 text-gray-600 cursor-pointer">
                            <span class="text-sm">Next</span>
                            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7">
                                </path>
                            </svg>
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

const route = useRoute();
const id = route.params.id as string;

// Get recipe from fixtures
const recipeData = recipesById[parseInt(id) as keyof typeof recipesById];
const creation: HowTo = transformJsonLdToHowTo(recipeData);

// Get steps as HowToStep array for template usage
const steps = creation.step as HowToStep[];
const totalSlides = steps.length + 2; // intro + steps + completion

// Reactive state for current slide
const currentSlide = ref(0);
const carouselRef = ref<HTMLElement>();
const showIngredients = ref(false);

// Image collapse state
const imageHeight = ref(25); // Default 25% height (h-1/4)
const isImageCollapsed = ref(false);
const isDragging = ref(false);
const dragStartY = ref(0);
const dragStartHeight = ref(0);
const MIN_HEIGHT = 10; // Minimum 10% height when collapsed
const MAX_HEIGHT = 33; // Maximum 33% height when expanded
const COLLAPSED_THRESHOLD = 15; // Below 15% is considered collapsed

// Track current media source
const currentMediaSource = computed(() => {
    if (currentSlide.value === 0 || currentSlide.value === 1) {
        // Intro and ingredients slides use main image
        return creation.image ? getImageUrl(creation.image) : 'default-intro';
    } else if (currentSlide.value <= steps.length + 1) {
        // Step slides - check for step-specific media
        const step = steps[currentSlide.value - 2];
        if (step.video) {
            return getVideoUrl(step.video);
        } else if (step.image) {
            return getImageUrl(step.image);
        } else {
            // Falls back to main image
            return creation.image ? getImageUrl(creation.image) : 'default-step';
        }
    } else {
        // Completion slide uses main image
        return creation.image ? getImageUrl(creation.image) : 'default-completion';
    }
});

// Watch for media changes and reset height
watch(currentMediaSource, (newSource, oldSource) => {
    if (newSource !== oldSource) {
        imageHeight.value = 25;
        isImageCollapsed.value = false;
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
const goToSlide = (index: number) => {
    if (index >= 0 && index < totalSlides) {
        currentSlide.value = index;
        if (carouselRef.value) {
            const targetSlide = carouselRef.value.querySelector(`#slide${index}`) as HTMLElement;
            if (targetSlide) {
                targetSlide.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'start' });
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
                position: instruction.position || index + 1
            };

            // If the HowToDirection has a supply list, add it to the step
            if (howToDirection?.supply && Array.isArray(howToDirection.supply)) {
                step.supply = howToDirection.supply;
            }

            // Add sample timer for baking steps
            const text = stepText.toLowerCase();
            if (text.match(/(\d+)\s*minutes?/) || text.match(/(\d+)\s*hours?/)) {
                const minutes = parseInt(text.match(/(\d+)\s*minutes?/)?.[1] || '0');
                const hours = parseInt(text.match(/(\d+)\s*hours?/)?.[1] || '0');
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

// Helper functions for image/video handling
function getImageUrl(image: any): string {
    if (typeof image === 'string') return image;
    if (image && typeof image === 'object') {
        return image.url || image.contentUrl || '';
    }
    return '';
}

function getVideoUrl(video: any): string {
    if (typeof video === 'string') return video;
    if (video && typeof video === 'object') {
        return video.contentUrl || video.url || '';
    }
    return '';
}

function getVideoThumbnail(video: any): string {
    if (video && typeof video === 'object') {
        return video.thumbnailUrl || '';
    }
    return '';
}

// Helper function to format ISO 8601 duration to human-readable
function formatDuration(duration: string | number | undefined): string {
    if (!duration) return '';
    if (typeof duration === 'number') {
        const hours = Math.floor(duration / 3600);
        const minutes = Math.floor((duration % 3600) / 60);
        const seconds = duration % 60;
        let timeString = '';
        if (hours > 0) {
            timeString = `${hours}h`;
        }
        if (minutes > 0) {
            timeString += ` ${minutes}m`;
        }
        if (seconds > 0) {
            timeString += ` ${seconds}s`;
        }
        return timeString.trim();
    }

    const match = duration.match(/PT(\d+)M/) || duration.match(/PT(\d+)S/);
    if (match) {
        const value = parseInt(match[1]);
        if (duration.includes('M')) {
            return `${value}m`;
        } else {
            const minutes = Math.floor(value / 60);
            const secs = value % 60;
            if (minutes > 0) {
                return secs > 0 ? `${minutes}m ${secs}s` : `${minutes}m`;
            }
            return `${secs}s`;
        }
    }
    return duration;
}
</script>