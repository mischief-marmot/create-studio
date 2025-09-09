import { build } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'
// import postcss from 'rollup-plugin-postcss' // Removed - using Vite built-in CSS handling
import tailwindcss from '@tailwindcss/postcss'
import autoprefixer from 'autoprefixer'
import { config as loadEnv } from 'dotenv'

// Load environment variables from .env file
loadEnv()

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = resolve(__dirname, '..')

export async function buildWidget() {
  console.log('🔧 Building Create Studio widget...')
  
  try {
    // Build the widget bundle
    await build({
      configFile: false,
      root,
      build: {
        lib: {
          entry: resolve(root, 'widget-entry.ts'),
          name: 'CreateStudio',
          fileName: (format) => `create-studio.${format}.js`,
          formats: ['iife']
        },
        outDir: resolve(root, 'dist/embed'),
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
        minify: true,
        sourcemap: false,
        cssCodeSplit: false
      },
      plugins: [
        vue({
          template: {
            compilerOptions: {
              isCustomElement: (tag) => tag.includes('-')
            }
          }
        }),
// Remove PostCSS plugin - using Vite's built-in CSS handling instead
      ],
      css: {
        postcss: {
          plugins: [
            tailwindcss('./tailwind.widget.config.js'),
            autoprefixer()
          ]
        }
      },
      define: {
        'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'production'),
        '__VUE_OPTIONS_API__': 'true',
        '__VUE_PROD_DEVTOOLS__': 'false',
        '__BUILD_TIME__': JSON.stringify(new Date().toISOString()),
        '__CREATE_STUDIO_BASE_URL__': JSON.stringify(
          process.env.CREATE_STUDIO_BASE_URL || 
          process.env.NUXT_PUBLIC_CREATE_STUDIO_BASE_URL || 
          'http://localhost:3001'
        ),
        '__CREATE_STUDIO_VERSION__': JSON.stringify(process.env.npm_package_version || '1.0.0')
      },
      resolve: {
        alias: {
          'vue': 'vue/dist/vue.esm-bundler.js',
          '@': root
        }
      }
    })
    
    console.log('✅ Create Studio widget built successfully')
    return true
  } catch (error) {
    console.error('❌ Widget build failed:', error)
    return false
  }
}

// Run if called directly
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  buildWidget()
}