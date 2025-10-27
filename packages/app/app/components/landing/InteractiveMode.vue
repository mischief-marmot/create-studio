<template>
    <div id="interactive-mode" class="bg-base-100 sm:py-24 py-16">
        <div class="max-w-7xl lg:px-8 px-6 mx-auto">
            <div class="max-w-4xl mx-auto text-center">
                <h2 v-if="eyebrow" class="text-md text-secondary font-semibold">{{ eyebrow }}</h2>
                <p
                    class="sm:text-7xl text-pretty text-base-content md:text-8xl sm:text-balance mt-2 font-serif text-6xl">
                    {{ title }}</p>
                <p v-if="description" class="sm:mt-6 text-lg/8 text-pretty max-w-2xl mx-auto mt-4">{{ description }}</p>

                <!-- Slot for custom header content -->
                <div v-if="$slots.header" class="mt-6">
                    <slot name="header" />
                </div>
            </div>
        </div>
        <div class="relative py-12 overflow-hidden">
            <div class="max-w-7xl lg:px-8 w-full px-4 mx-auto">
                <div class="relative rounded-xl shadow-2xl shadow-base-200 ring-1 ring-base-200 overflow-hidden max-w-[412px] max-h-[760px] w-full h-screen lg:max-h-[720px] md:max-w-none mx-auto"
                :class="[
                    showIframe ? '' : 'p-3'
                ]"
                >
                    <AbsoluteGradient v-if="!showIframe" />

                    <!-- Button placeholder before iframe loads -->
                    <div v-if="!showIframe" class="size-full dark:bg-base-200 rounded-xl relative z-10 flex flex-col items-center justify-center space-y-6 bg-white">
                        <p class="text-pretty text-lg">Click the button to try Interactive Mode!</p>
                        <button @click="showIframe = true" 
                        :class="[
                            'btn btn-primary font-normal text-xl sm:text-3xl btn-xl sm:btn-2xl gap-2 py-10',
                            ]"
                        >
                            Try Interactive Mode
                        </button>
                    </div>

                    <!-- Iframe loads on button click -->
                    <iframe v-if="showIframe" :src="demoRecipeUrl" class="lg:aspect-video rounded-xl relative z-10 w-full h-full overflow-hidden border-0"
                        frameborder="0"
                        allow="camera; microphone; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        title="Interactive Mode Demo" loading="lazy" />
                </div>
                <p v-if="showIframe" class="text-base-content pt-4 text-sm italic text-center">Try it out! Interact with the recipe above (from <a href="https://thesweetestoccasion.com/" target="_blank">The Sweetest Occasion</a>).</p>

                <!-- <img v-if="screenshot && !screenshotLight && !screenshotDark" :src="screenshot" :alt="screenshotAlt" class="rounded-xl ring-1 ring-base-300 shadow-2xl" width="2432" height="1442" /> -->
            </div>
        </div>
        <div class="max-w-7xl sm:mt-12 md:mt-16 lg:px-8 px-6 mx-auto mt-10">
            <dl v-if="features && features.length > 0"
                class="gap-x-6 gap-y-10 text-md text-pretty sm:grid-cols-2 lg:mx-0 lg:max-w-none lg:grid-cols-3 lg:gap-x-8 lg:gap-y-16 grid max-w-2xl grid-cols-1 mx-auto">
                <div v-for="feature, i in features" :key="i + feature.name" class="pl-9 relative">
                    <dt class="text-base-content inline font-semibold">
                        <component v-if="feature.icon" :is="feature.icon"
                            class="top-1 left-1 size-6 text-secondary absolute" aria-hidden="true" />
                        {{ feature.name }}.
                    </dt>
                    {{ ' ' }}
                    <dd class="inline" v-html="feature.description"></dd>
                </div>
            </dl>

            <!-- Slot for custom features content -->
            <div v-if="$slots.features">
                <slot name="features" />
            </div>

            <!-- Default slot for any additional content -->
            <div v-if="$slots.default" class="mt-16">
                <slot />
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { BellAlertIcon, ClockIcon, CodeBracketIcon, CurrencyDollarIcon, DevicePhoneMobileIcon, WindowIcon } from '@heroicons/vue/20/solid'

const features: Feature[] = [
        { name: 'Engaging experience', description: `Your readers swipe through steps, interacting with your recipes in an immersive experience&mdash;increasing engagement and reducing frustration`, icon: CodeBracketIcon },
        { name: 'Smart timers', description: 'Create Studio parses your instructions to generate built-in timers to keep readers on-page', icon: BellAlertIcon },
        { name: 'Saved progress', description: 'Readers can close Interactive Mode, pause timers, or refresh the page and pick up where they left off next time they open it', icon: WindowIcon },
        { name: 'Distraction-free view', description: 'Clean, focused interface keeps readers cooking instead of scrolling past ads and pop-ups, losing their place and getting frustrated', icon: DevicePhoneMobileIcon },
        { name: 'Longer site visits', description: 'Readers stay engaged with your content throughout the entire cooking process', icon: ClockIcon },
        { name: 'Ad supported', description: `You get free access to all of Create's premium features, just from the ads on this feature. Or use your ads for a small fee!'`, icon: CurrencyDollarIcon },
]

interface Feature {
    name: string
    description: string
    icon?: any
}

interface Props {
    eyebrow?: string
    title: string
    description?: string
    screenshot?: string
    screenshotLight?: string
    screenshotDark?: string
    screenshotAlt?: string
    demoRecipeUrl?: string
}

withDefaults(defineProps<Props>(), {
    screenshotAlt: 'App screenshot'
})

const showIframe = ref(false)
</script>