<template>
    <div class="h-dvh w-full">
        <div
            v-if="creationInfo"
            :id="`interactive-widget-${creationInfo.creationId}`"
        />
        <div v-else class="bg-base-300 flex items-center justify-center w-full h-full">
            <div class="p-8 text-center">
                <h2 class="text-error mb-4 text-2xl font-bold">Invalid Creation</h2>
                <p class="text-base-content mb-4">The creation key provided is not valid.</p>
                <a href="/" class="btn btn-primary">Back to Home</a>
            </div>
        </div>
        <!-- ad slot -->
        <div class="hidden flex-shrink-0 bg-base-300 text-base-content h-[50px] w-full p-2 md:hidden">
            <div class="mv_slot_target" data-slot="recipe" data-hint-slot-sizes="320x50"></div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { parseCreationKey } from '@create-studio/shared';
import { onMounted } from 'vue';

useScript({
    src: 'https://scripts.mediavine.com/tags/aj-test-2026.js',
    async: true,
    fetchpriority: 'high',
    crossorigin: 'anonymous',
    'data-noptimize': '1',
    'data-cfasync': 'false'
},
{
    trigger: 'onNuxtReady'
});

// Load widget CSS
useHead({
    link: [
        {
            rel: 'stylesheet',
            href: '/embed/entry.css'
        }
    ]
});


const route = useRoute();

// Add version query param for cache busting in development
const widgetVersion = route.query.cache_bust === 'true' ? `?v=${Date.now()}` : ''

useScript({
   src: `/embed/main.js${widgetVersion}`,
    type: 'module',
    id: 'create-studio-embed',
    crossorigin: 'anonymous',
    async: true,
    defer: false,
    fetchPriority: 'high',
})
const creationKey = route.params.creationKey as string;

// Parse creation key to get domain and creation ID
const creationInfo = parseCreationKey(creationKey);
if (!creationInfo) {
    throw createError({
        statusCode: 404,
        statusMessage: 'Invalid creation key'
    });
}

const cacheBust = route.query.cache_bust === 'true';
const disableRatingSubmission = route.query.disableRatingSubmission === 'true';

onMounted(async () => {
    if (!creationInfo) return;

    // Wait for CreateStudio SDK to be available
    const waitForSDK = () => {
        return new Promise<void>((resolve) => {
            if (window.CreateStudio) {
                resolve();
            } else {
                const checkInterval = setInterval(() => {
                    if (window.CreateStudio) {
                        clearInterval(checkInterval);
                        resolve();
                    }
                }, 100);
            }
        });
    };

    await waitForSDK();

    // Initialize the SDK
    await window.CreateStudio.init({
        siteUrl: creationInfo.domain,
        baseUrl: window.location.origin,
        debug: true
    });

    // Mount the interactive experience widget directly
    const targetElement = document.getElementById(`interactive-widget-${creationInfo.creationId}`);
    if (targetElement) {
        await window.CreateStudio.mount('interactive-experience', targetElement, {
            creationId: creationInfo.creationId,
            domain: creationInfo.domain,
            baseUrl: window.location.origin,
            hideAttribution: true,
            disableRatingSubmission
        });
        targetElement.style.height = '100%'
    }
});
</script>

<style scoped>
:root, [data-theme] {
    background-color: transparent;
}
</style>
