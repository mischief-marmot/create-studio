import { ref, computed } from 'vue'
import type { ComputedRef } from 'vue'

export function useInteractiveNavigation({ steps }: { steps: ComputedRef<any[]> }) {
  const currentSlide = ref(0)

  const totalSlides = computed(() => steps.value.length + 2)

  function goToSlide(index: number) {
    currentSlide.value = Math.max(0, Math.min(index, totalSlides.value - 1))
  }

  function nextSlide() {
    goToSlide(currentSlide.value + 1)
  }

  function previousSlide() {
    goToSlide(currentSlide.value - 1)
  }

  return { currentSlide, totalSlides, goToSlide, nextSlide, previousSlide }
}
