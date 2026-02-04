# Multi-Environment Admin Portal Plan

## Overview

Enable the Create Studio Admin portal to manage multiple environments (Production, Preview) from a single deployed instance, with the ability to switch between them via a UI toggle.

## Architecture

### Environment Bindings

The admin worker will bind to multiple D1 databases, R2 buckets, and KV namespaces:

```
Production:
- DB (D1) → create-studio production database
- BLOB (R2) → create-studio bucket
- KV → production KV namespace

Preview:
- DB_PREVIEW (D1) → create-studio-preview database
- BLOB_PREVIEW (R2) → create-studio-preview bucket
- KV_PREVIEW → preview KV namespace
```

### Environment Selection Flow

```
┌─────────────────────────────────────────────────────────────┐
│  User clicks environment selector in admin header           │
│                              ↓                              │
│  POST /api/admin/environment { environment: 'preview' }     │
│                              ↓                              │
│  Server sets cookie: admin_environment=preview              │
│                              ↓                              │
│  All subsequent API requests read cookie                    │
│                              ↓                              │
│  useAdminEnv() returns appropriate DB/Blob/KV bindings      │
│                              ↓                              │
│  API routes use dynamic bindings for queries                │
└─────────────────────────────────────────────────────────────┘
```

### Access Matrix

| Admin Running In | Can Access Environments |
|------------------|------------------------|
| Local Dev        | Local SQLite only      |
| Local Dev + `--remote` | Production, Preview |
| Production       | Production, Preview    |

## Implementation Tasks

### Task Group 1: Infrastructure (No Dependencies)

These tasks can run in parallel:

#### Task 1.1: Update wrangler.jsonc with multi-environment bindings
**File:** `packages/admin/wrangler.jsonc`

Add bindings for:
- `DB_PREVIEW` - Preview D1 database (id: `d0f371df-bcba-4017-a34d-2987d3d408aa`)
- `BLOB_PREVIEW` - Preview R2 bucket (name: `create-studio-preview`)
- `KV_PREVIEW` - Preview KV namespace (id: `9db8b6ec8e6640808667c975f906e232`)
- `CACHE_PREVIEW` - Preview cache KV (id: `0224961fc68b48e7bb65cab509fe6c83`)

Also add the production KV/R2 that are currently missing:
- `BLOB` - Production R2 bucket (name: `create-studio`)
- `KV` - Production KV namespace (id: `7dc773eb80a44b2ab23ec5f0823a12a3`)
- `CACHE` - Production cache KV (id: `ed9b7bfcb79f4e1ba2e3e94961bb0192`)

#### Task 1.2: Configure local dev database sharing
**File:** `packages/admin/nuxt.config.ts`

Add `hub.dir` configuration to point to main app's data directory:
```typescript
hub: {
  dir: '../app/.data/hub',
  db: {
    dialect: 'sqlite',
  },
}
```

### Task Group 2: Server Utilities (Depends on Group 1)

#### Task 2.1: Create environment management server utility
**File:** `packages/admin/server/utils/admin-env.ts`

Create a utility that:
1. Reads `admin_environment` cookie from request
2. Returns appropriate Cloudflare bindings based on environment
3. Provides typed interface for environment selection
4. Falls back to production if no environment set
5. Handles local dev gracefully (only one DB available)

```typescript
export type AdminEnvironment = 'production' | 'preview'

export interface AdminEnvBindings {
  db: D1Database
  blob: R2Bucket
  kv: KVNamespace
  cache: KVNamespace
  environment: AdminEnvironment
  isLocal: boolean
}

export function useAdminEnv(event: H3Event): AdminEnvBindings
export function getAdminEnvironment(event: H3Event): AdminEnvironment
export function setAdminEnvironment(event: H3Event, env: AdminEnvironment): void
```

#### Task 2.2: Create Drizzle database factory
**File:** `packages/admin/server/utils/admin-db.ts`

Create a utility that returns a Drizzle instance for the selected environment:
```typescript
export function useAdminDb(event: H3Event) {
  const { db } = useAdminEnv(event)
  return drizzle(db, { schema })
}
```

### Task Group 3: API Routes (Depends on Group 2)

#### Task 3.1: Create environment switching endpoint
**File:** `packages/admin/server/api/admin/environment.post.ts`

Endpoint to switch environments:
- Accepts `{ environment: 'production' | 'preview' }`
- Sets `admin_environment` cookie (httpOnly, secure, sameSite: strict)
- Returns current environment info

