<template>
  <div
    ref="containerRef"
    :class="[ 'cs:w-full cs:bg-base-100 cs:flex cs:flex-col cs:h-full cs:overflow-hidden', 'cs:md:flex-row cs:md:max-w-7xl cs:md:max-h-[80vh] cs:md:mx-auto cs:md:my-auto cs:md:gap-8' ]"
    :style="isMobile ? { height: `${containerHeight}px` } : {}"
  >

    <!-- Image section skeleton - Collapsible on mobile, fixed on desktop -->
    <div
      :class="[ 'cs:skeleton cs:flex-shrink-0', 'cs:md:w-2/5 cs:md:h-full cs:md:max-h-4/5', isMobile ? 'cs:-mb-6' : '' ]"
      :style="isMobile ? { height: `${imageHeight}px` } : {}"
    >
    </div>

    <!-- Content section skeleton with rounded top corners on mobile, side panel on desktop -->
    <div class="cs:flex-1 cs:overflow-hidden cs:flex cs:flex-col cs:relative cs:z-10 cs:bg-base-100 cs:rounded-t-3xl cs:md:rounded-none cs:md:w-3/5 cs:md:max-h-[80vh]">
      <!-- Draggable Handle skeleton - Mobile only -->
      <div v-if="isMobile" class="cs:absolute cs:top-0 cs:left-0 cs:right-0 cs:h-8 cs:flex cs:items-start cs:justify-center cs:pt-2 cs:z-20">
        <div class="cs:w-12 cs:h-1 cs:bg-base-content/20 cs:rounded-full"></div>
      </div>
      <div class="cs:flex-1 cs:overflow-y-auto">
        <div class="cs:p-6 cs:space-y-6">
          <!-- Step header skeleton -->
          <div class="cs:space-y-3">
            <div class="cs:skeleton cs:h-8 cs:w-24"></div>
            <div class="cs:skeleton cs:h-6 cs:w-3/4"></div>
            <div class="cs:space-y-2">
              <div class="cs:skeleton cs:h-4 cs:w-full"></div>
              <div class="cs:skeleton cs:h-4 cs:w-5/6"></div>
              <div class="cs:skeleton cs:h-4 cs:w-2/3"></div>
            </div>
          </div>

          
        </div>
      </div>

      <!-- Bottom navigation skeleton - Fixed at bottom for both mobile and desktop -->
      <div class="cs:flex-shrink-0 cs:bg-base-200 cs:border-t cs:border-base-300 cs:relative cs:md:absolute cs:md:bottom-0 cs:md:left-0 cs:md:right-0">

        <!-- Navigation controls skeleton -->
        <div class="cs:p-4">
          <div class="cs:flex cs:items-center cs:justify-between">
            <!-- Back button -->
            <div class="cs:skeleton cs:w-16 cs:h-10 cs:rounded-lg"></div>

            <!-- Progress indicator -->
            <div class="cs:flex-1 cs:flex cs:justify-center cs:items-center cs:space-x-1">
              <div class="cs:skeleton cs:w-32 cs:h-10 cs:rounded-lg"></div>
            </div>

            <!-- Next button -->
            <div class="cs:skeleton cs:w-16 cs:h-10 cs:rounded-lg"></div>
          </div>
        </div>
      </div>
      <div v-if="isMobile" class="cs:py-4">
        <div class="cs:h-10"></div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue';

const containerRef = ref<HTMLElement>();

// Mobile detection
const isMobile = ref(false);

// Calculate viewport-based heights (same logic as the main interactive page)
const containerHeight = ref(1024); // Default fallback
const imageHeight = ref(256); // Default fallback (25% of 1024)

// Calculate heights based on viewport
const calculateHeights = () => {
  if (typeof window === 'undefined') return;

  const viewportHeight = window.innerHeight;
  const calculatedHeight = Math.min(viewportHeight, 1024); // Max height like md:max-h-256 (1024px)

  containerHeight.value = calculatedHeight;
  imageHeight.value = Math.round(calculatedHeight * 0.25); // 25% for image section
};

// Initialize heights on mount
onMounted(() => {
  // Detect if device is mobile/tablet
  isMobile.value = window.matchMedia('(max-width: 768px)').matches;

  // Listen for screen size changes
  const mediaQuery = window.matchMedia('(max-width: 768px)');
  const handleMediaChange = (e: MediaQueryListEvent) => {
    isMobile.value = e.matches;
  };
  mediaQuery.addEventListener('change', handleMediaChange);

  calculateHeights();

  onUnmounted(() => {
    mediaQuery.removeEventListener('change', handleMediaChange);
  });
});
</script>