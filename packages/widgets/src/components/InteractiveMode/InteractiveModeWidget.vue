<template>
  <div>
    <button
      class="cs:inline-flex cs:items-center cs:justify-center cs:px-4 cs:py-2 cs:text-sm cs:font-medium cs:rounded-md cs:border-none cs:cursor-pointer cs:transition-all cs:duration-200 cs:bg-primary cs:text-primary-content cs:hover:opacity-90"
      @click="openModal"
    >
      {{ buttonText }}
    </button>

    <Teleport to="body">
      <!-- Side-by-side Modal Container -->
      <div
        v-if="showModal"
        class="cs:fixed cs:top-0 cs:left-0 cs:h-screen cs:flex cs:z-[1000000000] cs:font-sans"
      >
        <!-- Original Content Area -->
        <!-- <div class="cs:w-screen cs:h-full cs:overflow-auto"> -->
          <!-- This div serves as a placeholder for the original viewport content -->
        <!-- </div> -->

        <!-- Modal Content Area -->
        <div class="cs:w-screen cs:h-full cs:bg-gray-100 cs:relative cs:flex cs:items-center cs:justify-center">
          <button
            class="cs:absolute cs:top-4 cs:right-4 cs:p-2 cs:rounded-full cs:bg-gray-200 cs:transition-all cs:duration-200 cs:cursor-pointer cs:border-none cs:flex cs:items-center cs:justify-center cs:z-10 cs:hover:bg-gray-300"
            @click="closeModal"
            aria-label="Close"
          >
            <XMarkIcon class="cs:w-6 cs:h-6" />
          </button>

          <div
            :id="`create-studio-modal-${config.creationId}`"
            class="cs:w-full cs:h-full cs:mx-auto"
          >
            <iframe
              v-if="!inDomRendering"
              :src="iframeSrc"
              class="cs:w-full cs:h-full cs:shadow-xl"
              :title="`${config.creationName} - Interactive Mode`"
              frameborder="0"
              allow="camera; microphone; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            />
            <InteractiveExperience
              v-else
              :creation-id="config.creationId"
              :domain="domain"
              :base-url="baseUrl"
              hide-attribution
              class="cs:w-full cs:h-full"
            />
          </div>
        </div>
      </div>

      <!-- Overlay to prevent interaction with original content -->
      <div
        v-if="showModal"
        class="cs:fixed cs:top-0 cs:left-0 cs:w-screen cs:h-screen cs:z-[999999999] cs:cursor-pointer"
        @click="handleOverlayClick"
      />
    </Teleport>
  </div>
</template>
 
<script setup lang="ts">
import { XMarkIcon } from '@heroicons/vue/20/solid'
import { ref, computed, inject, onMounted, onBeforeUnmount } from 'vue'
import { SharedStorageManager } from '@create-studio/shared/lib/shared-storage/shared-storage-manager'
import { createCreationKey, normalizeDomain } from '@create-studio/shared/utils/domain'
import { useLogger } from '@create-studio/shared/utils/logger'
import InteractiveExperience from '../InteractiveExperience.vue'

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

// Check if in-DOM rendering is enabled (Pro tier feature)
const inDomRendering = computed(() => {
  return globalConfig?.features?.inDomRendering || false
})

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

// Extract domain from site URL for InteractiveExperience
const domain = computed(() => {
  const siteUrl = props.config.siteUrl || globalConfig?.siteUrl || window.location.origin
  return normalizeDomain(siteUrl)
})

// Base URL for API calls
const baseUrl = computed(() => {
  return props.config.embedUrl || globalConfig?._meta?.baseUrl || window.location.origin
})

const iframeSrc = computed(() => {
  logger.debug('Props', props.config)
  return `${baseUrl.value}/creations/${creationKey.value}/interactive`
})

function openModal() {
  logger.info('🎬 Opening modal', {
    inDomRendering: inDomRendering.value,
    creationId: props.config.creationId,
    creationKey: creationKey.value,
    iframeSrc: iframeSrc.value,
    baseUrl: baseUrl.value,
    globalConfig: globalConfig
  })

  showModal.value = true
  logger.debug('✅ showModal set to true')

  // Capture current viewport and scroll to modal
  viewportWidth.value = window.innerWidth
  logger.debug('📐 Viewport width:', viewportWidth.value)

  // Save original body overflow style
  document.body.style.overflow = 'hidden'
  logger.debug('🔒 Body overflow hidden')

  // Set scroll position to 0 to show modal in viewport
  scrollPosition.value = 0
  logger.debug('📍 Scroll position set to:', scrollPosition.value)

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

  // Add message listener for notification permission requests from iframe
  window.addEventListener('message', handleNotificationPermissionRequest)

  // Cleanup function for media query listener
  onBeforeUnmount(() => {
    mediaQuery.removeEventListener('change', handleMediaChange)
  })
})

// Handle notification permission request from iframe
async function handleNotificationPermissionRequest(event: MessageEvent) {
  // Only process our specific message type
  if (event.data?.type !== 'CREATE_STUDIO_REQUEST_NOTIFICATION_PERMISSION') {
    return
  }

  logger.info('📨 Received notification permission request from iframe:', event.data.data)

  // Request notification permission in parent window context
  if ('Notification' in window) {
    logger.info('📊 Current permission:', Notification.permission)

    if (Notification.permission === 'default') {
      logger.info('🔔 Requesting browser notification permission...')

      try {
        const permission = await Notification.requestPermission()
        logger.info('📋 Browser permission result:', permission)

        if (permission === 'granted') {
          logger.info('✅ Notifications enabled!')
          // Could register timer with Service Worker here if needed in the future
        }
      } catch (error) {
        logger.error('⚠️  Error requesting notification permission:', error)
      }
    } else if (Notification.permission === 'granted') {
      logger.info('✅ Notifications already granted')
    } else {
      logger.warn('❌ Notifications are blocked')
    }
  }
}

onBeforeUnmount(() => {
  document.removeEventListener('keydown', handleEscKey)
  window.removeEventListener('resize', handleResize)
  window.removeEventListener('message', handleNotificationPermissionRequest)
})
</script>

