import tailwindcss from "@tailwindcss/vite";
import { createConsola } from "consola"

const logger = createConsola({
  level: 5,
  fancy: true,
  formatOptions: {
      columns: 80,
      colors: true,
      compact: false,
      date: false,
  },
}).withTag('CS:NuxtConfig')

async function buildAndUploadWidget() {
  if (process.env.NODE_ENV === 'test') return // Skip during tests

  const { buildWidget } = await import('./scripts/build-widget.mjs')
  const { readFileSync, existsSync } = await import('fs')
  const { resolve } = await import('path')

  // Build the widget
  await buildWidget()

  // Read the built files
  const jsPath = resolve(process.cwd(), 'dist/embed/main.js')
  const cssPath = resolve(process.cwd(), 'dist/embed/main.css')

  if (!existsSync(jsPath)) {
    logger.warn('Widget JS file not found after build')
    return false
  }

  const jsContent = readFileSync(jsPath, 'utf-8')
  let cssContent = null

  if (existsSync(cssPath)) {
    cssContent = readFileSync(cssPath, 'utf-8')
  }

  // Prepare payload
  const payload = {
    js: jsContent,
    css: cssContent,
    metadata: {
      buildTime: new Date().toISOString(),
      version: process.env.npm_package_version || '1.0.0',
      jsSize: Buffer.byteLength(jsContent, 'utf8'),
      cssSize: cssContent ? Buffer.byteLength(cssContent, 'utf8') : 0
    }
  }

  // Schedule upload after delay (non-blocking)
  const baseUrl = process.env.NUXT_HUB_PROJECT_URL || 'http://localhost:3001'

  setTimeout(async () => {
    logger.info('Uploading widget files to NuxtHub Blob at', baseUrl)

    try {
      const res = await fetch(`${baseUrl}/api/upload-widget`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      })

      if (res.ok) {
        const result = await res.json()
        if (result.success) {
          logger.success('Widget files uploaded to NuxtHub Blob')
        } else {
          logger.warn('Widget upload unsuccessful:', result)
        }
      } else {
        logger.error('Blob upload failed with status:', res.status, await res.text())
      }
    } catch (err) {
      logger.error('Upload error:', err)
    }
  }, 5000)

  logger.info('Widget built, upload scheduled in 5 seconds...')
  return true
}

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: "2025-09-18",
  future: {
    compatibilityVersion: 4,
  },
  devServer: {
    port: 3001
  },
  debug: false,
  devtools: { enabled: false, timeline: {enabled: true,} },
  nitro: {
    experimental: {
      openAPI: true,
    },
    routeRules: {
      '/embed/**': { 
        cors: true, 
        headers: { 'Access-Control-Allow-Origin': '*' },
        
       },
      '/creations/{id}/interactive': {
        cors: true,
        headers: { 'Access-Control-Allow-Origin': '*' },
        cache: {
          maxAge: 60 * 60 * 24, // 1 day
        },
      },
    },
  },
  vite: {
    plugins: [tailwindcss()],
    server: {
      allowedHosts: ['host.docker.internal', 'localhost'],
      watch: {
        ignored: ['**/dist/**', '**/public/embed/**']
      }
    }
  },
  css: ["./app/assets/main.css"],

  modules: ["@nuxt/eslint", "@nuxt/image", "@nuxt/test-utils/module", "@pinia/nuxt", "@nuxthub/core", '@nuxt/scripts', 'nuxt-auth-utils'],
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
        id: 'G-Q7YTD7XTY0',
      }
    }
  },

  runtimeConfig: {
    debug: false,
    apiNinjasKey: '',
    servicesApiJwtSecret: '',
    postmarkKey: '',
    sendingAddress: '',
    nixId: '',
    nixKey: '',
    public: {
      rootUrl: '',
      supportEmail: '',
    }
  },
  
  hooks: {
    // Build and upload widget after Nuxt build (for production)
    'build:done': async () => {
      if (process.env.NODE_ENV !== 'production') return // Skip during tests
      // This runs during `nuxt build` which happens in production deployments
      logger.info('Build done hook - building and uploading widget for production')
      await buildAndUploadWidget()
    },
    // Build and upload widget on dev server start
    'ready': async (nuxt) => {
      if (nuxt.options.dev) {
        // Watch for widget file changes
        const chokidar = await import('chokidar')
        const watcher = chokidar.watch([
          'widget-entry.ts',
          'widget.css',
          './components/widgets',
          './lib/widget-sdk'
        ], {
          ignored: /node_modules/,
          persistent: true
        })
        
        // Debug: log watched files
        watcher.on('ready', () => {
          logger.info('Widget file watcher is ready and watching:')
          const watched = watcher.getWatched()
          let watchedMessage = ``
          Object.keys(watched).forEach(dir => {
            const files = watched[dir]
            if (files) {
              files.forEach(file => {
                watchedMessage += `- ${dir}/${file}\n`
              })
            }
          })
          logger.box({title: 'Watched Files', message: watchedMessage.trim(), style: {
            borderColor: 'cyan',
            padding: 2,
          }})
        })
        
        let building = false
        watcher.on('change', async (path) => {
          if (!building) {
            building = true
            logger.box({title: 'Widget file changed', message: path, style: {
              borderColor: 'yellow',
              padding: 1,
            }})

            // Build and upload widget
            await buildAndUploadWidget().catch(err =>
              logger.warn('Widget build/upload failed:', err.message)
            )

            building = false
          }
        })
      }
    },
  }
});