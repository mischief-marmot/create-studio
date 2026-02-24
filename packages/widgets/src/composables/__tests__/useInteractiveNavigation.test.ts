import { describe, it, expect, beforeEach } from 'vitest'
import { ref, computed, nextTick } from 'vue'
import { useInteractiveNavigation } from '../useInteractiveNavigation'

describe('useInteractiveNavigation', () => {
  const makeSteps = (count: number) =>
    Array.from({ length: count }, (_, i) => ({ text: `Step ${i + 1}`, name: `Step ${i + 1}` }))

  describe('initial state', () => {
    it('starts on slide 0', () => {
      const steps = computed(() => makeSteps(3))
      const { currentSlide } = useInteractiveNavigation({ steps })
      expect(currentSlide.value).toBe(0)
    })

    it('computes totalSlides as steps.length + 2 (intro + steps + review)', () => {
      const steps = computed(() => makeSteps(5))
      const { totalSlides } = useInteractiveNavigation({ steps })
      expect(totalSlides.value).toBe(7) // 5 steps + intro + review
    })

    it('totalSlides is 2 when there are no steps', () => {
      const steps = computed(() => makeSteps(0))
      const { totalSlides } = useInteractiveNavigation({ steps })
      expect(totalSlides.value).toBe(2)
    })
  })

  describe('goToSlide', () => {
    it('navigates to a specific slide', () => {
      const steps = computed(() => makeSteps(4))
      const { currentSlide, goToSlide } = useInteractiveNavigation({ steps })
      goToSlide(2)
      expect(currentSlide.value).toBe(2)
    })

    it('clamps to 0 for negative indexes', () => {
      const steps = computed(() => makeSteps(3))
      const { currentSlide, goToSlide } = useInteractiveNavigation({ steps })
      goToSlide(-1)
      expect(currentSlide.value).toBe(0)
    })

    it('clamps to last slide for out-of-range indexes', () => {
      const steps = computed(() => makeSteps(3))
      const { currentSlide, totalSlides, goToSlide } = useInteractiveNavigation({ steps })
      goToSlide(99)
      expect(currentSlide.value).toBe(totalSlides.value - 1)
    })

    it('navigates to the first slide (0)', () => {
      const steps = computed(() => makeSteps(3))
      const { currentSlide, goToSlide } = useInteractiveNavigation({ steps })
      goToSlide(3)
      goToSlide(0)
      expect(currentSlide.value).toBe(0)
    })

    it('navigates to the last slide', () => {
      const steps = computed(() => makeSteps(3))
      const { currentSlide, totalSlides, goToSlide } = useInteractiveNavigation({ steps })
      goToSlide(totalSlides.value - 1)
      expect(currentSlide.value).toBe(4)
    })
  })

  describe('nextSlide', () => {
    it('increments currentSlide by 1', () => {
      const steps = computed(() => makeSteps(3))
      const { currentSlide, nextSlide } = useInteractiveNavigation({ steps })
      nextSlide()
      expect(currentSlide.value).toBe(1)
    })

    it('does not exceed the last slide', () => {
      const steps = computed(() => makeSteps(3))
      const { currentSlide, totalSlides, nextSlide } = useInteractiveNavigation({ steps })
      // Go to last slide
      for (let i = 0; i < totalSlides.value + 5; i++) nextSlide()
      expect(currentSlide.value).toBe(totalSlides.value - 1)
    })

    it('advances through all slides sequentially', () => {
      const steps = computed(() => makeSteps(2))
      const { currentSlide, nextSlide } = useInteractiveNavigation({ steps })
      expect(currentSlide.value).toBe(0)
      nextSlide()
      expect(currentSlide.value).toBe(1)
      nextSlide()
      expect(currentSlide.value).toBe(2)
      nextSlide()
      expect(currentSlide.value).toBe(3) // last slide = 2 steps + 2 - 1
    })
  })

  describe('previousSlide', () => {
    it('decrements currentSlide by 1', () => {
      const steps = computed(() => makeSteps(3))
      const { currentSlide, goToSlide, previousSlide } = useInteractiveNavigation({ steps })
      goToSlide(2)
      previousSlide()
      expect(currentSlide.value).toBe(1)
    })

    it('does not go below 0', () => {
      const steps = computed(() => makeSteps(3))
      const { currentSlide, previousSlide } = useInteractiveNavigation({ steps })
      previousSlide()
      previousSlide()
      expect(currentSlide.value).toBe(0)
    })
  })

  describe('reactivity', () => {
    it('totalSlides updates when steps change', async () => {
      const stepsArr = ref(makeSteps(2))
      const steps = computed(() => stepsArr.value)
      const { totalSlides } = useInteractiveNavigation({ steps })
      expect(totalSlides.value).toBe(4)
      stepsArr.value = makeSteps(5)
      await nextTick()
      expect(totalSlides.value).toBe(7)
    })
  })
})
