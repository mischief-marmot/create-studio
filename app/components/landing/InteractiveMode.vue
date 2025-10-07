<template>
    <div id="interactive-mode" class="bg-base-100 py-16 sm:py-24">
        <div class="mx-auto max-w-7xl px-6 lg:px-8">
            <div class="mx-auto max-w-4xl text-center">
                <h2 v-if="eyebrow" class="text-md font-semibold text-secondary">{{ eyebrow }}</h2>
                <p
                    class="mt-2 text-6xl sm:text-7xl font-serif text-pretty text-base-content md:text-8xl sm:text-balance">
                    {{ title }}</p>
                <p v-if="description" class="mt-4 sm:mt-6 max-w-2xl mx-auto text-lg/8 text-pretty">{{ description }}</p>

                <!-- Slot for custom header content -->
                <div v-if="$slots.header" class="mt-6">
                    <slot name="header" />
                </div>
            </div>
        </div>
        <div class="relative overflow-hidden py-12">
            <div class="w-full mx-auto max-w-7xl px-4 lg:px-8">
                <div class="relative rounded-xl shadow-2xl shadow-base-200 ring-1 ring-base-200 overflow-hidden max-w-[412px] max-h-[760px] w-full h-screen lg:max-h-[720px] md:max-w-none mx-auto"
                :class="[
                    showIframe ? '' : 'p-3'
                ]"
                >
                    <div v-if="!showIframe" class="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-accent via-rose-300 to-warning z-0"></div>

                    <!-- Button placeholder before iframe loads -->
                    <div v-if="!showIframe" class="relative size-full flex items-center justify-center bg-white dark:bg-base-200 rounded-xl z-10">
                        <button @click="showIframe = true" 
                        :class="[
                            'btn font-normal btn-xl sm:btn-2xl gap-2 py-10',
                            'bg-slate-800 dark:bg-white text-white dark:text-slate-800'
                            ]"
                        >
                            <LogoSolo class="animate-[spin_4s_linear_infinite] size-12" />
                            Try Interactive Mode
                        </button>
                    </div>

                    <!-- Iframe loads on button click -->
                    <iframe v-if="showIframe" :src="demoRecipeUrl" class="relative w-full h-full border-0 lg:aspect-video rounded-xl overflow-hidden z-10"
                        frameborder="0"
                        allow="camera; microphone; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        title="Interactive Mode Demo" loading="lazy" />
                </div>
                <p v-if="showIframe" class="pt-4 text-center text-sm text-base-content italic">Try it out! Interact with the recipe above (from <a href="https://thesweetestoccasion.com/" target="_blank">The Sweetest Occasion</a>).</p>

                <!-- <img v-if="screenshot && !screenshotLight && !screenshotDark" :src="screenshot" :alt="screenshotAlt" class="rounded-xl shadow-2xl ring-1 ring-base-300" width="2432" height="1442" /> -->
            </div>
        </div>
        <div class="mx-auto mt-10 max-w-7xl px-6 sm:mt-12 md:mt-16 lg:px-8">
            <dl v-if="features && features.length > 0"
                class="mx-auto grid max-w-2xl grid-cols-1 gap-x-6 gap-y-10 text-md text-pretty sm:grid-cols-2 lg:mx-0 lg:max-w-none lg:grid-cols-3 lg:gap-x-8 lg:gap-y-16">
                <div v-for="feature, i in features" :key="i + feature.name" class="relative pl-9">
                    <dt class="inline font-semibold text-base-content">
                        <component v-if="feature.icon" :is="feature.icon"
                            class="absolute top-1 left-1 size-6 text-secondary" aria-hidden="true" />
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
import { BellAlertIcon, ClockIcon, CodeBracketIcon, CurrencyDollarIcon, DevicePhoneMobileIcon, WindowIcon } from '@heroicons/vue/20/solid';

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