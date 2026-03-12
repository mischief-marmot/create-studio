# Analytics Database System Spec

> Generated: 2026-03-09
> Status: Draft

## Overview

Replace the current KV-based analytics system with a dedicated D1 database using an event-sourcing pattern. A single `events` table with typed JSON payloads provides flexibility for any metric type, while structured summary tables enable fast dashboard queries. A shared `packages/analytics` package provides the schema, types, and query helpers used by both the main app and admin workers.

## Goals

- Replace KV analytics with a queryable D1 database shared between app and admin workers
- Event-sourcing pattern: single events table with `type` + JSON `body`, discriminated unions in TypeScript
- Configurable sampling: 100% for key funnel events (renders, activations, sessions), sampled for lower-priority events
- Structured summary tables rolled up via cron for fast dashboard reads
- 30-day raw event retention, summaries kept indefinitely
- Schema-ready for future features (IM themes/layouts, full trial lifecycle funnel)

## Non-Goals (Out of Scope)

- Full Stripe trial lifecycle funnel (future — schema supports it, not implemented yet)
- Interactive Mode theme/layout tracking (future — nullable column ready)
- Migrating historical KV data (hard cutover, start fresh)
- Real-time analytics (cron-based rollups are sufficient)

## Background

### Current System Pain Points
- KV `keys()` calls scan all keys and filter in JS — doesn't scale
- Admin dashboard queries are slow and hit rate limits
- No indexed queries, no JOINs, no aggregation at the storage layer
- Duplicated type definitions across 3 packages
- Session data has 30-day TTL with no long-term archive
- API sampling at 1% is a blunt instrument; Interactive Mode at 100% with no configurability

### Current Architecture
- **Client**: `useAnalytics` composable in widgets package batches events, POSTs to `/api/analytics/events` every 15s
- **Server**: `events.post.ts` stores session data + increments per-event-type counters in KV
- **Admin**: Reads same KV namespace, iterates all keys to build dashboard data
- **API middleware**: 1% sampling, tracks v1/v2 usage per endpoint per day/hour

## Technical Approach

### Database
New D1 database (`DB_ANALYTICS`) added as a binding to both app and admin workers. Completely separate from the core app DB.

### Event-Sourcing Pattern
Single `events` table with:
- Indexed columns: `type`, `domain`, `session_id`, `created_at` (for fast filtering)
- JSON `body` column shaped per event type (TypeScript discriminated unions)
- D1's `json_extract()` for ad-hoc queries into the body

### Sampling Strategy
| Event Type | Rate | Rationale |
|---|---|---|
| `cta_rendered` | 100% | Key funnel top — need exact counts |
| `cta_activated` | 100% | Key funnel — need exact counts |
| `im_session_start` | 100% | Need total session count |
| `im_session_complete` | 100% | Need completion rate |
| `rating_screen_shown` | 100% | Funnel step |
| `rating_submitted` | 100% | Funnel step |
| `page_view` | 10% | High volume, extrapolate from session count |
| `timer_start` | 10% | Lower priority |
| `timer_complete` | 10% | Lower priority |
| `api_call` | 0.1% | Very high volume, just need v1 vs v2 trend |
| `trial_started` | 100% | Low volume, high value |

Sampling is configured server-side in the event ingestion endpoint, not client-side.

### Write Path
1. Client batches events (same as today)
2. Server receives batch, applies per-event-type sampling
3. Surviving events inserted as rows in `events` table (batch INSERT)
4. For 100%-sampled funnel events, also increment atomic counters in a `counters` table for real-time-ish dashboard reads

### Rollup Strategy
- Cloudflare Workers cron trigger (daily)
- Aggregates raw events into structured summary tables
- Purges raw events older than 30 days

## Schema

### `events` table (raw events, 30-day retention)
```sql
CREATE TABLE events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  type TEXT NOT NULL,
  body TEXT NOT NULL,          -- JSON payload
  domain TEXT,
  session_id TEXT,
  sample_rate REAL NOT NULL DEFAULT 1.0,  -- for extrapolation
  created_at INTEGER NOT NULL  -- unix timestamp ms
);

CREATE INDEX idx_events_type_created ON events (type, created_at);
CREATE INDEX idx_events_domain_created ON events (domain, created_at);
CREATE INDEX idx_events_session ON events (session_id);
```

