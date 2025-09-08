import { build } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'
import postcss from 'rollup-plugin-postcss'
import tailwindcss from '@tailwindcss/postcss'
import autoprefixer from 'autoprefixer'

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
        postcss({
          extract: 'create-studio.css',
          minimize: true,
          plugins: [
            tailwindcss('./tailwind.widget.config.js'),
            autoprefixer()
          ],
          inject: false,
          modules: false
        })
      ],
      css: {
        postcss: {
          plugins: []
        }
      },
      define: {
        'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'production'),
        __VUE_OPTIONS_API__: 'true',
        __VUE_PROD_DEVTOOLS__: 'false'
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