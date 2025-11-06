import { defineVitestConfig } from "@nuxt/test-utils/config";

export default defineVitestConfig({
  test: {
    include: ["**/*.test.ts", "**/*.spec.ts", "tests/**/*.ts"],
    exclude: ["**/node_modules/**", "**/dist/**"],
    environment: "nuxt",
    environmentOptions: {
      nuxt: {
        rootDir: ".",
        domEnvironment: "happy-dom",
      },
    },
    env: {
      NUXT_PUBLIC_SITE_URL: "http://localhost:3001",
      NUXT_SERVICES_API_JWT_SECRET: "test-secret-key-for-unit-tests-only-not-for-production",
    },
    // Increase timeouts for e2e tests
    hookTimeout: 300000, // 5 minutes
    testTimeout: 60000, // 1 minute per test
  },
});
