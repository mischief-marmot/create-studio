<template>
  <h3 :id="props.id">
    <a
      v-if="props.id && generate"
      :href="`#${props.id}`"
    >
      <span class=" md:mr-2 inline-block mr-1">##</span><slot />
    </a>
    <slot v-else />
  </h3>
</template>

<script setup lang="ts">
const props = defineProps<{ id?: string }>()

const { headings } = useRuntimeConfig().public.mdc
const generate = computed(() => props.id && ((typeof headings?.anchorLinks === 'boolean' && headings?.anchorLinks === true) || (typeof headings?.anchorLinks === 'object' && headings?.anchorLinks?.h2)))
</script>