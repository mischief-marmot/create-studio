<template>
  <div class="dropdown" :class="{ 'dropdown-open': isOpen }">
    <button
      ref="triggerRef"
      type="button"
      class="btn btn-sm btn-outline gap-2"
      @click="toggleDropdown"
      :aria-expanded="isOpen"
      :aria-haspopup="true"
      :aria-label="`Filter by ${label}`"
    >
      <svg class="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
        />
      </svg>
      <span>{{ displayLabel }}</span>
      <svg
        class="size-3 transition-transform"
        :class="{ 'rotate-180': isOpen }"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        aria-hidden="true"
      >
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
      </svg>
      <span
        v-if="hasActiveFilter"
        class="badge badge-primary badge-sm ml-1"
        aria-label="Active filter"
      >
        1
      </span>
    </button>

    <ul
      v-show="isOpen"
      ref="dropdownRef"
      class="dropdown-content menu bg-base-100 rounded-lg shadow-lg border border-base-300 z-50 w-64 p-2 mt-2"
      role="listbox"
      :aria-labelledby="triggerId"
    >
      <!-- All/Clear Option -->
      <li v-if="showClearOption">
        <button
          type="button"
          class="flex items-center gap-2 justify-between"
          :class="{ 'active': !modelValue }"
          @click="handleSelect(null)"
          role="option"
          :aria-selected="!modelValue"
        >
          <span>All {{ label }}</span>
          <svg v-if="!modelValue" class="size-4 text-primary" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
            <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
          </svg>
        </button>
      </li>

      <div v-if="showClearOption && options.length > 0" class="divider my-1"></div>

      <!-- Options -->
      <li v-for="option in options" :key="option.value">
        <button
          type="button"
          class="flex items-center gap-2 justify-between"
          :class="{ 'active': modelValue === option.value }"
          @click="handleSelect(option.value)"
          role="option"
          :aria-selected="modelValue === option.value"
        >
          <span>{{ option.label }}</span>
          <svg
            v-if="modelValue === option.value"
            class="size-4 text-primary"
            fill="currentColor"
            viewBox="0 0 20 20"
            aria-hidden="true"
          >
            <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
          </svg>
        </button>
      </li>

      <!-- Empty State -->
      <li v-if="options.length === 0">
        <div class="text-base-content/50 text-sm py-2 text-center">
          No options available
        </div>
      </li>
    </ul>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'

export interface FilterOption {
  value: string | number
  label: string
}

interface Props {
  options: FilterOption[]
  modelValue: string | number | null
  label: string
  showClearOption?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  showClearOption: true,
})

const emit = defineEmits<{
  (e: 'update:modelValue', value: string | number | null): void
  (e: 'change', value: string | number | null): void
}>()

const isOpen = ref(false)
const triggerRef = ref<HTMLButtonElement | null>(null)
const dropdownRef = ref<HTMLUListElement | null>(null)
const triggerId = computed(() => `filter-dropdown-${Math.random().toString(36).substr(2, 9)}`)

const hasActiveFilter = computed(() => props.modelValue !== null && props.modelValue !== undefined)

const displayLabel = computed(() => {
  if (!hasActiveFilter.value) {
    return props.label
  }

  const selectedOption = props.options.find(opt => opt.value === props.modelValue)
  return selectedOption ? selectedOption.label : props.label
})

const toggleDropdown = () => {
  isOpen.value = !isOpen.value
}

const handleSelect = (value: string | number | null) => {
  emit('update:modelValue', value)
  emit('change', value)
  isOpen.value = false
  triggerRef.value?.focus()
}

const handleClickOutside = (event: MouseEvent) => {
  const target = event.target as Node
  if (
    isOpen.value &&
    triggerRef.value &&
    dropdownRef.value &&
    !triggerRef.value.contains(target) &&
    !dropdownRef.value.contains(target)
  ) {
    isOpen.value = false
  }
}

const handleEscape = (event: KeyboardEvent) => {
  if (event.key === 'Escape' && isOpen.value) {
    isOpen.value = false
    triggerRef.value?.focus()
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
  document.addEventListener('keydown', handleEscape)
})

onBeforeUnmount(() => {
  document.removeEventListener('click', handleClickOutside)
  document.removeEventListener('keydown', handleEscape)
})

defineExpose({
  open: () => { isOpen.value = true },
  close: () => { isOpen.value = false },
  toggle: toggleDropdown,
})
</script>
