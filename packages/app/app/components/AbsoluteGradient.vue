<template>
  <div
    class="absolute z-0 inset-0 ring-1 bottom-0 ring-black/5 ring-inset"
    :class="computedClass"
  ></div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface GradientConfig {
  from: string
  via: string
  to: string
  fromPercent?: number
  viaPercent?: number
}

interface Props {
  // Can be a solid color class string (e.g., 'bg-success') or a gradient object
  color?: string | GradientConfig
  // Gradient angle: 'mobile' (115deg) or 'tablet' (145deg)
  angle?: 'mobile' | 'tablet'
}

const props = withDefaults(defineProps<Props>(), {
  angle: 'mobile'
})

// Default gradient (original)
const defaultGradient: GradientConfig = {
  from: '#fff1be',
  via: '#ee87cb',
  to: '#b060ff',
  fromPercent: 28,
  viaPercent: 70
}

const computedClass = computed(() => {
  const classes: string[] = []

  // Handle color - can be a string (solid color class) or gradient object
  if (typeof props.color === 'string' && props.color.trim() !== '') {
    // Non-empty solid color class (e.g., 'bg-success', 'bg-error')
    classes.push(props.color)
  } else if (props.color && typeof props.color === 'object') {
    // Custom gradient object
    const gradient = props.color as GradientConfig
    const fromPercent = gradient.fromPercent ?? 28
    const viaPercent = gradient.viaPercent ?? 70
    classes.push(
      `bg-linear-115 from-[${gradient.from}] from-${fromPercent}% via-[${gradient.via}] via-${viaPercent}% to-[${gradient.to}]`
    )
  } else {
    // Default to the original gradient (when color is empty string, undefined, or null)
    const fromPercent = defaultGradient.fromPercent
    const viaPercent = defaultGradient.viaPercent
    classes.push(
      `bg-linear-115 from-[${defaultGradient.from}] from-${fromPercent}% via-[${defaultGradient.via}] via-${viaPercent}% to-[${defaultGradient.to}]`
    )
  }

  // Add angle class
  if (props.angle === 'tablet') {
    classes.push('sm:bg-linear-145')
  } else {
    classes.push('sm:bg-linear-115')
  }

  return classes
})
</script>