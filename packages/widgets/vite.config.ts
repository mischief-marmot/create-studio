import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'
import tailwindcss from '@tailwindcss/vite'
import autoprefixer from 'autoprefixer'

export default defineConfig({
  plugins: [
    vue(),
    tailwindcss()
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
          return undefined
        }
      }
    },
    minify: 'esbuild',
    sourcemap: true,
    esbuild: {
      drop: [] // Don't drop console.log or debugger statements
    },
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
  }
})
