<template>
    <div class="h-dvh w-full relative">
        <!-- Carousel Content -->
        <div class="carousel w-full max-w-7xl max-h-dvh bg-white" ref="carouselRef">
            <!-- Intro Card -->
            <div id="slide0" class="carousel-item w-full">
                <div class="card lg:card-side relative">
                    <!-- Fullscreen toggle button -->
                    <button 
                        @click="toggleFullscreen"
                        class="absolute top-4 right-4 z-10 w-10 h-10 bg-white/80 backdrop-blur-sm rounded-full flex items-center justify-center shadow-lg hover:bg-white transition-colors">
                        <svg v-if="!isFullscreen" class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4"></path>
                        </svg>
                        <svg v-else class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 9l6 6m0-6l-6 6m12-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                        </svg>
                    </button>
                    
                    <figure class="max-h-1/4 lg:max-h-none min-w-2/5">
                        <img v-if="creation.image" 
                             :src="getImageUrl(creation.image)" 
                             :alt="creation.name"
                             class="h-full w-full object-cover" />
                        <div v-else class="w-full h-full bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center">
                            <div class="text-6xl opacity-20">🍽️</div>
                        </div>
                    </figure>
                    
                    <div class="card-body space-y-2">
                        <h2 class="card-title">{{ creation.name }}</h2>
                        <p v-if="creation.description" v-html="creation.description" class="grow-0"></p>
                        
                        <!-- Recipe Info -->
                        <div v-if="creation.prepTime || creation.cookTime || creation.yield" class="stats shadow">
                            <div v-if="creation.prepTime" class="stat">
                                <div class="stat-title">Prep Time</div>
                                <div class="stat-value text-lg">{{ formatDuration(creation.prepTime) }}</div>
                            </div>
                            <div v-if="creation.cookTime" class="stat">
                                <div class="stat-title">Cook Time</div>
                                <div class="stat-value text-lg">{{ formatDuration(creation.cookTime) }}</div>
                            </div>
                            <div v-if="creation.yield" class="stat">
                                <div class="stat-title">Serves</div>
                                <div class="stat-value text-lg">{{ creation.yield }}</div>
                            </div>
                        </div>

                        <!-- Ingredients -->
                        <div class="grow">
                            <h3 class="font-semibold text-lg">Ingredients</h3>
                            <ul class="space-y-1">
                                <li v-for="ingredient in creation.recipeIngredient" :key="ingredient"
                                    class="flex items-start space-x-2">
                                    <span class="w-1.5 h-1.5 bg-primary rounded-full mt-2 flex-shrink-0"></span>
                                    <span class="text-sm">{{ ingredient }}</span>
                                </li>
                            </ul>
                        </div>
                        
                        <div class="card-actions justify-end mt-6">
                            <button @click="nextSlide" class="btn btn-primary w-2/3 mx-auto">Start Cooking</button>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Recipe Steps -->
            <div v-for="(step, index) in steps" :key="`step-${index}`" :id="`slide${index + 1}`"
                class="carousel-item w-full h-full">
                <div class="card lg:card-side relative h-full">
                    <!-- Navigation buttons -->
                    <button 
                        @click="previousSlide" 
                        v-show="currentSlide > 1"
                        class="absolute top-4 left-4 z-10 w-10 h-10 bg-white/80 backdrop-blur-sm rounded-full flex items-center justify-center shadow-lg hover:bg-white transition-colors">
                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"></path>
                        </svg>
                    </button>
                    
                    <button 
                        @click="toggleFullscreen"
                        class="absolute top-4 right-4 z-10 w-10 h-10 bg-white/80 backdrop-blur-sm rounded-full flex items-center justify-center shadow-lg hover:bg-white transition-colors">
                        <svg v-if="!isFullscreen" class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4"></path>
                        </svg>
                        <svg v-else class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 9l6 6m0-6l-6 6m12-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                        </svg>
                    </button>
                    
                    <figure class="max-h-1/4 lg:max-h-none min-w-2/5">
                        <!-- Video -->
                        <div v-if="step.video" class="w-full h-full">
                            <video :src="getVideoUrl(step.video)" :poster="getVideoThumbnail(step.video)"
                                class="w-full h-full object-cover" controls preload="metadata">
                                <source :src="getVideoUrl(step.video)" type="video/mp4">
                                Your browser does not support the video tag.
                            </video>
                        </div>
                        <!-- Image -->
                        <img v-else-if="step.image" 
                             :src="getImageUrl(step.image)" 
                             :alt="step.name || `Step ${index + 1}`"
                             class="w-full h-full object-cover" />
                        <!-- Fallback background if no media -->
                        <div v-else>
                        <img v-if="creation.image" 
                             :src="getImageUrl(creation.image)" 
                             :alt="creation.name"
                             class="h-full w-full object-cover" />
                        <div v-else class="w-full h-full bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center">
                            <div class="text-6xl opacity-20">🍽️</div>
                        </div>
                        </div>
                    </figure>
                    
                    <div class="card-body space-y-2">
                        <h2 class="card-title text-xl lg:text-2xl">{{ step.name || `Step ${index + 1}` }}</h2>
                        <div class="prose prose-sm max-w-none" v-html="step.text"></div>

                        <!-- Timer -->
                        <div v-if="step.timer" class="alert alert-warning mt-4">
                            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                            </svg>
                            <span>{{ step.timer.label }}</span>
                        </div>

                        <!-- Notes -->
                        <div v-if="step.notes && step.notes.length > 0" class="space-y-3 mt-4">
                            <div v-for="note in step.notes" :key="note.text" :class="[
                                'alert',
                                note.type === 'tip' ? 'alert-info' : '',
                                note.type === 'warning' ? 'alert-warning' : '',
                                note.type === 'info' ? 'alert-info' : ''
                            ]">
                                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                                <span>{{ note.text }}</span>
                            </div>
                        </div>
                        
                        <div class="card-actions justify-between mt-6">
                            <button 
                                @click="previousSlide" 
                                v-show="currentSlide > 1"
                                class="btn btn-outline">
                                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"></path>
                                </svg>
                                Back
                            </button>
                            <button 
                                @click="nextSlide" 
                                v-show="currentSlide < totalSlides - 1"
                                class="btn btn-primary">
                                Next
                                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path>
                                </svg>
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Completion Card -->
            <div :id="`slide${totalSlides - 1}`" class="carousel-item w-full p-4">
                <div class="card bg-base-100 shadow-xl w-full h-full relative">
                    <!-- Fullscreen toggle button -->
                    <button 
                        @click="toggleFullscreen"
                        class="absolute top-4 right-4 z-10 w-10 h-10 bg-white/80 backdrop-blur-sm rounded-full flex items-center justify-center shadow-lg hover:bg-white transition-colors">
                        <svg v-if="!isFullscreen" class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4"></path>
                        </svg>
                        <svg v-else class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 9l6 6m0-6l-6 6m12-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                        </svg>
                    </button>
                    
                    <div class="card-body flex flex-col justify-center items-center text-center">
                        <!-- Success Icon -->
                        <div class="w-24 h-24 mb-6 bg-success/20 rounded-full flex items-center justify-center">
                            <svg class="w-12 h-12 text-success" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                    d="M5 13l4 4L19 7"></path>
                            </svg>
                        </div>

                        <h2 class="card-title text-3xl lg:text-4xl text-success mb-4 justify-center">Congratulations!</h2>
                        <p class="text-xl mb-6">You've completed making <span class="font-semibold">{{ creation.name }}</span>!</p>

                        <div class="space-y-3 mb-8">
                            <p class="text-lg">Time to enjoy your delicious creation! 🎉</p>
                            <p class="text-sm opacity-70">Don't forget to share a photo of your finished dish!</p>
                        </div>

                        <div class="card-actions flex-col sm:flex-row gap-3">
                            <button @click="goToSlide(0)" class="btn btn-primary">Start Over</button>
                            <a href="/" class="btn btn-outline">Browse More Recipes</a>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Progress Indicator -->
        <div class="absolute bottom-6 left-1/2 transform -translate-x-1/2 z-10">
            <div class="flex space-x-2">
                <div v-for="index in totalSlides" :key="index - 1" :class="[
                    'w-2 h-2 rounded-full transition-all duration-200',
                    currentSlide === index - 1 ? 'bg-gray-900 w-6' : 'bg-gray-400'
                ]"></div>
            </div>
        </div>

    </div>
