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
    "@nuxthub/core",
    "@nuxtjs/supabase",
  ],
  hub: {
    blob: true,
    kv: true,
  },

  app: {
    head: {
      title: "Schema Card Generator",
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

  runtimeConfig: {
    apiNinjasKey: process.env.API_NINJAS_KEY,
  },

  supabase: {
    url: process.env.SUPABASE_URL || "http://127.0.0.1:54321",
    key:
      process.env.SUPABASE_ANON_KEY ||
      "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0",
    redirectOptions: {
      login: "/login",
      callback: "/dashboard",
      exclude: ["/", "/register", "/forgot-password"],
    },
  },
});
