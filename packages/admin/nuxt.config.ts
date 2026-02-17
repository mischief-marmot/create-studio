import tailwindcss from "@tailwindcss/vite";

// Suppress known upstream warning from @nuxthub/core's tsdown/rolldown-plugin-dts dependency
// See: https://github.com/rolldown/tsdown/issues/182
const _warn = console.warn;
console.warn = (...args: unknown[]) => {
  if (typeof args[0] === "string" && args[0].includes("[rolldown-plugin-dts]")) return;
  _warn(...args);
};

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: "2026-01-12",
  future: {
    compatibilityVersion: 4,
  },

  devServer: {
    port: 3010,
  },

  devtools: { enabled: false },

  // Override nitro settings for admin
  nitro: {
    preset: "cloudflare_durable",
  },

  vite: {
    plugins: [tailwindcss()],
    server: {
      allowedHosts: true,
    },
  },

  css: ["./app/assets/main.css"],

  modules: [
    "@nuxt/eslint",
    "@pinia/nuxt",
    "@nuxthub/core",
    "nuxt-auth-utils",
  ],

  hub: {
    // Share database and KV with main app
    dir: "../app/.data/hub",
    kv: true,
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
    // Main app URLs for proxying API calls (e.g., debug webhooks)
    mainAppUrl: "http://localhost:3000",
    mainAppPreviewUrl: "http://localhost:3000",
    // Shared secret for service-to-service auth with main app
    mainAppApiKey: "",
    // Session configuration for nuxt-auth-utils
    session: {
      password: process.env.NUXT_ADMIN_SESSION_PASSWORD || "",
      cookie: {
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
      },
    },
    public: {
      productName: "Create Studio Admin",
    },
  },
});
