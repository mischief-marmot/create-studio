<template>
  <div class="cs-interactive-mode-banner" @click="$emit('activate')">
    <div class="cs-interactive-mode-banner-icon">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="5 3 19 12 5 21 5 3"/></svg>
    </div>
    <div class="cs-interactive-mode-banner-text">
      <div class="cs-interactive-mode-banner-title">{{ displayTitle }}</div>
      <div class="cs-interactive-mode-banner-sub">{{ displaySubtitle }}</div>
    </div>
    <div class="cs-interactive-mode-banner-arrow">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  title?: string
  subtitle?: string
}>()

defineEmits<{
  activate: []
}>()

const displayTitle = computed(() => props.title || 'Cook step-by-step')
const displaySubtitle = computed(() => props.subtitle || 'Full screen with timers & ingredient lists')
</script>
