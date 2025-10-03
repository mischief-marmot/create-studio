<template>
  <div>
    <button
      class="btn bg-[#d42147] btn-sm text-amber-50"
      @click="openModal"
    >
      {{ buttonText }}
    </button>

    <Teleport to="body">
      <!-- Side-by-side Modal Container -->
      <div
        v-if="showModal"
        :class="[
          'fixed top-0 left-0 h-full flex z-[1000000000]',
          `w-[${viewportWidth}px]`
        ]"
        :style="{ transform: `translateX(${scrollPosition}px)`}"
      >
        <!-- Original Content Area -->
        <div class="w-screen h-full overflow-auto">
          <!-- This div serves as a placeholder for the original viewport content -->
        </div>

        <!-- Modal Content Area -->
        <div
          class="w-screen h-full bg-base-100 relative flex items-center justify-center"
        >
          <button
            class="absolute top-4 right-4 p-2 rounded-full bg-base-300 dark:bg-gray-700 hover:bg-base-200 dark:hover:bg-gray-600 transition-colors z-10"
            @click="closeModal"
            aria-label="Close"
          >
            <XMarkIcon class="w-6 h-6" />
          </button>

          <div
            :id="`create-studio-modal-${config.creationId}`"
            class="w-full h-full mx-auto"
          >
            <iframe
              :src="iframeSrc"
              class="w-full h-full shadow-xl"
              :title="`${config.creationName} - Interactive Mode`"
              frameborder="0"
              allow="camera; microphone; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            />
          </div>
        </div>
      </div>

      <!-- Overlay to prevent interaction with original content -->
      <div
        v-if="showModal"
        class="fixed top-0 left-0 w-screen h-full z-[999999999]"
        @click="handleOverlayClick"
      />
    </Teleport>
  </div>
</template>
 
<script setup lang="ts">
import { XMarkIcon } from '@heroicons/vue/20/solid'
import { ref, computed, inject, onMounted, onBeforeUnmount } from 'vue'
import { SharedStorageManager } from '#shared/lib/shared-storage/shared-storage-manager'
import { createCreationKey, normalizeDomain } from '#shared/utils/domain'
import { useLogger } from '#shared/utils/logger'

const logger = useLogger('InteractiveModeWidget')

interface Props {
  config: {
    creationId: string
    creationName?: string
    buttonText?: string
    siteUrl?: string 
    embedUrl?: string
    theme?: Record<string, string>
  }
  storage?: any
}

const props = defineProps<Props>()

const globalConfig = inject<any>('widgetConfig')
const theme = inject<any>('widgetTheme')

const showModal = ref(false)
const scrollPosition = ref(0)
const viewportWidth = ref(window.innerWidth)

// Mobile detection
const isMobile = ref(false)

// Initialize shared storage manager
const storageManager = new SharedStorageManager()

// Theme support can be added later if needed via CSS custom properties

// Create creation key from domain and creation ID
const creationKey = computed(() => {
  const siteUrl = props.config.siteUrl || globalConfig?.siteUrl || window.location.origin
  const domain = normalizeDomain(siteUrl)
  return createCreationKey(domain, props.config.creationId)
})

// Dynamic button text based on interaction state
const buttonText = computed(() => {
  if (props.config.buttonText) {
    return props.config.buttonText
  }
  
  // Check if user has interacted with this creation
  const creationState = storageManager.getCreationState(creationKey.value)
  const hasInteracted = creationState?.hasInteracted || false
  
  return hasInteracted ? 'Continue' : 'Try Interactive Mode!'
})

const iframeSrc = computed(() => {
  logger.debug('Props', props.config)
  const baseUrl = props.config.embedUrl || globalConfig?._meta?.baseUrl || window.location.origin

  return `${baseUrl}/creations/${creationKey.value}/interactive`
})

function openModal() {
  showModal.value = true

  // Capture current viewport and scroll to modal
  viewportWidth.value = window.innerWidth

  // Save original body overflow style
  document.body.style.overflow = 'hidden'

  // Animate scroll to the modal (slide to the right)
  scrollPosition.value = -viewportWidth.value

  // Initialize creation in shared storage when modal opens
  const siteUrl = props.config.siteUrl || globalConfig?.siteUrl || window.location.origin
  const domain = normalizeDomain(siteUrl)
  storageManager.initializeCreation(domain, props.config.creationId)

  if (globalConfig?._meta?.debug) {
    logger.debug('Create Studio Interactive mode opened for creation:', props.config.creationId)
    logger.debug('Creation key:', creationKey.value)
    logger.debug('iframe src:', iframeSrc.value)
    logger.debug('Mobile mode:', isMobile.value)
    logger.debug('Viewport width:', viewportWidth)
  }
}

function closeModal() {
  // Animate scroll back to original content
  scrollPosition.value = 0
  showModal.value = false

  // Restore body overflow
  document.body.style.overflow = ''
}

function handleOverlayClick(event: MouseEvent) {
  logger.debug('Overlay click', event.target, event.currentTarget)
  if (event.target === event.currentTarget) {
    logger.debug('Closing modal due to overlay click')
    closeModal()
  }
}

function handleEscKey(event: KeyboardEvent) {
  if (event.key === 'Escape' && showModal.value) {
    closeModal()
  }
}

function handleResize() {
  viewportWidth.value = window.innerWidth
  // Update scroll position if modal is open to maintain alignment
  if (showModal.value) {
    scrollPosition.value = -viewportWidth.value
  }
}

onMounted(() => {
  // Detect if device is mobile/tablet
  isMobile.value = window.matchMedia('(max-width: 768px)').matches

  // Listen for screen size changes
  const mediaQuery = window.matchMedia('(max-width: 768px)')
  const handleMediaChange = (e: MediaQueryListEvent) => {
    isMobile.value = e.matches
  }
  mediaQuery.addEventListener('change', handleMediaChange)

  // Add resize listener for viewport width updates
  window.addEventListener('resize', handleResize)

  document.addEventListener('keydown', handleEscKey)

  // Cleanup function for media query listener
  onBeforeUnmount(() => {
    mediaQuery.removeEventListener('change', handleMediaChange)
  })
})

onBeforeUnmount(() => {
  document.removeEventListener('keydown', handleEscKey)
  window.removeEventListener('resize', handleResize)
})
</script>

