<template>
  <div class="bg-base-100 text-base-content flex items-center justify-center min-h-screen p-3">
    <div class="w-full max-w-md">
      <!-- Logo/Brand -->
      <div class="text-center">
        <NuxtLink to="/" class="inline-flex items-center justify-center space-x-2">
          <LogoFull class="size-52 inline-block" />
        </NuxtLink>
      </div>

      <!-- Content Card -->
      <div class="card bg-base-100 rounded-4xl relative p-3 overflow-hidden shadow-xl">
        <AbsoluteGradient
          animate
          :speed=3
          :color="gradientColor"
          :angle="gradientAngle"
        />
        <div class="card-body bg-base-100 rounded-3xl z-10">
          <slot />
        </div>
      </div>

      <!-- Footer -->
      <div class=" mt-6 text-sm text-center">
        <p>&copy; {{ new Date().getFullYear() }} {{ config.productName }}. All rights reserved.</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, provide } from 'vue'

interface GradientConfig {
  from: string
  via: string
  to: string
  fromPercent?: number
  viaPercent?: number
}

const config = useRuntimeConfig().public

// Can be a string (color class) or gradient config object
const gradientColor = ref<string | GradientConfig>('') // Empty string defaults to default gradient
const gradientAngle = ref<'mobile' | 'tablet'>('mobile')

// Function to update gradient configuration from child components
const setGradient = (colorOrGradient: string | GradientConfig) => {
  gradientColor.value = colorOrGradient
}

// Provide gradient configuration to child components
provide('authGradient', { setGradient })
</script>
