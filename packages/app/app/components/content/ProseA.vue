<template>
  <NuxtLink
    :href="props.href"
    :target="props.target"
    class="inline-flex items-baseline justify-around h-[20px]"
  >
    <component :is="props.href && props.href.includes('mailto') ? EnvelopeIcon : LinkIcon"  class="size-4 inline-block mr-1" /><slot />
  </NuxtLink>
</template>

<script setup lang="ts">
import { EnvelopeIcon, LinkIcon } from '@heroicons/vue/20/solid';
import type { PropType } from 'vue'

const props = defineProps({
  href: {
    type: String,
    default: ''
  },
  target: {
    type: String as PropType<'_blank' | '_parent' | '_self' | '_top' | (string & object) | null | undefined>,
    default: undefined,
    required: false
  }
})
</script>