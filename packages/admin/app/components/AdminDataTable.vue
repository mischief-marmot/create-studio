<template>
  <div class="admin-section">
    <!-- Loading State -->
    <div v-if="loading" class="flex items-center justify-center py-12">
      <span class="loading loading-spinner loading-lg text-primary"></span>
    </div>

    <!-- Table -->
    <div v-else-if="data.length > 0" class="overflow-x-auto">
      <table class="admin-table">
        <thead>
          <tr>
            <th
              v-for="column in columns"
              :key="column.key"
              :class="{ 'cursor-pointer select-none hover:bg-base-200': column.sortable }"
              @click="column.sortable ? handleSort(column.key) : null"
            >
              <div class="flex items-center gap-2">
                <span>{{ column.label }}</span>
                <span
                  v-if="column.sortable"
                  class="inline-flex flex-col text-base-content/30"
                  :class="{ 'text-primary': currentSortKey === column.key }"
                >
                  <svg
                    v-if="currentSortKey !== column.key || currentSortDirection === 'asc'"
                    class="size-3"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                    :class="{ 'opacity-30': currentSortKey !== column.key || currentSortDirection === 'desc' }"
                  >
                    <path d="M5.293 9.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 7.414V15a1 1 0 11-2 0V7.414L6.707 9.707a1 1 0 01-1.414 0z" />
                  </svg>
                  <svg
                    v-if="currentSortKey === column.key && currentSortDirection === 'desc'"
                    class="size-3"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path d="M14.707 10.293a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 111.414-1.414L9 12.586V5a1 1 0 012 0v7.586l2.293-2.293a1 1 0 011.414 0z" />
                  </svg>
                </span>
              </div>
            </th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(row, index) in paginatedData" :key="index">
            <td v-for="column in columns" :key="column.key">
              <slot
                :name="`cell-${column.key}`"
                :row="row"
                :value="getCellValue(row, column.key)"
              >
                {{ getCellValue(row, column.key) }}
              </slot>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Empty State -->
    <div v-else class="flex flex-col items-center justify-center py-12 text-center">
      <div class="bg-base-200 rounded-full size-16 flex items-center justify-center mb-4">
        <svg class="size-8 text-base-content/40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
        </svg>
      </div>
      <p class="text-base-content/60 text-sm">No data available</p>
    </div>

    <!-- Pagination -->
    <div
      v-if="!loading && data.length > 0 && totalPages > 1"
      class="border-t border-base-300 px-6 py-4 flex items-center justify-between"
    >
      <div class="text-base-content/60 text-sm">
        Showing {{ startIndex + 1 }} to {{ Math.min(endIndex, data.length) }} of {{ data.length }} results
      </div>
      <div class="flex items-center gap-2">
        <button
          class="btn btn-sm btn-ghost"
          :disabled="currentPage === 1"
          @click="handlePageChange(currentPage - 1)"
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
            class="btn btn-sm"
            :class="page === currentPage ? 'btn-primary' : 'btn-ghost'"
            @click="handlePageChange(page)"
            :aria-label="`Go to page ${page}`"
            :aria-current="page === currentPage ? 'page' : undefined"
          >
            {{ page }}
          </button>
        </div>

        <button
          class="btn btn-sm btn-ghost"
          :disabled="currentPage === totalPages"
          @click="handlePageChange(currentPage + 1)"
          aria-label="Next page"
        >
          <svg class="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'

export interface TableColumn {
  key: string
  label: string
  sortable?: boolean
}

interface Props {
  columns: TableColumn[]
  data: Record<string, any>[]
  loading?: boolean
  pageSize?: number
}

const props = withDefaults(defineProps<Props>(), {
  loading: false,
  pageSize: 10,
})

const emit = defineEmits<{
  (e: 'sort', key: string, direction: 'asc' | 'desc'): void
}>()

const currentPage = ref(1)
const currentSortKey = ref<string | null>(null)
const currentSortDirection = ref<'asc' | 'desc'>('asc')

const totalPages = computed(() => Math.ceil(props.data.length / props.pageSize))
const startIndex = computed(() => (currentPage.value - 1) * props.pageSize)
const endIndex = computed(() => startIndex.value + props.pageSize)

const paginatedData = computed(() => {
  return props.data.slice(startIndex.value, endIndex.value)
})

const visiblePages = computed(() => {
  const pages: number[] = []
  const maxVisible = 5
  let start = Math.max(1, currentPage.value - Math.floor(maxVisible / 2))
  let end = Math.min(totalPages.value, start + maxVisible - 1)

  if (end - start < maxVisible - 1) {
    start = Math.max(1, end - maxVisible + 1)
  }

  for (let i = start; i <= end; i++) {
    pages.push(i)
  }

  return pages
})

const getCellValue = (row: Record<string, any>, key: string) => {
  return key.split('.').reduce((obj, k) => obj?.[k], row) ?? ''
}

const handleSort = (key: string) => {
  if (currentSortKey.value === key) {
    currentSortDirection.value = currentSortDirection.value === 'asc' ? 'desc' : 'asc'
  } else {
    currentSortKey.value = key
    currentSortDirection.value = 'asc'
  }
  emit('sort', key, currentSortDirection.value)
}

const handlePageChange = (page: number) => {
  if (page >= 1 && page <= totalPages.value) {
    currentPage.value = page
  }
}

// Expose methods for parent components
defineExpose({
  currentPage,
  resetPage: () => {
    currentPage.value = 1
  },
})
</script>
