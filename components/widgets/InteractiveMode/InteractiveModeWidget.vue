<template>
  <div>
    <button 
      class="btn btn-primary bg-purple-600 btn-sm create-studio-interactive-btn"
      @click="openModal"
    >
      {{ config.buttonText || 'Try Interactive Mode!' }}
    </button>
    
    <Teleport to="body">
      <div 
        v-if="showModal"
        :id="`create-studio-modal-${config.creationId}`"
        class="w-full h-full fixed top-0 left-0 z-5"
        @click="handleOverlayClick"
      >
        <button 
          class="create-studio-modal-close"
          @click="closeModal"
          aria-label="Close"
        >
          ×
        </button> 
        <iframe 
          :src="iframeSrc"
          class="w-full h-full"
          :title="`${config.recipeName} - Interactive Mode`"
          frameborder="0"
          allow="camera; microphone; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
        />
      </div> 
    </Teleport>
  </div>
</template>
 
<script setup lang="ts">
import { ref, computed, inject, onMounted, onBeforeUnmount } from 'vue'

interface Props {
  config: {
    creationId: string
    recipeName?: string
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

// Theme support can be added later if needed via CSS custom properties

const iframeSrc = computed(() => {
  console.log('Props', props.config)
  const baseUrl = props.config.embedUrl || globalConfig?._meta?.baseUrl || window.location.origin
  const siteUrl = props.config.siteUrl || globalConfig?.siteUrl || window.location.origin
  const creationId = props.config.creationId
  
  return `${baseUrl}/creations/${creationId}/interactive?site_url=${encodeURIComponent(siteUrl)}`
})

function openModal() {
  showModal.value = true
  
  if (globalConfig?._meta?.debug) {
    console.log('Create Studio Interactive mode opened for creation:', props.config.creationId)
    console.log('iframe src:', iframeSrc.value)
    // request fullscreen for better UX
    const modalElement = document.getElementById(`create-studio-modal-${props.config.creationId}`)
    if (modalElement && modalElement.requestFullscreen) {
      modalElement.requestFullscreen().catch(err => {
        console.warn('Error attempting to enable full-screen mode:', err)
      })
    }
  } 
}

function closeModal() {
  showModal.value = false
}

function handleOverlayClick(event: MouseEvent) {
  if (event.target === event.currentTarget) {
    closeModal()
  }
}

function handleEscKey(event: KeyboardEvent) {
  if (event.key === 'Escape' && showModal.value) {
    closeModal()
  }
}

onMounted(() => {
  document.addEventListener('keydown', handleEscKey)
})

onBeforeUnmount(() => {
  document.removeEventListener('keydown', handleEscKey)
})
</script>

