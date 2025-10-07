<template>
  <div class="bg-base-200">
    <div class="relative isolate overflow-hidden bg-linear-to-b from-primary/20 dark:from-primary/10">
      <div class="mx-auto max-w-7xl pt-10 pb-16 sm:pb-24 lg:grid lg:grid-cols-2 lg:gap-x-8 lg:px-8 lg:py-24">
        <div class="px-6 lg:px-0 lg:pt-4">
          <div class="mx-auto sm:max-w-2xl">
            <div class="sm:max-w-xl w-full">
              <h1 class="mt-6 sm:mt-10 text-center sm:text-left font-serif text-7xl font-medium text-pretty text-base-content sm:text-7xl">
                Get rich results for your
                <span class="text-accent block w-full mt-4 sm:m-[initial]">
                    {{ currentRotatingText }}
                    <span class="inline-flex items-center gap-3">
                    <LogoSolo
                      :class="[
                    'inline-block', 
                    isMobile ? 'size-10' : 'size-16',
                      isDeleting ? '-animate-spin' : '',
                      isTyping ? 'animate-spin' : ''
                    ]"
                    />
                  </span>
                </span>
              </h1>
              <p class="mt-8 text-lg font-medium text-pretty text-base-content sm:text-xl/8">
                Help readers find your content on search. Add automatic JSON-LD schema, free nutrition facts, user ratings, and interactive features—all completely free.
              </p>
              <div  class="hidden mt-6 sm:mt-10 flex items-center gap-x-6">
                <a href="#" target="_blank" class="btn btn-accent">Learn More</a>
              </div>
            </div>
          </div>
        </div>
        <div class="mt-16 sm:mt-24 md:mx-auto md:max-w-2xl lg:mx-0 lg:mt-0 lg:w-screen">
          <div class="absolute inset-y-0 right-1/2 -z-10 -mr-10 w-[200%] skew-x-[-30deg] bg-white shadow-xl ring-1 shadow-primary/10 ring-indigo-50 md:-mr-20 lg:-mr-36 dark:bg-gray-800/30  dark:ring-white/5" aria-hidden="true" />
          <div class="shadow-lg md:rounded-3xl pb-16 px-2 sm:px-[initial] sm:pt-16">
            <div class="bg-base-300 [clip-path:inset(0)] md:[clip-path:inset(0_round_var(--radius-3xl))]">
              <div class="absolute -inset-y-px left-1/2 -z-10 ml-10 w-[200%] skew-x-[-30deg] bg-primary opacity-20 inset-ring inset-ring-white md:ml-20 lg:ml-36" aria-hidden="true" />
              <div class="relative p-3 md:p-4">
                <div class="mx-auto max-w-2xl md:mx-0 md:max-w-none">
                  <div class="overflow-hidden rounded-xl w-full h-full">
                    <img src="/img/screenshots/rich-results.png" alt="Screenshot showing rich results on Google search from Create cards" class="w-full object-cover h-full" />
                  </div>
                </div>
                <div class="pointer-events-none absolute inset-0 ring-1 ring-black/10 ring-inset md:rounded-3xl dark:ring-white/10" aria-hidden="true" />
              </div>
            </div>
          </div>
        </div>
      </div>
      <div class="absolute inset-x-0 bottom-0 -z-10 h-16 bg-linear-to-t from-base-100 sm:h-32" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'

const currentRotatingText = ref('')
const currentIndex = ref(0)
const isDeleting = ref(false)
const isTyping = ref(false)
const charIndex = ref(0)
const isMobile = ref(false)
const headingRotate = ['Recipes', 'How-Tos', 'Lists']
let timeoutId: ReturnType<typeof setTimeout> | null = null

const typeText = () => {
  const currentWord = headingRotate[currentIndex.value]

  if (!isDeleting.value) {
    // Typing
    if (charIndex.value < currentWord.length) {
      isTyping.value = true
      currentRotatingText.value = currentWord.substring(0, charIndex.value + 1)
      charIndex.value++
      timeoutId = setTimeout(typeText, 65)
    } else {
      // Wait before deleting
      isTyping.value = false
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
      currentIndex.value = (currentIndex.value + 1) % headingRotate.length
      timeoutId = setTimeout(typeText, 250)
    }
  }
}

onMounted(() => {
  // Check if mobile
  isMobile.value = window.innerWidth < 640

  if (headingRotate && headingRotate.length > 0) {
    typeText()
  }

  // Update mobile status on resize
  const handleResize = () => {
    isMobile.value = window.innerWidth < 640
  }
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  if (timeoutId) {
    clearTimeout(timeoutId)
  }
  window.removeEventListener('resize', () => {})
})
</script>