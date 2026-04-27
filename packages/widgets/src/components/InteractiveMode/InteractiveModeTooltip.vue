<template>
  <div v-if="!dismissed" ref="rootEl" class="cs-interactive-mode-tooltip">
    <span class="cs-interactive-mode-tooltip-text">
      {{ displayTitle }}
      <NewTabHint v-if="opensInNewTab" />
    </span>
    <button class="cs-interactive-mode-tooltip-try" @click="$emit('activate')">
      {{ displayButtonText }}
      <ArrowTopRightOnSquareIcon v-if="opensInNewTab" class="cs:w-4 cs:h-4 cs:ml-1 cs:inline-block" />
    </button>
    <span class="cs-interactive-mode-tooltip-dismiss" @click.stop="dismiss">&times;</span>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, ref, watch } from 'vue'
import { ArrowTopRightOnSquareIcon } from '@heroicons/vue/20/solid'
import NewTabHint from './NewTabHint.vue'

const props = defineProps<{
  title?: string
  buttonText?: string
  opensInNewTab?: boolean
}>()

const emit = defineEmits<{
  activate: []
  rendered: []
}>()

const displayTitle = computed(() => props.title || 'Try hands-free cooking mode')
const displayButtonText = computed(() => props.buttonText || 'Try it')

const dismissed = ref(false)
const rootEl = ref<HTMLElement | null>(null)

function dismiss() {
  dismissed.value = true
}

// Tooltip uses v-if on dismissed, so observe only after the ref is attached.
let observer: IntersectionObserver | null = null
let fired = false
watch(rootEl, async (el) => {
  if (!el || fired) return
  await nextTick()
  observer?.disconnect()
  observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting && !fired) {
          fired = true
          emit('rendered')
          observer?.disconnect()
        }
      }
    },
    { threshold: 0 }
  )
  observer.observe(el)
}, { immediate: true })

onBeforeUnmount(() => observer?.disconnect())
</script>
