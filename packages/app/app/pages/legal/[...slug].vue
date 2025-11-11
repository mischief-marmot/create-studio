<script lang="ts" setup>
const route = useRoute()
const slug = route.path

const { data: page } = await useAsyncData(route.path, () => {
  return queryCollection('legal').path(slug).first()
})

const formatDate = (dateString: string) => {
  // Parse the date string (YYYY-MM-DD) as local time, not UTC
  const parts = dateString.split('-').map(Number)
  const year = parts[0]
  const month = parts[1]
  const day = parts[2]
  const date = new Date(year, month - 1, day)
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
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
      <!-- Header -->
      <div class="bg-base-200 sm:py-16 py-12">
        <div class="sm:px-6 lg:px-8 max-w-3xl px-4 mx-auto">
          <h1 class="sm:text-5xl text-base-content mb-4 text-4xl font-bold">
            {{ page.title }}
          </h1>
          <p class="text-base-content/80 text-xl">Create by Mischief Marmot LLC</p>
          <p class="text-base-content text-lg">
            Last updated: {{ formatDate(page.lastUpdated) }}
          </p>
        </div>
      </div>

      <!-- Content -->
      <div class="sm:px-6 lg:px-8 sm:py-16 max-w-3xl px-4 py-12 mx-auto">
        <!-- Content Body -->
        <div class="prose-zinc max-w-none prose prose-lg">
          <ContentRenderer :value="page" />
        </div>

        <!-- Back to Home -->
        <div class="mt-16">
          <NuxtLink
            to="/"
            class="text-base-content border-base-300 hover:bg-base-200 inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium transition-colors border rounded-lg shadow-sm"
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
            Back to Home
          </NuxtLink>
        </div>
      </div>
    </div>
  </NuxtLayout>
</template>