### `daily_summaries` table (rolled up, kept indefinitely)
```sql
CREATE TABLE daily_summaries (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  date TEXT NOT NULL,           -- YYYY-MM-DD
  domain TEXT,                  -- NULL for global aggregates
  metric TEXT NOT NULL,         -- e.g., 'cta_renders', 'cta_activations', 'im_sessions'
  dimensions TEXT,              -- JSON for grouping keys, e.g., {"variant": "button"}
  value REAL NOT NULL,          -- the aggregated count/sum/avg
  sample_rate REAL NOT NULL DEFAULT 1.0,
  created_at INTEGER NOT NULL
);

CREATE UNIQUE INDEX idx_daily_summary_unique ON daily_summaries (date, domain, metric, dimensions);
CREATE INDEX idx_daily_summary_date ON daily_summaries (date);
CREATE INDEX idx_daily_summary_metric ON daily_summaries (metric, date);
```

### `counters` table (real-time atomic counters for key metrics)
```sql
CREATE TABLE counters (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  key TEXT NOT NULL UNIQUE,     -- e.g., 'cta_rendered:button:2026-03-09'
  value INTEGER NOT NULL DEFAULT 0,
  updated_at INTEGER NOT NULL
);

CREATE UNIQUE INDEX idx_counters_key ON counters (key);
```

### Event Type Definitions (TypeScript)
```typescript
type AnalyticsEvent =
  | { type: 'cta_rendered'; body: { variant: string; creation_id: string } }
  | { type: 'cta_activated'; body: { variant: string; creation_id: string } }
  | { type: 'im_session_start'; body: { creation_id: string; total_pages: number; theme_id?: string } }
  | { type: 'im_session_complete'; body: { creation_id: string; duration: number; pages_viewed: number; theme_id?: string } }
  | { type: 'rating_screen_shown'; body: { creation_id: string } }
  | { type: 'rating_submitted'; body: { creation_id: string; rating: number } }
  | { type: 'page_view'; body: { creation_id: string; page_number: number; total_pages: number } }
  | { type: 'timer_start'; body: { creation_id: string; timer_id?: string } }
  | { type: 'timer_complete'; body: { creation_id: string; timer_id?: string } }
  | { type: 'api_call'; body: { version: 'v1' | 'v2' } }
  | { type: 'trial_started'; body: { user_id: string; plan?: string; source?: string } }
  | { type: 'trial_converted'; body: { user_id: string; plan: string } }
```

## Package Structure

```
packages/analytics/
  index.ts              -- public API exports
  schema.ts             -- Drizzle schema definitions
  types.ts              -- Event types, discriminated unions, sampling config
  sampling.ts           -- Sampling rate config and shouldSample() helper
  queries/
    events.ts           -- Insert events, query raw events
    summaries.ts        -- Query summary tables
    counters.ts         -- Increment/read counters
  rollup/
    index.ts            -- Cron handler: aggregate + purge
    aggregators.ts      -- Per-metric aggregation logic
  migrations/
    0001_init.sql       -- Initial schema
```

## Task Groups

Tasks are organized into parallel execution groups. Each group can run concurrently with other groups unless marked as dependent.

### Group 1: Database & Package Foundation (Independent)

**Tasks:**
1. Create new D1 database via Cloudflare dashboard or wrangler
2. Add `DB_ANALYTICS` binding to `packages/app/wrangler.jsonc` and `packages/admin/wrangler.jsonc` (production + preview)
3. Create `packages/analytics/` package with `package.json`, `tsconfig.json`
4. Define Drizzle schema in `packages/analytics/schema.ts`
5. Write initial migration `0001_init.sql` (events, daily_summaries, counters tables)
6. Define TypeScript event types and discriminated unions in `packages/analytics/types.ts`
7. Implement sampling config in `packages/analytics/sampling.ts`
8. Add NuxtHub config for analytics DB in both app and admin `nuxt.config.ts`

**Verification:**
- [ ] `packages/analytics` builds without errors
- [ ] D1 database created and accessible via both workers
- [ ] Migration applies cleanly on dev startup

---

### Group 2: Event Ingestion (Depends on: Group 1)

