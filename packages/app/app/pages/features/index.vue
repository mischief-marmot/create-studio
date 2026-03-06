<template>
  <NuxtLayout name="main">
    <div class="sm:py-32 bg-base-100 py-24">
      <div class="max-w-7xl lg:px-8 px-6 mx-auto">
        <div class="max-w-3xl mx-auto text-center">
          <h2 class="text-balance sm:text-5xl text-base-content text-4xl font-semibold tracking-tight">Features</h2>
          <p class="text-lg/8 text-base-content/70 mt-2">Everything you can do with Create Plugin.</p>
        </div>

        <!-- Features grid -->
        <div class="auto-rows-fr sm:mt-16 lg:mx-0 lg:max-w-none lg:grid-cols-3 grid max-w-2xl grid-cols-1 gap-6 mx-auto mt-12">
          <article
            v-for="feature in features"
            :key="feature.stem"
            class="rounded-lg ring-1 ring-white/10 relative flex flex-col overflow-hidden"
            style="background: linear-gradient(135deg, #1a1a1f 0%, #1f1a28 50%, #1a1a1f 100%)"
          >
            <div class="flex flex-col flex-1 px-6 py-5">
              <h3 class="text-lg/6 font-semibold" style="color: #ffffff">
                <NuxtLink :to="`/features/${feature.stem?.split('/').pop()}`">
                  <span class="absolute inset-0" />
                  {{ feature.title }}
                </NuxtLink>
              </h3>

              <p class="text-sm/6 line-clamp-3 mt-2" style="color: rgba(255,255,255,0.6)">{{ feature.description }}</p>
            </div>

            <!-- Accent line bottom -->
            <div class="h-1.5 w-full" style="background: linear-gradient(90deg, #b060ff, #ee87cb 30%, #fff1be 72%)" />
          </article>
        </div>

        <!-- Empty state -->
        <div v-if="features?.length === 0" class="mt-16 text-center">
          <p class="text-base-content/60">No features found.</p>
        </div>
      </div>
    </div>
  </NuxtLayout>
</template>

<script setup lang="ts">
definePageMeta({
  layout: false,
})

const { data: features } = await useAsyncData('features', () => {
  return queryCollection('features')
    .order('title', 'ASC')
    .all()
})
</script>