</template>

<script setup lang="ts">
import type { HowTo, HowToStep } from '~/types/schema-org';
import { recipesById } from '~/fixtures/recipes';

const route = useRoute();
const id = route.params.id as string;

// Get recipe from fixtures
const recipeData = recipesById[parseInt(id) as keyof typeof recipesById];
const creation: HowTo = transformMediavineToHowTo(recipeData);

// Get steps as HowToStep array for template usage
const steps = creation.step as HowToStep[];
const totalSlides = steps.length + 2; // intro + steps + completion

// Reactive state for current slide
const currentSlide = ref(0);
const carouselRef = ref<HTMLElement>();

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

// Full-screen functionality
const isFullscreen = ref(false);

const enterFullscreen = async () => {
    try {
        if (document.documentElement.requestFullscreen) {
            await document.documentElement.requestFullscreen();
        } else if ((document.documentElement as any).webkitRequestFullscreen) {
            // Safari support
            await (document.documentElement as any).webkitRequestFullscreen();
        } else if ((document.documentElement as any).msRequestFullscreen) {
            // IE/Edge support
            await (document.documentElement as any).msRequestFullscreen();
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
            // Safari support
            await (document as any).webkitExitFullscreen();
        } else if ((document as any).msExitFullscreen) {
            // IE/Edge support
            await (document as any).msExitFullscreen();
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
            // Press 'F' to toggle fullscreen
            event.preventDefault();
            toggleFullscreen();
        } else if (event.key === 'Escape' && isFullscreen.value) {
            // ESC to exit fullscreen
            exitFullscreen();
        }
    };
    
    // Scroll detection for touch navigation
    const handleScroll = () => {
        updateCurrentSlideFromScroll();
    };
    
    // Fullscreen change detection
    const handleFullscreenChange = () => {
        isFullscreen.value = !!(document.fullscreenElement || 
                                (document as any).webkitFullscreenElement || 
                                (document as any).msFullscreenElement);
    };
    
    document.addEventListener('keydown', handleKeydown);
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('msfullscreenchange', handleFullscreenChange);
    
    if (carouselRef.value) {
        carouselRef.value.addEventListener('scroll', handleScroll, { passive: true });
    }
    
    onUnmounted(() => {
        document.removeEventListener('keydown', handleKeydown);
        document.removeEventListener('fullscreenchange', handleFullscreenChange);
        document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
        document.removeEventListener('msfullscreenchange', handleFullscreenChange);
        if (carouselRef.value) {
            carouselRef.value.removeEventListener('scroll', handleScroll);
        }
    });
});

