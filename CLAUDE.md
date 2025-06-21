# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Recipe Card Generator application that allows publishers and bloggers to create structured data cards (recipes, how-to guides, FAQs) with automatic JSON-LD generation and embeddable, interactive visual cards. Built with Nuxt 3, TypeScript, Tailwind CSS v4, DaisyUI, Supabase, and deployed on NuxtHub/Cloudflare.

**Project Plan**: See PROJECT_PLAN.md for detailed phased development approach and current progress.

## Essential Commands

```bash
# Development
npm run dev          # Start development server (http://localhost:3000)
npm run dev:setup    # Copy .env.example to .env (run once after cloning)

# Build & Deploy
npm run build        # Build for production
npm run generate     # Generate static site
npm run preview      # Preview production build

# Testing
npm test             # Run all tests with Vitest
npm run test:ui      # Run tests with Vitest UI
npm run test:e2e     # Run E2E tests with Vitest
npm run test:unit    # Run Unit tests with Vitest
npm run test:components     # Run Component tests with Vitest

# Run specific test files
npm test tests/unit/utils.test.ts

# Project-specific commands
/continue-phase      # Continue Recipe Card Generator development
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
- ✅ Schema type definitions with comprehensive validation
- ✅ JSON-LD generator utilities with edge cases
- ✅ Authentication components and flows
- ✅ Database operations and edge cases

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

The project uses a comprehensive testing strategy:

#### Test Organization
- `tests/unit/` - Unit tests for utilities and functions
- `tests/components/` - Component tests using Vue Test Utils
- `tests/e2e/` - End-to-end tests using Playwright or Nuxt test utils
- `pages/*.test.ts` - Page-specific tests can live alongside pages

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

**E2E Tests with Nuxt Test Utils**:
```typescript
import { describe, test, expect } from 'vitest'
import { createPage, setup, url } from '@nuxt/test-utils/e2e'

describe('App E2E', async () => {
  await setup()
  
  test('loads home page', async () => {
    const page = await createPage(url('/'))
    const heading = page.locator('h1')
    const headingText = await heading.textContent()
    expect(headingText).toBe('Welcome')
  })
})
```

**E2E Tests with Playwright**:
```typescript
import { test, expect } from '@playwright/test'

test('home page loads', async ({ page }) => {
  await page.goto('/')
  await expect(page.locator('h1')).toHaveText('Welcome')
})
```

#### Test Utilities
- `mountSuspended()` - Mount components in Nuxt environment
- `mockNuxtImport()` - Mock auto-imported composables
- `mockComponent()` - Mock child components
- `$fetch` - Test API endpoints
- `createPage()` - Create browser page for E2E testing

#### E2E Testing Setup
First time setup for Playwright:
```bash
npx playwright install  # Install browsers for E2E testing
```

The project supports two E2E testing approaches:
1. **Nuxt Test Utils** (`@nuxt/test-utils/playwright`) - Integrated with Nuxt, auto-handles build/server
2. **Native Playwright** (`@playwright/test`) - Direct Playwright API, more control

Both approaches are configured and examples are provided in `tests/e2e/`.
```

## Feature Development Guidelines

### Approach to Feature Development
- When developing new features in this Nuxt app, start with test-driven development.
- When actually implementing the features, focus on seeing features added piece by piece.
- If a feature belongs on a page (e.g., CRUD operations pages like new, edit, view, delete):
  - Start by scaffolding the page first
  - Develop pages to ensure they exist and are navigable
  - Continue developing functionality incrementally
  - Build UI piece by piece to watch progress visually