<template>
    <div class="h-dvh flex flex-col w-full relative">
        <button
            type="button"
            aria-label="Close"
            class="btn btn-circle btn-sm btn-ghost bg-base-100/80 hover:bg-base-100 fixed top-3 right-3 z-50 backdrop-blur-sm shadow"
            @click="handleClose"
        >
            <XMarkIcon class="w-5 h-5" />
        </button>
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
import { XMarkIcon } from '@heroicons/vue/20/solid';

const { loadAds } = useRuntimeConfig().public;

// Track if adhesion mobile wrapper exists
const hasAdhesionWrapper = ref(false);

// In iframe: ask parent to close. In the FreePlus new-tab flow: window.close() succeeds
// because the tab was script-opened. On a direct visit window.close() is a no-op — we
// intentionally don't fall back to history.back() there (would surprise search-referred
// visitors), only to a known referrer.
function handleClose() {
    if (window.parent !== window) {
        window.parent.postMessage({ type: 'CREATE_STUDIO_CLOSE_MODAL' }, '*');
        return;
    }
    window.close();
    if (document.referrer) {
        setTimeout(() => {
            window.location.href = document.referrer;
        }, 100);
    }
}

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
            hideAttribution: false,
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
