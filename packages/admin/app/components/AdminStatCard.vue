<template>
  <div class="admin-stat-card">
    <div class="flex items-start justify-between mb-3">
      <div class="flex-1">
        <p class="text-base-content/60 text-sm font-medium mb-1">{{ title }}</p>
        <p class="text-base-content text-3xl font-bold tracking-tight">
          {{ formattedValue }}
        </p>
      </div>
      <div
        v-if="icon"
        class="bg-primary/10 rounded-lg size-12 flex items-center justify-center shrink-0"
        :aria-hidden="true"
      >
        <component :is="icon" class="size-6 text-primary" />
      </div>
    </div>

    <!-- Trend Indicator -->
    <div v-if="trend !== undefined && trend !== null" class="flex items-center gap-1.5">
      <!-- Up Trend -->
      <div
        v-if="trend > 0"
        class="flex items-center gap-1 text-success text-sm font-medium"
        role="status"
        :aria-label="`${trend}% increase`"
      >
        <svg class="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 10l7-7m0 0l7 7m-7-7v18" />
        </svg>
        <span>{{ Math.abs(trend) }}%</span>
      </div>

      <!-- Down Trend -->
      <div
        v-else-if="trend < 0"
        class="flex items-center gap-1 text-error text-sm font-medium"
        role="status"
        :aria-label="`${Math.abs(trend)}% decrease`"
      >
        <svg class="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 14l-7 7m0 0l-7-7m7 7V3" />
        </svg>
        <span>{{ Math.abs(trend) }}%</span>
      </div>

      <!-- No Change -->
      <div
        v-else
        class="flex items-center gap-1 text-base-content/60 text-sm font-medium"
        role="status"
        aria-label="No change"
      >
        <svg class="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 12h14" />
        </svg>
        <span>0%</span>
      </div>

      <span class="text-base-content/50 text-sm">{{ trendLabel }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, type Component } from 'vue'

interface Props {
  title: string
  value: string | number
  trend?: number
  trendLabel?: string
  icon?: Component
  formatValue?: (value: string | number) => string
}

const props = withDefaults(defineProps<Props>(), {
  trend: undefined,
  trendLabel: 'vs last period',
  icon: undefined,
  formatValue: undefined,
})

const formattedValue = computed(() => {
  if (props.formatValue) {
    return props.formatValue(props.value)
  }

  if (typeof props.value === 'number') {
    // Format large numbers with commas
    return props.value.toLocaleString()
  }

  return props.value
})
</script>
