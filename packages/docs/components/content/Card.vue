<template>
  <div
    class="card-item bg-base-100 border-base-300 hover:shadow-lg hover:border-cyan-300 hover:bg-base-200/50 group relative border-2 rounded-lg shadow-sm cursor-pointer"
  >
    <NuxtLink
      :to="to"
      class="hover:no-underline block p-6 no-underline"
    >
      <div class="flex items-start space-x-4">
        <span v-if="icon" class="flex-shrink-0 text-3xl">{{ icon }}</span>
        <div class="flex-1">
          <h3 class="text-base-content group-hover:text-primary mb-2 text-lg font-semibold transition-colors">
            {{ title }}
          </h3>
          <div class="text-base-content/70 text-sm">
            <slot />
          </div>
        </div>
      </div>
    </NuxtLink>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  title: string
  to: string
  icon?: string
}>()
</script>

<style scoped>
/* Override any link underlines */
.card-item a,
.card-item a:hover,
.card-item a:focus {
  text-decoration: none !important;
}

/* Ensure all nested elements don't have underlines */
.card-item * {
  text-decoration: none !important;
}
</style>