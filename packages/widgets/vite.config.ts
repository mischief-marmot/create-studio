import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'
import tailwindcss from '@tailwindcss/vite'
import autoprefixer from 'autoprefixer'
import terserPlugin from '@rollup/plugin-terser'
import { visualizer } from 'rollup-plugin-visualizer'
import { config as loadEnv } from 'dotenv'
import { readFileSync } from 'fs'

// Load environment variables from root .env file
loadEnv({ path: resolve(__dirname, '../app/.env'), override: false })

// Read package.json for version
const packageJson = JSON.parse(readFileSync(resolve(__dirname, 'package.json'), 'utf-8'))

export default defineConfig(({ mode }) => ({
  plugins: [
    vue(),
    tailwindcss(),
    ...(process.env.ANALYZE ? [visualizer({
      open: true,
      filename: 'dist/bundle-analysis.html',
      gzipSize: true,
      template: 'treemap',
    })] : []),
  ],
  build: {
    lib: {
      entry: resolve(__dirname, 'src/entry.ts'),
      name: 'CreateStudio',
      fileName: () => 'main.js',
      formats: ['es']
    },
    outDir: 'dist',
    emptyOutDir: true,
    rollupOptions: {
      external: [],
      output: {
        format: 'es',
        assetFileNames: '[name].[ext]',
        chunkFileNames: '[name].js',
        entryFileNames: 'main.js',
        plugins: mode === 'production' ? [terserPlugin({
          compress: true,
          mangle: true,
          format: { comments: false },
          module: true,
        })] : [],
        inlineDynamicImports: false,
        manualChunks(id) {
          if (id.includes('InteractiveModeWidget') ||
              id.includes('InteractiveExperience') ||
              id.includes('RecipeSkeletonLoader') ||
              id.includes('RecipeMedia') ||
              id.includes('DraggableHandle') ||
              id.includes('RecipeTimer') ||
              id.includes('StarRating') ||
              id.includes('Logo/Solo') ||
              id.includes('ActiveTimers')) {
            return 'interactive-mode'
          }
          if (id.includes('ServingsAdjusterWidget')) {
            return 'servings-adjuster'
          }
          if (id.includes('UnitConversion/unit-conversion')) {
            return 'unit-conversion'
          }
          return undefined
        }
      }
    },
    minify: false,
    sourcemap: mode === 'development',
    cssCodeSplit: true,
    cssMinify: true
  },
  css: {
    postcss: {
      plugins: [
        autoprefixer()
      ]
    }
  },
  resolve: {
    alias: {
      '@': __dirname,
      '~': __dirname,
      '@create-studio/shared': resolve(__dirname, '../shared/src'),
    }
  },
  define: {
    'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'production'),
    '__VUE_OPTIONS_API__': 'true',
    '__VUE_PROD_DEVTOOLS__': 'false',
    '__CREATE_STUDIO_BASE_URL__': JSON.stringify(process.env.NUXT_PUBLIC_ROOT_URL || (mode === 'production' ? 'https://create.studio' : 'http://localhost:3001')),
    '__BUILD_TIME__': JSON.stringify(new Date().toISOString()),
    '__CREATE_STUDIO_VERSION__': JSON.stringify(packageJson.version),
  }
}))
