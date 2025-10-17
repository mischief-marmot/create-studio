<template>
  <div class="sm:py-32 bg-base-100 text-base-content min-h-screen py-24">
    <div v-if="recipe" class="max-w-7xl mx-auto">
      <div class="max-w-4xl lg:px-8 mx-auto">
        <!-- Back Link -->
        <NuxtLink to="/demos" class="text-base-content/70 hover:text-base-content inline-flex items-center gap-2 mb-8 text-sm">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
          </svg>
          Back to all demos
        </NuxtLink>

        <!-- Recipe Header -->
        <div class="hidden mb-12">
          <div class="gap-x-4 gap-y-2 flex flex-wrap items-center mb-4 text-xs">
            <span class="rounded-full bg-base-200 px-3 py-1.5 font-medium text-base-content">
              {{ recipe.category }}
            </span>
            <span v-if="recipe.prepTime" class="text-base-content/60">
              Prep: {{ recipe.prepTime }}
            </span>
            <span v-if="recipe.totalTime" class="text-base-content/60">
              Total: {{ recipe.totalTime }}
            </span>
          </div>

          <h1 class="sm:text-5xl mb-4 text-4xl font-bold tracking-tight">
            {{ recipe.title }}
          </h1>

          <p v-if="recipe.description" class="text-base-content/80 mb-6 text-lg">
            {{ recipe.description }}
          </p>

          <!-- Attribution -->
          <div class="border-base-content/10 flex items-center gap-4 pt-6 border-t">
            <p class="text-base-content/70 text-sm">
              Recipe from
              <a :href="recipe.canonicalUrl" target="_blank" rel="noopener" class="text-base-content hover:underline font-semibold">
                {{ recipe.domain }}
              </a>
            </p>
          </div>
        </div>

        <!-- Featured Image -->
        <div v-if="recipe.imageUrl" class="hidden mb-12">
          <div class="h-96 rounded-2xl relative w-full overflow-hidden">
            <img :src="recipe.imageUrl" :alt="recipe.title" class="absolute inset-0 object-cover w-full h-full" />
            <div class="ring-1 ring-inset ring-base-content/10 absolute inset-0" />
          </div>
        </div>

        <!-- Interactive Widget - Loads Immediately -->
        <div
          :id="`interactive-widget-${recipe.id}`"
          class="w-full rounded-2xl bg-base-200/50"
        />
      </div>
    </div>

    <!-- Recipe Not Found -->
    <div v-else class="max-w-7xl lg:px-8 px-6 mx-auto">
      <div class="max-w-2xl mx-auto text-center">
        <h1 class="sm:text-5xl mb-4 text-4xl font-bold tracking-tight">
          Recipe Not Found
        </h1>
        <p class="text-base-content/70 mb-8 text-lg">
          The recipe you're looking for doesn't exist.
        </p>
        <NuxtLink to="/demos" class="btn btn-primary">
          View All Demos
        </NuxtLink>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { demoRecipes, getDemoRecipeBySlug } from '~~/utils/demoRecipes'

const route = useRoute()
const slug = route.params.slug as string

// Find the recipe
const recipe = getDemoRecipeBySlug(slug)

// Load widget CSS
useHead({
  link: [
    {
      rel: 'stylesheet',
      href: '/embed/entry.css'
    }
  ]
})

// Load widget SDK
useScript({
  src: '/embed/main.js',
  type: 'module',
  id: 'create-studio-embed'
})

// Load widget immediately on mount
onMounted(async () => {
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

    // Initialize the SDK
    await (window as any).CreateStudio.init({
      siteUrl: recipe.domain,
      baseUrl: window.location.origin,
      debug: false
    })

    // Mount the interactive experience widget immediately
    const targetElement = document.getElementById(`interactive-widget-${recipe.id}`)
    if (targetElement) {
      await (window as any).CreateStudio.mount('interactive-experience', targetElement, {
        creationId: recipe.creationId,
        domain: recipe.domain,
        baseUrl: window.location.origin,
        hideAttribution: false
      })

      console.log(`✅ Loaded widget for recipe: ${recipe.title}`)
    }
  } catch (error) {
    console.error(`Failed to load widget:`, error)
  }
})

// Page meta
definePageMeta({
  layout: 'default'
})

// SEO meta tags
useHead({
  title: recipe ? `${recipe.title} - Create Studio Demo` : 'Recipe Not Found - Create Studio',
  meta: recipe ? [
    {
      name: 'description',
      content: recipe.description || `Interactive demo of ${recipe.title} recipe card`
    },
    {
      property: 'og:title',
      content: `${recipe.title} - Create Studio Demo`
    },
    {
      property: 'og:description',
      content: recipe.description || `Interactive demo of ${recipe.title} recipe card`
    },
    {
      property: 'og:image',
      content: recipe.imageUrl
    }
  ] : []
})
</script>
