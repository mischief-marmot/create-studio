<template>
  <div class="bg-base-100 rounded-xl shadow-lg ring-1 ring-base-content/10 overflow-hidden max-w-sm mx-auto my-6">
    <!-- Toolbar -->
    <div class="bg-base-200 px-4 py-2 flex items-center gap-2 border-b border-base-300">
      <div class="flex gap-1.5">
        <span class="w-2.5 h-2.5 rounded-full bg-error/60" />
        <span class="w-2.5 h-2.5 rounded-full bg-warning/60" />
        <span class="w-2.5 h-2.5 rounded-full bg-success/60" />
      </div>
      <span class="text-xs text-base-content/40 font-mono ml-2">{{ title || 'Card Editor' }}</span>
    </div>
    <!-- Content area -->
    <div class="p-4">
      <slot />
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  title?: string
}>()
</script>
