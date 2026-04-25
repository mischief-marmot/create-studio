# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Create Studio is an application that allows publishers and bloggers to create structured data cards (recipes, how-to guides, FAQs) with automatic JSON-LD generation and embeddable, interactive visual cards. Built with Nuxt 4, TypeScript, Tailwind CSS v4, DaisyUI, Clerk Auth, and deployed on NuxtHub/Cloudflare.

## Diagrams

See diagrams in .memory/diagrams directory for more context on the architecture and data flow.

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
npm test tests/unit/nutrition-api.test.ts
```

## Architecture

### Framework Stack
- **Nuxt 4** (v4.4) - Vue.js meta-framework
- **TypeScript** - Type safety throughout
- **Tailwind CSS v4** - Utility-first CSS with `@tailwindcss/vite`
- **DaisyUI** - Component library with custom themes ("light" light, "dark" dark)
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

## Database

- **Database Dialect**: The database dialect is set in the `nuxt.config.ts` file, within the `hub.db` option or `hub.db.dialect` property.
- **Drizzle Config**: Don't generate the `drizzle.config.ts` file manually, it is generated automatically by NuxtHub.
- **Manual Migrations Only**: Do NOT use `npx nuxt db generate` or `npx nuxt db migrate`. NuxtHub's Drizzle-based migration tooling uses a different format that we are not using. All migrations must be written manually.
- **Migration Format**: Migrations are plain SQL files in `packages/app/server/db/migrations/` with the naming convention `NNNN_description.sql` (e.g., `0018_add-site-meta.sql`). The number is zero-padded to 4 digits and increments sequentially.
- **Workflow**:
  1. Create or modify the database schema in `server/db/schema.ts` or any other schema file in the `server/db/schema/` directory
  2. Manually create a new SQL migration file in `packages/app/server/db/migrations/` with the next sequential number
  3. Write the SQL statements (CREATE TABLE, ALTER TABLE, CREATE INDEX, etc.) in the migration file
  4. Migrations are applied automatically when running `npx nuxt dev`
- **Migration file template**:
  ```sql
  -- Migration number: NNNN
  -- Description of what this migration does

  ALTER TABLE MyTable ADD COLUMN new_column TEXT;
  ```
- **Access the database**: Use the `db` instance from `hub:db` to query the database, it is a Drizzle ORM instance.

## Caching at the Edge (Cloudflare)

The Worker is deployed on a **Custom Domain** (`create.studio`), not a Worker Route. On Custom Domains the Worker runs *first* on every request, so:

- **Cache Rules alone do NOT cache Worker responses.** A `set_cache_settings { cache: true }` rule grants eligibility, but the edge cache stays empty until the Worker explicitly writes to it via `caches.default.put()`.
- **Cache Rules DO let cached entries serve without invoking the Worker.** Once an entry exists in `caches.default`, subsequent requests for the same URL hit the edge first and emit `cf-cache-status: HIT`. Without a Cache Rule on the path, the Worker is invoked even if a cache entry exists.
- **You need both** for high cache-hit ratios: a Cache Rule on the path *and* `caches.default.put()` inside the Worker.

### Pattern for cacheable Worker routes

See `packages/app/server/routes/embed/[...pathname].get.ts` and `packages/app/server/api/v2/site-config/[siteKey].get.ts` for the canonical pattern:

```ts
const cacheKey = new Request(getRequestURL(event).toString(), { method: 'GET' })

// 1. Read from edge cache
const cache = (caches as any).default as Cache | undefined
if (cache) {
  const cached = await cache.match(cacheKey)
  if (cached) {
    setResponseHeaders(event, Object.fromEntries(cached.headers.entries()))
    return cached.json()  // or .body for streams
  }
}

// 2. Compute the response
const result = await ...

// 3. Write to edge cache (fire-and-forget via waitUntil)
const responseToCache = new Response(JSON.stringify(result), {
  headers: {
    'Content-Type': 'application/json',
    'Cache-Control': 'public, max-age=600',
    'CDN-Cache-Control': 'public, max-age=600',
    'Access-Control-Allow-Origin': '*',
  },
})
const ctx = (event.context.cloudflare as any)?.context
ctx?.waitUntil ? ctx.waitUntil(cache.put(cacheKey, responseToCache)) : cache.put(cacheKey, responseToCache).catch(() => {})

return result
```

### Diagnosing cache failures

- `cf-cache-status` header **missing entirely** → the Cache Rule didn't match the path (check expression and rule order in CF dashboard).
- `cf-cache-status: DYNAMIC` or `BYPASS` → rule matched but something disqualified caching (most often `Set-Cookie` on the response, or a `Vary: *` header).
- `cf-cache-status: MISS` on every request → Cache Rule is working but the Worker isn't writing to `caches.default`. Add the put.
- `cf-cache-status: HIT` → working correctly.

### Cookie leak protection

The `packages/app/server/plugins/cacheable-no-cookies.ts` Nitro plugin strips `set-cookie` from responses on listed prefixes (`/embed/`, `/api/v2/site-config/`). Without it, an h3/nuxt-auth-utils session cookie can be baked into a cached entry and served to every visitor of that entry. Add new cacheable prefixes to the array in that plugin.

The root cause of session cookies leaking onto every response is `nuxt-auth-utils` registering a per-request hydrator when `nitro.experimental.websocket: true`. Keep that flag off unless you actually use WebSockets — see `packages/app/nuxt.config.ts`.

### Cache invalidation

The Worker has `NUXT_CLOUDFLARE_API_TOKEN` + `NUXT_CLOUDFLARE_ZONE_ID` secrets and uses them in `packages/app/server/api/v2/upload-widget.post.ts` to call CF's `purge_cache` API after each widget upload. For new caching code, reuse the same pattern instead of waiting for natural TTL expiry.

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

#### Test Utilities
- `mountSuspended()` - Mount components in Nuxt environment
- `mockNuxtImport()` - Mock auto-imported composables
- `mockComponent()` - Mock child components
- `$fetch` - Test API endpoints
- `createPage()` - Create browser page for E2E testing

#### E2E Testing Setup
```
1. **Nuxt Test Utils** (`@nuxt/test-utils/playwright`) - Integrated with Nuxt, auto-handles build/server
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