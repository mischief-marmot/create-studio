import { build } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'

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

export function widgetBuilder() {
  let isBuilding = false
  
  return {
    name: 'widget-builder',
    configureServer(server) {
      const buildWidget = async () => {
        if (isBuilding) return
        isBuilding = true
        
        try {
          console.log('🔧 Building Create Studio widget...')
          
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
                  assetFileNames: 'create-studio.[ext]'
                }
              },
              minify: false,
              sourcemap: false // Disable sourcemap for dev to avoid issues
            },
            plugins: [vue({
              template: {
                compilerOptions: {
                  isCustomElement: (tag) => tag.includes('-')
                }
              }
            })],
            define: {
              'process.env.NODE_ENV': JSON.stringify('development'),
              __VUE_OPTIONS_API__: 'true',
              __VUE_PROD_DEVTOOLS__: 'false'
            },
            resolve: {
              alias: {
                'vue': 'vue/dist/vue.esm-bundler.js',
                '@': resolve(process.cwd())
              }
            }
          })
          
          console.log('✅ Create Studio widget built')
          
          // Upload built files to NuxtHub Blob
          await uploadWidgetToBlob()
        } catch (error) {
          console.error('❌ Widget build failed:', error)
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
          console.log(`📝 Widget file changed: ${file}`)
          buildWidget()
        }
      })
    }
  }
}