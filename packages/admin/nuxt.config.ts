import tailwindcss from "@tailwindcss/vite";

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: "2026-01-12",
  future: {
    compatibilityVersion: 4,
  },

  // Extend the main app as a layer to share components, composables, server utils
  extends: ["../app"],

  devServer: {
    port: 3002,
  },

  devtools: { enabled: false },

  // Override nitro settings for admin
  nitro: {
    preset: "cloudflare_durable",
  },

  vite: {
    plugins: [tailwindcss()],
  },

  css: ["./app/assets/main.css"],

  // Admin-specific modules (inherits from main app layer)
  modules: [
    "@nuxt/eslint",
    "@pinia/nuxt",
    "@nuxthub/core",
    "nuxt-auth-utils",
  ],

  hub: {
    // Share database with main app
    db: {
      dialect: "sqlite",
    },
  },

  app: {
    head: {
      title: "Create Studio Admin",
      meta: [
        { charset: "utf-8" },
        { name: "viewport", content: "width=device-width, initial-scale=1" },
        {
          name: "description",
          content: "Admin portal for Create Studio",
        },
        { name: "robots", content: "noindex, nofollow" },
      ],
      link: [
        { rel: "preconnect", href: "https://fonts.googleapis.com" },
        { rel: "preconnect", href: "https://fonts.gstatic.com", crossorigin: "" },
        {
          rel: "stylesheet",
          href: "https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=Fraunces:wght@200;300;400;500;600;700;800;900&family=Satoshi:ital,wght@0,400..900;1,400..900&display=swap",
        },
      ],
    },
  },

  runtimeConfig: {
    // Admin-specific config
    adminSessionPassword: "",
    // Session configuration for nuxt-auth-utils
    session: {
      password: process.env.NUXT_ADMIN_SESSION_PASSWORD || "",
    },
    public: {
      productName: "Create Studio Admin",
    },
  },
});