#### Task 3.2: Create environment status endpoint
**File:** `packages/admin/server/api/admin/environment.get.ts`

Returns current environment info:
- Current selected environment
- Available environments
- Whether running locally or in production

#### Task 3.3: Update all admin API routes to use dynamic database

Update these files to use `useAdminDb(event)` instead of direct `db` import:

- `server/api/admin/dashboard/stats.get.ts`
- `server/api/admin/users/index.get.ts`
- `server/api/admin/users/[id].get.ts`
- `server/api/admin/users/[id]/update.patch.ts`
- `server/api/admin/users/[id]/reset-password.post.ts`
- `server/api/admin/users/[id]/send-verification.post.ts`
- `server/api/admin/users/[id]/toggle-status.post.ts`
- `server/api/admin/sites/index.get.ts`
- `server/api/admin/sites/[id].get.ts`
- `server/api/admin/subscriptions/index.get.ts`
- `server/api/admin/subscriptions/[id].get.ts`
- `server/api/admin/subscriptions/[id]/modify-tier.post.ts`
- `server/api/admin/subscriptions/[id]/cancel.post.ts`
- `server/api/admin/audit-logs/index.get.ts`

**Pattern to apply:**
```typescript
// Before:
import { db } from '~~/server/utils/db'
// ...
const results = await db.select()...

// After:
export default defineEventHandler(async (event) => {
  const db = useAdminDb(event)
  // ...
  const results = await db.select()...
})
```

### Task Group 4: Frontend (Depends on Group 2, Parallel with Group 3)

#### Task 4.1: Create environment composable
**File:** `packages/admin/app/composables/useAdminEnvironment.ts`

```typescript
export function useAdminEnvironment() {
  const environment = ref<'production' | 'preview'>('production')
  const isLoading = ref(false)
  const availableEnvironments = ref(['production', 'preview'])

  async function fetchEnvironment() { ... }
  async function switchEnvironment(env: string) { ... }

  return { environment, isLoading, availableEnvironments, switchEnvironment, fetchEnvironment }
}
```

#### Task 4.2: Create environment selector component
**File:** `packages/admin/app/components/AdminEnvironmentSelector.vue`

A dropdown component for the header:
- Shows current environment with visual indicator (badge color)
- Dropdown to switch environments
- Loading state during switch
- Confirmation for switching to production
- Visual distinction: Production = green/primary, Preview = orange/warning

Design:
```
┌──────────────────┐
│ ● Production  ▼  │
├──────────────────┤
│ ● Production     │ ← green dot
│ ○ Preview        │ ← orange dot
└──────────────────┘
```

#### Task 4.3: Update admin layout with environment selector
**File:** `packages/admin/app/layouts/admin.vue`

- Add `AdminEnvironmentSelector` to the header (next to theme toggle)
- Show environment indicator in sidebar header
- Add visual banner when in Preview environment (warning color)

### Task Group 5: Testing & Documentation (Depends on Groups 3 & 4)

#### Task 5.1: Add tests for environment switching
**File:** `packages/admin/tests/unit/admin-env.test.ts`

Test:
- Cookie reading/writing
- Binding selection logic
- Fallback to production
- Local dev detection

#### Task 5.2: Update admin README with multi-environment docs

Document:
- How to switch environments
- Local dev setup with `--remote`
- Binding configuration

## File Change Summary

### New Files
- `packages/admin/server/utils/admin-env.ts`
- `packages/admin/server/utils/admin-db.ts`
- `packages/admin/server/api/admin/environment.post.ts`
- `packages/admin/server/api/admin/environment.get.ts`
- `packages/admin/app/composables/useAdminEnvironment.ts`
- `packages/admin/app/components/AdminEnvironmentSelector.vue`
- `packages/admin/tests/unit/admin-env.test.ts`

### Modified Files
- `packages/admin/wrangler.jsonc` - Add multi-environment bindings
- `packages/admin/nuxt.config.ts` - Add hub.dir for local dev
- `packages/admin/app/layouts/admin.vue` - Add environment selector
- `packages/admin/server/api/admin/**/*.ts` - Update to use dynamic DB (15 files)

## Verification Steps

1. **Local Dev**: Run `npm run dev` in admin package, verify it uses main app's database
2. **Environment Switch**: Click selector, verify cookie is set, data changes
3. **API Routes**: Hit any API endpoint, verify it uses selected environment's DB
4. **Visual Indicator**: Verify banner appears when in Preview environment
5. **Production Deploy**: Deploy to Cloudflare, verify both environments accessible
