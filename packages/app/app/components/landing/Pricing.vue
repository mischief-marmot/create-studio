<template>
  <div class="bg-base-100 py-24 sm:py-32">
    <div class="mx-auto max-w-7xl px-6 lg:px-8">
      <div class="mx-auto max-w-4xl sm:text-center">
        <h2 class="text-5xl font-semibold tracking-tight text-pretty text-base-content sm:text-6xl sm:text-balance">{{ title }}</h2>
        <p v-if="description" class="mx-auto mt-6 max-w-2xl text-lg font-medium text-pretty opacity-70 sm:text-xl/8">{{ description }}</p>
      </div>

      <!-- Slot for custom content above pricing card -->
      <div v-if="$slots.header" class="mt-8">
        <slot name="header" />
      </div>

      <div class="mx-auto mt-16 max-w-2xl rounded-3xl ring-1 ring-base-300 sm:mt-20 lg:mx-0 lg:flex lg:max-w-none bg-base-200/50">
        <div class="p-8 sm:p-10 lg:flex-auto">
          <h3 class="text-3xl font-semibold tracking-tight text-base-content">{{ planName }}</h3>
          <p v-if="planDescription" class="mt-6 text-base/7 opacity-80">{{ planDescription }}</p>
          <div class="mt-10 flex items-center gap-x-4">
            <h4 class="flex-none text-sm/6 font-semibold text-secondary">{{ featuresLabel }}</h4>
            <div class="h-px flex-auto bg-base-300" />
          </div>
          <ul role="list" class="mt-8 grid grid-cols-1 gap-4 text-sm/6 opacity-80 sm:grid-cols-2 sm:gap-6">
            <li v-for="feature in features" :key="feature" class="flex gap-x-3">
              <CheckIcon class="h-6 w-5 flex-none text-secondary" aria-hidden="true" />
              {{ feature }}
            </li>
          </ul>

          <!-- Slot for custom features content -->
          <div v-if="$slots.features" class="mt-8">
            <slot name="features" />
          </div>
        </div>
        <div class="-mt-2 p-2 lg:mt-0 lg:w-full lg:max-w-md lg:shrink-0">
          <div class="rounded-2xl bg-base-300 py-10 text-center inset-ring inset-ring-base-300 lg:flex lg:flex-col lg:justify-center lg:py-16">
            <div class="mx-auto max-w-xs px-8">
              <p class="text-base font-semibold opacity-70">{{ priceLabel }}</p>
              <p class="mt-6 flex items-baseline justify-center gap-x-2">
                <span class="text-5xl font-semibold tracking-tight text-base-content">{{ price }}</span>
                <span v-if="priceSuffix" class="text-sm/6 font-semibold tracking-wide opacity-70">{{ priceSuffix }}</span>
              </p>
              <a :href="buttonLink" class="btn btn-accent mt-10 w-full">{{ buttonText }}</a>
              <p v-if="footerNote" class="mt-6 text-xs/5 opacity-70">{{ footerNote }}</p>

              <!-- Slot for custom footer content -->
              <div v-if="$slots.footer" class="mt-6">
                <slot name="footer" />
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Default slot for additional content below pricing -->
      <div v-if="$slots.default" class="mt-16">
        <slot />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { CheckIcon } from '@heroicons/vue/20/solid'

interface Props {
  title: string
  description?: string
  planName: string
  planDescription?: string
  featuresLabel?: string
  features: string[]
  priceLabel?: string
  price: string
  priceSuffix?: string
  buttonText: string
  buttonLink?: string
  footerNote?: string
}

withDefaults(defineProps<Props>(), {
  featuresLabel: 'What\'s included',
  priceLabel: 'Pay once, own it forever',
  buttonLink: '#'
})
</script>