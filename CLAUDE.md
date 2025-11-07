# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Create Studio is an application that allows publishers and bloggers to create structured data cards (recipes, how-to guides, FAQs) with automatic JSON-LD generation and embeddable, interactive visual cards. Built with Nuxt 3, TypeScript, Tailwind CSS v4, DaisyUI, Clerk Auth, and deployed on NuxtHub/Cloudflare.

**Project Plan**: See PROJECT_PLAN.md for detailed phased development approach and current progress.

## Essential Commands

```bash
# Development
npm run dev          # Start development server (http://localhost:3001)
npm run dev:setup    # Copy .env.example to .env (run once after cloning)

# Build & Deploy
npm run build        # Build for production
npm run generate     # Generate static site
npm run preview      # Preview production build
npm run build:shared # Build shared package (required before testing)

# Testing
npm run build:shared # MUST run before testing (see Testing section)
npm test             # Run unit and component tests
npm run test:e2e     # Run E2E tests with Playwright
npm run test:ui      # Run tests with Vitest UI
npm run test:unit    # Run Unit tests only
npm run test:components     # Run Component tests only

# Run specific test files
npm test tests/unit/nutrition-api.test.ts
```

## Architecture

### Framework Stack
- **Nuxt 3** (v3.17.3) - Vue.js meta-framework
- **TypeScript** - Type safety throughout
- **Tailwind CSS v4** - Utility-first CSS with `@tailwindcss/vite`
- **DaisyUI** - Component library with custom themes ("claudette" light, "claudia" dark)
- **Pinia** - State management

### Key Directories
- `app.vue` - Root component (entry point)
- `pages/` - File-based routing (create this for pages)
- `components/` - Vue components (auto-imported)
- `composables/` - Vue composables (auto-imported)
- `server/` - Server-side API routes and middleware
- `assets/` - Processed assets (CSS, images)
- `public/` - Static assets served as-is
- `tests/` - Directory for keeping tests

### Configuration Files
- `nuxt.config.ts` - Main Nuxt configuration
- `tsconfig.json` - TypeScript configuration
- `vitest.config.ts` - Vitest test configuration
- `eslint.config.mjs` - ESLint rules

## Development Methodology

### Test-Driven Development (TDD)
This project follows Test-Driven Development principles:
1. **Write failing tests FIRST** - Define expected behavior before implementation
2. **Run tests to confirm they fail** - Verify tests are properly detecting missing functionality
3. **Write minimal code to make tests pass** - Implement only what's necessary
4. **Refactor if needed** - Improve code quality while keeping tests green

**CRITICAL**: Always start new features by writing tests first. This is non-negotiable.

Example workflow:
```bash
# 1. Write test first
# 2. Run test to see it fail
npm test
# 3. Implement feature
# 4. Run test to see it pass
npm test
```

#### Current Test Coverage

## Development Notes

### Adding Pages
Create files in `pages/` directory for automatic routing:
```vue
<!-- pages/index.vue -->
<template>
  <div>Home page</div>
</template>
```

### Using DaisyUI Components
DaisyUI classes are available globally:
```vue
<button class="btn btn-primary">Click me</button>
```

### State Management with Pinia
Create stores in `stores/` directory:
```typescript
// stores/counter.ts
export const useCounterStore = defineStore('counter', () => {
  const count = ref(0)
  const increment = () => count.value++
  return { count, increment }
})
```

### API Routes
Create server routes in `server/api/`:
```typescript
// server/api/hello.ts
export default defineEventHandler(() => {
  return { message: 'Hello API' }
})
```

### Environment Variables
1. Copy `.env.example` to `.env`
2. Add variables prefixed with `NUXT_PUBLIC_` for client-side access
3. Server-only variables don't need prefix

### Testing

The project uses a comprehensive testing strategy with Vitest and Playwright.

#### Critical Build Requirement

**⚠️ IMPORTANT:** Before running any tests, the shared package MUST be built first:

```bash
npm run build:shared
npm test
```

The app package imports from `@create-studio/shared`, so tests will fail with module resolution errors if the shared package hasn't been compiled. This requirement is enforced in CI/CD (see workflow below).

#### Test Organization
- `tests/unit/` - Unit tests for utilities and functions
- `tests/components/` - Component tests using Vue Test Utils
- `tests/e2e/` - End-to-end tests using Playwright
- `pages/*.test.ts` - Page-specific tests can live alongside pages

