import tailwindcss from "@tailwindcss/vite";

async function uploadWidgetToBlob() {
  try {
    const response = await fetch('http://localhost:3001/api/upload-widget', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    })
    
    if (response.ok) {
      const result = await response.json()
      if (result.success) {
        console.log('📦 Widget files uploaded to NuxtHub Blob')
      } else {
        console.log('⚠️  Widget files not ready yet')
      }
    } else {
      console.error('❌ Blob upload failed with status:', response.status)
    }
  } catch (error) {
    throw error // Re-throw so caller can handle
  }
}

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: "2024-11-01",
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

  runtimeConfig: {
    apiNinjasKey: process.env.API_NINJAS_KEY,
  },
  
  hooks: {
    // Build widget after Nuxt build
    'build:done': async () => {
      const { buildWidget } = await import('./scripts/build-widget.mjs')
      await buildWidget()
      
      // Upload to NuxtHub blob storage
      await uploadWidgetToBlob()
    },
    // Build widget on dev server start
    'ready': async (nuxt) => {
      if (nuxt.options.dev) {
        const { buildWidget } = await import('./scripts/build-widget.mjs')
        await buildWidget()
        
        // Watch for widget file changes
        const chokidar = await import('chokidar')
        const watcher = chokidar.watch([
          'widget-entry.ts',
          'widget.css',
          'components/widgets/**/*.vue',
          'components/widgets/**/*.ts',
          'components/widgets/**/*.js',
          'lib/widget-sdk/**/*'
        ], {
          ignored: /node_modules/,
          persistent: true
        })
        
        // Debug: log watched files
        watcher.on('ready', () => {
          console.log('🔍 Widget file watcher is ready and watching:')
          const watched = watcher.getWatched()
          Object.keys(watched).forEach(dir => {
            watched[dir].forEach(file => {
              console.log(`  - ${dir}/${file}`)
            })
          })
        })
        
        let building = false
        watcher.on('change', async (path) => {
          if (!building) {
            building = true
            console.log(`📝 Widget file changed: ${path}`)
            await buildWidget()
            
            // Upload to blob storage after build (non-blocking)
            uploadWidgetToBlob().catch(err => 
              console.log('⚠️  Blob upload failed:', err.message)
            )
            
            building = false
          }
        })
      }
    },
    
    // Upload widget to blob after server is fully started
    'listen': async () => {
      // Wait longer and retry if needed for initial upload
      const attemptUpload = async (attempt = 1, maxAttempts = 3) => {
        const delay = attempt * 2000 // 2s, 4s, 6s
        
        setTimeout(async () => {
          try {
            await uploadWidgetToBlob()
          } catch (error) {
            if (attempt < maxAttempts) {
              console.log(`⏳ Upload attempt ${attempt} failed, retrying...`)
              attemptUpload(attempt + 1, maxAttempts)
            } else {
              console.log('⚠️  All upload attempts failed:', (error as Error).message)
            }
          }
        }, delay)
      }
      
      attemptUpload()
    }
  }
});
