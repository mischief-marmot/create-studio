import tailwindcss from "@tailwindcss/vite";

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: "2024-11-01",
  devtools: { enabled: false },
  vite: {
    plugins: [tailwindcss()],
  },
  css: ["~/assets/main.css"],

  modules: [
    "@nuxt/eslint",
    "@nuxt/image",
    "@nuxt/test-utils/module",
    "@pinia/nuxt",
  ],

  app: {
    head: {
      title: 'Nuxt Starter',
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        { name: 'description', content: 'A modern Nuxt 3 starter template with TypeScript, Tailwind CSS, and DaisyUI' }
      ]
    }
  }
});