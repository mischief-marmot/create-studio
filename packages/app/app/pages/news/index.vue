<template>
  <NuxtLayout name="main">
    <div class="sm:py-32 bg-base-100 py-24">
      <div class="max-w-7xl lg:px-8 px-6 mx-auto">
        <div class="max-w-3xl mx-auto text-center">
          <h2 class="text-balance sm:text-5xl text-base-content text-4xl font-semibold tracking-tight">Read the News</h2>
          <p class="text-lg/8 text-base-content/70 mt-2">Learn about the latest features and updates to Create & Create Studio.</p>
        </div>
        <div class="auto-rows-fr sm:mt-20 lg:mx-0 lg:max-w-none lg:grid-cols-3 grid max-w-2xl grid-cols-1 gap-6 mx-auto mt-16">
          <article
            v-for="post in posts"
            :key="post.stem"
            class="rounded-lg ring-1 ring-white/10 relative flex flex-col overflow-hidden"
            style="background: linear-gradient(135deg, #1a1a1f 0%, #1f1a28 50%, #1a1a1f 100%)"
          >
            <div class="flex flex-col flex-1 px-6 py-5">
              <!-- Date + Author -->
              <div class="flex items-center gap-2 mb-3">
                <span class="text-xs font-bold tracking-widest uppercase" style="color: #e6a640">
                  {{ formatDate(post.date) }}
                </span>
                <span v-if="post.author" class="text-xs" style="color: rgba(255,255,255,0.4)">
                  · {{ post.author.name }}
                </span>
              </div>

              <h3 class="text-lg/6 font-semibold" style="color: #ffffff">
                <NuxtLink :to="`/news/${post.stem?.split('/').pop()}`">
                  <span class="absolute inset-0" />
                  {{ post.title }}
                </NuxtLink>
              </h3>

              <p class="text-sm/6 line-clamp-3 mt-2" style="color: rgba(255,255,255,0.6)">{{ post.description }}</p>

              <div v-if="post.category" class="pt-4 mt-auto">
                <span class="badge badge-sm badge-primary border-0">{{ post.category }}</span>
              </div>
            </div>

            <!-- Accent line bottom -->
            <div class="h-1.5 w-full" style="background: linear-gradient(90deg, #b060ff, #ee87cb 30%, #fff1be 72%)" />
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

// Fetch posts using queryCollection
const { data: posts } = await useAsyncData('news-posts', () => {
  return queryCollection('news').where('_published', '=', true).order('date', 'DESC').all()
})

const formatDate = (dateString: string) => {
  const date = new Date(dateString + 'T12:00:00')
  return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
}
</script>
