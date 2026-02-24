import { describe, it, expect } from 'vitest'
import { ref } from 'vue'
import { useInteractiveImage } from '../useInteractiveImage'

describe('useInteractiveImage', () => {
  describe('initial state', () => {
    it('imageHeight starts at 25', () => {
      const { imageHeight } = useInteractiveImage({
        isMobile: ref(true),
        containerRef: ref(undefined),
      })
      expect(imageHeight.value).toBe(25)
    })

    it('isImageCollapsed starts false', () => {
      const { isImageCollapsed } = useInteractiveImage({
        isMobile: ref(true),
        containerRef: ref(undefined),
      })
      expect(isImageCollapsed.value).toBe(false)
    })

    it('isDragging starts false', () => {
      const { isDragging } = useInteractiveImage({
        isMobile: ref(true),
        containerRef: ref(undefined),
      })
      expect(isDragging.value).toBe(false)
    })

    it('imageHeightPx is 0 on desktop (isMobile=false)', () => {
      const { imageHeightPx } = useInteractiveImage({
        isMobile: ref(false),
        containerRef: ref(undefined),
      })
      expect(imageHeightPx.value).toBe(0)
    })

    it('imageHeightPx uses fallback 150 when container is undefined on mobile', () => {
      const { imageHeightPx } = useInteractiveImage({
        isMobile: ref(true),
        containerRef: ref(undefined),
      })
      // 25% of fallback 600 = 150
      expect(imageHeightPx.value).toBe(150)
    })
  })

  describe('toggleImageCollapse', () => {
    it('collapses image when not collapsed (mobile only)', () => {
      const { imageHeight, isImageCollapsed, toggleImageCollapse } = useInteractiveImage({
        isMobile: ref(true),
        containerRef: ref(undefined),
      })
      toggleImageCollapse()
      expect(isImageCollapsed.value).toBe(true)
    })

    it('expands image when collapsed', () => {
      const { imageHeight, isImageCollapsed, toggleImageCollapse } = useInteractiveImage({
        isMobile: ref(true),
        containerRef: ref(undefined),
      })
      // Collapse first
      toggleImageCollapse()
      expect(isImageCollapsed.value).toBe(true)
      // Now expand
      toggleImageCollapse()
      expect(isImageCollapsed.value).toBe(false)
      expect(imageHeight.value).toBe(25)
    })

    it('does nothing on desktop (isMobile=false)', () => {
      const { imageHeight, isImageCollapsed, toggleImageCollapse } = useInteractiveImage({
        isMobile: ref(false),
        containerRef: ref(undefined),
      })
      toggleImageCollapse()
      expect(isImageCollapsed.value).toBe(false)
      expect(imageHeight.value).toBe(25)
    })
  })

  describe('imageHeightPx computation', () => {
    it('computes pixel height from container height on mobile', () => {
      const container = { offsetHeight: 800 } as HTMLElement
      const { imageHeightPx } = useInteractiveImage({
        isMobile: ref(true),
        containerRef: ref(container),
      })
      // 25% of 800 = 200
      expect(imageHeightPx.value).toBe(200)
    })

    it('rounds pixel height to nearest integer', () => {
      const container = { offsetHeight: 700 } as HTMLElement
      const { imageHeightPx } = useInteractiveImage({
        isMobile: ref(true),
        containerRef: ref(container),
      })
      // 25% of 700 = 175
      expect(imageHeightPx.value).toBe(175)
    })
  })
})
