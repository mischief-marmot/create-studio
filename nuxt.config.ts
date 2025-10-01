import tailwindcss from "@tailwindcss/vite";
import { createConsola } from "consola";
import vue from '@vitejs/plugin-vue'

const logger = createConsola({
  level: 5,
  fancy: true,
  formatOptions: {
    columns: 80,
    colors: true,
    compact: false,
    date: false,
  },
}).withTag("CS:NuxtConfig");

let building = false;

async function buildAndUploadWidget() {
  if (process.env.NODE_ENV === "test" || building) return; // Skip during tests
  building = true;

  const { buildWidget } = await import("./scripts/build-widget.mjs");

  // Build the widget (build script now handles uploads automatically)
  const success = await buildWidget();

  building = false;

  return success;
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
    experimental: {
      openAPI: true,
    },
    routeRules: {
      "/embed/**": {
        cors: true,
        headers: { "Access-Control-Allow-Origin": "*" },
      },
      "/creations/{id}/interactive": {
        cors: true,
        headers: { "Access-Control-Allow-Origin": "*" },
        cache: {
          maxAge: 60 * 60 * 24, // 1 day
        },
      },
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
      allowedHosts: ["host.docker.internal", "localhost"],
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
    registry: {
      googleAnalytics: {
        id: "G-Q7YTD7XTY0",
      },
    },
  },

  runtimeConfig: {
    debug: false,
    apiNinjasKey: "",
    servicesApiJwtSecret: "",
    postmarkKey: "",
    sendingAddress: "hello@create.studio",
    nixId: "",
    nixKey: "",
    public: {
      debug: process.env.NUXT_DEBUG || false,
      companyName: "Mischief Marmot LLC",
      productName: "Create Studio",
      rootUrl: "https://create.studio",
      supportEmail: "support@create.studio",
    },
  },

  hooks: {
    // Build and upload widget after Nuxt build (for production)
    "build:done": async () => {
      if (process.env.NODE_ENV !== "production") return; // Skip during tests
      // This runs during `nuxt build` which happens in production deployments
      logger.info(
        "Build done hook - building and uploading widget for production"
      );
      await buildAndUploadWidget();
    },
    // Build and upload widget on dev server start
    ready: async (nuxt) => {
      if (nuxt.options.dev) {
        // Watch for widget file changes
        const chokidar = await import("chokidar");
        const watcher = chokidar.watch(
          [
            "widget-entry.ts",
            "widget.css",
            "./app/components/widgets",
            "./shared/lib/widget-sdk",
          ],
          {
            ignored: /node_modules/,
            persistent: true,
          }
        );

        // Debug: log watched files
        watcher.on("ready", () => {
          logger.info("Widget file watcher is ready and watching:");
          const watched = watcher.getWatched();
          let watchedMessage = ``;
          Object.keys(watched).forEach((dir) => {
            const files = watched[dir];
            if (files) {
              files.forEach((file) => {
                watchedMessage += `- ${dir}/${file}\n`;
              });
            }
          });
          logger.box({
            title: "Watched Files",
            message: watchedMessage.trim(),
            style: {
              borderColor: "cyan",
              padding: 2,
            },
          });
        });

        let changeTimeout: NodeJS.Timeout | null = null;
        watcher.on("change", async (path) => {
          // Clear any existing timeout
          if (changeTimeout) {
            clearTimeout(changeTimeout);
          }

          // Set a new timeout to debounce multiple file changes
          changeTimeout = setTimeout(async () => {
            logger.box({
              title: "Widget file changed",
              message: path,
              style: {
                borderColor: "yellow",
                padding: 1,
              },
            });

            changeTimeout = null;
          }, 500); // Wait 500ms after last change before rebuilding
          buildAndUploadWidget();
        });
      }
    },
  },
});
