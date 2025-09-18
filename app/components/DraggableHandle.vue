<template>
  <div 
    @mousedown.prevent="$emit('start-drag', $event)"
    @touchstart.prevent="$emit('start-drag', $event)"
    class="absolute top-0 left-0 right-0 h-8 flex items-start justify-center pt-2 z-20 cursor-ns-resize"
    data-draggable-handle="true"
  >
    <div class="w-12 h-1 bg-base-content/30 rounded-full shadow-sm"></div>
  </div>
</template>

<script setup lang="ts">
defineEmits<{
  'start-drag': [event: MouseEvent | TouchEvent];
}>();
</script>