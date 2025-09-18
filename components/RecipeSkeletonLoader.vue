<template>
  <div
    ref="containerRef"
    :class="[
      'w-full bg-base-100 flex flex-col h-full overflow-hidden',
      'md:flex-row md:max-w-7xl md:max-h-[80vh] md:mx-auto md:my-auto md:gap-8'
    ]"
    :style="isMobile ? { height: `${containerHeight}px` } : {}"
  >

    <!-- Image section skeleton - Collapsible on mobile, fixed on desktop -->
    <div
      :class="[
        'skeleton flex-shrink-0',
        'md:w-2/5 md:h-full md:max-h-4/5',
        isMobile ? '-mb-6' : ''
      ]"
      :style="isMobile ? { height: `${imageHeight}px` } : {}"
    >
    </div>

    <!-- Content section skeleton with rounded top corners on mobile, side panel on desktop -->
    <div class="flex-1 overflow-hidden flex flex-col relative z-10 bg-base-100 rounded-t-3xl md:rounded-none md:w-3/5 md:max-h-[80vh]">
      <!-- Draggable Handle skeleton - Mobile only -->
      <div v-if="isMobile" class="absolute top-0 left-0 right-0 h-8 flex items-start justify-center pt-2 z-20">
        <div class="w-12 h-1 bg-base-content/20 rounded-full"></div>
      </div>
      <div class="flex-1 overflow-y-auto">
        <div class="p-6 space-y-6">
          <!-- Step header skeleton -->
          <div class="space-y-3">
            <div class="skeleton h-8 w-24"></div>
            <div class="skeleton h-6 w-3/4"></div>
            <div class="space-y-2">
              <div class="skeleton h-4 w-full"></div>
              <div class="skeleton h-4 w-5/6"></div>
              <div class="skeleton h-4 w-2/3"></div>
            </div>
          </div>

          
        </div>
      </div>

      <!-- Bottom navigation skeleton - Fixed at bottom for both mobile and desktop -->
      <div class="flex-shrink-0 bg-base-200 border-t border-base-300 relative md:absolute md:bottom-0 md:left-0 md:right-0">

        <!-- Navigation controls skeleton -->
        <div class="p-4">
          <div class="flex items-center justify-between">
            <!-- Back button -->
            <div class="skeleton w-16 h-10 rounded-lg"></div>

            <!-- Progress indicator -->
            <div class="flex-1 flex justify-center items-center space-x-1">
              <div class="skeleton w-32 h-10 rounded-lg"></div>
            </div>

            <!-- Next button -->
            <div class="skeleton w-16 h-10 rounded-lg"></div>
          </div>
        </div>
      </div>
      <div v-if="isMobile" class="py-4">
        <div class="h-10"></div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
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