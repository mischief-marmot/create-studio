<template>
  <section id="interactive-mode" class="bg-base-100 sm:py-24 py-16">
    <div class="max-w-7xl lg:px-8 sm:px-6 mx-auto">
      <!-- Header -->
      <div class="max-w-3xl mx-auto text-center">
        <span class="badge badge-primary badge-lg gap-2 mb-4 font-bold">
          All-New Feature!
        </span>
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
            <div class="lg:flex lg:gap-6 rounded-2xl hover:shadow-sm hover:-mx-2 hover:px-8 items-center justify-between hidden p-6" :class="getFeatureColors()">
              <!-- Content -->
              <div class="flex-1 min-w-0">
                <h3 class="text-primary group-hover:text-base-content dark:group-hover:text-primary dark:text-primary-content mb-2 font-serif text-3xl tracking-wider">{{ feature.name }}</h3>
                <p class="text-base-content/80 text-sm leading-relaxed" v-html="feature.description" />
              </div>

              <!-- Number Badge -->
              <div class="flex-shrink-0 text-right">
                <span class="text-primary group-hover:text-base-content dark:text-primary-content dark:group-hover:text-primary font-serif text-3xl font-light">
                  {{ String(index + 1).padStart(2, '0') }}
                </span>
              </div>
            </div>

            <!-- Mobile: Accordion Layout -->
            <div class="lg:hidden collapse rounded-2xl overflow-hidden" :class="getFeatureColors()">
              <input
              class="p-0"
                type="checkbox"
                :checked="activeFeature === index"
                @change="activeFeature = activeFeature === index ? null : index"
              />
              <div class="collapse-title lg:gap-4 lg:p-5 flex items-center justify-between gap-0 px-5 text-sm font-semibold">
                <span class="flex-1 min-w-0">{{ feature.name }}</span>
                <span class="text-primary flex-shrink-0 font-mono text-xl font-light">
                  {{ String(index + 1).padStart(2, '0') }}
                </span>
              </div>
              <div class="collapse-content lg:p-5 lg:pt-0 min-w-0 px-5 pt-0">
                <p
                v-html="feature.description"
                 class="text-base-content/80 text-xs leading-relaxed break-words" />
              </div>
            </div>
          </div>
        </div>

        <!-- Demo Area -->
        <div class="lg:mt-0 mt-12">
          <div class="rounded-3xl shadow-base-300 overflow-clip sm:p-3 relative p-1">
            <AbsoluteGradient />
            <div class="bg-gradient-to-br rounded-2xl from-base-200 to-base-300 sm:p-6 sm:pt-8 min-h-30 relative p-3">
              <!-- Phone Mockup -->
              <div class="sm:block hidden max-w-[445px] mx-auto">
                <div class="bg-base-100 rounded-[2.5rem] p-2 shadow-xl ring-1 ring-base-300">
                  <!-- Notch -->
                  <div v-if="!showIframe" class="flex justify-center mb-2">
                    <div class="bg-base-content min-w-24 h-6 rounded-full" />
                  </div>
                  <!-- Screen -->
                  <div class="bg-base-200 rounded-[2rem] min-h-[630px] flex flex-col relative overflow-hidden">
                    <!-- Placeholder content -->
                    <div v-if="!showIframe" class="flex flex-col flex-1 p-6">
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
                    <!-- Iframe inside phone screen -->
                    <div v-else class="absolute inset-0">
                      <button
                        @click="showIframe = false"
                        class="top-2 right-2 btn btn-circle btn-sm bg-base-100/80 backdrop-blur absolute z-10"
                      >
                        <XMarkIcon class="size-5" />
                      </button>
                      <iframe
                        :src="demoRecipeUrlWithParams"
                        class="w-full h-full rounded-[2rem]"
                        frameborder="0"
                        allow="camera; microphone; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        title="Interactive Mode Demo"
                        loading="lazy"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <!-- Mobile: no phone mockup, just iframe or CTA -->
              <div class="sm:hidden">
                <div v-if="!showIframe" class="h-80 flex flex-col items-center justify-center gap-4 text-center">
                  <div class="font-serif text-xl tracking-wide">
                    Click the button below to try Interactive Mode for yourself!
                  </div>
                </div>
                <div v-else class="relative h-[600px]">
                  <button
                    @click="showIframe = false"
                    class="top-2 right-2 btn btn-circle btn-sm bg-base-100/80 backdrop-blur absolute z-10"
                  >
                    <XMarkIcon class="size-5" />
                  </button>
                  <iframe
                    :src="demoRecipeUrlWithParams"
                    class="border-base-content/20 rounded-2xl w-full h-full border shadow-sm"
                    frameborder="0"
                    allow="camera; microphone; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    title="Interactive Mode Demo"
                    loading="lazy"
                  />
                </div>
              </div>

              <!-- CTA / Caption area (fixed height to prevent layout shift) -->
              <div class="sm:mt-8 flex flex-col items-center justify-center gap-4 text-center">
                <button
                  v-if="!showIframe"
                  @click="showIframe = true"
                  class="btn btn-primary btn-lg w-fit gap-3"
                >
                  <PlayIcon class="size-5" />
                  Try Interactive Mode
                </button>
                <p v-else class="text-base-content/50 text-sm italic">
                  Try it out! Interact with the recipe above (from <a href="https://thesweetestoccasion.com/" target="_blank" class="hover:text-accent underline">The Sweetest Occasion</a>).
                </p>
              </div>
            </div>
          </div>
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
  DevicePhoneMobileIcon,
  ComputerDesktopIcon
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
  {
    name: 'Ad-supported experience',
    description: `<strong>Create 2.0 Free+ plan</strong>: Interactive Mode opens on create.studio in a new tab, where Create shows ads while your site ads keep running on your own page. <br/><strong>Create 2.0 Pro plan</strong>: Interactive Mode stays in-page on your site&mdash;readers never leave&mdash;with support for your own ad network, custom button text, or the ability to disable it entirely.`,
    icon: ComputerDesktopIcon
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
