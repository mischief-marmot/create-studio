<script lang="ts" setup>
definePageMeta({
  layout: false,
})

const route = useRoute()
const slug = `/releases${route.path.replace('/releases', '')}`

const { data: page } = await useAsyncData(route.path, () => {
  return queryCollection('releases').path(slug).first()
})

// Get surrounding releases of same product for navigation
const { data: surroundings } = await useAsyncData(`release-surround-${slug}`, () => {
  return queryCollectionItemSurroundings('releases', slug)
    .where('_published', '=', true)
    .order('date', 'DESC')
})
const [prev, next] = surroundings?.value || []

const formatDate = (dateString: string) => {
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

const highlightIcon = (type: string) => {
  switch (type) {
    case 'feature': return '✦'
    case 'enhancement': return '↑'
    case 'fix': return '✓'
    case 'breaking': return '!'
    default: return '•'
  }
}

const highlightClass = (type: string) => {
  switch (type) {
    case 'feature': return 'text-success'
    case 'enhancement': return 'text-info'
    case 'fix': return 'text-warning'
    case 'breaking': return 'text-error'
    default: return 'text-base-content/60'
  }
}

// SEO meta
useHead({
  title: page.value?.title,
  meta: [
    { name: 'description', content: page.value?.description },
  ],
})

useSeoMeta({
  ogTitle: page.value?.title,
  ogDescription: page.value?.description,
  ogImage: page.value?.ogImage,
  twitterCard: 'summary_large_image',
})
</script>

<template>
  <NuxtLayout name="main">
    <div v-if="page" class="bg-base-100 min-h-screen">
      <div class="max-w-3xl px-6 py-16 mx-auto">
        <!-- Breadcrumbs -->
        <div class="breadcrumbs text-sm mb-8">
          <ul>
            <li><NuxtLink to="/releases">Releases</NuxtLink></li>
            <li>{{ page.title }}</li>
          </ul>
        </div>

        <!-- Header -->
        <div class="flex items-center gap-3 mt-8">
          <span class="badge" :class="page.product === 'create-plugin' ? 'badge-primary' : 'badge-secondary'">
            {{ page.product === 'create-plugin' ? 'Create Plugin' : 'Create Studio' }}
          </span>
          <span class="badge badge-outline font-mono">v{{ page.version }}</span>
        </div>

        <h2 class="text-xs/5 text-base-content/60 mt-4 font-mono font-semibold tracking-widest uppercase">
          {{ formatDate(page.date) }}
        </h2>
        <h1 class="text-pretty text-base-content sm:text-5xl mt-2 text-4xl font-medium tracking-tighter">
          {{ page.title }}
        </h1>
        <p class="text-lg/7 text-base-content/70 mt-4">{{ page.description }}</p>

        <!-- Content Body -->
        <div class="mt-12 max-w-none prose-a:no-underline prose-a:hover:underline prose-zinc prose prose-lg">
          <ContentRenderer :value="page" />
        </div>

        <!-- Highlights -->
        <div v-if="page.highlights?.length" class="mt-16">
          <h2 class="text-xl font-semibold text-base-content mb-6">Release Highlights</h2>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div
              v-for="highlight in page.highlights"
              :key="highlight.title"
              class="bg-base-200 rounded-xl px-5 py-4 ring-1 ring-base-content/5"
            >
              <div class="flex items-center gap-2 mb-1">
                <span class="text-sm font-bold" :class="highlightClass(highlight.type)">
                  {{ highlightIcon(highlight.type) }}
                </span>
                <span class="text-sm font-semibold text-base-content">{{ highlight.title }}</span>
              </div>
              <p class="text-sm text-base-content/60">{{ highlight.description }}</p>
            </div>
          </div>
        </div>

        <!-- Subscribe CTA -->
        <div class="mt-16 mb-10">
          <ReleaseSubscribe />
        </div>

        <!-- Post Navigation -->
        <div v-if="prev || next" class="flex justify-between gap-4 mt-10">
          <NuxtLink
            v-if="prev"
            :to="`/releases/${prev.stem?.split('/').pop()}`"
            class="border-base-300 ring-1 ring-base-content/10 text-base-content hover:bg-base-200 flex items-center flex-1 gap-2 px-4 py-3 text-sm font-medium transition-colors border rounded-lg shadow-sm"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" class="size-4 flex-shrink-0">
              <path fill-rule="evenodd" d="M9.78 4.22a.75.75 0 0 1 0 1.06L7.06 8l2.72 2.72a.75.75 0 1 1-1.06 1.06L5.47 8.53a.75.75 0 0 1 0-1.06l3.25-3.25a.75.75 0 0 1 1.06 0Z" clip-rule="evenodd" />
            </svg>
            <div class="text-left">
              <div class="text-base-content/60 text-xs">Previous</div>
              <div class="truncate">{{ prev.title }}</div>
            </div>
          </NuxtLink>

          <NuxtLink
            v-if="next"
            :to="`/releases/${next.stem?.split('/').pop()}`"
            class="border-base-300 ring-1 ring-base-content/10 text-base-content hover:bg-base-200 flex items-center justify-end flex-1 gap-2 px-4 py-3 text-sm font-medium transition-colors border rounded-lg shadow-sm"
          >
            <div class="text-right">
              <div class="text-base-content/60 text-xs">Next</div>
              <div class="truncate">{{ next.title }}</div>
            </div>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" class="size-4 flex-shrink-0">
              <path fill-rule="evenodd" d="M6.22 4.22a.75.75 0 0 1 1.06 0l3.25 3.25a.75.75 0 0 1 0 1.06l-3.25 3.25a.75.75 0 0 1-1.06-1.06L8.94 8 6.22 5.28a.75.75 0 0 1 0-1.06Z" clip-rule="evenodd" />
            </svg>
          </NuxtLink>
        </div>

        <!-- Back to Releases (fallback) -->
        <div v-if="!prev && !next" class="mt-10">
          <NuxtLink
            to="/releases"
            class="border-base-300 ring-1 ring-base-content/10 whitespace-nowrap text-base-content hover:bg-base-200 inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium transition-colors border rounded-lg shadow-sm"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" class="size-4">
              <path fill-rule="evenodd" d="M9.78 4.22a.75.75 0 0 1 0 1.06L7.06 8l2.72 2.72a.75.75 0 1 1-1.06 1.06L5.47 8.53a.75.75 0 0 1 0-1.06l3.25-3.25a.75.75 0 0 1 1.06 0Z" clip-rule="evenodd" />
            </svg>
            Back to Releases
          </NuxtLink>
        </div>
      </div>
    </div>
  </NuxtLayout>
</template>
