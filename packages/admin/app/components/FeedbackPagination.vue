<template>
  <div
    class="border-t border-base-300/50 px-6 py-4 flex items-center justify-between"
  >
    <div class="text-base-content/50 text-sm">
      Showing {{ startIndex + 1 }} to {{ Math.min(endIndex, pagination.total) }} of {{ pagination.total }} reports
    </div>
    <div class="flex items-center gap-2">
      <button
        class="p-2 rounded-lg text-base-content/50 hover:text-base-content hover:bg-base-200 transition-all disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-transparent"
        :disabled="pagination.page === 1"
        @click="$emit('pageChange', pagination.page - 1)"
        aria-label="Previous page"
      >
        <svg class="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
        </svg>
      </button>

      <div class="flex items-center gap-1">
        <button
          v-for="page in visiblePages"
          :key="page"
          class="min-w-[32px] h-8 px-2 rounded-lg text-sm font-medium transition-all"
          :class="page === pagination.page
            ? 'bg-primary text-primary-content'
            : 'text-base-content/70 hover:text-base-content hover:bg-base-200'"
          @click="$emit('pageChange', page)"
          :aria-label="`Go to page ${page}`"
          :aria-current="page === pagination.page ? 'page' : undefined"
        >
          {{ page }}
        </button>
      </div>

      <button
        class="p-2 rounded-lg text-base-content/50 hover:text-base-content hover:bg-base-200 transition-all disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-transparent"
        :disabled="pagination.page === pagination.totalPages"
        @click="$emit('pageChange', pagination.page + 1)"
        aria-label="Next page"
      >
        <svg class="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
        </svg>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
interface Props {
  pagination: { page: number; limit: number; total: number; totalPages: number }
  startIndex: number
  endIndex: number
  visiblePages: number[]
}

defineProps<Props>()
defineEmits<{
  (e: 'pageChange', page: number): void
}>()
</script>
