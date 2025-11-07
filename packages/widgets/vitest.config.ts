import { defineConfig } from 'vitest/config'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'

export default defineConfig({
  plugins: [vue()],
  test: {
    include: ['src/**/*.test.ts', 'src/**/*.spec.ts'],
    globals: true,
    environment: 'happy-dom',
    passWithNoTests: true,
  },
  resolve: {
    alias: {
      '@create-studio/shared': resolve(__dirname, '../shared/src'),
    }
  }
})
