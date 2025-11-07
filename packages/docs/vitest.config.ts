import { defineVitestConfig } from "@nuxt/test-utils/config";

export default defineVitestConfig({
  test: {
    include: ["tests/**/*.test.ts", "tests/**/*.spec.ts"],
    exclude: ["**/node_modules/**", "**/dist/**"],
    environment: "nuxt",
    environmentOptions: {
      nuxt: {
        rootDir: ".",
        domEnvironment: "happy-dom",
      },
    },
    passWithNoTests: true,
  },
});