**Tasks:**
1. Create `packages/analytics/queries/events.ts` — batch insert helper
2. Create `packages/analytics/queries/counters.ts` — atomic increment helper
3. Update `packages/app/server/api/analytics/events.post.ts` to write to D1 instead of KV
   - Apply per-event-type sampling
   - Batch insert surviving events
   - Increment counters for 100%-sampled funnel events
4. Update `packages/app/server/middleware/analytics.ts` to write API usage to D1 at 0.1% sampling
5. Update client `useAnalytics.ts` event types to match new type definitions (if needed)

**Verification:**
- [ ] Events POST endpoint writes to D1
- [ ] Sampling rates applied correctly per event type
- [ ] Counters increment atomically for funnel events
- [ ] API middleware writes to D1 instead of KV
- [ ] Unit tests for sampling logic and event insertion

---

### Group 3: Rollup Cron (Depends on: Group 1)

**Tasks:**
1. Create `packages/analytics/rollup/aggregators.ts` — per-metric aggregation functions
2. Create `packages/analytics/rollup/index.ts` — cron handler that:
   - Aggregates raw events into `daily_summaries` for each completed day
   - Purges raw events older than 30 days
3. Register cron trigger in `packages/app/wrangler.jsonc`
4. Create `packages/analytics/queries/summaries.ts` — query helpers for summary tables

**Verification:**
- [ ] Cron handler aggregates test events correctly
- [ ] Old events purged after 30 days
- [ ] Summary rows created with correct dimensions and values
- [ ] Unit tests for aggregation logic

---

### Group 4: Admin Dashboard Migration (Depends on: Groups 2, 3)

**Tasks:**
1. Rewrite `packages/admin/server/api/admin/analytics/interactive.get.ts` to query D1 summaries + counters
2. Rewrite `packages/admin/server/api/admin/analytics/dashboard.get.ts` to query D1
3. Rewrite `packages/admin/server/api/admin/analytics/api-usage.get.ts` to query D1
4. Remove KV analytics query code from admin
5. Update admin dashboard UI if data shapes changed

**Verification:**
- [ ] Admin dashboard loads with D1-backed data
- [ ] CTA conversion rates display correctly
- [ ] API usage v1/v2 breakdown works
- [ ] Interactive Mode funnel metrics accurate

---

### Group 5: Cleanup (Depends on: Group 4)

**Tasks:**
1. Remove KV analytics utilities from `packages/app/server/utils/analytics.ts` (keep non-analytics KV usage)
2. Remove `packages/admin/server/utils/analytics-types.ts` (replaced by shared package)
3. Remove KV-specific dashboard code from `packages/app/server/api/analytics/dashboard.get.ts`
4. Delete `scripts/backfill-cta-renders.sh`
5. Update any remaining KV references in analytics code

**Verification:**
- [ ] No KV analytics reads or writes remain
- [ ] App and admin both import from `packages/analytics`
- [ ] All analytics endpoints functional end-to-end

---

## Execution Instructions

To execute this spec, use the `/parallel` skill:

```
/parallel
```

**Agent Guidelines:**
- Each task group can be assigned to a separate agent
- Groups marked "Independent" can run in parallel
- Groups with dependencies wait for their prerequisites
- Commit after completing each group as a checkpoint
- Use descriptive commit messages referencing the spec section

**Commit Strategy:**
- Atomic commits after each task group
- Example: `feat(analytics): add D1 database schema and shared package (Group 1)`
- Example: `feat(analytics): migrate event ingestion from KV to D1 (Group 2)`

## Open Questions

1. **D1 database creation**: Should we create via `wrangler d1 create` or Cloudflare dashboard? Need the database ID for wrangler config.
2. **Cron frequency**: Daily rollup sufficient, or should we also do hourly for near-real-time summaries?
3. **Counter key format**: Proposed `{metric}:{dimension}:{date}` (e.g., `cta_rendered:button:2026-03-09`). Confirm this covers dashboard query patterns.
4. **Preview environment**: Should preview use its own analytics DB, or share with production? (Current KV setup has separate preview bindings.)

## References

- Current KV analytics: `packages/app/server/utils/analytics.ts`
- Current event ingestion: `packages/app/server/api/analytics/events.post.ts`
- Current admin dashboards: `packages/admin/server/api/admin/analytics/`
- Client tracking: `packages/widgets/src/composables/useAnalytics.ts`
- Wrangler configs: `packages/app/wrangler.jsonc`, `packages/admin/wrangler.jsonc`
