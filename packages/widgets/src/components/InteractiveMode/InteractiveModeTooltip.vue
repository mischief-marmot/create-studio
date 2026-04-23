<template>
  <div v-if="!dismissed" class="cs-interactive-mode-tooltip">
    <span class="cs-interactive-mode-tooltip-text">
      {{ displayTitle }}
      <NewTabHint v-if="opensInNewTab" />
    </span>
    <button class="cs-interactive-mode-tooltip-try" @click="$emit('activate')">
      {{ displayButtonText }}
      <ArrowTopRightOnSquareIcon v-if="opensInNewTab" class="cs:w-4 cs:h-4 cs:ml-1 cs:inline-block" />
    </button>
    <span class="cs-interactive-mode-tooltip-dismiss" @click.stop="dismiss">&times;</span>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { ArrowTopRightOnSquareIcon } from '@heroicons/vue/20/solid'
import NewTabHint from './NewTabHint.vue'

const props = defineProps<{
  title?: string
  buttonText?: string
  opensInNewTab?: boolean
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
