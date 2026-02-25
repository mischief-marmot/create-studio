<template>
  <div
    v-show="visible"
    ref="stickyEl"
    class="cs-interactive-mode-sticky"
    :style="barStyle"
  >
    <div class="cs-interactive-mode-sticky-text">
      <strong>{{ displayTitle }}</strong>
      <span>{{ displaySubtitle }}</span>
    </div>
    <button class="cs-interactive-mode-sticky-btn" @click="$emit('activate')">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="5 3 19 12 5 21 5 3"/></svg>
      {{ displayButtonText }}
    </button>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'

const props = defineProps<{
  title?: string
  subtitle?: string
  buttonText?: string
}>()

defineEmits<{
  activate: []
}>()

const displayTitle = computed(() => props.title || 'Ready to cook?')
const displaySubtitle = computed(() => props.subtitle || 'Step-by-step with timers')
const displayButtonText = computed(() => props.buttonText || "Let's Go")

const stickyEl = ref<HTMLElement | null>(null)
const visible = ref(false)
const cardRect = ref<{ left: number; width: number } | null>(null)

let observer: IntersectionObserver | null = null
let resizeObserver: ResizeObserver | null = null

// Match the bar width/position to the recipe card
const barStyle = computed(() => {
  if (!cardRect.value) return {}
  return {
    left: `${cardRect.value.left}px`,
    width: `${cardRect.value.width}px`,
  }
})

function updateCardRect(card: Element) {
  const rect = card.getBoundingClientRect()
  cardRect.value = { left: rect.left, width: rect.width }
}

onMounted(() => {
  const el = stickyEl.value
  if (!el) return

  // Find the recipe card section and its instructions
  const section = el.closest('section[id^="mv-creation-"]')
  if (!section) return

  const instructions = section.querySelector('.mv-create-instructions')
  const card = section.querySelector('.mv-create-card') || section
  if (!instructions) return

  // Track card position/size
  updateCardRect(card)
  resizeObserver = new ResizeObserver(() => updateCardRect(card))
  resizeObserver.observe(card)
  window.addEventListener('scroll', () => updateCardRect(card), { passive: true })
  window.addEventListener('resize', () => updateCardRect(card), { passive: true })

  // Show when instructions section is in the viewport
  observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        visible.value = entry.isIntersecting
      }
    },
    { threshold: 0 }
  )
  observer.observe(instructions)
})

onBeforeUnmount(() => {
  observer?.disconnect()
  resizeObserver?.disconnect()
})
</script>
