<template>
  <section id="interactive-mode" class="bg-base-100 sm:py-24 py-16">
    <div class="max-w-7xl lg:px-8 px-6 mx-auto">
      <!-- Header -->
      <div class="max-w-3xl mx-auto text-center">
        <span class="badge badge-primary badge-lg mb-4">Coming Soon</span>
        <span v-if="eyebrow" class="text-primary-content dark:text-primary block mb-2 text-sm font-semibold tracking-wider uppercase">{{ eyebrow }}</span>
        <h2 class="sm:text-5xl lg:text-6xl text-base-content font-serif text-4xl">{{ title }}</h2>
        <p v-if="description" class="text-base-content mt-6 text-lg leading-relaxed">{{ description }}</p>
      </div>

      <!-- Content Grid -->
      <div class="lg:grid lg:grid-cols-2 lg:gap-16 items-start mt-16">
        <!-- Features List -->
        <div class="space-y-3">
          <div
            v-for="(feature, index) in features"
            :key="index"
            class="group relative"
            :style="{ animationDelay: `${index * 0.1}s` }"
          >
            <!-- Desktop: Content + Number Layout -->
            <div class="hidden lg:flex lg:gap-6 p-6 rounded-2xl transition-all duration-300 hover:shadow-md items-center justify-between" :class="getFeatureColors()">
              <!-- Content -->
              <div class="flex-1 min-w-0">
                <h3 class="font-semibold text-base-content mb-2 group-hover:text-primary transition-colors">{{ feature.name }}</h3>
                <p class="text-sm leading-relaxed text-base-content/80">
                  {{ feature.description }}
                </p>
              </div>

              <!-- Number Badge -->
              <div class="flex-shrink-0 text-right">
                <span class="font-mono text-3xl font-light text-primary group-hover:text-primary/80 transition-colors">
                  {{ String(index + 1).padStart(2, '0') }}
                </span>
              </div>
            </div>

            <!-- Mobile: Accordion Layout -->
            <div class="lg:hidden collapse rounded-2xl overflow-hidden" :class="getFeatureColors()">
              <input
                type="checkbox"
                :checked="activeFeature === index"
                @change="activeFeature = activeFeature === index ? null : index"
              />
              <div class="collapse-title flex items-center justify-between p-5 font-semibold text-sm gap-4">
                <span class="flex-1 min-w-0">{{ feature.name }}</span>
                <span class="font-mono text-xl font-light text-primary flex-shrink-0">
                  {{ String(index + 1).padStart(2, '0') }}
                </span>
              </div>
              <div class="collapse-content p-5 pt-0 min-w-0">
                <p class="text-xs leading-relaxed text-base-content/80 break-words">
                  {{ feature.description }}
                </p>
              </div>
            </div>
          </div>
        </div>

        <!-- Demo Area -->
        <div class="lg:mt-0 mt-12">
          <div
            class="rounded-3xl shadow-base-300 ring-1 ring-base-300 relative overflow-hidden shadow-2xl"
            :class="showIframe ? 'h-[915px] w-[415px] mx-auto' : 'p-3'"
          >
            <AbsoluteGradient v-if="!showIframe" />
            <!-- Placeholder -->
            <div v-if="!showIframe" class="bg-gradient-to-br rounded-2xl from-base-200 to-base-300 relative p-8">
              <!-- Phone Mockup -->
              <div class="max-w-[415px] mx-auto">
                <div class="bg-base-100 rounded-[2.5rem] p-2 shadow-xl ring-1 ring-base-300">
                  <!-- Notch -->
                  <div class="flex justify-center mb-2">
                    <div class="bg-base-content min-w-24 h-6 rounded-full" />
                  </div>
                  <!-- Screen -->
                  <div class="bg-base-200 rounded-[2rem] p-6 min-h-[730px] flex flex-col">
                    <div class="flex flex-col items-center justify-center flex-1 space-y-6 text-center">
                      <div class="space-y-2">
                        <div class="text-accent text-xs font-medium tracking-wider uppercase">Step 1</div>
                        <div class="text-base-content font-serif text-lg">Prepare the glaze</div>
                      </div>
                      <div class="bg-base-300 flex items-center gap-2 px-4 py-2 text-sm rounded-full">
                        <ClockIcon class="size-4 text-accent" />
                        <span class="font-mono">5:00</span>
                      </div>
                    </div>
                    <!-- Progress Dots -->
                    <div class="flex justify-center gap-2 pt-4">
                      <div class="size-2 bg-primary rounded-full" />
                      <div class="size-2 bg-base-300 rounded-full" />
                      <div class="size-2 bg-base-300 rounded-full" />
                      <div class="size-2 bg-base-300 rounded-full" />
                    </div>
                  </div>
                </div>
              </div>

              <!-- CTA Button -->
              <div class="mt-8 text-center">
                <button
                  @click="showIframe = true"
                  class="btn btn-primary btn-lg gap-3"
                >
                  <PlayIcon class="size-5" />
                  Try Interactive Mode
                </button>
              </div>
            </div>

            <!-- Iframe -->
            <div v-else class="size-full relative max-w-[415px] mx-auto">
              <button
                @click="showIframe = false"
                class="top-4 right-4 btn btn-circle btn-sm bg-base-100/80 backdrop-blur absolute z-10"
              >
                <XMarkIcon class="size-5" />
              </button>
              <iframe
                :src="demoRecipeUrlWithParams"
                class="w-full h-full border-0"
                frameborder="0"
                allow="camera; microphone; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                title="Interactive Mode Demo"
                loading="lazy"
              />
            </div>
          </div>

          <p v-if="showIframe" class="text-base-content/50 mt-4 text-sm italic text-center">
            Try it out! Interact with the recipe above (from <a href="https://thesweetestoccasion.com/" target="_blank" class="hover:text-accent underline">The Sweetest Occasion</a>).
          </p>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import {
  PlayIcon,
  XMarkIcon,
  ClockIcon,
  CodeBracketIcon,
  BellAlertIcon,
  WindowIcon,
  DevicePhoneMobileIcon
} from '@heroicons/vue/20/solid'

