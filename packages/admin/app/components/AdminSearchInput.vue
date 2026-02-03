<template>
  <div class="admin-search-wrapper">
    <svg
      class="admin-search-icon"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      aria-hidden="true"
    >
      <path
        stroke-linecap="round"
        stroke-linejoin="round"
        stroke-width="2"
        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
      />
    </svg>
    <input
      ref="inputRef"
      type="search"
      class="admin-search-input"
      :value="modelValue"
      :placeholder="placeholder"
      :aria-label="ariaLabel || placeholder"
      @input="handleInput"
      @keydown.enter="handleEnter"
      @keydown.esc="handleEscape"
    />
    <button
      v-if="modelValue"
      class="absolute right-3 top-1/2 -translate-y-1/2 text-base-content/40 hover:text-base-content transition-colors"
      @click="handleClear"
      aria-label="Clear search"
      type="button"
    >
      <svg class="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
      </svg>
    </button>
  </div>
</template>

<script setup lang="ts">
import { ref, onBeforeUnmount } from 'vue'

interface Props {
  modelValue: string
  placeholder?: string
  debounce?: number
  ariaLabel?: string
}

const props = withDefaults(defineProps<Props>(), {
  placeholder: 'Search...',
  debounce: 300,
  ariaLabel: '',
})

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void
  (e: 'search', value: string): void
  (e: 'clear'): void
}>()

const inputRef = ref<HTMLInputElement | null>(null)
let debounceTimeout: ReturnType<typeof setTimeout> | null = null

const handleInput = (event: Event) => {
  const target = event.target as HTMLInputElement
  const value = target.value

  // Clear existing timeout
  if (debounceTimeout) {
    clearTimeout(debounceTimeout)
  }

  // Update model value immediately for v-model binding
  emit('update:modelValue', value)

  // Debounce the search event
  if (props.debounce > 0) {
    debounceTimeout = setTimeout(() => {
      emit('search', value)
    }, props.debounce)
  } else {
    emit('search', value)
  }
}

const handleClear = () => {
  emit('update:modelValue', '')
  emit('search', '')
  emit('clear')
  inputRef.value?.focus()
}

const handleEnter = (event: KeyboardEvent) => {
  // Clear debounce and emit immediately on Enter
  if (debounceTimeout) {
    clearTimeout(debounceTimeout)
  }
  emit('search', (event.target as HTMLInputElement).value)
}

const handleEscape = () => {
  if (props.modelValue) {
    handleClear()
  } else {
    inputRef.value?.blur()
  }
}

// Cleanup timeout on unmount
onBeforeUnmount(() => {
  if (debounceTimeout) {
    clearTimeout(debounceTimeout)
  }
})

// Expose focus method for parent components
defineExpose({
  focus: () => inputRef.value?.focus(),
  blur: () => inputRef.value?.blur(),
})
</script>
