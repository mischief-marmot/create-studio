<template>
  <div 
    @mousedown.prevent="$emit('start-drag', $event)"
    @touchstart.prevent="$emit('start-drag', $event)"
    @touchmove.prevent="$emit('drag', $event)"
    @touchend.prevent="$emit('end-drag')"
    class="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-black/20 to-transparent flex items-end justify-center pb-2 cursor-ns-resize touch-none"
  >
    <div class="w-12 h-1 bg-white/80 rounded-full shadow-md"></div>
  </div>
</template>

<script setup lang="ts">
defineEmits<{
  'start-drag': [event: MouseEvent | TouchEvent];
  'drag': [event: MouseEvent | TouchEvent];
  'end-drag': [];
}>();
</script>