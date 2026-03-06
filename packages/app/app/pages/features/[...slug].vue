<script lang="ts" setup>
definePageMeta({
  layout: false,
})

const route = useRoute()
const slug = `/features${route.path.replace('/features', '')}`

const { data: page } = await useAsyncData(route.path, () => {
  return queryCollection('features').path(slug).first()
})
if (!page.value) {
  throw createError({ statusCode: 404, fatal: true });
}

// Get surrounding features for navigation
const { data: surroundings } = await useAsyncData(`feature-surround-${slug}`, () => {
  return queryCollectionItemSurroundings('features', slug)
    .order('title', 'ASC')
})
const [prev, next] = surroundings?.value || []

interface TocHeading {
  id: string
  text: string
  depth: number
}

const headings = ref<TocHeading[]>([])
const activeHeading = ref('')

onMounted(() => {
  nextTick(() => {
    const els = document.querySelectorAll('.prose h2[id], .prose h3[id]')
    headings.value = Array.from(els).map(el => ({
      id: el.id,
      text: el.textContent?.trim() || '',
      depth: el.tagName === 'H2' ? 2 : 3,
    }))

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            activeHeading.value = entry.target.id
          }
        }
      },
      { rootMargin: '-80px 0px -70% 0px' },
    )

    els.forEach(el => observer.observe(el))
    onUnmounted(() => observer.disconnect())
  })
})

function scrollToHeading(id: string) {
  const el = document.getElementById(id)
  if (el) {
    el.scrollIntoView({ behavior: 'smooth', block: 'start' })
    activeHeading.value = id
  }
}

useHead({
  title: page.value?.title,
  meta: [
    { name: 'description', content: page.value?.description },
  ],
  link: [
    { rel: 'canonical', href: `https://create.studio${route.path}` }
  ],
})

useSeoMeta({
  ogTitle: page.value?.title,
  ogDescription: page.value?.description,
  ogType: 'article',
  ogSiteName: 'Create Studio',
  twitterCard: 'summary_large_image',
})

useSchemaOrg([
  defineArticle({
    '@type': 'TechArticle',
    headline: page.value?.title,
    description: page.value?.description,
    image: `https://create.studio/__og-image__/image/features/${route.params.slug?.[0] || ''}/og.png`,
    author: {
      '@type': 'Organization',
      name: 'Create Studio',
      url: 'https://create.studio',
    },
    publisher: {
      '@type': 'Organization',
      name: 'Create Studio',
      url: 'https://create.studio',
    },
  }),
])

defineOgImage({
  component: 'Feature',
  title: page.value?.title || '',
  description: page.value?.description || '',
  icon: page.value?.icon || '',
})
</script>

<template>
  <NuxtLayout name="main">
    <div v-if="page" class="bg-base-100 min-h-screen">
      <div class="max-w-7xl px-6 py-16 mx-auto">
        <!-- Breadcrumbs -->
        <div class="breadcrumbs max-w-3xl mb-8 text-sm">
          <ul>
            <li><NuxtLink to="/features">Features</NuxtLink></li>
            <li>{{ page.title }}</li>
          </ul>
        </div>

        <div class="lg:grid lg:grid-cols-[260px_1fr] lg:gap-12">
          <!-- Table of Contents sidebar -->
          <aside v-if="headings.length" class="lg:block hidden">
            <nav class="top-24 sticky">
              <div class="text-base-content/80 mb-3 text-xs font-semibold tracking-wider uppercase">On this page</div>
              <ul class="border-base-300 space-y-1 border-l">
                <li v-for="heading in headings" :key="heading.id">
                  <a
                    :href="`#${heading.id}`"
                    class="hover:text-base-content block py-1 -ml-px text-sm transition-colors border-l-2"
                    :class="[
                      activeHeading === heading.id
                        ? 'text-base-content border-primary font-medium text-md'
                        : 'text-base-content/70 border-transparent',
                      heading.depth === 3 ? 'pl-6' : 'pl-4',
                    ]"
                    @click.prevent="scrollToHeading(heading.id)"
                  >
                    {{ heading.text }}
                  </a>
                </li>
              </ul>
            </nav>
          </aside>

          <!-- Main content column -->
          <div class="max-w-3xl">
            <!-- Header -->
            <h1 class="text-pretty text-base-content sm:text-5xl mt-2 text-4xl font-medium tracking-tighter">
              {{ page.title }}
            </h1>
            <p class="text-lg/7 text-base-content/70 mt-4">{{ page.description }}</p>

            <!-- Featured Image (if exists) -->
            <img
              v-if="page.image"
              :alt="page.title"
              class="aspect-[3/2] rounded-2xl object-cover w-full mt-10"
              :src="page.image"
            />

            <!-- Content Body -->
            <div class="max-w-none prose-a:no-underline prose-a:hover:underline prose-slate mt-12 prose prose-lg">
              <ContentRenderer :value="page" />
            </div>

            <!-- Post Navigation -->
            <div v-if="prev || next" class="flex justify-between gap-4 mt-10">
              <NuxtLink v-if="prev" :to="`/features/${prev.stem?.split('/').pop()}`" class="border-base-300 ring-1 ring-base-content/10 text-base-content hover:bg-base-200 flex items-center flex-1 gap-2 px-4 py-3 text-sm font-medium transition-colors border rounded-lg shadow-sm">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" class="size-4 flex-shrink-0"><path fill-rule="evenodd" d="M9.78 4.22a.75.75 0 0 1 0 1.06L7.06 8l2.72 2.72a.75.75 0 1 1-1.06 1.06L5.47 8.53a.75.75 0 0 1 0-1.06l3.25-3.25a.75.75 0 0 1 1.06 0Z" clip-rule="evenodd" /></svg>
                <div class="text-left">
                  <div class="text-base-content/60 text-xs">Previous</div>
                  <div class="truncate">{{ prev.title }}</div>
                </div>
              </NuxtLink>
              <NuxtLink v-if="next" :to="`/features/${next.stem?.split('/').pop()}`" class="border-base-300 ring-1 ring-base-content/10 text-base-content hover:bg-base-200 flex items-center justify-end flex-1 gap-2 px-4 py-3 text-sm font-medium transition-colors border rounded-lg shadow-sm">
                <div class="text-right">
                  <div class="text-base-content/60 text-xs">Next</div>
                  <div class="truncate">{{ next.title }}</div>
                </div>
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" class="size-4 flex-shrink-0"><path fill-rule="evenodd" d="M6.22 4.22a.75.75 0 0 1 1.06 0l3.25 3.25a.75.75 0 0 1 0 1.06l-3.25 3.25a.75.75 0 0 1-1.06-1.06L8.94 8 6.22 5.28a.75.75 0 0 1 0-1.06Z" clip-rule="evenodd" /></svg>
              </NuxtLink>
            </div>

            <!-- Back to Features (fallback) -->
            <div v-if="!prev && !next" class="mt-10">
              <NuxtLink to="/features" class="border-base-300 ring-1 ring-base-content/10 whitespace-nowrap text-base-content hover:bg-base-200 inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium transition-colors border rounded-lg shadow-sm">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" class="size-4"><path fill-rule="evenodd" d="M9.78 4.22a.75.75 0 0 1 0 1.06L7.06 8l2.72 2.72a.75.75 0 1 1-1.06 1.06L5.47 8.53a.75.75 0 0 1 0-1.06l3.25-3.25a.75.75 0 0 1 1.06 0Z" clip-rule="evenodd" /></svg>
                Back to Features
              </NuxtLink>
            </div>
          </div>
        </div>
      </div>
    </div>
  </NuxtLayout>
</template>
