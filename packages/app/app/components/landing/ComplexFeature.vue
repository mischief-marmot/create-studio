<template>
  <div class="overflow-hidden bg-base-100 py-24 sm:py-32">
    <div class="mx-auto max-w-7xl px-6 lg:px-8">
      <div class="mx-auto grid max-w-2xl grid-cols-1 gap-x-8 gap-y-16 sm:gap-y-20 lg:mx-0 lg:max-w-none lg:grid-cols-2">
        <div class="lg:pt-4 lg:pr-8">
          <div class="lg:max-w-lg">
            <h2 v-if="eyebrow" class="text-base/7 font-semibold text-secondary">{{ eyebrow }}</h2>
            <p class="mt-2 text-4xl font-semibold tracking-tight text-pretty text-base-content sm:text-5xl">{{ title }}</p>
            <p v-if="description" class="mt-6 text-lg/8 opacity-85">{{ description }}</p>

            <!-- Slot for custom content -->
            <div v-if="$slots.default" class="mt-6">
              <slot />
            </div>

            <dl v-if="features && features.length > 0" class="mt-10 max-w-xl space-y-8 text-base/7 opacity-80 lg:max-w-none">
              <div v-for="feature in features" :key="feature.name" class="relative pl-9">
                <dt class="inline font-semibold text-base-content">
                  <component v-if="feature.icon" :is="feature.icon" class="absolute top-1 left-1 size-5 text-secondary" aria-hidden="true" />
                  {{ feature.name }}
                </dt>
                {{ ' ' }}
                <dd class="inline">{{ feature.description }}</dd>
              </div>
            </dl>

            <!-- Slot for features if you want custom rendering -->
            <div v-if="$slots.features" class="mt-10">
              <slot name="features" />
            </div>
          </div>
        </div>
        <img v-if="screenshotDark" :src="screenshotDark" :alt="screenshotAlt" class="w-3xl max-w-none rounded-xl shadow-xl ring-1 ring-base-300 not-dark:hidden sm:w-228 md:-ml-4 lg:-ml-0" width="2432" height="1442" />
        <img v-if="screenshotLight" :src="screenshotLight" :alt="screenshotAlt" class="w-3xl max-w-none rounded-xl shadow-xl ring-1 ring-base-300 sm:w-228 md:-ml-4 lg:-ml-0 dark:hidden" width="2432" height="1442" />
        <img v-if="screenshot && !screenshotLight && !screenshotDark" :src="screenshot" :alt="screenshotAlt" class="w-3xl max-w-none rounded-xl shadow-xl ring-1 ring-base-300 sm:w-228 md:-ml-4 lg:-ml-0" width="2432" height="1442" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
interface Feature {
  name: string
  description: string
  icon?: any
}

interface Props {
  eyebrow?: string
  title: string
  description?: string
  features?: Feature[]
  screenshot?: string
  screenshotLight?: string
  screenshotDark?: string
  screenshotAlt?: string
}

withDefaults(defineProps<Props>(), {
  screenshotAlt: 'Product screenshot'
})
</script>