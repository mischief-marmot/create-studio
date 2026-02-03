<template>
  <dialog ref="dialogRef" class="modal modal-bottom sm:modal-middle" :aria-labelledby="titleId">
    <div class="modal-box" :class="modalSizeClass">
      <!-- Close Button -->
      <button
        class="btn btn-sm btn-circle btn-ghost right-4 top-4 absolute"
        @click="handleCancel"
        aria-label="Close modal"
      >
        <svg class="size-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>

      <!-- Header -->
      <div class="mb-6">
        <div v-if="icon" class="rounded-2xl bg-gradient-to-br size-16 flex items-center justify-center mx-auto mb-4" :class="iconColorClass">
          <component :is="icon" class="size-8" :class="iconTextClass" />
        </div>
        <h3 :id="titleId" class="font-serif text-2xl text-center mb-2">{{ title }}</h3>
        <p v-if="description" class="text-base-content/70 text-sm text-center">
          {{ description }}
        </p>
      </div>

      <!-- Content Slot -->
      <div class="mb-6">
        <slot></slot>
      </div>

      <!-- Footer Actions -->
      <div class="flex gap-2" :class="{ 'flex-col-reverse sm:flex-row': variant === 'confirm' }">
        <button
          v-if="showCancel"
          class="btn flex-1"
          :class="cancelButtonClass"
          @click="handleCancel"
          :disabled="loading"
        >
          {{ cancelText }}
        </button>
        <button
          v-if="showConfirm"
          class="btn flex-1"
          :class="confirmButtonClass"
          @click="handleConfirm"
          :disabled="loading || disabled"
        >
          <span v-if="loading" class="loading loading-spinner loading-sm"></span>
          {{ loading ? loadingText : confirmText }}
        </button>
      </div>
    </div>
    <form method="dialog" class="modal-backdrop">
      <button @click="handleCancel" aria-label="Close modal">close</button>
    </form>
  </dialog>
</template>

<script setup lang="ts">
import { ref, watch, computed, type Component } from 'vue'

type ModalVariant = 'confirm' | 'form' | 'info' | 'warning' | 'danger'
type ModalSize = 'sm' | 'md' | 'lg'

interface Props {
  open: boolean
  title: string
  description?: string
  variant?: ModalVariant
  size?: ModalSize
  icon?: Component
  confirmText?: string
  cancelText?: string
  loadingText?: string
  loading?: boolean
  disabled?: boolean
  showConfirm?: boolean
  showCancel?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  description: '',
  variant: 'form',
  size: 'md',
  icon: undefined,
  confirmText: 'Confirm',
  cancelText: 'Cancel',
  loadingText: 'Processing...',
  loading: false,
  disabled: false,
  showConfirm: true,
  showCancel: true,
})

const emit = defineEmits<{
  (e: 'confirm'): void
  (e: 'cancel'): void
  (e: 'close'): void
}>()

const dialogRef = ref<HTMLDialogElement | null>(null)
const titleId = computed(() => `modal-title-${Math.random().toString(36).substr(2, 9)}`)

const modalSizeClass = computed(() => {
  const sizes = {
    sm: 'max-w-sm',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
  }
  return sizes[props.size]
})

const iconColorClass = computed(() => {
  const colors = {
    confirm: 'from-primary/10 to-primary/5',
    form: 'from-primary/10 to-primary/5',
    info: 'from-info/10 to-info/5',
    warning: 'from-warning/10 to-warning/5',
    danger: 'from-error/10 to-error/5',
  }
  return colors[props.variant]
})

const iconTextClass = computed(() => {
  const colors = {
    confirm: 'text-primary',
    form: 'text-primary',
    info: 'text-info',
    warning: 'text-warning',
    danger: 'text-error',
  }
  return colors[props.variant]
})

const confirmButtonClass = computed(() => {
  const classes = {
    confirm: 'btn-primary',
    form: 'btn-primary',
    info: 'btn-info',
    warning: 'btn-warning',
    danger: 'btn-error',
  }
  return classes[props.variant]
})

const cancelButtonClass = computed(() => {
  return props.variant === 'confirm' || props.variant === 'danger' ? 'btn-ghost' : 'btn-outline'
})

watch(() => props.open, (isOpen) => {
  if (isOpen) {
    dialogRef.value?.showModal()
  } else {
    dialogRef.value?.close()
  }
})

const handleConfirm = () => {
  if (!props.loading && !props.disabled) {
    emit('confirm')
  }
}

const handleCancel = () => {
  if (!props.loading) {
    emit('cancel')
    emit('close')
  }
}

// Handle ESC key
const handleKeydown = (event: KeyboardEvent) => {
  if (event.key === 'Escape' && !props.loading) {
    handleCancel()
  }
}

// Trap focus within modal for accessibility
const trapFocus = (event: KeyboardEvent) => {
  if (event.key === 'Tab' && props.open) {
    const focusableElements = dialogRef.value?.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    )

    if (focusableElements && focusableElements.length > 0) {
      const firstElement = focusableElements[0] as HTMLElement
      const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement

      if (event.shiftKey && document.activeElement === firstElement) {
        lastElement.focus()
        event.preventDefault()
      } else if (!event.shiftKey && document.activeElement === lastElement) {
        firstElement.focus()
        event.preventDefault()
      }
    }
  }
}

if (typeof window !== 'undefined') {
  window.addEventListener('keydown', handleKeydown)
  window.addEventListener('keydown', trapFocus)
}
</script>
