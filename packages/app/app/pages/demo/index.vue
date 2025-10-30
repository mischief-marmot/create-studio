<template>
  <div class="sm:py-32 bg-base-100 text-base-content min-h-screen py-24">
    <div class="max-w-7xl lg:px-8 px-6 mx-auto">
      <div class="lg:max-w-4xl max-w-2xl mx-auto">
        <!-- Header -->
        <h2 class="text-pretty sm:text-5xl text-4xl font-semibold tracking-tight">
          Interactive Recipe Demos
        </h2>
        <p class="text-lg/8 text-base-content/70 mt-2">
          Browse 45 real recipes from top food bloggers. Click any recipe to try our interactive mode.
        </p>

        <!-- Recipe List -->
        <div class="lg:mt-20 mt-16 space-y-20">
          <article v-for="recipe in demoRecipes" :key="recipe.id" class="isolate relative flex flex-col gap-8">
            <!-- Recipe Header Row (Image + Text) -->
            <div class="lg:flex-row flex flex-col gap-8">
              <NuxtLink :to="`/demo/${recipe.slug}`" class="lg:w-64 lg:h-64 shrink-0 relative w-full h-48 group">
                <img :src="recipe.imageUrl" :alt="recipe.title" class="rounded-2xl absolute inset-0 object-cover w-full h-full group-hover:opacity-90 transition-opacity" />
                <div class="rounded-2xl ring-1 ring-inset ring-base-content/10 absolute inset-0" />
              </NuxtLink>
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
                    <NuxtLink :to="`/demo/${recipe.slug}`"
                      class="text-base-content hover:underline">
                      {{ recipe.title }}
                    </NuxtLink>
                  </h3>
                  <p class="text-sm/6 text-base-content/80 mt-5">{{ recipe.description }}</p>
                </div>
                <div class="border-base-content/10 flex pt-6 mt-6 border-t">
                  <div class="gap-x-4 relative flex items-center">
                    <div class="text-sm/6">
                      <p class="text-base-content font-semibold">
                        Recipe from <a :href="recipe.canonicalUrl" target="_blank" rel="noopener"
                          class="text-base-content hover:underline font-semibold">{{ recipe.domain }}</a>
                      </p>
                    </div>
                  </div>
                </div>

                <!-- View Interactive Demo Link -->
                <div class="mt-4">
                  <NuxtLink :to="`/demo/${recipe.slug}`" class="btn btn-primary btn-sm">
                    Try Interactive Mode →
                  </NuxtLink>
                </div>
              </div>
            </div>
          </article>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { demoRecipes } from '~~/utils/demoRecipes'

// Page meta
definePageMeta({
  name: 'demo-index',
  layout: 'default'
})

// SEO meta tags
useHead({
  title: 'Interactive Recipe Demos - Create Studio',
  meta: [
    {
      name: 'description',
      content: 'Browse 45 interactive recipe demos from top food bloggers. Experience our innovative recipe card format with interactive mode, timers, and structured data.'
    },
    {
      property: 'og:title',
      content: 'Interactive Recipe Demos - Create Studio'
    },
    {
      property: 'og:description',
      content: 'Browse 45 interactive recipe demos from top food bloggers. Experience our innovative recipe card format with interactive mode, timers, and structured data.'
    }
  ]
})
</script>
