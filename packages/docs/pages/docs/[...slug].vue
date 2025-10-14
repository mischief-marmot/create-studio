<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import clsx from 'clsx'

const route = useRoute()

// Query content - try to find the page
const { data: page } = await useAsyncData(`content-${route.path}`, async () => {
  try {
    // Build the full path including /docs prefix
    const slug = route.params.slug?.join('/') || ''
    const fullPath = `/docs/${slug}`
    const content = await queryCollection('content').path(fullPath).first()
    return content
  } catch (e) {
    console.error('Content query error:', e)
    return null
  }
})

const isScrolled = ref(false)

onMounted(() => {
  const handleScroll = () => {
    isScrolled.value = window.scrollY > 0
  }
  handleScroll()
  window.addEventListener('scroll', handleScroll, { passive: true })
})

// Set page meta
useHead({
  title: page.value.title,
  meta: [
    { name: 'description', content: page.value.description }
  ]
})
</script>

<template>
  <div class="flex flex-col w-full">
    <!-- Header -->
    <header
      :class="clsx(
        'sticky top-0 z-50 flex flex-none flex-wrap items-center justify-between bg-white px-4 py-5 shadow-md shadow-slate-900/5 transition duration-500 sm:px-6 lg:px-8 dark:shadow-none',
        isScrolled
          ? 'dark:bg-slate-900/95 dark:backdrop-blur-sm dark:[@supports(backdrop-filter:blur(0))]:bg-slate-900/75'
          : 'dark:bg-transparent'
      )"
    >
      <div class="lg:hidden flex mr-6">
        <MobileNavigation />
      </div>
      <div class="grow basis-0 relative flex items-center">
        <NuxtLink to="/" aria-label="Home page">
          <Logomark class-name="h-9 w-9 lg:hidden stroke-sky-500" />
          <Logo class-name="hidden h-9 w-auto fill-slate-700 lg:block dark:fill-sky-100" />
        </NuxtLink>
      </div>
      <div class="sm:mr-8 md:mr-0 mr-6 -my-5">
        <!-- Search placeholder -->
        <div class="w-6 h-6" />
      </div>
      <div class="basis-0 sm:gap-8 md:grow relative flex justify-end gap-6">
        <ThemeSelector class="relative z-10" />
        <a href="https://github.com/your-repo" class="group" aria-label="GitHub">
          <svg aria-hidden="true" viewBox="0 0 16 16" class="fill-slate-400 group-hover:fill-slate-500 dark:group-hover:fill-slate-300 w-6 h-6">
            <path d="M8 0C3.58 0 0 3.58 0 8C0 11.54 2.29 14.53 5.47 15.59C5.87 15.66 6.02 15.42 6.02 15.21C6.02 15.02 6.01 14.39 6.01 13.72C4 14.09 3.48 13.23 3.32 12.78C3.23 12.55 2.84 11.84 2.5 11.65C2.22 11.5 1.82 11.13 2.49 11.12C3.12 11.11 3.57 11.7 3.72 11.94C4.44 13.15 5.59 12.81 6.05 12.6C6.12 12.08 6.33 11.73 6.56 11.53C4.78 11.33 2.92 10.64 2.92 7.58C2.92 6.71 3.23 5.99 3.74 5.43C3.66 5.23 3.38 4.41 3.82 3.31C3.82 3.31 4.49 3.1 6.02 4.13C6.66 3.95 7.34 3.86 8.02 3.86C8.7 3.86 9.38 3.95 10.02 4.13C11.55 3.09 12.22 3.31 12.22 3.31C12.66 4.41 12.38 5.23 12.3 5.43C12.81 5.99 13.12 6.7 13.12 7.58C13.12 10.65 11.25 11.33 9.47 11.53C9.76 11.78 10.01 12.26 10.01 13.01C10 14.08 10 14.94 10 15.21C10 15.42 10.15 15.67 10.55 15.59C13.71 14.53 16 11.53 16 8C16 3.58 12.42 0 8 0Z" />
          </svg>
        </a>
      </div>
    </header>

    <!-- Main Content with Sidebar -->
    <div class="max-w-8xl sm:px-2 lg:px-8 xl:px-12 relative flex justify-center flex-auto w-full mx-auto">
      <div class="lg:relative lg:block lg:flex-none hidden">
        <div class="absolute inset-y-0 right-0 w-[50vw] bg-slate-50 dark:hidden" />
        <div class="top-16 bg-gradient-to-t from-slate-800 dark:block absolute bottom-0 right-0 hidden w-px h-12" />
        <div class="top-28 bg-slate-800 dark:block absolute bottom-0 right-0 hidden w-px" />
        <div class="sticky top-24 -ml-0.5 h-[calc(100vh-6rem)] w-64 overflow-y-auto py-16 pr-8 pl-0.5 xl:w-72 xl:pr-16">
          <Navigation />
        </div>
      </div>

      <!-- Main content area -->
      <div class="lg:max-w-none lg:pr-0 lg:pl-8 xl:px-16 flex-auto max-w-2xl min-w-0 px-4 py-16">
        <article>
          <header class="mb-9 space-y-1">
            <p v-if="page.description" class="font-display text-sky-500 text-sm font-medium">
              {{ page.description }}
            </p>
            <h1 class="font-display text-slate-900 dark:text-white text-3xl tracking-tight">
              {{ page.title }}
            </h1>
          </header>
          <div class="max-w-none placeholder-stone-800 prose">
            <ContentRenderer :value="page" />
          </div>
        </article>
      </div>
    </div>
  </div>
</template>