// Transform Mediavine recipe data to our HowTo format (same as before)
function transformMediavineToHowTo(data: any): HowTo {
    const recipe: HowTo = {
        '@context': 'https://schema.org',
        '@type': 'Recipe',
        name: data?.title || 'Recipe',
        description: data?.description || '',
        datePublished: data?.created,
        dateModified: data?.modified,
        keywords: data?.keywords,
        yield: data?.yield || data?.servings,
        prepTime: data?.prep_time ? `PT${Math.floor(data.prep_time / 60)}M` : undefined,
        cookTime: data?.active_time ? `PT${Math.floor(data.active_time / 60)}M` : undefined,
        totalTime: data?.total_time ? `PT${Math.floor(data.total_time / 60)}M` : undefined,
        recipeCategory: data?.category_name,
        recipeCuisine: data?.secondary_term_name,
        difficulty: 'medium',
        interactiveMode: true,
        step: []
    };

    // Add author if available
    if (data?.author) {
        recipe.author = {
            '@type': 'Person',
            name: data.author
        };
    }

    // Add images
    if (data?.thumbnail_uri) {
        recipe.image = {
            '@type': 'ImageObject',
            url: data.thumbnail_uri
        };
    }

    // Add nutrition info if available
    if (data?.nutrition) {
        recipe.nutrition = {
            '@type': 'NutritionInformation',
            calories: data.nutrition.calories ? `${data.nutrition.calories} calories` : undefined,
            carbohydrateContent: data.nutrition.carbohydrates ? `${data.nutrition.carbohydrates} g` : undefined,
            proteinContent: data.nutrition.protein ? `${data.nutrition.protein} g` : undefined,
            fatContent: data.nutrition.total_fat ? `${data.nutrition.total_fat} g` : undefined,
            saturatedFatContent: data.nutrition.saturated_fat ? `${data.nutrition.saturated_fat} g` : undefined,
            sugarContent: data.nutrition.sugar ? `${data.nutrition.sugar} g` : undefined,
            sodiumContent: data.nutrition.sodium ? `${data.nutrition.sodium} mg` : undefined,
            fiberContent: data.nutrition.fiber ? `${data.nutrition.fiber} g` : undefined
        };
    }

    // Transform supplies (ingredients) to both formats
    if (data?.supplies && Array.isArray(data.supplies)) {
        recipe.recipeIngredient = data.supplies.map((supply: any) => supply.original_text || supply.name);
        
        recipe.supply = data.supplies.map((supply: any) => ({
            '@type': 'HowToSupply' as const,
            name: supply.original_text || supply.name,
            requiredQuantity: supply.amount ? {
                '@type': 'QuantitativeValue' as const,
                value: parseFloat(supply.amount) || 1,
                unitText: supply.unit || ''
            } : undefined
        }));
    }

    // Transform instructions HTML to steps
    if (data?.instructions) {
        const listItemRegex = /<li[^>]*>(.*?)<\/li>/gi;
        const matches = Array.from(data.instructions.matchAll(listItemRegex));
        
        recipe.step = matches.map((match, index) => {
            const stepContent = ((match as RegExpMatchArray)[1] || '').trim();
            const step: HowToStep = {
                '@type': 'HowToStep',
                name: `Step ${index + 1}`,
                text: stepContent
            };

            // Add sample timer for baking steps
            const text = stepContent.replace(/<[^>]*>/g, '').toLowerCase();
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

function getImageCaption(image: any): string {
    if (image && typeof image === 'object') {
        return image.caption || image.description || '';
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

function getVideoDescription(video: any): string {
    if (video && typeof video === 'object') {
        return video.description || video.name || '';
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