interface Props {
  eyebrow?: string
  title: string
  description?: string
  demoRecipeUrl?: string
}

const props = defineProps<Props>()

const showIframe = ref(false)
const activeFeature = ref<number | null>(0)

const features = [
  {
    name: 'Engaging experience',
    description: 'Your readers swipe through steps, interacting with your recipes in an immersive experience&mdash;increasing engagement and reducing frustration.',
    icon: CodeBracketIcon
  },
  {
    name: 'Smart timers',
    description: 'Create Studio parses your instructions to generate built-in timers to keep readers on-page and cooking with confidence.',
    icon: BellAlertIcon
  },
  {
    name: 'Saved progress',
    description: 'Readers can close Interactive Mode, pause timers, or refresh the page and pick up where they left off next time they open it.',
    icon: WindowIcon
  },
  {
    name: 'Distraction-free view',
    description: 'Clean, focused interface keeps readers cooking instead of scrolling past ads and pop-ups, losing their place and getting frustrated.',
    icon: DevicePhoneMobileIcon
  },
  {
    name: 'Longer site visits',
    description: 'Readers stay engaged with your content throughout the entire cooking process, increasing time on site and reducing bounce rates.',
    icon: ClockIcon
  },
]

const demoRecipeUrlWithParams = computed(() => {
  if (!props.demoRecipeUrl) return ''
  const url = new URL(props.demoRecipeUrl)
  url.searchParams.set('disableRatingSubmission', 'true')
  url.searchParams.set('cache_bust', 'true')
  return url.toString()
})

// Helper function to get background color for feature card
const getFeatureColors = () => {
  return 'bg-base-200'
}
</script>
