<template>
    <div class="bg-base-100 py-24 sm:py-32">
        <div class="mx-auto max-w-7xl px-6 lg:px-8">
            <div class="mx-auto max-w-2xl sm:text-center">
                <h2 v-if="eyebrow" class="text-xl font-semibold text-secondary">{{ eyebrow }}</h2>
                <p
                    class="mt-2 text-4xl font-semibold tracking-tight text-pretty text-base-content sm:text-5xl sm:text-balance">
                    {{ title }}</p>
                <p v-if="description" class="mt-6 text-lg/8 opacity-80">{{ description }}</p>

                <!-- Slot for custom header content -->
                <div v-if="$slots.header" class="mt-6">
                    <slot name="header" />
                </div>
            </div>
        </div>
        <div class="relative overflow-hidden py-12">
            <div class="w-full mx-auto max-w-7xl px-4 lg:px-8">
                <div class="relative p-3 rounded-xl shadow-2xl shadow-base-200 ring-1 ring-base-200 overflow-hidden max-w-[412px] max-h-[760px] w-full h-screen lg:max-h-[720px] md:max-w-none mx-auto">
                    <div class="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-accent via-rose-300 to-warning z-0"></div>

                    <!-- Button placeholder before iframe loads -->
                    <div v-if="!showIframe" class="relative w-full h-full flex items-center justify-center bg-white dark:bg-base-200 rounded-xl z-10">
                        <button @click="showIframe = true" 
                        :class="[
                            'btn font-normal btn-2xl gap-2',
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
                <p class="pt-4 text-center text-sm text-base-content italic">Try it out! Interact with the recipe above (from <a href="https://thesweetestoccasion.com/" target="_blank">The Sweetest Occasion</a>).</p>

                <!-- <img v-if="screenshot && !screenshotLight && !screenshotDark" :src="screenshot" :alt="screenshotAlt" class="rounded-xl shadow-2xl ring-1 ring-base-300" width="2432" height="1442" /> -->
            </div>
        </div>
        <div class="mx-auto mt-10 max-w-7xl px-6 sm:mt-12 md:mt-16 lg:px-8">
            <dl v-if="features && features.length > 0"
                class="mx-auto grid max-w-2xl grid-cols-1 gap-x-6 gap-y-10 text-base/7 opacity-80 sm:grid-cols-2 lg:mx-0 lg:max-w-none lg:grid-cols-3 lg:gap-x-8 lg:gap-y-16">
                <div v-for="feature in features" :key="feature.name" class="relative pl-9">
                    <dt class="inline font-semibold text-base-content">
                        <component v-if="feature.icon" :is="feature.icon"
                            class="absolute top-1 left-1 size-6 text-secondary" aria-hidden="true" />
                        {{ feature.name }}.
                    </dt>
                    {{ ' ' }}
                    <dd class="inline">{{ feature.description }}</dd>
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
    demoRecipeUrl?: string
}

withDefaults(defineProps<Props>(), {
    screenshotAlt: 'App screenshot'
})

const showIframe = ref(false)
</script>