#### Test Commands
```bash
# Must build shared first
npm run build:shared

# Run unit and component tests (excludes e2e)
npm test

# Run e2e tests separately (requires playwright browsers)
npx playwright install  # First time only
npm run test:e2e

# Run specific test type
npm run test:unit       # Unit tests only
npm run test:components # Component tests only

# Run specific test file
npm test tests/unit/nutrition-api.test.ts

# Watch mode
npm run test:watch
```

#### Writing Tests

**Unit Tests** (Pure functions, utilities):
```typescript
import { describe, it, expect } from 'vitest'

describe('myFunction', () => {
  it('should return expected value', () => {
    expect(myFunction(input)).toBe(expectedOutput)
  })
})
```

**Component Tests** (Vue components):
```typescript
import { mountSuspended } from '@nuxt/test-utils/runtime'
import MyComponent from '~/components/MyComponent.vue'

describe('MyComponent', () => {
  it('renders correctly', async () => {
    const wrapper = await mountSuspended(MyComponent, {
      props: { /* props */ }
    })
    expect(wrapper.text()).toContain('expected text')
  })
})
```

**E2E Tests with Playwright**:
```typescript
import { test, expect } from '@playwright/test'
import { mockWordPressAPI } from './helpers/api-mocks'

test.describe('Feature Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Apply API mocking before each test
    await mockWordPressAPI(page)
  })

  test('loads page correctly', async ({ page }) => {
    await page.goto('/some-page')
    await page.waitForLoadState('networkidle')

    const heading = page.locator('h1')
    await expect(heading).toBeVisible()
  })
})
```

**Writing E2E Tests - Critical Guidelines**:

1. **Always Mock External APIs**: Never use real external data in e2e tests. Use the `mockWordPressAPI()` helper in `test.beforeEach()`:
   ```typescript
   test.describe('My Tests', () => {
     test.beforeEach(async ({ page }) => {
       await mockWordPressAPI(page)  // Mocks all WordPress API calls
     })
   })
   ```

2. **Understanding API Mocking Architecture**:
   - E2E tests mock `/api/v2/fetch-creation` (the internal Nuxt endpoint)
   - **NOT** the WordPress API directly (`wp-json/mv-create/v1/creations/*`)
   - This is because Playwright's `page.route()` only intercepts browser requests, not server-side HTTP calls
   - The Nuxt server endpoint makes its own HTTP requests that bypass browser mocking
   - See `tests/e2e/README.md` for detailed explanation

3. **Mock Data Structure**:
   - Mock data must include the **transformed** HowTo format with `step` array
   - WordPress API returns HTML in `instructions` field
   - `/api/v2/fetch-creation` transforms this into structured `step` objects
   - See `tests/e2e/fixtures/mock-recipe.json` for example structure

4. **Adding New Mocks**:
   - Edit `tests/e2e/helpers/api-mocks.ts` to add new route interceptions
   - Create fixture files in `tests/e2e/fixtures/` for mock data
   - Import fixtures using: `import data from './fixtures/file.json' with { type: 'json' }`

5. **Using Data-Role Attributes**:
   - Add `data-role` attributes to components for reliable test selectors
   - Example: `<button data-role="submit">Submit</button>`
   - Locate in tests: `page.locator('button[data-role="submit"]')`

6. **Test Organization**:
   - Group related tests in `test.describe()` blocks
   - Use `test.beforeEach()` for setup that applies to all tests
   - Use graceful fallbacks for conditional elements:
     ```typescript
     if (await element.count() > 0) {
       await expect(element.first()).toBeVisible()
     }
     ```

See `tests/e2e/README.md` for comprehensive e2e testing documentation and patterns.

#### Test Utilities
- `mountSuspended()` - Mount components in Nuxt environment
- `mockNuxtImport()` - Mock auto-imported composables
- `mockComponent()` - Mock child components
- `$fetch` - Test API endpoints
- `createPage()` - Create Playwright page for E2E testing

#### CI/CD Testing Pipeline

The GitHub Actions workflow (`nuxthub.yml`) enforces proper test execution:

1. **build** job - Builds `@create-studio/shared`
2. **test** job - Runs unit/component tests (depends on build)
3. **e2e** job - Runs Playwright e2e tests (depends on build)
4. **deploy** job - Only runs if test AND e2e jobs pass

All test jobs build the shared package independently to ensure tests can run with proper dependencies.

## Feature Development Guidelines

### Approach to Feature Development
- When developing new features in this Nuxt app, start with test-driven development.
- When actually implementing the features, focus on seeing features added piece by piece.
- If a feature belongs on a page (e.g., CRUD operations pages like new, edit, view, delete):
  - Start by scaffolding the page first
  - Develop pages to ensure they exist and are navigable
  - Continue developing functionality incrementally
  - Build UI piece by piece to watch progress visually