<template>
  <div>
    <button 
      class="btn btn-primary btn-sm"
      @click="openModal"
    >
      {{ buttonText }}
    </button>
    
    <Teleport to="body">
      <!-- Desktop Modal Overlay -->
      <div 
        v-if="showModal"
        :class="[
          'fixed inset-0 z-[1000] flex items-center justify-center w-full h-full',
          isMobile ? ' top-0 left-0 z-50' : 'bg-black/80 '
          ]"
        @click="handleOverlayClick"
      >
        <div 
          :id="`create-studio-modal-${config.creationId}`"
          class="md:rounded-lg md:shadow-xl md:max-w-lg md:max-h-256 w-full h-full relative overflow-hidden z-[1001]"
          @click="$event.stopPropagation()"
        >
          <button 
            class="btn btn-md btn-squircle px-2 bg-base-content text-base-300 border-0 absolute top-4 right-4 z-10 shadow-xl hover:bg-base-content/80"
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
            allow="camera; microphone; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
          />
        </div>
      </div>
    </Teleport>
  </div>
</template>
 
<script setup lang="ts">
import { XMarkIcon } from '@heroicons/vue/20/solid'
import { ref, computed, inject, onMounted, onBeforeUnmount, nextTick } from 'vue'
import { SharedStorageManager } from '~/lib/shared-storage/shared-storage-manager'
import { createCreationKey, normalizeDomain } from '~/utils/domain'

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
  const creationState = storageManager.getRecipeState(creationKey.value)
  const hasInteracted = creationState?.hasInteracted || false
  
  return hasInteracted ? 'Continue' : 'Try Interactive Mode!'
})

const iframeSrc = computed(() => {
  console.log('Props', props.config)
  const baseUrl = props.config.embedUrl || globalConfig?._meta?.baseUrl || window.location.origin
  
  return `${baseUrl}/creations/${creationKey.value}/interactive`
})

function openModal() {
  showModal.value = true
  
  // Initialize creation in shared storage when modal opens
  const siteUrl = props.config.siteUrl || globalConfig?.siteUrl || window.location.origin
  const domain = normalizeDomain(siteUrl)
  storageManager.initializeRecipe(domain, props.config.creationId)
  
  // Wait for DOM to update then handle fullscreen for mobile
  nextTick(() => {
    if (isMobile.value) {
      const modalElement = document.getElementById(`create-studio-modal-${props.config.creationId}`)
      if (modalElement) {
        // Try to request fullscreen on mobile for better UX
        if (modalElement.requestFullscreen) {
          modalElement.requestFullscreen().catch(err => {
            if (globalConfig?._meta?.debug) {
              console.warn('Error attempting to enable full-screen mode:', err)
            }
          })
        }
      }
    }
    
    if (globalConfig?._meta?.debug) {
      console.log('Create Studio Interactive mode opened for creation:', props.config.creationId)
      console.log('Creation key:', creationKey.value)
      console.log('iframe src:', iframeSrc.value)
      console.log('Mobile mode:', isMobile.value)
    }
  })
}

function closeModal() {
  showModal.value = false
}

function handleOverlayClick(event: MouseEvent) {
  console.log('Overlay click', event.target, event.currentTarget)
  if (event.target === event.currentTarget) {
    console.log('Closing modal due to overlay click')
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

