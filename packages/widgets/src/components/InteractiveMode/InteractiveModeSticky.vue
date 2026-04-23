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
    <div class="cs-interactive-mode-sticky-action">
      <button class="cs-interactive-mode-sticky-btn" @click="$emit('activate')">
        <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor" style="width:14px;height:14px;min-width:14px;display:inline-block;vertical-align:middle;"><polygon points="5 3 19 12 5 21 5 3"/></svg>
        {{ displayButtonText }}
      </button>
      <NewTabHint v-if="opensInNewTab" class="cs-interactive-mode-sticky-hint" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import NewTabHint from './NewTabHint.vue'

const props = defineProps<{
  title?: string
  subtitle?: string
  buttonText?: string
  opensInNewTab?: boolean
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
 * Scans all page elements since ad containers can be deeply nested (e.g.
 * #adhesion_desktop > #adhesion_desktop_container with position: sticky).
 * Only runs on mount + body mutations, not on scroll, so perf is acceptable.
 */
function detectBottomAdHeight(): number {
  const viewportHeight = window.innerHeight
  const threshold = 200
  let maxHeight = 0

  const allElements = document.querySelectorAll('*')
  for (const el of allElements) {
    // Skip our own bar and hidden elements
    if (stickyEl.value && (el === stickyEl.value || stickyEl.value.contains(el))) continue
    if (!(el as HTMLElement).offsetHeight) continue

    const rect = el.getBoundingClientRect()
    // Quick bounds check before expensive getComputedStyle
    if (rect.bottom < viewportHeight - 10 || rect.top <= viewportHeight - threshold) continue
    if (rect.height <= maxHeight || rect.height >= threshold) continue

    const style = window.getComputedStyle(el)
    if (style.position === 'fixed' || style.position === 'sticky') {
      maxHeight = rect.height
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

  // Detect bottom ads on mount + whenever DOM changes (ads load async and can be deeply nested)
  updateBottomOffset()
  // Re-check after delays since ads load asynchronously at various times
  setTimeout(updateBottomOffset, 2000)
  setTimeout(updateBottomOffset, 5000)
  adObserver = new MutationObserver(() => {
    setTimeout(updateBottomOffset, 300)
  })
  adObserver.observe(document.body, { childList: true, subtree: true })

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
