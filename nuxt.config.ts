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

async function uploadWidgetToBlob() {
  if (process.env.NODE_ENV === 'test') return // Skip during tests
  const baseUrl = process.env.NUXT_HUB_PROJECT_URL || 'http://localhost:3001'
  logger.info('Uploading widget files to NuxtHub Blob from', baseUrl)
  function upload() {
    fetch(`${baseUrl}/api/upload-widget`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    }).then(async res => {if (res.ok) {
      const result = await res.json()
      if (result.success) {
        logger.success('Widget files uploaded to NuxtHub Blob')
      } else {
        logger.warn('Widget files not ready yet', 'jsPath' in result ? `JS Path: ${result.jsPath}` : 'Result', result)
      } 
    } else {
      logger.error('Blob upload failed with status:', res.status, await res.text())
    }
      return res
    }).catch(err => {
      throw err
    })
  }
  setTimeout(() => {
    upload()
  }, 5000) // Initial delay to allow server to be fully ready
}

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: "2025-09-18",
  future: {
    compatibilityVersion: 4,
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

  runtimeConfig: {
    debug: process.env.ENV_DEBUG === 'true' || false,
    apiNinjasKey: process.env.API_NINJAS_KEY,
    jwtSecret: process.env.JWT_SECRET,
    postmarkKey: process.env.POSTMARK_KEY,
    sendingAddress: process.env.SENDING_ADDRESS || 'hello@create.studio',
    nixId: process.env.NIX_ID,
    nixKey: process.env.NIX_KEY,
    rootUrl: process.env.ROOT_URL,
    public: {
      supportEmail: process.env.SUPPORT_EMAIL || 'support@create.studios',
    }
  },
  
  hooks: {
    // Build widget after Nuxt build
    'build:done': async () => {
      if (process.env.NODE_ENV !== 'production') return // Build-only
      const { buildWidget } = await import('./scripts/build-widget.mjs')
      await buildWidget()
      
      // Upload to NuxtHub blob storage
      await uploadWidgetToBlob()
    },
    // Build widget on dev server start
    'ready': async (nuxt) => {
      if (process.env.NODE_ENV !== 'development') return // Skip during tests, production
      if (nuxt.options.dev) {
        const { buildWidget } = await import('./scripts/build-widget.mjs')
        await buildWidget()
        
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
          if (process.env.ENV_DEBUG === 'true') {
            logger.info('Widget file watcher is ready and watching:')
            const watched = watcher.getWatched()
            let watchedMessage = ``
            Object.keys(watched).forEach(dir => {
              watched[dir].forEach(file => {
                watchedMessage += `- ${dir}/${file}\n`
              })
            })
            logger.box({title: 'Watched Files', message: watchedMessage.trim(), style: {
              borderColor: 'cyan',
              padding: 2,
            }})
          }
        })
        
        let building = false
        watcher.on('change', async (path) => {
          if (!building) {
            building = true
            logger.box({title: 'Widget file changed', message: path, style: {
              borderColor: 'yellow',
              padding: 1,
            }})
            await buildWidget()
            
            // Upload to blob storage after build (non-blocking)
            uploadWidgetToBlob().catch(err =>
              logger.warn('Blob upload failed:', err.message)
            )
            
            building = false
          }
        })
      }
    },
    
    // Upload widget to blob after server is fully started
    'listen': async () => {
      if (process.env.NODE_ENV !== 'development') return // Skip during tests
      // Wait longer and retry if needed for initial upload
      const attemptUpload = async (attempt = 1, maxAttempts = 3) => {
        const delay = attempt * 2000 // 2s, 4s, 6s
        
        setTimeout(async () => {
          try {
            await uploadWidgetToBlob()
          } catch (error) {
            if (attempt < maxAttempts) {
              logger.warn(`Upload attempt ${attempt} failed, retrying...`)
              attemptUpload(attempt + 1, maxAttempts)
            } else {
              logger.error('All upload attempts failed:', (error as Error).message)
            }
          }
        }, delay)
      }
      
      attemptUpload()
    }
  }
});