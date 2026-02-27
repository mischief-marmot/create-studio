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
      <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor" style="width:14px;height:14px;min-width:14px;display:inline-block;vertical-align:middle;"><polygon points="5 3 19 12 5 21 5 3"/></svg>
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
const bottomOffset = ref(0)

let observer: IntersectionObserver | null = null
let resizeObserver: ResizeObserver | null = null
let adObserver: MutationObserver | null = null

const barStyle = computed(() => {
  const style: Record<string, string> = {}
  if (cardRect.value) {
    style.left = `${cardRect.value.left}px`
    style.width = `${cardRect.value.width}px`
  }
  style.bottom = `${bottomOffset.value}px`
  return style
})

/**
 * Detect fixed/sticky elements at the bottom of the viewport (ad banners).
 * Walks all direct children of body + iframes, since ad scripts inject there.
 */
function detectBottomAdHeight(): number {
  const viewportHeight = window.innerHeight
  const threshold = 200
  let maxHeight = 0

  // Walk body children + all iframes (covers most ad injection patterns)
  const candidates = [
    ...Array.from(document.body.children),
    ...Array.from(document.querySelectorAll('iframe')),
  ]

  for (const el of candidates) {
    if (stickyEl.value && (el === stickyEl.value || el.contains(stickyEl.value))) continue
    const htmlEl = el as HTMLElement
    if (!htmlEl.offsetHeight) continue

    const style = window.getComputedStyle(el)
    if (style.position !== 'fixed' && style.position !== 'sticky') continue

    const rect = el.getBoundingClientRect()
    // Is it anchored at the bottom of the viewport?
    if (rect.bottom >= viewportHeight - 5 && rect.top > viewportHeight - threshold) {
      if (rect.height > maxHeight && rect.height < threshold) {
        maxHeight = rect.height
      }
    }
  }

  return maxHeight
}

function updateCardRect(card: Element) {
  const rect = card.getBoundingClientRect()
  cardRect.value = { left: rect.left, width: rect.width }
}

function updateBottomOffset() {
  bottomOffset.value = detectBottomAdHeight()
}

onMounted(() => {
  const el = stickyEl.value
  if (!el) return

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

  // Detect bottom ads on mount + whenever body children change (ads load async)
  updateBottomOffset()
  adObserver = new MutationObserver(() => {
    // Small delay so the new element has time to get styles applied
    setTimeout(updateBottomOffset, 200)
  })
  adObserver.observe(document.body, { childList: true, subtree: false })

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
  adObserver?.disconnect()
})
</script>
