import { ref, computed, type Ref } from 'vue'

interface Options {
  isMobile: Ref<boolean>
  containerRef: Ref<HTMLElement | undefined>
}

const MIN_HEIGHT = 3
const MAX_HEIGHT = 35
const COLLAPSED_THRESHOLD = 10

export function useInteractiveImage({ isMobile, containerRef }: Options) {
  const imageHeight = ref(25)
  const isImageCollapsed = ref(false)
  const isDragging = ref(false)
  const dragStartY = ref(0)
  const dragStartHeight = ref(0)

  const imageHeightPx = computed(() => {
    if (!isMobile.value) return 0
    if (!containerRef.value) return Math.round((imageHeight.value / 100) * 600)
    return Math.round((imageHeight.value / 100) * containerRef.value.offsetHeight)
  })

  const toggleImageCollapse = () => {
    if (!isMobile.value) return
    isDragging.value = false
    if (isImageCollapsed.value) {
      imageHeight.value = 25
      isImageCollapsed.value = false
    } else {
      imageHeight.value = MIN_HEIGHT
      isImageCollapsed.value = true
    }
  }

  const startDrag = (event: MouseEvent | TouchEvent) => {
    if (!isMobile.value) return

    const target = event.target as HTMLElement
    const isFromHandle = target.closest('[data-draggable-handle="true"]')
    if (!isFromHandle) return

    const startY = event.type.includes('touch')
      ? (event as TouchEvent).touches[0].clientY
      : (event as MouseEvent).clientY
    const startX = event.type.includes('touch')
      ? (event as TouchEvent).touches[0].clientX
      : (event as MouseEvent).clientX

    let hasMoved = false
    let isVerticalDrag = false

    const checkDragDirection = (e: MouseEvent | TouchEvent) => {
      if (hasMoved) return
      const currentY = e.type.includes('touch')
        ? (e as TouchEvent).touches[0].clientY
        : (e as MouseEvent).clientY
      const currentX = e.type.includes('touch')
        ? (e as TouchEvent).touches[0].clientX
        : (e as MouseEvent).clientX

      const deltaY = Math.abs(currentY - startY)
      const deltaX = Math.abs(currentX - startX)

      if (deltaY > 10 || deltaX > 10) {
        hasMoved = true
        if (deltaY > deltaX * 1.5) {
          isVerticalDrag = true
          isDragging.value = true
          dragStartY.value = startY
          dragStartHeight.value = imageHeight.value
          e.preventDefault()
        }
      }
    }

    const onDrag = (e: MouseEvent | TouchEvent) => {
      if (!isDragging.value) return

      requestAnimationFrame(() => {
        const currentY = e.type.includes('touch')
          ? (e as TouchEvent).touches[0].clientY
          : (e as MouseEvent).clientY

        const deltaY = currentY - dragStartY.value
        const containerHeight = containerRef.value?.offsetHeight || window.innerHeight
        const deltaPercent = (deltaY / containerHeight) * 100

        let newHeight = dragStartHeight.value + deltaPercent
        newHeight = Math.max(MIN_HEIGHT, Math.min(MAX_HEIGHT, newHeight))

        imageHeight.value = newHeight
        isImageCollapsed.value = newHeight <= COLLAPSED_THRESHOLD
      })
    }

    const endDrag = () => {
      if (!isDragging.value) return
      isDragging.value = false
      isImageCollapsed.value = imageHeight.value <= COLLAPSED_THRESHOLD
    }

    const moveHandler = (e: MouseEvent | TouchEvent) => {
      if (!hasMoved) checkDragDirection(e)
      if (isVerticalDrag) onDrag(e)
    }

    const endHandler = () => {
      if (isVerticalDrag) endDrag()
      document.removeEventListener('mousemove', moveHandler)
      document.removeEventListener('touchmove', moveHandler)
      document.removeEventListener('mouseup', endHandler)
      document.removeEventListener('touchend', endHandler)
    }

    document.addEventListener('mousemove', moveHandler)
    document.addEventListener('touchmove', moveHandler, { passive: false })
    document.addEventListener('mouseup', endHandler)
    document.addEventListener('touchend', endHandler)
  }

  return {
    imageHeight,
    isImageCollapsed,
    isDragging,
    imageHeightPx,
    toggleImageCollapse,
    startDrag,
  }
}
