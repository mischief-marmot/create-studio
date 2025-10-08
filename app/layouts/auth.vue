<template>
  <div class="min-h-screen bg-base-100 text-base-content flex items-center justify-center p-3">
    <div class="w-full max-w-md">
      <!-- Logo/Brand -->
      <div class="text-center">
        <NuxtLink to="/" class="inline-flex justify-center items-center space-x-2">
          <LogoFull class="size-52 inline-block" />
        </NuxtLink>
      </div>

      <!-- Content Card -->
      <div class="relative card bg-base-100 shadow-xl p-3 rounded-4xl overflow-hidden">
        <AbsoluteGradient />
        <div class="card-body z-10 bg-base-100 rounded-3xl">
          <slot />
        </div>
      </div>

      <!-- Footer -->
      <div class="text-center mt-6 text-sm ">
        <p>&copy; {{ new Date().getFullYear() }} {{ config.productName }}. All rights reserved.</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const config = useRuntimeConfig().public
// Optional: Add any shared auth layout logic here
</script>
