<template>
  <div 
    @mousedown.prevent="$emit('start-drag', $event)"
    @touchstart.prevent="$emit('start-drag', $event)"
    class="cs:absolute cs:top-0 cs:left-0 cs:right-0 cs:h-8 cs:flex cs:items-start cs:justify-center cs:pt-2 cs:z-20 cs:cursor-ns-resize"
    data-draggable-handle="true"
  >
    <div class="cs:w-12 cs:h-1 cs:bg-base-content/30 cs:rounded-full cs:shadow-sm"></div>
  </div>
</template>

<script setup lang="ts">
defineEmits<{
  'start-drag': [event: MouseEvent | TouchEvent];
}>();
</script>