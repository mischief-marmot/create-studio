# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Nuxt 3 starter template with TypeScript, Tailwind CSS v4, DaisyUI, and Pinia state management.

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
npm test             # Run Vitest tests
npm run test:ui      # Run tests with UI
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

Example workflow:
```bash
# 1. Write test first
# 2. Run test to see it fail
npm test
# 3. Implement feature
# 4. Run test to see it pass
npm test
```

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
Tests use Vitest with Happy DOM. Place test files adjacent to source files with `.test.ts` or `.spec.ts` extension.