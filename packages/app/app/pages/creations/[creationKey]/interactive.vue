<template>
    <div class="h-dvh flex flex-col w-full">
        <div
            v-if="creationInfo"
            :id="`interactive-widget-${creationInfo.creationId}`"
            class="flex-1 min-h-0"
        />
        <div v-else class="bg-base-300 flex items-center justify-center flex-1 w-full">
            <div class="p-8 text-center">
                <h2 class="text-error mb-4 text-2xl font-bold">Invalid Creation</h2>
                <p class="text-base-content mb-4">The creation key provided is not valid.</p>
                <a href="/" class="btn btn-primary">Back to Home</a>
            </div>
        </div>
        <!-- ad slot -->
        <div v-if="loadAds" :class="['flex-shrink-0 bg-base-300 text-base-content h-[54px] w-full p-2 md:hidden', hasAdhesionWrapper ? 'hidden' : '']">
            <div class="mv_slot_target" data-slot="recipe" data-hint-slot-sizes="320x50"></div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { parseCreationKey } from '@create-studio/shared';
import { onMounted, ref } from 'vue';

const { loadAds } = useRuntimeConfig().public;

// Track if adhesion mobile wrapper exists
const hasAdhesionWrapper = ref(false);

if (loadAds) {
    useScript({
        src: 'https://scripts.mediavine.com/tags/create-studio-1.js',
        async: true,
        fetchpriority: 'high',
        crossorigin: 'anonymous',
        'data-noptimize': '1',
        'data-cfasync': 'false'
    },
    {
        trigger: 'onNuxtReady'
    });
}

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
const cacheBust = route.query.cache_bust === 'true' ? `?v=${Date.now()}` : ''

useScript({
   src: `/embed/main.js${cacheBust}`,
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

const disableRatingSubmission = route.query.disableRatingSubmission === 'true';

onMounted(async () => {
    if (!creationInfo) return;

    // Listen for Escape key to close modal (when in iframe)
    const handleEscKey = (event: KeyboardEvent) => {
        if (event.key === 'Escape' && window.parent !== window) {
            console.log('🔑 Escape pressed in iframe, sending close message to parent');
            window.parent.postMessage({
                type: 'CREATE_STUDIO_CLOSE_MODAL'
            }, '*');
        }
    };
    document.addEventListener('keydown', handleEscKey);

    // Notify parent window to hide Grow widget (when in iframe)
    if (window.parent !== window) {
        window.parent.postMessage({
            type: 'CREATE_STUDIO_INTERACTIVE_MOUNTED',
            action: 'hide-grow-widget'
        }, '*');
    }

    // Check if adhesion mobile wrapper exists (only relevant when ads are enabled)
    if (loadAds) {
        const checkAdhesionWrapper = () => {
            hasAdhesionWrapper.value = !!document.getElementById('adhesion_mobile_wrapper');
        };

        // Check immediately
        checkAdhesionWrapper();

        // Also check after a delay in case ads load asynchronously
        setTimeout(checkAdhesionWrapper, 1000);
        setTimeout(checkAdhesionWrapper, 3000);
    }

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

    // SDK base64-encodes siteUrl as the /api/v2/site-config/<key> param;
    // a bare domain produces a key the server rejects. Add a protocol.
    // 8074 is the WP plugin docker-stack's port for `create.test`.
    const domain = creationInfo.domain;
    let siteUrl: string;
    if (domain === 'localhost') siteUrl = 'http://localhost:8074';
    else if (domain.endsWith('.test')) siteUrl = `http://${domain}`;
    else siteUrl = `${window.location.protocol}//${domain}`;

    // Initialize the SDK
    await window.CreateStudio.init({
        siteUrl,
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
