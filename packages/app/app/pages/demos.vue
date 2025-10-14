<template>
  <div class="sm:py-32 bg-base-100 text-base-content min-h-screen py-24">
    <div class="max-w-7xl lg:px-8 px-6 mx-auto">
      <div class="lg:max-w-4xl max-w-2xl mx-auto">
        <!-- Header -->
        <h2 class="text-pretty sm:text-5xl text-4xl font-semibold tracking-tight">
          Interactive Recipes
        </h2>
        <p class="text-lg/8 text-base-content/70 mt-2">
          Experience our interactive recipe cards in action.
        </p>

        <!-- Recipe List -->
        <div class="lg:mt-20 mt-16 space-y-20">
          <article v-for="recipe in demoRecipes" :key="recipe.id" class="isolate relative flex flex-col gap-8">
            <!-- Recipe Header Row (Image + Text) -->
            <div class="lg:flex-row flex flex-col gap-8">
              <div class="lg:w-64 lg:h-64 shrink-0 relative w-full h-48">
                <img :src="recipe.imageUrl" :alt="recipe.title" class="rounded-2xl absolute inset-0 object-cover w-full h-full" />
                <div class="rounded-2xl ring-1 ring-inset ring-base-content/10 absolute inset-0" />
              </div>
              <div class="flex-1">
                <div class="gap-x-4 flex items-center text-xs">
                  <!-- Meta Info (Category, Prep Time, Total Time) -->
                  <div class="gap-x-4 gap-y-2 flex flex-wrap items-center text-xs">
                    <span class="relative z-10 rounded-full bg-base-200 px-3 py-1.5 font-medium text-base-content hover:bg-base-300">
                      {{ recipe.category }}
                    </span>
                    <span v-if="recipe.prepTime" class="text-base-content/60">
                      Prep: {{ recipe.prepTime }}
                    </span>
                    <span v-if="recipe.totalTime" class="text-base-content/60">
                      Total: {{ recipe.totalTime }}
                    </span>
                  </div>
                </div>
                <div class="group relative max-w-xl">
                  <h3 class="text-lg/6 mt-3 font-semibold">
                    <a :href="recipe.canonicalUrl" target="_blank" rel="noopener"
                      class="text-base-content hover:underline">
                      {{ recipe.title }}
                    </a>
                  </h3>
                  <p class="text-sm/6 text-base-content/80 mt-5">{{ recipe.description }}</p>
                </div>
                <div class="border-base-content/10 flex pt-6 mt-6 border-t">
                  <div class="gap-x-4 relative flex items-center">
                    <div class="text-sm/6">
                      <p class="text-base-content font-semibold">
                        From <a :href="recipe.canonicalUrl" target="_blank" rel="noopener"
                          class="text-base-content hover:underline font-semibold">{{ recipe.domain }}</a>
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Interactive Experience - Loads Below Recipe Info -->
              <h2 class="text-2xl">Interactive Experience</h2>

            <div :ref="(el) => setWidgetRef(el, recipe.id)" :data-recipe-id="recipe.id"
              :data-creation-key="recipe.creationKey" :data-domain="recipe.domain"
              class="w-full min-h-[600px] rounded-2xl bg-base-200/50 flex items-center justify-center transition-all duration-300"
              :class="{ 'bg-base-200': !loadedWidgets.has(recipe.id) }">
              <!-- Widget Container -->
              <div :id="`interactive-widget-${recipe.id}`" class="w-full h-full min-h-[600px]"
                :class="{ 'hidden': !loadedWidgets.has(recipe.id) }" />
            </div>
          </article>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { demoRecipes } from '~~/utils/demoRecipes'


// Load widget SDK
useScript({
  src: '/embed/main.js',
  type: 'module',
  id: 'create-studio-embed'
})

// Track which widgets have been loaded
const loadedWidgets = ref<Set<number>>(new Set())
const widgetRefs = ref<Map<number, HTMLElement>>(new Map())
let observer: IntersectionObserver | null = null

// Store widget ref
const setWidgetRef = (el: any, recipeId: number) => {
  if (el) {
    widgetRefs.value.set(recipeId, el as HTMLElement)
  }
}

// Load a specific widget
const loadWidget = async (recipeId: number) => {
  if (loadedWidgets.value.has(recipeId)) return

  const recipe = demoRecipes.find(r => r.id === recipeId)
  if (!recipe) return

  // Wait for CreateStudio SDK to be available
  const waitForSDK = () => {
    return new Promise<void>((resolve) => {
      if ((window as any).CreateStudio) {
        resolve()
      } else {
        const checkInterval = setInterval(() => {
          if ((window as any).CreateStudio) {
            clearInterval(checkInterval)
            resolve()
          }
        }, 100)
      }
    })
  }

  try {
    await waitForSDK()

    // Initialize the SDK (only once)
    if (!(window as any).__createStudioInitialized) {
      await (window as any).CreateStudio.init({
        siteUrl: recipe.domain,
        baseUrl: window.location.origin,
        debug: false
      })
      ;(window as any).__createStudioInitialized = true
    }

    // Mount the interactive experience widget
    const targetElement = document.getElementById(`interactive-widget-${recipeId}`)
    if (targetElement) {
      await (window as any).CreateStudio.mount('interactive-experience', targetElement, {
        creationId: recipe.creationId,
        domain: recipe.domain,
        baseUrl: window.location.origin,
        hideAttribution: false
      })

      loadedWidgets.value.add(recipeId)
      console.log(`✅ Loaded widget for recipe ${recipeId}: ${recipe.title}`)
    }
  } catch (error) {
    console.error(`Failed to load widget for recipe ${recipeId}:`, error)
  }
}

// Setup intersection observer on mount
onMounted(() => {
  // Create intersection observer
  observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const recipeId = parseInt(entry.target.getAttribute('data-recipe-id') || '0')
          if (recipeId) {
            loadWidget(recipeId)
          }
        }
      })
    },
    {
      root: null, // viewport
      rootMargin: '200px', // Start loading 200px before visible
      threshold: 0.1 // Trigger when 10% visible
    }
  )

  // Observe all widget containers
  widgetRefs.value.forEach((element) => {
    if (observer) {
      observer.observe(element)
    }
  })
})

// Cleanup on unmount
onUnmounted(() => {
  if (observer) {
    observer.disconnect()
  }
})

// Page meta
definePageMeta({
  name: 'demos',
  layout: 'default'
})

// SEO meta tags
useHead({
  title: 'Interactive Recipe Demos - Create Studio',
  meta: [
    {
      name: 'description',
      content: 'Experience interactive recipe cards in action. Browse 45 real recipes from top food bloggers with our innovative interactive mode.'
    },
    {
      property: 'og:title',
      content: 'Interactive Recipe Demos - Create Studio'
    },
    {
      property: 'og:description',
      content: 'Experience interactive recipe cards in action. Browse 45 real recipes from top food bloggers with our innovative interactive mode.'
    }
  ]
})
</script>

