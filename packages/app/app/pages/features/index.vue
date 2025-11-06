<template>
  <NuxtLayout name="main">
    <div class="sm:py-32 bg-base-100 py-24">
      <div class="max-w-7xl lg:px-8 px-6 mx-auto">
        <div class="max-w-3xl mx-auto text-center">
          <h2 class="text-balance sm:text-5xl text-base-content text-4xl font-semibold tracking-tight">Features</h2>
          <p class="text-lg/8 text-base-content/70 mt-2">Explore the powerful features that make Create Studio the best choice for creating structured content.</p>
        </div>
        <div class="auto-rows-fr sm:mt-20 lg:mx-0 lg:max-w-none lg:grid-cols-3 grid max-w-2xl grid-cols-1 gap-8 mx-auto mt-16">
          <article
            v-for="feature in features"
            :key="feature.stem"
            class="isolate rounded-2xl pt-80 sm:pt-48 lg:pt-80 bg-base-300 relative flex flex-col justify-end px-8 pb-8 overflow-hidden"
          >
            <img
              v-if="feature.image"
              :src="feature.image"
              alt=""
              class="-z-10 size-full absolute inset-0 object-cover"
            />
            <div class="-z-10 bg-gradient-to-t from-base-300 via-base-300/40 absolute inset-0" />
            <div class="-z-10 rounded-2xl ring-1 ring-inset ring-base-content/10 absolute inset-0" />

            <div class="gap-y-1 text-sm/6 text-base-content/70 flex flex-wrap items-center overflow-hidden">
              <div v-if="feature.icon" class="text-4xl mr-3">{{ feature.icon }}</div>
              <div v-if="feature.category" class="flex items-center gap-x-4">
                <span class="bg-base-content/10 text-xs text-base-content px-2 py-1 rounded-full">
                  {{ feature.category }}
                </span>
              </div>
            </div>
            <h3 class="text-lg/6 text-base-content mt-3 font-semibold">
              <NuxtLink :to="`/features/${feature.stem.split('/').pop()}`">
                <span class="absolute inset-0" />
                {{ feature.title }}
              </NuxtLink>
            </h3>
            <p class="text-sm text-base-content/70 mt-2 line-clamp-2">
              {{ feature.description }}
            </p>
          </article>
        </div>
      </div>
    </div>
  </NuxtLayout>
</template>

<script setup lang="ts">
definePageMeta({
  layout: false,
})

// Fetch features using queryCollection
const { data: features } = await useAsyncData('features-list', () => {
  return queryCollection('features').where('_published', '=', true).all()
})
</script>
