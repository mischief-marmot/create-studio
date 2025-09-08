import tailwindcss from "@tailwindcss/vite";

async function uploadWidgetToBlob() {
  try {
    // Use fetch to call the server API endpoint for blob upload
    const response = await fetch('http://localhost:3001/api/upload-widget', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    })
    
    if (response.ok) {
      await response.json()
      console.log('📦 Widget files uploaded to NuxtHub Blob')
    } else {
      console.error('❌ Blob upload failed:', await response.text())
    }
  } catch (error) {
    console.error('❌ Blob upload failed:', error)
  }
}

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: "2024-11-01",
  devtools: { enabled: false },
  nitro: {
    experimental: {
      openAPI: true,
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
        
        // Upload to NuxtHub blob storage
        await uploadWidgetToBlob()
        
        // Watch for widget file changes
        const chokidar = await import('chokidar')
        const watcher = chokidar.watch([
          'widget-entry.ts',
          'widget.css',
          'components/widgets/**/*',
          'lib/widget-sdk/**/*'
        ], {
          ignored: /node_modules/,
          persistent: true
        })
        
        let building = false
        watcher.on('change', async (path) => {
          if (!building) {
            building = true
            console.log(`📝 Widget file changed: ${path}`)
            await buildWidget()
            
            // Upload to blob storage after build
            await uploadWidgetToBlob()
            
            building = false
          }
        })
      }
    }
  }
});
