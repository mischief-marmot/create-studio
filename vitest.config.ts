import { defineVitestConfig } from '@nuxt/test-utils/config'

export default defineVitestConfig({
  test: {
    include: ['**/*.test.ts', '**/*.spec.ts'],
    environment: 'happy-dom'
  }
})
