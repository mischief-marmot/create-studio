<template>
  <NuxtLayout name="main">
    <div class="sm:py-32 bg-base-100 py-24">
      <div class="max-w-7xl lg:px-8 px-6 mx-auto">
        <div class="max-w-3xl mx-auto text-center">
          <h2 class="text-balance sm:text-5xl text-base-content text-4xl font-semibold tracking-tight">Release Notes</h2>
          <p class="text-lg/8 text-base-content/70 mt-2">What's new in Create Plugin and Create Studio.</p>
        </div>

        <!-- Product filter -->
        <div class="flex justify-center gap-2 mt-10">
          <button
            v-for="filter in filters"
            :key="filter.value"
            class="btn btn-sm"
            :class="activeFilter === filter.value ? 'btn-primary' : 'btn-ghost'"
            @click="activeFilter = filter.value"
          >
            {{ filter.label }}
          </button>
        </div>

        <!-- Releases grid -->
        <div class="auto-rows-fr sm:mt-16 lg:mx-0 lg:max-w-none lg:grid-cols-3 grid max-w-2xl grid-cols-1 gap-8 mx-auto mt-12">
          <article
            v-for="release in filteredReleases"
            :key="release.stem"
            class="rounded-2xl bg-base-200 ring-1 ring-base-content/10 relative flex flex-col px-8 py-8 overflow-hidden"
          >
            <!-- Product + Version badges -->
            <div class="flex items-center gap-2 mb-4">
              <span class="badge badge-sm" :class="release.product === 'create-plugin' ? 'badge-primary' : 'badge-secondary'">
                {{ release.product === 'create-plugin' ? 'Plugin' : 'Studio' }}
              </span>
              <span class="badge badge-sm badge-outline font-mono">v{{ release.version }}</span>
            </div>

            <h3 class="text-lg/6 text-base-content font-semibold">
              <NuxtLink :to="`/releases/${release.stem?.split('/').pop()}`">
                <span class="absolute inset-0" />
                {{ release.title }}
              </NuxtLink>
            </h3>

            <p class="text-sm/6 text-base-content/60 line-clamp-3 mt-2">{{ release.description }}</p>

            <div class="text-sm/6 text-base-content/50 pt-4 mt-auto">
              <time :datetime="release.date">{{ formatDate(release.date) }}</time>
            </div>
          </article>
        </div>

        <!-- Empty state -->
        <div v-if="filteredReleases?.length === 0" class="mt-16 text-center">
          <p class="text-base-content/60">No releases found for this filter.</p>
        </div>
      </div>
    </div>
  </NuxtLayout>
</template>

<script setup lang="ts">
definePageMeta({
  layout: false,
})

const filters = [
  { label: 'All', value: 'all' },
  { label: 'Create Plugin', value: 'create-plugin' },
  { label: 'Create Studio', value: 'create-studio' },
]

const activeFilter = ref('all')

const { data: releases } = await useAsyncData('releases', () => {
  return queryCollection('releases')
    .where('_published', '=', true)
    .order('date', 'DESC')
    .all()
})

const filteredReleases = computed(() => {
  if (!releases.value) return []
  if (activeFilter.value === 'all') return releases.value
  return releases.value.filter(r => r.product === activeFilter.value)
})

const formatDate = (dateString: string) => {
  const date = new Date(dateString + 'T12:00:00')
  return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
}

const highlightClass = (type: string) => {
  switch (type) {
    case 'feature': return 'bg-success/20 text-success'
    case 'enhancement': return 'bg-info/20 text-info'
    case 'fix': return 'bg-warning/20 text-warning'
    case 'breaking': return 'bg-error/20 text-error'
    default: return 'bg-base-300 text-base-content/60'
  }
}
</script>
