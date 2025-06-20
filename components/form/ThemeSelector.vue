<template>
  <div 
    :data-testid="'theme-selector'"
    class="theme-selector"
    :class="{ compact, disabled }"
    @keydown="handleKeydown"
    tabindex="0"
  >
    <!-- Label -->
    <div v-if="showLabels" :data-testid="'theme-label'" class="theme-label">
      Theme
    </div>

    <!-- Theme Options -->
    <div class="theme-options" :class="{ 'grid-compact': compact }">
      <div
        v-for="(theme, index) in themes"
        :key="theme.id"
        :data-testid="`theme-option-${theme.id}`"
        class="theme-option"
        data-theme-option
        :class="{ 
          selected: modelValue === theme.id,
          disabled: disabled
        }"
        @click="!disabled && selectTheme(theme)"
        @keydown.enter="!disabled && selectTheme(theme)"
        :tabindex="disabled ? -1 : 0"
      >
        <!-- Theme Preview -->
        <div 
          v-if="showPreviews"
          :data-testid="`theme-preview-${theme.id}`"
          class="theme-preview"
          :class="`preview-${theme.id}`"
        >
          <div class="preview-header"></div>
          <div class="preview-content">
            <div class="preview-text"></div>
            <div class="preview-accent"></div>
          </div>
        </div>

        <!-- Theme Info -->
        <div class="theme-info">
          <div class="theme-name">{{ theme.name }}</div>
          <div v-if="theme.description && !compact" class="theme-description">
            {{ theme.description }}
          </div>
        </div>

        <!-- Selection Indicator -->
        <div v-if="modelValue === theme.id" class="selection-indicator">
          <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/>
          </svg>
        </div>
      </div>

      <!-- Custom Theme Button -->
      <div
        v-if="allowCustom"
        :data-testid="'custom-theme-button'"
        class="theme-option custom-theme"
        @click="!disabled && $emit('create-custom')"
        :tabindex="disabled ? -1 : 0"
      >
        <div class="custom-icon">
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
          </svg>
        </div>
        <div class="theme-info">
          <div class="theme-name">Custom</div>
          <div v-if="!compact" class="theme-description">Create your own</div>
        </div>
      </div>
    </div>

    <!-- Selected Theme Info -->
    <div v-if="selectedTheme && showSelectedInfo" class="selected-theme-info">
      <div class="selected-label">Selected Theme:</div>
      <div class="selected-details">
        <span class="selected-name">{{ selectedTheme.name }}</span>
        <span v-if="selectedTheme.description" class="selected-description">
          {{ selectedTheme.description }}
        </span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
interface ThemeOption {
  id: string
  name: string
  description?: string
  colors?: Record<string, string>
}

interface Props {
  modelValue: string
  themes: ThemeOption[]
  compact?: boolean
  disabled?: boolean
  showPreviews?: boolean
  showLabels?: boolean
  showSelectedInfo?: boolean
  allowCustom?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  compact: false,
  disabled: false,
  showPreviews: true,
  showLabels: true,
  showSelectedInfo: false,
  allowCustom: false
})

const emit = defineEmits<{
  'update:modelValue': [value: string]
  'theme-change': [theme: ThemeOption]
  'create-custom': []
}>()

const focusedIndex = ref(0)

const selectedTheme = computed(() => {
  return props.themes.find(theme => theme.id === props.modelValue)
})

function selectTheme(theme: ThemeOption) {
  if (props.disabled) return
  
  emit('update:modelValue', theme.id)
  emit('theme-change', theme)
}

function handleKeydown(event: KeyboardEvent) {
  if (props.disabled) return

  switch (event.key) {
    case 'ArrowDown':
    case 'ArrowRight':
      event.preventDefault()
      focusedIndex.value = Math.min(focusedIndex.value + 1, props.themes.length - 1)
      break
    case 'ArrowUp':
    case 'ArrowLeft':
      event.preventDefault()
      focusedIndex.value = Math.max(focusedIndex.value - 1, 0)
      break
    case 'Enter':
    case ' ':
      event.preventDefault()
      if (props.themes[focusedIndex.value]) {
        selectTheme(props.themes[focusedIndex.value])
      }
      break
  }
}

