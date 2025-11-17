<script lang="ts" setup>
const route = useRoute()
const slug = route.params.slug.join('/')

const { data: page } = await useAsyncData(route.path, () => {
  return queryCollection('features').path(slug).first()
})

// Get surrounding features for navigation
const { data: surroundings } = await useAsyncData('surround', () => {
  return queryCollectionItemSurroundings('features', slug)
  .order('title', 'ASC')
})
const [prev, next] = surroundings?.value || []
const prevTitle = prev?.title.includes('-') ? prev?.title.split('-')[0] : prev?.title
const nextTitle = next?.title.includes('-') ? next?.title.split('-')[0] : next?.title

const title = page.value?.title.includes('-') ? page.value?.title.split('-')[0] : page.value?.title

// Set comprehensive page meta for SEO
useHead({
  title: page.value?.title,
  meta: [
    // Primary Meta Tags
    { name: 'description', content: page.value?.description },
    { name: 'keywords', content: page.value?.keywords || '' },
    { name: 'author', content: 'Create Studio' },
    { name: 'robots', content: 'index, follow' },
    { name: 'viewport', content: 'width=device-width, initial-scale=1' },

    // Open Graph / Facebook Meta Tags
    { property: 'og:type', content: 'article' },
    { property: 'og:url', content: `https://create.studio${route.path}` },
    { property: 'og:title', content: page.value?.title },
    { property: 'og:description', content: page.value?.description },
    { property: 'og:image', content: page.value?.image || '/img/og-default.jpg' },
    { property: 'og:site_name', content: 'Create Studio' },

    // Twitter Meta Tags
    { name: 'twitter:card', content: 'summary_large_image' },
    { property: 'twitter:domain', content: 'create.studio' },
    { property: 'twitter:url', content: `https://create.studio${route.path}` },
    { name: 'twitter:title', content: page.value?.title },
    { name: 'twitter:description', content: page.value?.description },
    { name: 'twitter:image', content: page.value?.image || '/img/og-default.jpg' },

    // Additional SEO Meta
    { name: 'article:author', content: 'Create Studio' },
    { name: 'article:published_time', content: new Date().toISOString() }
  ],
  link: [
    { rel: 'canonical', href: `https://create.studio${route.path}` }
  ],
  script: [
    // JSON-LD Structured Data for Article
    {
      type: 'application/ld+json',
      innerHTML: JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'Article',
        headline: page.value?.title,
        description: page.value?.description,
        image: page.value?.image || '/img/logo/logo-color-light.svg',
        author: {
          '@type': 'Organization',
          name: 'Create Studio',
          url: 'https://create.studio/'
        },
        publisher: {
          '@type': 'Organization',
          name: 'Create Studio',
          logo: {
            '@type': 'ImageObject',
            url: 'https://create.studio/img/logo/logo-color-light.svg'
          }
        },
        datePublished: new Date().toISOString(),
        dateModified: new Date().toISOString(),
        mainEntityOfPage: {
          '@type': 'WebPage',
          '@id': `https://create.studio${route.path}`
        }
      })
    }
  ]
})
</script>

<template>
  <NuxtLayout name="main">
    <div v-if="page" class="bg-base-100 min-h-screen">
      <div class="lg:max-w-5xl lg:px-8 max-w-2xl px-6 py-16 mx-auto">
        <!-- Breadcrumbs -->
        <div class="breadcrumbs mb-8 text-sm">
          <ul>
            <li>Features</li>
            <li>{{ title }}</li>
          </ul>
        </div>

        <!-- Header -->
        <h1 class="text-base-content sm:text-6xl text-pretty mt-2 text-4xl font-medium">
          {{ page.title }}
        </h1>
        <p class="text-base-content/80 mt-4 text-lg">
          {{ page.description }}
        </p>

        <!-- Content Grid -->
        <div class="mt-16 grid grid-cols-1 gap-8 pb-24 lg:grid-cols-[1fr] xl:grid-cols-[1fr]">
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
                <!-- Previous Feature -->
                <NuxtLink
                  v-if="prev"
                  :to="`/features/${prev.stem.split('/').pop()}`"
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
                    <div class="truncate">{{ prevTitle }}</div>
                  </div>
                </NuxtLink>

                <!-- Next Feature -->
                <NuxtLink
                  v-if="next"
                  :to="`/features/${next.stem.split('/').pop()}`"
                  class="border-base-300 ring-1 ring-base-content/10 text-base-content hover:bg-base-200 flex items-center justify-end flex-1 gap-2 px-4 py-3 text-sm font-medium transition-colors border rounded-lg shadow-sm"
                >
                  <div class="text-right">
                    <div class="text-base-content/60 text-xs">Next</div>
                    <div class="truncate">{{ nextTitle }}</div>
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

              <!-- Back to Features (fallback if no surrounding features) -->
              <div v-else class="mt-10">
                <NuxtLink
                  to="/#features"
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
                  Back to Features
                </NuxtLink>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </NuxtLayout>
</template>
