<template>
  <div>
    <button 
      class="btn bg-amber-500 btn-sm text-amber-50"
      @click="openModal"
    >
      {{ buttonText }}
    </button>
    
    <Teleport to="body">
      <!-- Desktop Modal Overlay -->
      <div 
        v-if="showModal"
        :class="[
          'fixed inset-0 flex items-center justify-center w-full h-full',
          isMobile ? ' top-0 left-0 z-[10000000000]' : 'bg-black/80 z-[1000000000] '
          ]"
        @click="handleOverlayClick"
      >
        <div 
          :id="`create-studio-modal-${config.creationId}`"
          class="md:rounded-lg md:shadow-xl md:max-w-lg md:max-h-256 w-full h-full relative overflow-hidden z-[1001]"
          @click="$event.stopPropagation()"
        >
          <button 
            class="close-button"
            @click="closeModal"
            aria-label="Close"
          >
            <XMarkIcon class="w-5 h-5" />
          </button> 
          <iframe 
            :src="iframeSrc"
            class="w-full h-full md:rounded-lg"
            :title="`${config.creationName} - Interactive Mode`"
            frameborder="0"
            allow="camera; microphone; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          />
        </div>
      </div>
    </Teleport>
  </div>
</template>
 
<script setup lang="ts">
import { XMarkIcon } from '@heroicons/vue/20/solid'
import { ref, computed, inject, onMounted, onBeforeUnmount } from 'vue'
import { SharedStorageManager } from '~/lib/shared-storage/shared-storage-manager'
import { createCreationKey, normalizeDomain } from '~/utils/domain'
import { useLogger } from '~/utils/logger'

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
  
  // Initialize creation in shared storage when modal opens
  const siteUrl = props.config.siteUrl || globalConfig?.siteUrl || window.location.origin
  const domain = normalizeDomain(siteUrl)
  storageManager.initializeCreation(domain, props.config.creationId)
  
  if (globalConfig?._meta?.debug) {
    logger.debug('Create Studio Interactive mode opened for creation:', props.config.creationId)
    logger.debug('Creation key:', creationKey.value)
    logger.debug('iframe src:', iframeSrc.value)
    logger.debug('Mobile mode:', isMobile.value)
  }
}

function closeModal() {
  showModal.value = false
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

onMounted(() => {
  // Detect if device is mobile/tablet
  isMobile.value = window.matchMedia('(max-width: 768px)').matches
  
  // Listen for screen size changes
  const mediaQuery = window.matchMedia('(max-width: 768px)')
  const handleMediaChange = (e: MediaQueryListEvent) => {
    isMobile.value = e.matches
  }
  mediaQuery.addEventListener('change', handleMediaChange)
  
  document.addEventListener('keydown', handleEscKey)
  
  // Cleanup function for media query listener
  onBeforeUnmount(() => {
    mediaQuery.removeEventListener('change', handleMediaChange)
  })
})

onBeforeUnmount(() => {
  document.removeEventListener('keydown', handleEscKey)
})
</script>

