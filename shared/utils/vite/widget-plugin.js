import { build } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'
import { consola } from 'consola'
import tailwindcss from '@tailwindcss/vite'

async function uploadWidgetToBlob() {
  try {
    // Use fetch to call the server API endpoint for blob upload
    const response = await fetch('http://localhost:3001/api/v2/upload-widget', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    })
    
    if (response.ok) {
      await response.json()
      consola.success('📦 Widget files uploaded to NuxtHub Blob')
    } else {
      consola.error('❌ Blob upload failed:', await response.text())
    }
  } catch (error) {
    consola.error('❌ Blob upload failed:', error)
  }
}

export function widgetBuilder() {
  let isBuilding = false
  
  return {
    name: 'widget-builder',
    configureServer(server) {
      const buildWidget = async () => {
        if (isBuilding) return
        isBuilding = true
        
        try {
          consola.info('🔧 Building Create Studio widget...')
          
          // Use the same exact config as the working build script
          await build({
            configFile: false,
            build: {
              target: 'es2015',
              lib: {
                entry: resolve(process.cwd(), 'widget-entry.ts'),
                name: 'CreateStudio',
                fileName: (format) => `create-studio.${format}.js`,
                formats: ['iife']
              },
              outDir: resolve(process.cwd(), 'dist/embed'),
              emptyOutDir: true,
              rollupOptions: {
                external: [],
                output: {
                  format: 'iife',
                  name: 'CreateStudio',
                  globals: {},
                  assetFileNames: 'create-studio.[ext]',
                  inlineDynamicImports: true
                }
              },
              minify: false,
              sourcemap: false, // Disable sourcemap for dev to avoid issues
              cssCodeSplit: false, // Keep CSS with JS
            },
            plugins: [
              tailwindcss({
                content: [
                  './widget-entry.ts',
                  './components/widgets/**/*.vue', 
                  './lib/widget-sdk/**/*.ts'
                ]
              }),
              vue({
                template: {
                  compilerOptions: {
                    isCustomElement: (tag) => tag.includes('-')
                  }
                }
              })
            ],
            define: {
              'process.env.NODE_ENV': JSON.stringify('development'),
              __VUE_OPTIONS_API__: 'true',
              __VUE_PROD_DEVTOOLS__: 'false'
            },
            resolve: {
              alias: {
                'vue': 'vue/dist/vue.esm-bundler.js',
                '@': resolve(process.cwd()),
                '~': resolve(process.cwd()),
                '#shared/lib': resolve(process.cwd(), 'shared/lib'),
                '#shared/utils': resolve(process.cwd(), 'shared/utils'),
                '~/app/composables': resolve(process.cwd(), 'app/composables'),
                '~/app/components': resolve(process.cwd(), 'app/components')
              }
            }
          })
          
          consola.success('✅ Create Studio widget built')
          
          // Upload built files to NuxtHub Blob
          await uploadWidgetToBlob()
        } catch (error) {
          consola.error('❌ Widget build failed:', error)
        } finally {
          isBuilding = false
        }
      }

      // Initial build
      buildWidget()

      // Watch for changes to widget files
      const watchPaths = [
        'widget-entry.ts',
        'lib/widget-sdk/**/*',
        'components/widgets/**/*'
      ]

      server.middlewares.use('/embed/create-studio.iife.js', (req, res, next) => {
        // Trigger rebuild when widget is requested after changes
        buildWidget().then(() => next()).catch(() => next())
      })

      // Watch for file changes
      server.watcher.add(watchPaths)
      server.watcher.on('change', (file) => {
        if (watchPaths.some(pattern => {
          const regex = new RegExp(pattern.replace('**/*', '.*').replace('*', '[^/]*'))
          return regex.test(file)
        })) {
          consola.info(`📝 Widget file changed: ${file}`)
          buildWidget()
        }
      })
    }
  }
}