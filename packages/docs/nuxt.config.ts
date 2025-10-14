// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: "2025-07-15",
  extends: [
    // Put this layer before one with nuxt content
    "@d0rich/nuxt-content-mermaid",
  ],
  modules: [
    // "@d0rich/nuxt-content-mermaid",
    "@nuxt/content",
    "@nuxthub/core",
    "@nuxt/image",
    "@nuxt/eslint",
  ],

  content: {
    build: {
      markdown: {
        highlight: {
          theme: "github-dark",
          preload: ["javascript", "typescript", "vue", "bash", "shell", "json"],
        },
      },
    },
  },

  hub: {
    database: true,
  },

  // css imported in app.vue instead

  vite: {
    css: {
      postcss: {
        plugins: [require("@tailwindcss/postcss")()],
      },
    },
  },

  app: {
    head: {
      title: "Create Studio Documentation",
      meta: [
        { charset: "utf-8" },
        { name: "viewport", content: "width=device-width, initial-scale=1" },
        {
          name: "description",
          content:
            "Documentation for Create Studio - Create structured data cards with automatic JSON-LD generation and embeddable widgets.",
        },
      ],
      link: [{ rel: "icon", type: "image/x-icon", href: "/favicon.ico" }],
    },
    config: {

    contentMermaid: {
      enabled: true,
      /**
       * @default 'default'
       * @description 'default' or '@nuxtjs/color-mode'
       */
      color: "default",
      spinnerComponent: "DAnimationSpinner",
    },
    }
  },

  devtools: { enabled: true },
});
