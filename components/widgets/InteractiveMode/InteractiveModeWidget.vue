<template>
  <button 
    class="btn btn-primary bg-green-600 btn-sm create-studio-interactive-btn"
    @click="openModal"
  >
    {{ config.buttonText || 'Try Interactive Mode!' }}
  </button>
  
  <Teleport to="body">
    <div 
      v-if="showModal"
      :id="`create-studio-modal-${config.creationId}`"
      class="create-studio-modal-overlay"
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
        class="create-studio-modal-iframe"
        :title="`${config.recipeName} - Interactive Mode`"
        frameborder="0"
      />
    </div>
  </Teleport>
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

