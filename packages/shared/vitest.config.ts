import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    include: ['src/**/*.test.ts', 'src/**/*.spec.ts', 'lib/**/*.test.ts', 'lib/**/*.spec.ts', 'utils/**/*.test.ts', 'utils/**/*.spec.ts'],
    globals: true,
    environment: 'node',
    passWithNoTests: true,
  },
})
