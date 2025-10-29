import tailwindcss from "@tailwindcss/vite";
import vue from '@vitejs/plugin-vue'

const toCache = process.env.NODE_ENV === 'production' && {
          cache: {
            maxAge: 60 * 60 * 24, // 1 day
          }
        }

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: "2025-09-18",
  future: {
    compatibilityVersion: 4,
  },
  devServer: {
    port: 3001,
  },
  debug: false,
  devtools: { enabled: false, timeline: { enabled: true } },
  nitro: {
    rollupConfig: {
      plugins: [vue()]
    },
    cloudflare: {
      pages: {
        routes: {
          exclude: ['/assets/*']
        }
      }
    },
    compatibilityFlags: ['nodejs_compat'],
    alias: {
      'object-inspect': '../../node_modules/unenv/dist/runtime/mock/empty.mjs',
      'picomatch': '../../node_modules/unenv/dist/runtime/mock/empty.mjs',
      'anymatch': '../../node_modules/unenv/dist/runtime/mock/empty.mjs',
      'file-uri-to-path': '../../node_modules/unenv/dist/runtime/mock/empty.mjs',
      'bindings': '../../node_modules/unenv/dist/runtime/mock/empty.mjs',
      'better-sqlite3': '../../node_modules/unenv/dist/runtime/mock/empty.mjs'
    },
    experimental: {
      openAPI: true,
      websocket: true,
    },
    routeRules: {
      "/embed/**": {
        cors: true,
        headers: { "Access-Control-Allow-Origin": "*" },
        toCache
      },
      "/download/**": {
        cors: true,
        headers: { "Access-Control-Allow-Origin": "*" },
        toCache
      },
      "/creations/{id}/interactive": {
        cors: true,
        headers: { "Access-Control-Allow-Origin": "*" },
        toCache
      },
      "/api/v2/timers/**": {
        cors: true,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type",
        },
      },
      '/plugin': { redirect: 'https://wordpress.org/plugins/mediavine-create' },

    },
  },
  vite: {
    plugins: [
      tailwindcss(),
      // hides sourcemap warning for tailwind
      {
        apply: "build",
        name: "vite-plugin-ignore-sourcemap-warnings",
        configResolved(config) {
          const originalOnWarn = config.build.rollupOptions.onwarn;
          config.build.rollupOptions.onwarn = (warning, warn) => {
            if (
              warning.code === "SOURCEMAP_BROKEN" &&
              warning.plugin === "@tailwindcss/vite:generate:build"
            ) {
              return;
            }

            if (originalOnWarn) {
              originalOnWarn(warning, warn);
            } else {
              warn(warning);
            }
          };
        },
      },
    ],
    server: {
      allowedHosts: ["host.docker.internal", "localhost", "7823d21b31b9.ngrok-free.app"],
    },
  },
  css: ["./app/assets/main.css"],

  modules: [
    "@nuxt/eslint",
    "@nuxt/image",
    "@nuxt/test-utils/module",
    "@pinia/nuxt",
    "@nuxthub/core",
    "@nuxt/scripts",
    "nuxt-auth-utils",
    "@nuxt/content",
  ],
  hub: {
    blob: true,
    kv: true,
    database: true,
    cache: true,
    bindings: {
      observability: {
        logs: true,
      },
    },
  },
  app: {
    head: {
      title: "Create Studio - Schema Cards",
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

  scripts: {
    registry: process.env.NODE_ENV === 'production' ?{
      googleAnalytics:  {
        id: "G-Q7YTD7XTY0"
      },
    } : {},
  },

  runtimeConfig: {
    debug: false,
    apiNinjasKey: "",
    servicesApiJwtSecret: "",
    postmarkKey: "",
    sendingAddress: "hello@create.studio",
    nixId: "",
    nixKey: "",
    stripeSecretKey: "",
    stripeWebhookSecret: "",
    public: {
      debug: false,
      companyName: "Mischief Marmot LLC",
      productName: "Create Studio",
      rootUrl: "https://create.studio",
      supportEmail: "support@create.studio",
      stripePublishableKey: "",
      stripePrice: {
        monthly: "",
        quarterly: "",
        annual: "",
        biennial: "",
      },
      stripeBillingPortalUrl: "",
    },
  },
});
