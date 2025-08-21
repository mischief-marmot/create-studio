<template>
    <div class="h-dvh w-full relative">
        <!-- Carousel Content -->
        <div class="carousel w-full h-full" ref="carouselRef">
            <!-- Intro Card -->
            <div id="slide0" class="carousel-item w-full">
                <div class="flex flex-col justify-center items-center w-full h-full bg-white p-4">
                    <div class="max-w-2xl w-full text-center space-y-4">
                        <!-- Recipe Image -->
                        <div v-if="creation.image" class="w-full max-w-md mx-auto">
                            <img :src="getImageUrl(creation.image)" :alt="creation.name"
                                class="w-full h-64 object-cover rounded-xl shadow-lg" />
                        </div>

                        <!-- Title -->
                        <h1 class="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900">{{ creation.name }}</h1>

                        <!-- Ingredients -->
                        <div class="text-left max-w-lg mx-auto">
                            <h3 class="text-xl font-semibold mb-3 text-center">Ingredients</h3>
                            <ul class="space-y-1">
                                <li v-for="ingredient in creation.recipeIngredient" :key="ingredient"
                                    class="flex items-start space-x-2">
                                    <span class="w-2 h-2 bg-gray-500 rounded-full mt-2 flex-shrink-0"></span>
                                    <span>{{ ingredient }}</span>
                                </li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Recipe Steps -->
            <div v-for="(step, index) in steps" :key="`step-${index}`" :id="`slide${index + 1}`"
                class="carousel-item w-full">
                <div class="flex flex-col justify-center items-center w-full h-full bg-gray-100 p-6">
                    <div class="max-w-2xl w-full text-center space-y-6">
                        <!-- Step Number and Title -->
                        <div class="text-center">
                            <h2 v-if="step.name" class="text-2xl font-bold">{{ step.name }}</h2>
                        </div>

                        <!-- Step Image/Video -->
                        <div v-if="step.image || step.video" class="w-full max-w-md mx-auto">
                            <!-- Video -->
                            <div v-if="step.video" class="space-y-2">
                                <video :src="getVideoUrl(step.video)" :poster="getVideoThumbnail(step.video)"
                                    class="w-full h-48 object-cover rounded-lg shadow-lg" controls preload="metadata">
                                    <source :src="getVideoUrl(step.video)" type="video/mp4">
                                    Your browser does not support the video tag.
                                </video>
                                <p v-if="getVideoDescription(step.video)" class="text-sm text-gray-600 mt-2 italic">
                                    {{ getVideoDescription(step.video) }}
                                </p>
                            </div>
                            <!-- Image -->
                            <div v-else-if="step.image">
                                <img :src="getImageUrl(step.image)" :alt="step.name || `Step ${index + 1}`"
                                    class="w-full h-48 object-cover rounded-lg shadow-lg" />
                                <p v-if="getImageCaption(step.image)" class="text-sm text-gray-600 mt-2 italic">
                                    {{ getImageCaption(step.image) }}
                                </p>
                            </div>
                        </div>

                        <!-- Step Instructions -->
                        <div class="prose max-w-none text-lg" v-html="step.text"></div>

                        <!-- Timer -->
                        <div v-if="step.timer" class="bg-warning/20 p-4 rounded-lg">
                            <div class="flex items-center justify-center space-x-2">
                                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                        d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                                </svg>
                                <span class="font-semibold">{{ step.timer.label }}</span>
                            </div>
                        </div>

                        <!-- Notes -->
                        <div v-if="step.notes && step.notes.length > 0" class="space-y-2">
                            <div v-for="note in step.notes" :key="note.text" :class="[
                                'p-3 rounded-lg text-sm',
                                note.type === 'tip' ? 'bg-info/20 text-info-content' : '',
                                note.type === 'warning' ? 'bg-warning/20 text-warning-content' : '',
                                note.type === 'info' ? 'bg-base-200' : ''
                            ]">
                                <div class="flex items-start space-x-2">
                                    <svg class="w-4 h-4 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor"
                                        viewBox="0 0 24 24">
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
                        </div>
                    </div>
                </div>
            </div>

            <!-- Completion Card -->
            <div :id="`slide${totalSlides - 1}`" class="carousel-item w-full">
                <div class="flex flex-col justify-center items-center w-full h-full bg-gradient-to-b from-success/10 to-base-100 p-6">
                    <div class="max-w-2xl w-full text-center space-y-6">
                        <!-- Success Icon -->
                        <div class="w-24 h-24 mx-auto bg-success/20 rounded-full flex items-center justify-center">
                            <svg class="w-12 h-12 text-success" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                    d="M5 13l4 4L19 7"></path>
                            </svg>
                        </div>

                        <h2 class="text-4xl font-bold text-success">Congratulations!</h2>
                        <p class="text-xl">You've completed making <span class="font-semibold">{{ creation.name }}</span>!</p>

                        <div class="space-y-3">
                            <p class="text-lg">Time to enjoy your delicious creation! 🎉</p>
                            <p class="text-sm text-gray-600">Don't forget to share a photo of your finished dish!</p>
                        </div>

                        <!-- Action Buttons -->
                        <div class="flex flex-col sm:flex-row gap-3 justify-center">
                            <button @click="goToSlide(0)" class="btn btn-primary">Start Over</button>
                            <a href="/" class="btn btn-outline">Browse More Recipes</a>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Fixed Navigation Controls -->
        <div class="absolute bottom-4 left-1/2 transform -translate-x-1/2 z-10 w-full px-2">
            <div class="flex justify-between">
                <!-- Previous Button -->
                <button 
                    @click="previousSlide" 
                    :disabled="currentSlide === 0"
                    v-show="currentSlide > 0"
                    class="btn btn-circle btn-outline">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"></path>
                    </svg>
                </button>
                
                <!-- Show an invisible element to push the next button to the end on the first slide -->
                <div v-show="currentSlide === 0" class="h-0 w-0"></div>

                <!-- Next Button -->
                <button 
                    @click="nextSlide" 
                    :disabled="currentSlide === totalSlides - 1"
                    v-show="currentSlide < totalSlides - 1"
                    class="btn btn-circle btn-primary">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path>
                    </svg>
                </button>
                
                <!-- Show an invisible element to push the previous button to the end on the last slide -->
                <div v-show="currentSlide === totalSlides - 1" class="h-0 w-0"></div>
            </div>
        </div>

        <!-- Progress Indicator -->
        <div class="absolute top-6 left-1/2 transform -translate-x-1/2 z-10">
            <div class="bg-base-100/90 backdrop-blur-sm rounded-full px-4 py-2 shadow-lg">
                <span class="text-sm font-medium">
                    {{ currentSlide + 1 }} / {{ totalSlides }}
                    <span v-if="currentSlide === 0" class="text-xs opacity-70">- Ingredients</span>
                    <span v-else-if="currentSlide === totalSlides - 1" class="text-xs opacity-70">- Complete!</span>
                    <span v-else class="text-xs opacity-70">- Step {{ currentSlide }}</span>
                </span>
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
    
    document.addEventListener('keydown', handleKeydown);
    
    if (carouselRef.value) {
        carouselRef.value.addEventListener('scroll', handleScroll, { passive: true });
    }
    
    onUnmounted(() => {
        document.removeEventListener('keydown', handleKeydown);
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
</script>