<template>
  <div v-if="!dismissed" class="cs-interactive-mode-tooltip">
    <span class="cs-interactive-mode-tooltip-text">{{ displayTitle }}</span>
    <button class="cs-interactive-mode-tooltip-try" @click="$emit('activate')">{{ displayButtonText }}</button>
    <span class="cs-interactive-mode-tooltip-dismiss" @click.stop="dismiss">&times;</span>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'

const props = defineProps<{
  title?: string
  buttonText?: string
}>()

defineEmits<{
  activate: []
}>()

const displayTitle = computed(() => props.title || 'Try hands-free cooking mode')
const displayButtonText = computed(() => props.buttonText || 'Try it')

const dismissed = ref(false)

function dismiss() {
  dismissed.value = true
}
</script>
