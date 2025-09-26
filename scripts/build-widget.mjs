import { build } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'
import tailwindcss from '@tailwindcss/postcss'
import autoprefixer from 'autoprefixer'
import { config as loadEnv } from 'dotenv'
import { consola } from 'consola'

// Load environment variables from .env file
loadEnv()

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = resolve(__dirname, '..')
const logger = consola.withTag('CS:BuildWidget')
logger.level = 999

export async function buildWidget() {
  const defineEnv = {
        'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'production'),
        '__VUE_OPTIONS_API__': 'true',
        '__VUE_PROD_DEVTOOLS__': 'false',
        '__BUILD_TIME__': JSON.stringify(new Date().toISOString()),
        '__CREATE_STUDIO_BASE_URL__': JSON.stringify(
          process.env.CREATE_STUDIO_BASE_URL || 
          process.env.NUXT_PUBLIC_CREATE_STUDIO_BASE_URL || 
          process.env.NUXT_HUB_PROJECT_URL ||
          'https://create-studio.jmlallier12912781.workers.dev/'
        ),
        '__CREATE_STUDIO_VERSION__': JSON.stringify(process.env.npm_package_version || '1.0.0')
      }
  logger.info('Building Create Studio widget...')

  try {
    // Build the widget bundle
    await build({
      configFile: false,
      root,
      build: {
        lib: {
          entry: resolve(root, 'widget-entry.ts'),
          name: 'CreateStudio',
          fileName: () => 'main.js',
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
            assetFileNames: 'main.[ext]',
            inlineDynamicImports: true
          }
        },
        minify: 'esbuild', // Use esbuild for better minification
        sourcemap: false,
        cssCodeSplit: false,
        cssMinify: true
      },
      esbuild: {
        drop: ['debugger'], // Only remove debugger statements, keep console for debugging
        minifyIdentifiers: true,
        minifySyntax: true,
        minifyWhitespace: true,
        treeShaking: true
      },
      plugins: [
        vue({
          template: {
            compilerOptions: {
              isCustomElement: (tag) => tag.includes('-')
            }
          }
        }),
      ],
      css: {
        postcss: {
          plugins: [
            tailwindcss('./tailwind.widget.config.js'),
            autoprefixer()
          ]
        }
      },
      define: defineEnv,
      resolve: {
        alias: {
          'vue': 'vue/dist/vue.esm-bundler.js',
          '@': root,
          '~': root,
          '#shared/lib': resolve(root, 'shared/lib'),
          '#shared/utils': resolve(root, 'shared/utils'),
          '~/app/composables': resolve(root, 'app/composables'),
          '~/app/components': resolve(root, 'app/components')
        }
      }
    })
    
    logger.success('Create Studio widget built successfully')
    return true
  } catch (error) {
    logger.error('Widget build failed:', error)
    return false
  }
}

// Run if called directly
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  buildWidget()
}