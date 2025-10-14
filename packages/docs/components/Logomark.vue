<script setup lang="ts">
defineProps<{
  className?: string
}>()
</script>

<template>
  <svg aria-hidden="true" viewBox="0 0 36 36" fill="none" :class="className">
    <g fill="none" stroke="currentColor" stroke-linejoin="round" :stroke-width="3">
      <path d="M10.308 5L18 17.5 10.308 30 2.615 17.5 10.308 5z" />
      <path d="M18 17.5L10.308 5h15.144l7.933 12.5M18 17.5h15.385L25.452 30H10.308L18 17.5z" />
    </g>
  </svg>
</template>
