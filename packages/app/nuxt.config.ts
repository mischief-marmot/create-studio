import tailwindcss from "@tailwindcss/vite";
import vue from '@vitejs/plugin-vue'

const toCache = process.env.NODE_ENV === 'production' && {
          cache: {
            maxAge: 60 * 60 * 24, // 1 day
          }
        }

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: "2026-01-12",
  future: {
    compatibilityVersion: 4,
  },
  devServer: {
    port: 3001,
  },
  debug: false,
  devtools: { enabled: false, timeline: { enabled: true } },
  nitro: {
    preset: "cloudflare_durable",
    rollupConfig: {
      plugins: [vue()],
      external: ['cloudflare:workers', 'cloudflare:sockets']
    },
    cors: {
      origin: ["http://localhost:3000", "http://localhost:3001", "http://localhost:8074", "http://localhost:8174", "http://localhost:8274", "http://localhost:8374", "http://localhost:8081", "http://localhost:8083"],
      methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
      credentials: true,
    },
    cloudflare: {
      deployConfig: false,
      nodeCompat: true,
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
      tasks: true,
    },
    scheduledTasks: {
      // Daily analytics rollup at 2am UTC (matches wrangler.jsonc cron trigger)
      '0 2 * * *': ['analytics:rollup'],
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
      // Suppress sourcemap warning from Tailwind
      {
        apply: "build",
        name: "vite-plugin-suppress-sourcemap-warnings",
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
      allowedHosts: true,
      middlewareMode: true,
      hmr: {
        host: "localhost",
        port: 3001,
      },
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, PATCH, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
      },
    },
  },
  css: ["./app/assets/main.css"],

  modules: [
    "@nuxt/eslint",
    "@nuxt/image",
    "@nuxt/test-utils/module",
    "@pinia/nuxt",
    "@nuxt/content",  // Must be before @nuxthub/core for database auto-config
    "@nuxthub/core",
    "@nuxt/scripts",
    "@nuxt/fonts",
    "nuxt-og-image",
    "nuxt-schema-org",
    "nuxt-auth-utils",
  ],
  ogImage: {
    defaults: {
      width: 1200,
      height: 630,
    },
    compatibility: {
      runtime: {
        'resvg': 'wasm',
        'css-inline': 'wasm',
      },
    },
  },
  content: {
    // Database auto-configured by NuxtHub when registered after @nuxt/content
    build: {
      markdown: {
        // Disable syntax highlighting (Shiki is ~1MB+)
        highlight: false,
      },
    },
  },
  hub: {
    blob: true,
    kv: true,
    db: {
      applyMigrationsDuringBuild: false,
      dialect: 'sqlite',
    },
    cache: true,
    // DB_ANALYTICS (analytics D1 database) is configured via wrangler.jsonc binding,
    // not through hub config — NuxtHub only manages a single D1 via hub.db.
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
            "Create structured data cards for recipes, how-to guides, and lists with automatic JSON-LD generation",
        },
      ],
       link: [
        { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
        { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: '' },
        {
          rel: 'stylesheet',
          href: 'https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=Fraunces:wght@200;300;400;500;600;700;800;900&family=Satoshi:ital,wght@0,400..900;1,400..900&display=swap',
        },
        {
          rel: 'stylesheet',
          href: 'https://cdn.fontshare.com/css?f[]=satoshi@300,400,500,700&display=swap',
        },
      ],
    },
  },

  scripts: {
    registry: {
      googleAnalytics:  {
        id: '', // NUXT_PUBLIC_SCRIPTS_GOOGLE_ANALYTICS_ID
        consent: 'analytics', // Require analytics consent before loading
        anonymizeIp: true, // GDPR-friendly
      },
    },
  },
  $development: {
    scripts: {
      registry: {
        googleAnalytics: "mock",
      },
    },
  },

  runtimeConfig: {
    debug: false,
    apiNinjasKey: "",
    servicesApiJwtSecret: "",
    postmarkKey: "",
    sendingAddress: "hello@create.studio",
    session: {
      password: "",
      cookie: {
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
      },
    },
    stripeSecretKey: "",
    stripeWebhookSecret: "",
    stripeMultiSiteCouponId: "",
    webhookPrivateKey: "",
    adminApiKey: "",
    betaUploadApiKey: "",
    cloudflareApiToken: "",
    cloudflareZoneId: "",
    // Comma-separated list of domain patterns allowed for testing (e.g., ".local,.test")
    // These bypass the production block on internal/reserved domains
    allowedTestDomains: "fastfoodforfamilies.local,localhost,localhost:8074,localhost:8174,localhost:8274",
    public: {
      debug: false,
      companyName: "Mischief Marmot LLC",
      productName: "Create Studio",
      rootUrl: "https://create.studio",
      supportEmail: "support@create.studio",
      loadAds: false,
      scripts: {
        googleAnalytics: {
          id: '', // NUXT_PUBLIC_SCRIPTS_GOOGLE_ANALYTICS_ID
        }
      },
      webhookPublicKey: "",
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
