<template>
  <button 
    :class="buttonClasses"
    :style="buttonStyles"
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

const buttonClasses = computed(() => [
  'create-studio-interactive-btn'
])

const buttonStyles = computed(() => {
  const customTheme = props.config.theme || {}
  const mergedTheme = { ...theme, ...customTheme }
  
  return {
    '--cs-primary': mergedTheme.primary,
    '--cs-secondary': mergedTheme.secondary,
    backgroundColor: mergedTheme.primary || '#3b82f6',
  }
})

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

<style scoped>
.create-studio-interactive-btn {
  background: var(--cs-primary, #3b82f6);
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 600;
  margin: 10px 0;
  display: inline-block;
  font-family: inherit;
  transition: background-color 0.2s ease;
}

.create-studio-interactive-btn:hover {
  background: var(--cs-secondary, #2563eb);
}

.create-studio-modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.8);
  z-index: 999999;
  display: flex;
  align-items: center;
  justify-content: center;
}

.create-studio-modal-close {
  position: absolute;
  top: 20px;
  right: 30px;
  background: none;
  border: none;
  color: white;
  font-size: 40px;
  cursor: pointer;
  z-index: 1000000;
  line-height: 1;
  padding: 0;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.create-studio-modal-close:hover {
  opacity: 0.7;
}

.create-studio-modal-iframe {
  width: 100%;
  height: 100%;
  border: 0;
}
</style>