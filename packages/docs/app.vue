<script setup lang="ts">
import '~/assets/main.css'

// Set up fonts and meta
useHead({
  htmlAttrs: {
    lang: 'en',
    class: 'h-full antialiased',
  },
  bodyAttrs: {
    class: 'flex min-h-full bg-white dark:bg-slate-900',
  },
  link: [
    {
      rel: 'stylesheet',
      href: 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap',
    },
  ],
  style: [
    {
      children: `
        @font-face {
          font-family: 'Lexend';
          src: url('/fonts/lexend.woff2') format('woff2');
          font-display: swap;
          font-weight: 400 700;
        }
      `,
    },
  ],
})
</script>

<template>
  <div class="w-full">
    <NuxtPage />
  </div>
</template>
