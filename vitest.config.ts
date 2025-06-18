import { defineVitestConfig } from '@nuxt/test-utils/config'

export default defineVitestConfig({
  test: {
    include: ['**/*.test.ts', '**/*.spec.ts', 'tests/**/*.ts'],
    exclude: ['**/node_modules/**', '**/dist/**'],
    environment: 'nuxt',
    environmentOptions: {
      nuxt: {
        rootDir: '.',
        domEnvironment: 'happy-dom'
      }
    }
  }
})