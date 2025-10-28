<template>
  <NuxtLayout name="main">
    <div class="sm:py-32 bg-base-100 py-24">
      <div class="max-w-7xl lg:px-8 px-6 mx-auto">
        <div class="max-w-2xl mx-auto text-center">
          <h2 class="text-balance sm:text-5xl text-base-content text-4xl font-semibold tracking-tight">From the blog</h2>
          <p class="text-lg/8 text-base-content/70 mt-2">Learn about the latest features and updates to Create Studio.</p>
        </div>
        <div class="auto-rows-fr sm:mt-20 lg:mx-0 lg:max-w-none lg:grid-cols-3 grid max-w-2xl grid-cols-1 gap-8 mx-auto mt-16">
          <article
            v-for="post in posts"
            :key="post.stem"
            class="isolate rounded-2xl pt-80 sm:pt-48 lg:pt-80 bg-base-300 relative flex flex-col justify-end px-8 pb-8 overflow-hidden"
          >
            <img
              v-if="post.image"
              :src="post.image"
              alt=""
              class="-z-10 size-full absolute inset-0 object-cover"
            />
            <div class="-z-10 bg-gradient-to-t from-base-300 via-base-300/40 absolute inset-0" />
            <div class="-z-10 rounded-2xl ring-1 ring-inset ring-base-content/10 absolute inset-0" />

            <div class="gap-y-1 text-sm/6 text-base-content/70 flex flex-wrap items-center overflow-hidden">
              <time :datetime="post.date" class="mr-8">{{ formatDate(post.date) }}</time>
              <div v-if="post.author" class="gap-x-4 flex items-center -ml-4">
                <svg viewBox="0 0 2 2" class="-ml-0.5 size-0.5 flex-none fill-base-content/50">
                  <circle cx="1" cy="1" r="1" />
                </svg>
                <div class="flex gap-x-2.5">
                  <img
                    :src="post.author.imageUrl"
                    alt=""
                    class="size-6 bg-base-content/10 flex-none rounded-full"
                  />
                  {{ post.author.name }}
                </div>
              </div>
            </div>
            <h3 class="text-lg/6 text-base-content mt-3 font-semibold">
              <NuxtLink :to="`/${post.stem.split('/').pop()}`">
                <span class="absolute inset-0" />
                {{ post.title }}
              </NuxtLink>
            </h3>
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
  return queryCollection('news').order('date', 'DESC').all()
})

const formatDate = (dateString: string) => {
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
}
</script>
