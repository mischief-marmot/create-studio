<template>
  <div class="cs-interactive-mode-banner ezoic-no-insert adthrive-no-insert" data-nosnippet @click="$emit('activate')">
    <div class="cs-interactive-mode-banner-icon">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="5 3 19 12 5 21 5 3"/></svg>
    </div>
    <div class="cs-interactive-mode-banner-text">
      <div class="cs-interactive-mode-banner-title">
        {{ displayTitle }}
        <ArrowTopRightOnSquareIcon v-if="opensInNewTab" class="cs:w-4 cs:h-4 cs:ml-1 cs:inline-block" />
      </div>
      <div class="cs-interactive-mode-banner-sub">
        {{ displaySubtitle }}
        <NewTabHint v-if="opensInNewTab" />
      </div>
    </div>
    <div class="cs-interactive-mode-banner-arrow">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { ArrowTopRightOnSquareIcon } from '@heroicons/vue/20/solid'
import NewTabHint from './NewTabHint.vue'

const props = defineProps<{
  title?: string
  subtitle?: string
  opensInNewTab?: boolean
}>()

defineEmits<{
  activate: []
}>()

const displayTitle = computed(() => props.title || 'Cook step-by-step')
const displaySubtitle = computed(() => props.subtitle || 'Full screen with timers & ingredient lists')
</script>
