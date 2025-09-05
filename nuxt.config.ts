import tailwindcss from "@tailwindcss/vite";
import { embedMinifier } from "./utils/vite/embed-plugin.js";

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: "2024-11-01",
  devtools: { enabled: false },
  vite: {
    plugins: [tailwindcss(), embedMinifier()],
  },
  css: ["~/assets/main.css"],

  modules: [
    "@nuxt/eslint",
    "@nuxt/image",
    "@nuxt/test-utils/module",
    "@pinia/nuxt",
    "@nuxthub/core",
  ],
  hub: {
    blob: true,
    kv: true,
    database: true,
    cache: true,
  },

  app: {
    head: {
      title: "Halogen - Schema Cards",
      meta: [
        { charset: "utf-8" },
        { name: "viewport", content: "width=device-width, initial-scale=1" },
        {
          name: "description",
          content:
            "Create structured data cards for recipes, how-to guides, and FAQs with automatic JSON-LD generation",
        },
      ],
    },
  },
  nitro: {
    experimental: {
      openAPI: true,
    },
  },

  runtimeConfig: {
    apiNinjasKey: process.env.API_NINJAS_KEY,
  },
});
