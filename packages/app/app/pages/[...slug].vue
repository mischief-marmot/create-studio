<script lang="ts" setup>
const route = useRoute()

// Determine collection based on route path
const isFeature = route.path.startsWith('/features/')
const collection = isFeature ? 'features' : 'news'
const slug = isFeature ? route.path : `/news${route.path}`

const { data: page } = await useAsyncData(route.path, () => {
  return queryCollection(collection).path(slug).first()
})

// Get surrounding posts for navigation (only for news)
const { data: surroundings } = await useAsyncData('surround', () => {
  if (!isFeature) {
    return queryCollectionItemSurroundings('news', slug)
      .where('_published', '=', true)
      .order('date', 'DESC')
  }
  return null
})
const [prev, next] = surroundings?.value || []

const formatDate = (dateString: string) => {
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

// Set page meta for SEO
useHead({
  title: page.value?.title,
  meta: [
    { name: 'description', content: page.value?.description }
  ]
})
</script>

<template>
  <NuxtLayout name="main">
    <div v-if="page" class="bg-base-100 min-h-screen">
      <div class="lg:max-w-7xl lg:px-8 max-w-2xl px-6 py-16 mx-auto">
        <!-- Breadcrumbs -->
        <div class="breadcrumbs text-sm mb-8">
          <ul>
            <li><NuxtLink :to="isFeature ? '/features' : '/news'">{{ isFeature ? 'Features' : 'News' }}</NuxtLink></li>
            <li>{{ page.title }}</li>
          </ul>
        </div>

        <!-- Header -->
        <h2 v-if="!isFeature && page.date" class="text-xs/5 text-base-content/60 mt-8 font-mono font-semibold tracking-widest uppercase">
          {{ formatDate(page.date) }}
        </h2>
        <h2 v-if="isFeature && page.lastUpdated" class="text-xs/5 text-base-content/60 mt-8 font-mono font-semibold tracking-widest uppercase">
          Last Updated: {{ formatDate(page.lastUpdated) }}
        </h2>
        <h1 class="text-pretty text-base-content sm:text-6xl mt-2 text-4xl font-medium tracking-tighter">
          {{ page.title }}
        </h1>

        <!-- Content Grid -->
        <div class="mt-16 grid grid-cols-1 gap-8 pb-24 lg:grid-cols-[15rem_1fr] xl:grid-cols-[15rem_1fr_15rem]">
          <!-- Sidebar -->
          <div class="max-lg:justify-between lg:flex-col lg:items-start flex flex-wrap items-center gap-8">
            <!-- Author (News only) -->
            <div v-if="!isFeature && page.author" class="flex items-center gap-3">
              <img
                :alt="page.author.name"
                class="aspect-square size-10 bg-base-200 object-cover rounded-full"
                :src="page.author.imageUrl"
              />
              <div class="text-sm/5 text-base-content">{{ page.author.name }}</div>
            </div>

            <!-- Icon (Features only) -->
            <div v-if="isFeature && page.icon" class="text-6xl">
              {{ page.icon }}
            </div>

            <!-- Category -->
            <div v-if="page.category" class="flex flex-wrap gap-2">
              <span class="bg-base-200 text-sm/6 text-base-content border-base-300 px-3 py-1 font-medium border border-dotted rounded-full">
                {{ page.category }}
              </span>
            </div>
          </div>

          <!-- Main Content -->
          <div class="text-base-content/80">
            <div class="xl:mx-auto max-w-2xl">
              <!-- Featured Image (if exists) -->
              <img
                v-if="page.image"
                :alt="page.title"
                class="aspect-[3/2] rounded-2xl object-cover w-full mb-10 shadow-xl"
                :src="page.image"
              />

              <!-- Content Body -->
              <div
                class="max-w-none lg:prose-xl prose-a:no-underline prose-a:hover:underline prose-zinc prose prose-lg"
              >
                <ContentRenderer :value="page" />
              </div>

              <!-- Post Navigation -->
              <div v-if="prev || next" class="flex justify-between gap-4 mt-10">
                <!-- Previous Post -->
                <NuxtLink
                  v-if="prev"
                  :to="`/${prev.stem.split('/').pop()}`"
                  class="border-base-300 ring-1 ring-base-content/10 text-base-content hover:bg-base-200 flex items-center flex-1 gap-2 px-4 py-3 text-sm font-medium transition-colors border rounded-lg shadow-sm"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 16 16"
                    fill="currentColor"
                    class="size-4 flex-shrink-0"
                  >
                    <path
                      fill-rule="evenodd"
                      d="M9.78 4.22a.75.75 0 0 1 0 1.06L7.06 8l2.72 2.72a.75.75 0 1 1-1.06 1.06L5.47 8.53a.75.75 0 0 1 0-1.06l3.25-3.25a.75.75 0 0 1 1.06 0Z"
                      clip-rule="evenodd"
                    />
                  </svg>
                  <div class="text-left">
                    <div class="text-base-content/60 text-xs">Previous</div>
                    <div class="truncate">{{ prev.title }}</div>
                  </div>
                </NuxtLink>

                <!-- Next Post -->
                <NuxtLink
                  v-if="next"
                  :to="`/${next.stem.split('/').pop()}`"
                  class="border-base-300 ring-1 ring-base-content/10 text-base-content hover:bg-base-200 flex items-center justify-end flex-1 gap-2 px-4 py-3 text-sm font-medium transition-colors border rounded-lg shadow-sm"
                >
                  <div class="text-right">
                    <div class="text-base-content/60 text-xs">Next</div>
                    <div class="truncate">{{ next.title }}</div>
                  </div>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 16 16"
                    fill="currentColor"
                    class="size-4 flex-shrink-0"
                  >
                    <path
                      fill-rule="evenodd"
                      d="M6.22 4.22a.75.75 0 0 1 1.06 0l3.25 3.25a.75.75 0 0 1 0 1.06l-3.25 3.25a.75.75 0 0 1-1.06-1.06L8.94 8 6.22 5.28a.75.75 0 0 1 0-1.06Z"
                      clip-rule="evenodd"
                    />
                  </svg>
                </NuxtLink>
              </div>

              <!-- Back to list (fallback if no surrounding posts or for features) -->
              <div v-if="isFeature || (!prev && !next)" class="mt-10">
                <NuxtLink
                  :to="isFeature ? '/features' : '/news'"
                  class="border-base-300 ring-1 ring-base-content/10 whitespace-nowrap text-base-content hover:bg-base-200 inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium transition-colors border rounded-lg shadow-sm"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 16 16"
                    fill="currentColor"
                    class="size-4"
                  >
                    <path
                      fill-rule="evenodd"
                      d="M9.78 4.22a.75.75 0 0 1 0 1.06L7.06 8l2.72 2.72a.75.75 0 1 1-1.06 1.06L5.47 8.53a.75.75 0 0 1 0-1.06l3.25-3.25a.75.75 0 0 1 1.06 0Z"
                      clip-rule="evenodd"
                    />
                  </svg>
                  {{ isFeature ? 'Back to Features' : 'Back to News' }}
                </NuxtLink>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </NuxtLayout>
</template>
