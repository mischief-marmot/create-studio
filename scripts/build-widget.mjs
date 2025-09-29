import { build } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'
import tailwindcss from '@tailwindcss/postcss'
import autoprefixer from 'autoprefixer'
import { config as loadEnv } from 'dotenv'
import { createConsola } from "consola";

// Load environment variables from .env file
loadEnv()

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = resolve(__dirname, '..')

const logger = createConsola({
  level: 5,
  fancy: true,
  formatOptions: {
    columns: 80,
    colors: true,
    compact: false,
    date: false,
  },
}).withTag('CS:BuildWidget')
logger.level = 999

async function uploadChunkedFilesToBlob() {
  try {
    const { readFileSync, existsSync, readdirSync } = await import('fs')

    const embedDir = resolve(__dirname, '..', 'dist/embed')
    if (!existsSync(embedDir)) {
      logger.warn('Embed directory not found, skipping chunk upload')
      return
    }

    // Get all JS and CSS files
    const files = readdirSync(embedDir).filter(file =>
      file.endsWith('.js') || file.endsWith('.css')
    )

    if (files.length === 0) {
      logger.warn('No files found to upload')
      return
    }

    logger.info(`Found ${files.length} files to upload:`, files)

    // Upload each file individually to blob storage
    const baseUrl = process.env.NUXT_HUB_PROJECT_URL || 'http://localhost:3001'
    const uploadFailures = []

    for (const filename of files) {
      const filePath = resolve(embedDir, filename)
      const content = readFileSync(filePath, 'utf-8')

      try {
        const response = await fetch(`${baseUrl}/api/v2/upload-widget`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            filename,
            content,
            metadata: {
              buildTime: new Date().toISOString(),
              size: Buffer.byteLength(content, 'utf8')
            }
          })
        })

        if (response.ok) {
          const result = await response.json()
          logger.success(`${filename} uploaded (${Math.floor(result.size / 1024)}KB)`)
        } else {
          const responseText = await response.text()
          const failureReason = `HTTP ${response.status}: ${responseText}`
          uploadFailures.push({ filename, reason: failureReason })
          logger.error(`Failed to upload ${filename}:`, failureReason)
        }
      } catch (error) {
        const failureReason = `Network error: ${error.message}`
        uploadFailures.push({ filename, reason: failureReason })
        logger.error(`Upload error for ${filename}:`, failureReason)
      }
    }

    // Check for upload failures and throw error if any occurred
    if (uploadFailures.length > 0) {
      const failureMessages = uploadFailures.map(f => `${f.filename} (${f.reason})`).join(', ')
      throw new Error(`Upload failed for ${uploadFailures.length} file(s): ${failureMessages}`)
    }

  } catch (error) {
    logger.error('Failed to upload chunks:', error)
    throw error
  }
}

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
    // Build the chunked ES module version
    await build({
      configFile: false,
      root,
      build: {
        lib: {
          entry: resolve(root, 'widget-entry.ts'),
          name: 'CreateStudio',
          fileName: () => 'main.js',
          formats: ['es']
        },
        outDir: resolve(root, 'dist/embed'),
        emptyOutDir: true,
        rollupOptions: {
          external: [],
          output: {
            format: 'es',
            globals: {},
            assetFileNames: '[name].[ext]',
            chunkFileNames: '[name].js',
            entryFileNames: 'main.js',
            inlineDynamicImports: false,
            manualChunks(id) {
              // Only split widget components - everything else stays in main or its proper place
              if (id.includes('InteractiveModeWidget.vue')) {
                return 'interactive-mode'
              }
              if (id.includes('ServingsAdjusterWidget.vue')) {
                return 'servings-adjuster'
              }

              // Everything else stays in main bundle or gets handled by Vite's default chunking
              return undefined
            }
          }
        },
        minify: 'esbuild', // esbuild is faster and often more efficient for ES modules
        sourcemap: false,
        cssCodeSplit: true,
        cssMinify: true
      },
      esbuild: {
        minifyIdentifiers: true,
        minifySyntax: true,
        minifyWhitespace: true,
        treeShaking: true,
        target: 'es2018', // Target modern browsers for better optimization
        legalComments: 'none' // Remove all comments
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

    logger.success('Create Studio widget built successfully (ES module chunks)')

    // Upload all files to blob storage
    await uploadChunkedFilesToBlob()

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