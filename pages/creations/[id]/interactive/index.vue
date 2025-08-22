<template>
    <div class="h-dvh w-full flex items-center justify-center bg-white">
        <!-- Single Card Container -->
        <div class="card lg:card-side w-full max-w-7xl h-full lg:h-5/6 bg-white shadow-xl relative">
            <!-- Fullscreen toggle button -->
            <button 
                @click="toggleFullscreen"
                class="absolute top-4 right-4 z-20 w-10 h-10 bg-white/80 backdrop-blur-sm rounded-full flex items-center justify-center shadow-lg hover:bg-white transition-colors">
                <svg v-if="!isFullscreen" class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4"></path>
                </svg>
                <svg v-else class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 9l6 6m0-6l-6 6m12-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
            </button>
            
            <!-- Stationary Figure Section -->
            <figure class="h-1/4 md:h-1/3 lg:h-full lg:w-2/5 relative rounded-b-3xl shadow-xl overflow-hidden">
                <!-- Current Step Media or Default Image -->
                <template v-if="currentSlide === 0">
                    <!-- Intro Image -->
                    <img v-if="creation.image" 
                         :src="getImageUrl(creation.image)" 
                         :alt="creation.name"
                         class="h-full w-full object-cover" />
                    <div v-else class="w-full h-full bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center">
                        <div class="text-6xl opacity-20">🍽️</div>
                    </div>
                </template>
                <template v-else-if="currentSlide === 1">
                    <!-- Ingredients Image -->
                    <img v-if="creation.image" 
                         :src="getImageUrl(creation.image)" 
                         :alt="creation.name"
                         class="h-full w-full object-cover" />
                    <div v-else class="w-full h-full bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center">
                        <div class="text-6xl opacity-20">📋</div>
                    </div>
                </template>
                <template v-else-if="currentSlide <= steps.length + 1">
                    <!-- Step Media -->
                    <div v-if="steps[currentSlide - 2].video" class="w-full h-full">
                        <video :key="`video-${currentSlide}`"
                               :src="getVideoUrl(steps[currentSlide - 2].video)" 
                               :poster="getVideoThumbnail(steps[currentSlide - 2].video)"
                               class="w-full h-full object-cover" 
                               controls 
                               preload="metadata">
                            <source :src="getVideoUrl(steps[currentSlide - 2].video)" type="video/mp4">
                            Your browser does not support the video tag.
                        </video>
                    </div>
                    <img v-else-if="steps[currentSlide - 2].image" 
                         :src="getImageUrl(steps[currentSlide - 2].image)" 
                         :alt="steps[currentSlide - 2].name || `Step ${currentSlide - 1}`"
                         class="w-full h-full object-cover" />
                    <!-- Fallback to main image if step has no media -->
                    <img v-else-if="creation.image" 
                         :src="getImageUrl(creation.image)" 
                         :alt="creation.name"
                         class="h-full w-full object-cover" />
                    <div v-else class="w-full h-full bg-gradient-to-br from-base-200 to-base-300 flex items-center justify-center">
                        <div class="text-6xl opacity-20">👩‍🍳</div>
                    </div>
                </template>
                <template v-else>
                    <!-- Completion Image -->
                    <img v-if="creation.image" 
                         :src="getImageUrl(creation.image)" 
                         :alt="creation.name"
                         class="h-full w-full object-cover" />
                    <div v-else class="w-full h-full bg-gradient-to-br from-success/20 to-success/30 flex items-center justify-center">
                        <div class="text-6xl opacity-20">🎉</div>
                    </div>
                </template>
                
                <!-- Navigation Controls Overlay -->
                <div class="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/50 to-transparent">
                    <div class="flex justify-between items-center">
                        <button 
                            @click="previousSlide" 
                            :class="currentSlide === 0 ? 'bg-white/50 pointer-events-none cursor-not-allowed' : 'bg-white/90 hover:bg-white'"
                            class="btn mask mask-squircle border-0 transition-none">
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"></path>
                            </svg>
                        </button>
                        
                        <!-- Progress Dots -->
                        <div class="flex space-x-2">
                            <div v-for="index in totalSlides" :key="index - 1" :class="[
                                'w-2 h-2 rounded-full transition-all duration-300',
                                currentSlide === index - 1 ? 'bg-white w-6' : 'bg-white/50'
                            ]"></div>
                        </div>
                        
                        <button 
                            @click="nextSlide" 
                            :class="currentSlide === totalSlides - 1 ? 'bg-white/50 pointer-events-none cursor-not-allowed' : 'bg-white/90 hover:bg-white'"
                            class="btn mask mask-squircle border-0 transition-none">
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path>
                            </svg>
                        </button>
                    </div>
                </div>
            </figure>
            
            <!-- Carousel Body Section -->
            <div class="flex-1 h-3/4 lg:h-full relative overflow-hidden flex flex-col">
                <div class="carousel w-full flex-1" ref="carouselRef">
                    <!-- Intro Slide - Title, Description, Stats -->
                    <div id="slide0" class="carousel-item w-full">
                        <div class="card-body space-y-2">
                            <div class="">
                                <h2 class="card-title text-3xl lg:text-4xl">{{ creation.name }}</h2>
                                <p v-if="creation.description" v-html="creation.description" class="text-base-content"></p>
                            </div>
                            
                            <!-- Recipe Info -->
                            <div v-if="creation.prepTime || creation.cookTime || creation.yield" class="stats shadow max-w-md mx-auto">
                                <div v-if="creation.prepTime" class="stat">
                                    <div class="stat-title">Prep Time</div>
                                    <div class="stat-value text-2xl">{{ formatDuration(creation.prepTime) }}</div>
                                </div>
                                <div v-if="creation.cookTime" class="stat">
                                    <div class="stat-title">Cook Time</div>
                                    <div class="stat-value text-2xl">{{ formatDuration(creation.cookTime) }}</div>
                                </div>
                                <div v-if="creation.yield" class="stat">
                                    <div class="stat-title">Serves</div>
                                    <div class="stat-value text-2xl">{{ creation.yield }}</div>
                                </div>
                            </div>
                            
                            <!-- Call to Action -->
                            <div class="text-center mt-8">
                                <p class="text-sm text-gray-700">Swipe to see ingredients →</p>
                            </div>
                        </div>
                    </div>

                    <!-- Ingredients Slide -->
                    <div id="slide1" class="carousel-item w-full">
                        <div class="card-body space-y-2 overflow-y-auto">
                            <h2 class="card-title text-2xl lg:text-3xl">Ingredients</h2>
                            
                            <div class="max-w-lg">
                                <ul class="space-y-1">
                                    <li v-for="ingredient in creation.recipeIngredient" :key="ingredient"
                                        class="flex items-start space-x-2">
                                        <span class="w-2 h-2 bg-base-content rounded-full mt-2 flex-shrink-0"></span>
                                        <span class="text-sm ">{{ ingredient }}</span>
                                    </li>
                                </ul>
                            </div>
                            
                            <!-- Call to Action -->
                            <div class="text-center mt-6">
                                <p class="text-sm opacity-60 animate-pulse">Ready to cook? Swipe to start →</p>
                            </div>
                        </div>
                    </div>

                    <!-- Recipe Steps -->
                    <div v-for="(step, index) in steps" :key="`step-${index}`" :id="`slide${index + 2}`"
                        class="carousel-item w-full">
                        <div class="card-body space-y-2 overflow-y-auto">
                            <h2 class="card-title text-xl lg:text-2xl">{{ step.name || `Step ${step.position || index + 1}` }}</h2>
                            <div class="prose prose-sm max-w-none" v-html="step.text"></div>

                            <!-- Step-specific supplies/ingredients -->
                            <div v-if="step.supply && step.supply.length > 0" class="bg-blue-50 rounded-lg p-3 border-l-4 border-blue-300">
                                <h4 class="font-semibold text-sm mb-2 text-blue-700">Ingredients for this step:</h4>
                                <ul class="space-y-1">
                                    <li v-for="supply in step.supply" :key="supply.name"
                                        class="flex items-start space-x-2">
                                        <span class="w-1 h-1 bg-blue-500 rounded-full mt-1.5 flex-shrink-0"></span>
                                        <span class="text-xs text-blue-700">{{ supply.name }}</span>
                                    </li>
                                </ul>
                            </div>

                            <!-- All ingredients fallback (if no step-specific supplies) -->
                            <div v-else-if="creation.recipeIngredient && creation.recipeIngredient.length > 0" class="bg-gray-50 rounded-lg p-3">
                                <h4 class="font-semibold text-sm mb-2">All Ingredients:</h4>
                                <ul class="space-y-1">
                                    <li v-for="ingredient in creation.recipeIngredient" :key="ingredient"
                                        class="flex items-start space-x-2">
                                        <span class="w-1 h-1 bg-primary rounded-full mt-1.5 flex-shrink-0"></span>
                                        <span class="text-xs">{{ ingredient }}</span>
                                    </li>
                                </ul>
                            </div>

                            <!-- Timer -->
                            <div v-if="step.timer" class="alert alert-warning">
                                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                        d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                                </svg>
                                <span>{{ step.timer.label }}</span>
                            </div>

                            <!-- Notes -->
                            <div v-if="step.notes && step.notes.length > 0" class="space-y-2">
                                <div v-for="note in step.notes" :key="note.text" class="alert alert-info">
                                    <svg class="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path v-if="note.type === 'tip'" stroke-linecap="round" stroke-linejoin="round"
                                            stroke-width="2"
                                            d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z">
                                        </path>
                                        <path v-else-if="note.type === 'warning'" stroke-linecap="round"
                                            stroke-linejoin="round" stroke-width="2"
                                            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z">
                                        </path>
                                        <path v-else stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                            d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                                    </svg>
                                    <span class="text-sm">{{ note.text }}</span>
                                </div>
                            </div>
                            
                        </div>
                    </div>

                    <!-- Completion Slide -->
                    <div :id="`slide${totalSlides - 1}`" class="carousel-item w-full">
                        <div class="card-body flex flex-col justify-center items-center text-center">
                            <!-- Success Icon -->
                            <div class="w-20 h-20 mb-4 bg-success/20 rounded-full flex items-center justify-center">
                                <svg class="w-10 h-10 text-success" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                        d="M5 13l4 4L19 7"></path>
                                </svg>
                            </div>

                            <h2 class="text-2xl lg:text-3xl font-bold text-success mb-2">Congratulations!</h2>
                            <p class="text-lg mb-4">You've completed making</p>
                            <p class="text-xl font-semibold mb-6">{{ creation.name }}</p>

                            <div class="space-y-2 mb-6">
                                <p class="text-base">Time to enjoy your delicious creation! 🎉</p>
                                <p class="text-sm opacity-70">Don't forget to share a photo of your finished dish!</p>
                            </div>

                            <div class="card-actions flex-col sm:flex-row gap-2">
                                <button @click="goToSlide(0)" class="btn btn-primary btn-sm">Start Over</button>
                                <a href="/" class="btn btn-outline btn-sm">Browse More Recipes</a>
                            </div>
                        </div>
                    </div>
                </div>
                
                <!-- Stationary Banner Ad Section -->
                <div class="w-full bg-base-300 border-t border-base-300 p-3">
                    <div class="max-w-sm mx-auto">
                        <!-- Sample Ad Content - Replace with your ad network code -->
                        <div class="bg-base-100 rounded-lg p-3 text-center border-2 border-dashed border-base-300">
                            <div class="text-xs text-base-content/60 mb-1">Advertisement</div>
                            <div class="text-sm font-medium text-base-content/80">Your Ad Here</div>
                            <div class="text-xs text-base-content/50 mt-1">728×90 Banner Space</div>
                        </div>
                    </div>
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
const totalSlides = steps.length + 3; // intro + ingredients + steps + completion

// Reactive state for current slide
const currentSlide = ref(0);
const carouselRef = ref<HTMLElement>();

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
        } else if (event.key === 'f' || event.key === 'F') {
            event.preventDefault();
            toggleFullscreen();
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
    
    document.addEventListener('keydown', handleKeydown);
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    
    if (carouselRef.value) {
        carouselRef.value.addEventListener('scroll', handleScroll, { passive: true });
    }
    
    onUnmounted(() => {
        document.removeEventListener('keydown', handleKeydown);
        document.removeEventListener('fullscreenchange', handleFullscreenChange);
        document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
        if (carouselRef.value) {
            carouselRef.value.removeEventListener('scroll', handleScroll);
        }
    });
});

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
            if (text.includes('bake') && text.match(/(\d+)\s*minutes?/)) {
                const minutes = parseInt(text.match(/(\d+)\s*minutes?/)?.[1] || '0');
                step.timer = {
                    duration: minutes * 60,
                    label: `Timer for ${minutes} minutes`,
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
function formatDuration(duration: string | undefined): string {
    if (!duration) return '';

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