// Watch for external changes to update focused index
watch(() => props.modelValue, (newValue) => {
  const index = props.themes.findIndex(theme => theme.id === newValue)
  if (index !== -1) {
    focusedIndex.value = index
  }
})
</script>

<style scoped>
.theme-selector {
  width: 100%;
}

.theme-label {
  font-weight: 600;
  margin-bottom: 0.75rem;
  color: hsl(var(--bc));
}

.theme-options {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
}

.grid-compact {
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
}

.theme-option {
  position: relative;
  border: 2px solid hsl(var(--bc) / 0.2);
  border-radius: 0.75rem;
  padding: 1rem;
  cursor: pointer;
  transition: all 0.2s;
  background-color: hsl(var(--b1));
}

.theme-option:hover:not(.disabled) {
  border-color: hsl(var(--p));
  transform: translateY(-2px);
  box-shadow: 0 4px 12px hsl(var(--p) / 0.1);
}

.theme-option.selected {
  border-color: hsl(var(--p));
  background-color: hsl(var(--p) / 0.05);
}

.theme-option.disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.compact .theme-option {
  padding: 0.75rem;
}

.theme-preview {
  height: 60px;
  border-radius: 0.5rem;
  margin-bottom: 0.75rem;
  overflow: hidden;
  position: relative;
}

.compact .theme-preview {
  height: 40px;
  margin-bottom: 0.5rem;
}

/* Theme Preview Styles */
.preview-default {
  background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
  border: 1px solid #e2e8f0;
}

.preview-modern {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.preview-minimal {
  background: #f7fafc;
  border-left: 4px solid #718096;
}

.preview-elegant {
  background: linear-gradient(135deg, #fefcf3 0%, #f8f5e8 100%);
  border: 1px solid #d4af37;
}

.preview-header {
  height: 20px;
  background-color: hsl(var(--p) / 0.3);
  margin-bottom: 8px;
}

.preview-content {
  padding: 0 8px;
}

.preview-text {
  height: 8px;
  background-color: hsl(var(--bc) / 0.4);
  border-radius: 2px;
  margin-bottom: 4px;
  width: 70%;
}

.preview-accent {
  height: 6px;
  background-color: hsl(var(--s) / 0.6);
  border-radius: 2px;
  width: 40%;
}

.theme-info {
  text-align: center;
}

.compact .theme-info {
  text-align: center;
}

.theme-name {
  font-weight: 600;
  color: hsl(var(--bc));
  margin-bottom: 0.25rem;
  font-size: 0.9rem;
}

.theme-description {
  font-size: 0.8rem;
  color: hsl(var(--bc) / 0.7);
}

.selection-indicator {
  position: absolute;
  top: 0.5rem;
  right: 0.5rem;
  color: hsl(var(--p));
  background-color: hsl(var(--b1));
  border-radius: 50%;
  padding: 0.125rem;
}

.custom-theme {
  border-style: dashed;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 120px;
}

.compact .custom-theme {
  min-height: 80px;
}

.custom-icon {
  color: hsl(var(--bc) / 0.5);
  margin-bottom: 0.5rem;
}

.custom-theme:hover:not(.disabled) .custom-icon {
  color: hsl(var(--p));
}

.selected-theme-info {
  margin-top: 1rem;
  padding: 0.75rem;
  background-color: hsl(var(--b2));
  border-radius: 0.5rem;
  border-left: 4px solid hsl(var(--p));
}

.selected-label {
  font-size: 0.875rem;
  font-weight: 600;
  color: hsl(var(--bc));
  margin-bottom: 0.25rem;
}

.selected-name {
  font-weight: 600;
  color: hsl(var(--p));
}

.selected-description {
  color: hsl(var(--bc) / 0.7);
  margin-left: 0.5rem;
}

.disabled {
  opacity: 0.6;
  pointer-events: none;
}
</style>