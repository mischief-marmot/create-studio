<template>
  <div class="bg-base-200">
    <div class="relative isolate overflow-hidden bg-linear-to-b from-primary/20 dark:from-primary/10">
      <div class="mx-auto max-w-7xl pt-10 pb-24 sm:pb-32 lg:grid lg:grid-cols-2 lg:gap-x-8 lg:px-8 lg:py-24">
        <div class="px-6 lg:px-0 lg:pt-4">
          <div class="mx-auto max-w-2xl">
            <div class="max-w-xl">
              <img v-if="logoLight" class="h-11 dark:hidden" :src="logoLight" :alt="logoAlt" />
              <img v-if="logoDark" class="h-11 not-dark:hidden" :src="logoDark" :alt="logoAlt" />
              <div v-if="badge || badgeLink" class="mt-24 sm:mt-32 lg:mt-16">
                <a :href="badgeLink || '#'" class="inline-flex space-x-6">
                  <span class="rounded-full bg-indigo-50 px-3 py-1 text-sm/6 font-semibold text-primary ring-1 ring-primary/20 ring-inset dark:bg-primary/10 dark:text-primary dark:ring-primary/25">{{ badge }}</span>
                  <span v-if="badgeText" class="inline-flex items-center space-x-2 text-sm/6 font-medium text-gray-600 dark:text-gray-300">
                    <span>{{ badgeText }}</span>
                    <ChevronRightIcon class="size-5 text-gray-400 dark:text-gray-500" aria-hidden="true" />
                  </span>
                </a>
              </div>
              <h1 class="mt-10 text-5xl font-semibold tracking-tight text-pretty text-gray-900 sm:text-7xl dark:text-white">
                {{ heading }}
                <span v-if="headingRotate && headingRotate.length > 0" class="block w-full">
                  <span class="text-accent">{{ currentRotatingText }}</span>
                  <span class="animate-pulse text-accent font-thin ml-2 leading-1">|</span>
                </span>
              </h1>
              <p class="mt-8 text-lg font-medium text-pretty text-gray-500 sm:text-xl/8 dark:text-gray-400">{{ description }}</p>
              <div class="mt-10 flex items-center gap-x-6">
                <a :href="primaryButtonLink" class="btn btn-accent">{{ primaryButtonText }}</a>
                <a v-if="secondaryButtonText" :href="secondaryButtonLink" class="text-sm/6 font-semibold text-gray-900 dark:text-white">{{ secondaryButtonText }} <span aria-hidden="true">→</span></a>
              </div>
            </div>
          </div>
        </div>
        <div class="mt-20 sm:mt-24 md:mx-auto md:max-w-2xl lg:mx-0 lg:mt-0 lg:w-screen">
          <div class="absolute inset-y-0 right-1/2 -z-10 -mr-10 w-[200%] skew-x-[-30deg] bg-white shadow-xl ring-1 shadow-primary/10 ring-indigo-50 md:-mr-20 lg:-mr-36 dark:bg-gray-800/30  dark:ring-white/5" aria-hidden="true" />
          <div class="shadow-lg md:rounded-3xl">
            <div class="bg-base-300 [clip-path:inset(0)] md:[clip-path:inset(0_round_var(--radius-3xl))]">
              <div class="absolute -inset-y-px left-1/2 -z-10 ml-10 w-[200%] skew-x-[-30deg] bg-primary opacity-20 inset-ring inset-ring-white md:ml-20 lg:ml-36" aria-hidden="true" />
              <div class="relative p-3 md:p-4">
                <div class="mx-auto max-w-2xl md:mx-0 md:max-w-none">
                  <div v-if="screenshotSrc" class="overflow-hidden rounded-xl w-full h-full">
                    <img :src="screenshotSrc" :alt="screenshotAlt" class="w-full object-cover h-full" />
                  </div>
                </div>
                <div class="pointer-events-none absolute inset-0 ring-1 ring-black/10 ring-inset md:rounded-3xl dark:ring-white/10" aria-hidden="true" />
              </div>
            </div>
          </div>
        </div>
      </div>
      <div class="absolute inset-x-0 bottom-0 -z-10 h-24 bg-linear-to-t from-base-100 sm:h-32" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { ChevronRightIcon } from '@heroicons/vue/20/solid'

interface Props {
  logoLight?: string
  logoDark?: string
  logoAlt?: string
  badge?: string
  badgeText?: string
  badgeLink?: string
  heading: string
  headingRotate?: string[]
  description: string
  primaryButtonText: string
  primaryButtonLink?: string
  secondaryButtonText?: string
  secondaryButtonLink?: string
  screenshotSrc?: string
  screenshotAlt?: string
}

const props = withDefaults(defineProps<Props>(), {
  logoAlt: 'Company Logo',
  primaryButtonLink: '#',
  secondaryButtonLink: '#',
  screenshotAlt: 'Screenshot'
})

const currentRotatingText = ref('')
const currentIndex = ref(0)
const isDeleting = ref(false)
const charIndex = ref(0)
let timeoutId: ReturnType<typeof setTimeout> | null = null

const typeText = () => {
  if (!props.headingRotate || props.headingRotate.length === 0) return

  const currentWord = props.headingRotate[currentIndex.value]

  if (!isDeleting.value) {
    // Typing
    if (charIndex.value < currentWord.length) {
      currentRotatingText.value = currentWord.substring(0, charIndex.value + 1)
      charIndex.value++
      timeoutId = setTimeout(typeText, 65)
    } else {
      // Wait before deleting
      timeoutId = setTimeout(() => {
        isDeleting.value = true
        typeText()
      }, 2000)
    }
  } else {
    // Deleting
    if (charIndex.value > 0) {
      currentRotatingText.value = currentWord.substring(0, charIndex.value - 1)
      charIndex.value--
      timeoutId = setTimeout(typeText, 35)
    } else {
      // Move to next word
      isDeleting.value = false
      currentIndex.value = (currentIndex.value + 1) % props.headingRotate.length
      timeoutId = setTimeout(typeText, 200)
    }
  }
}

onMounted(() => {
  if (props.headingRotate && props.headingRotate.length > 0) {
    typeText()
  }
})

onUnmounted(() => {
  if (timeoutId) {
    clearTimeout(timeoutId)
  }
})
</script>