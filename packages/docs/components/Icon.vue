<script setup lang="ts">
import { computed } from 'vue'
import clsx from 'clsx'
import {
  RocketLaunchIcon,
  LightBulbIcon,
  PuzzlePieceIcon,
  SwatchIcon,
  ExclamationTriangleIcon,
  Cog6ToothIcon,
} from '@heroicons/vue/24/outline'

const props = withDefaults(defineProps<{
  icon: 'installation' | 'presets' | 'plugins' | 'theming' | 'lightbulb' | 'warning'
  className?: string
}>(), {})

const icons = {
  installation: RocketLaunchIcon,
  presets: Cog6ToothIcon,
  plugins: PuzzlePieceIcon,
  theming: SwatchIcon,
  lightbulb: LightBulbIcon,
  warning: ExclamationTriangleIcon,
}

const IconComponent = computed(() => icons[props.icon])
</script>

<template>
  <component
    :is="IconComponent"
    :class="clsx('h-6 w-6', className)"
    aria-hidden="true"
  />
</template>
