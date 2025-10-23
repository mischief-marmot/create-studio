<template>
  <div
    v-if="isAnimated"
    class="ring-1 ring-black/5 ring-inset absolute inset-0 bottom-0 z-0"
    :style="animatedStyle"
    :class="animatedClass"
  ></div>
  <div
    v-else
    class="ring-1 ring-black/5 ring-inset absolute inset-0 bottom-0 z-0"
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
  // Enable animated conic gradient rotation
  animate?: boolean
  // Speed of animation in seconds
  speed?: number
}

const props = withDefaults(defineProps<Props>(), {
  angle: 'mobile',
  animate: true,
  speed: 4
})

// Default gradient (original)
const defaultGradient: GradientConfig = {
  from: '#fff1be',
  via: '#ee87cb',
  to: '#b060ff',
  fromPercent: 28,
  viaPercent: 70
}

const isAnimated = computed(() => props.animate)

const getGradientColors = computed(() => {
  if (typeof props.color === 'string' && props.color.trim() !== '') {
    // For solid color strings, we can't use conic gradient, so return null
    return null
  } else if (props.color && typeof props.color === 'object') {
    // Custom gradient object
    return props.color as GradientConfig
  } else {
    // Default gradient
    return defaultGradient
  }
})

const animatedClass = computed(() => {
  // If color is a solid color class string, apply it for animated mode
  if (typeof props.color === 'string' && props.color.trim() !== '') {
    return [props.color]
  }
  return []
})

const animatedStyle = computed(() => {
  const colors = getGradientColors.value
  if (!colors) return {}

  return {
    background: `conic-gradient(from 0deg, ${colors.from}, ${colors.via}, ${colors.to}, ${colors.from})`,
    animation: `spin ${props.speed}s linear infinite`,
    width: '200%',
    height: '200%',
    top: '-50%',
    left: '-50%',
    transformOrigin: 'center'
  }
})

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