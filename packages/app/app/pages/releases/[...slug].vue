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
    .order('date', 'ASC')
})
const [prev, next] = surroundings?.value || []

const formatDate = (dateString: string) => {
  const date = new Date(dateString + 'T12:00:00')
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

// Extract headings from DOM after render
interface TocHeading {
  id: string
  text: string
  depth: number
}

const headings = ref<TocHeading[]>([])
const activeHeading = ref('')

onMounted(() => {
  // Read headings from the rendered DOM
  nextTick(() => {
    const els = document.querySelectorAll('.release-content h2[id], .release-content h3[id]')
    headings.value = Array.from(els).map(el => ({
      id: el.id,
      text: el.textContent?.trim() || '',
      depth: el.tagName === 'H2' ? 2 : 3,
    }))

    // Observe headings for active state
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
  twitterCard: 'summary_large_image',
})

const faqEntries = computed(() => (page.value as any)?.faq || [])

// Render inline markdown (links + bold) to HTML
function renderInlineMd(text: string): string {
  return text
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" class="link link-primary">$1</a>')
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
}

// Strip markdown to plain text for schema
function stripMd(text: string): string {
  return text
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/\*\*([^*]+)\*\*/g, '$1')
}

const schemaOrg = computed(() => {
  const schemas: any[] = [
    defineArticle({
      '@type': 'TechArticle',
      headline: page.value?.title,
      description: page.value?.description,
      datePublished: page.value?.date ? `${page.value.date}T00:00:00+00:00` : undefined,
      image: `https://create.studio/__og-image__/image/releases/${route.params.slug?.[0] || ''}/og.png`,
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
    defineSoftwareApp({
      name: page.value?.product === 'create-plugin' ? 'Create Plugin for WordPress' : 'Create Studio',
      operatingSystem: 'WordPress',
      applicationCategory: 'LifestyleApplication',
      softwareVersion: page.value?.version,
      offers: {
        '@type': 'Offer',
        price: '0',
        priceCurrency: 'USD',
      },
    }),
  ]
  if (faqEntries.value.length > 0) {
    schemas.push(defineWebPage({
      '@type': 'FAQPage',
    }))
    for (const entry of faqEntries.value) {
      schemas.push(defineQuestion({
        name: entry.question,
        acceptedAnswer: stripMd(entry.answer),
      }))
    }
  }
  return schemas
})

useSchemaOrg(schemaOrg)

defineOgImage('Release', {
  title: page.value?.title || '',
  description: page.value?.description || '',
  version: page.value?.version || '',
  product: page.value?.product || 'create-plugin',
  date: page.value?.date ? new Date(page.value.date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : '',
})
</script>

<template>
  <NuxtLayout name="main">
    <div v-if="page" class="bg-base-100 min-h-screen">
      <div class="max-w-7xl px-6 py-16 mx-auto">
        <!-- Breadcrumbs -->
        <div class="breadcrumbs max-w-3xl mb-8 text-sm">
          <ul>
            <li><NuxtLink to="/releases">Releases</NuxtLink></li>
            <li>{{ page.title }}</li>
          </ul>
        </div>

        <div class="lg:grid lg:grid-cols-[260px_1fr] lg:gap-12">
          <!-- Table of Contents sidebar (always rendered for layout stability, content populates on mount) -->
          <aside class="lg:block hidden">
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
          <div class="release-content max-w-3xl">
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
            <div class="max-w-none prose-a:no-underline prose-a:hover:underline prose-slate mt-12 prose prose-lg">
              <ContentRenderer :value="page" />
            </div>

            <!-- FAQ (from frontmatter) -->
            <div v-if="faqEntries.length" class="mt-16">
              <h2 id="frequently-asked-questions" class="text-base-content mb-6 text-2xl font-semibold tracking-tight">Frequently Asked Questions</h2>
              <div class="space-y-6">
                <div v-for="(entry, i) in faqEntries" :key="i">
                  <h3 :id="`faq-${i}`" class="text-base-content text-base font-semibold">{{ entry.question }}</h3>
                  <p class="text-base-content/70 mt-1.5 text-sm leading-relaxed" v-html="renderInlineMd(entry.answer)" />
                </div>
              </div>
            </div>

            <!-- Highlights -->
            <div v-if="page.highlights?.length" class="mt-16">
              <h2 id="release-highlights" class="text-base-content mb-6 text-xl font-semibold">Release Highlights</h2>
              <div class="sm:grid-cols-2 grid grid-cols-1 gap-3">
                <div
                  v-for="highlight in page.highlights"
                  :key="highlight.title"
                  class="bg-base-200 rounded-xl ring-1 ring-base-content/5 px-5 py-4"
                >
                  <div class="flex items-center gap-2 mb-1">
                    <span class="text-sm font-bold" :class="highlightClass(highlight.type)">
                      {{ highlightIcon(highlight.type) }}
                    </span>
                    <span class="text-base-content text-sm font-semibold">{{ highlight.title }}</span>
                  </div>
                  <p class="text-base-content/60 text-sm">{{ highlight.description }}</p>
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
                class="border-base-300 ring-1 ring-base-content/10 text-base-content hover:bg-base-200 flex items-center max-w-[50%] gap-2 px-4 py-3 text-sm font-medium transition-colors border rounded-lg shadow-sm"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" class="size-4 flex-shrink-0">
                  <path fill-rule="evenodd" d="M9.78 4.22a.75.75 0 0 1 0 1.06L7.06 8l2.72 2.72a.75.75 0 1 1-1.06 1.06L5.47 8.53a.75.75 0 0 1 0-1.06l3.25-3.25a.75.75 0 0 1 1.06 0Z" clip-rule="evenodd" />
                </svg>
                <div class="text-left">
                  <div class="text-base-content/60 text-xs">Previous</div>
                  <div class="text-pretty">{{ prev.title }}</div>
                </div>
              </NuxtLink>

              <NuxtLink
                v-if="next"
                :to="`/releases/${next.stem?.split('/').pop()}`"
                class="border-base-300 ring-1 ring-base-content/10 text-base-content hover:bg-base-200 flex items-center justify-end max-w-[50%] ml-auto gap-2 px-4 py-3 text-sm font-medium transition-colors border rounded-lg shadow-sm"
              >
                <div class="text-right">
                  <div class="text-base-content/60 text-xs">Next</div>
                  <div class="text-pretty">{{ next.title }}</div>
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
      </div>
    </div>
  </NuxtLayout>
</template>
