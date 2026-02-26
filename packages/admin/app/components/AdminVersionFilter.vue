<template>
  <div class="dropdown" :class="{ 'dropdown-open': isOpen }">
    <button
      ref="triggerRef"
      type="button"
      class="btn btn-sm btn-outline gap-2"
      :class="{ 'btn-primary': isActive }"
      @click="toggleDropdown"
      :aria-expanded="isOpen"
      :aria-haspopup="true"
      aria-label="Filter by version"
    >
      <svg class="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
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
      <span v-if="isActive" class="badge badge-primary badge-sm ml-1" aria-label="Active filter">1</span>
    </button>

    <div
      v-show="isOpen"
      ref="dropdownRef"
      class="dropdown-content bg-base-100 rounded-lg shadow-lg border border-base-300 z-50 w-72 p-4 mt-2"
    >
      <div class="space-y-3">
        <div class="text-xs font-medium text-base-content/50 uppercase tracking-wider mb-1">Filter by Version</div>

        <!-- Field -->
        <div>
          <label class="text-xs text-base-content/60 mb-1 block">Field</label>
          <select v-model="draft.field" class="select select-sm select-bordered w-full">
            <option value="create">Create Plugin</option>
            <option value="wp">WordPress</option>
            <option value="php">PHP</option>
          </select>
        </div>

        <!-- Operator -->
        <div>
          <label class="text-xs text-base-content/60 mb-1 block">Operator</label>
          <select v-model="draft.op" class="select select-sm select-bordered w-full">
            <option value="lt">&lt; Less than</option>
            <option value="lte">&le; Less than or equal</option>
            <option value="eq">= Equal to</option>
            <option value="gte">&ge; Greater than or equal</option>
            <option value="gt">&gt; Greater than</option>
            <option value="between">Between (inclusive)</option>
          </select>
        </div>

        <!-- Version value(s) -->
        <div v-if="draft.op !== 'between'">
          <label class="text-xs text-base-content/60 mb-1 block">Version</label>
          <input
            v-model="draft.value"
            type="text"
            class="input input-sm input-bordered w-full font-mono"
            placeholder="e.g. 8.1 or 1.10.5"
            @keydown.enter="handleApply"
          />
        </div>
        <div v-else class="flex items-center gap-2">
          <div class="flex-1">
            <label class="text-xs text-base-content/60 mb-1 block">From</label>
            <input
              v-model="draft.value"
              type="text"
              class="input input-sm input-bordered w-full font-mono"
              placeholder="e.g. 8.0"
              @keydown.enter="handleApply"
            />
          </div>
          <div class="flex-1">
            <label class="text-xs text-base-content/60 mb-1 block">To</label>
            <input
              v-model="draft.value2"
              type="text"
              class="input input-sm input-bordered w-full font-mono"
              placeholder="e.g. 8.2"
              @keydown.enter="handleApply"
            />
          </div>
        </div>

        <!-- Actions -->
        <div class="flex gap-2 pt-1">
          <button
            type="button"
            class="btn btn-sm btn-primary flex-1"
            :disabled="!canApply"
            @click="handleApply"
          >
            Apply
          </button>
          <button
            v-if="isActive"
            type="button"
            class="btn btn-sm btn-ghost"
            @click="handleClear"
          >
            Clear
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount, watch } from 'vue'

export interface VersionFilterValue {
  field: 'create' | 'wp' | 'php'
  op: 'lt' | 'lte' | 'eq' | 'gte' | 'gt' | 'between'
  value: string
  value2?: string
}

interface Props {
  modelValue: VersionFilterValue | null
}

const props = defineProps<Props>()
const emit = defineEmits<{
  (e: 'update:modelValue', value: VersionFilterValue | null): void
  (e: 'change', value: VersionFilterValue | null): void
}>()

const isOpen = ref(false)
const triggerRef = ref<HTMLButtonElement | null>(null)
const dropdownRef = ref<HTMLDivElement | null>(null)

const draft = ref<{ field: 'create' | 'wp' | 'php'; op: VersionFilterValue['op']; value: string; value2: string }>({
  field: 'php',
  op: 'lte',
  value: '',
  value2: '',
})

// Sync draft from incoming modelValue when it changes externally
watch(() => props.modelValue, (val) => {
  if (val) {
    draft.value = { field: val.field, op: val.op, value: val.value, value2: val.value2 ?? '' }
  }
}, { immediate: true })

const isActive = computed(() => props.modelValue !== null)

const fieldLabels: Record<string, string> = {
  create: 'Create',
  wp: 'WordPress',
  php: 'PHP',
}

const opSymbols: Record<string, string> = {
  lt: '<',
  lte: '≤',
  eq: '=',
  gte: '≥',
  gt: '>',
  between: 'between',
}

const displayLabel = computed(() => {
  if (!isActive.value || !props.modelValue) return 'Version'
  const { field, op, value, value2 } = props.modelValue
  const fieldLabel = fieldLabels[field] ?? field
  const opSymbol = opSymbols[op] ?? op
  if (op === 'between') return `${fieldLabel} ${opSymbol} ${value}–${value2}`
  return `${fieldLabel} ${opSymbol} ${value}`
})

const canApply = computed(() => {
  if (!draft.value.value.trim()) return false
  if (draft.value.op === 'between' && !draft.value.value2.trim()) return false
  return true
})

const toggleDropdown = () => {
  isOpen.value = !isOpen.value
}

const handleApply = () => {
  if (!canApply.value) return
  const result: VersionFilterValue = {
    field: draft.value.field,
    op: draft.value.op,
    value: draft.value.value.trim(),
    ...(draft.value.op === 'between' ? { value2: draft.value.value2.trim() } : {}),
  }
  emit('update:modelValue', result)
  emit('change', result)
  isOpen.value = false
  triggerRef.value?.focus()
}

const handleClear = () => {
  draft.value = { field: 'php', op: 'lte', value: '', value2: '' }
  emit('update:modelValue', null)
  emit('change', null)
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
</script>
