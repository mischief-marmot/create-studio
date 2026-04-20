/**
 * Admin Database Factory
 *
 * Returns a Drizzle database instance for the selected admin environment.
 * In local dev, connects directly to the main app's SQLite DB file.
 * In production, uses the D1 binding from Cloudflare Workers.
 */

import { drizzle as drizzleD1 } from 'drizzle-orm/d1'
import { drizzle as drizzleSqlite } from 'drizzle-orm/better-sqlite3'
import Database from 'better-sqlite3'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { readdirSync } from 'node:fs'
import * as schema from '../../../app/server/db/schema'
import { useAdminEnv } from './admin-env'
import type { DrizzleD1Database } from 'drizzle-orm/d1'
import type { H3Event } from 'h3'

// Re-export app schema tables for convenience in API routes
// Note: admins/auditLogs/Admin/NewAdmin/AuditLog/NewAuditLog are intentionally
// excluded here to avoid collisions with admin-ops-db.ts exports
export { users, sites, siteUsers, subscriptions, broadcasts, feedbackReports, siteMeta, surveys, surveyResponses } from '../../../app/server/db/schema'
export type { User, NewUser, Site, NewSite, SiteUser, NewSiteUser, Subscription, NewSubscription, Broadcast, NewBroadcast, FeedbackReport, NewFeedbackReport, SiteMeta, NewSiteMeta, SiteSettings, VersionLogEntry, Survey, SurveyResponse } from '../../../app/server/db/schema'

// Use D1 database type as the common interface — both D1 (production) and
// better-sqlite3 (local dev) share the same query API surface
type DrizzleDb = DrizzleD1Database

// Cached local SQLite connection (singleton for the process lifetime)
let localAppDbInstance: ReturnType<typeof drizzleSqlite> | null = null

/**
 * Find the miniflare D1 SQLite file that contains the app's tables.
 * NuxtHub uses miniflare D1 in local dev, which stores data at
 * .wrangler/state/v3/d1/miniflare-D1DatabaseObject/<hash>.sqlite
 */
function findMiniflareD1Path(appDir: string): string | null {
  const d1Dir = join(appDir, '.wrangler/state/v3/d1/miniflare-D1DatabaseObject')
  try {
    const files = readdirSync(d1Dir).filter(f => f.endsWith('.sqlite'))
    for (const file of files) {
      const dbPath = join(d1Dir, file)
      try {
        const testDb = new Database(dbPath, { readonly: true })
        const result = testDb.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='_hub_migrations'").get()
        testDb.close()
        if (result) return dbPath
      } catch {
        // Skip unreadable files
      }
    }
  } catch {
    // Directory doesn't exist
  }
  return null
}

/**
 * Get the local app Drizzle instance pointing at the main app's SQLite DB (cached singleton)
 *
 * Connects to the miniflare D1 database that NuxtHub uses in local dev.
 * Falls back to the legacy .data/db/sqlite.db path if miniflare is not found.
 */
function getLocalAppDb(): ReturnType<typeof drizzleSqlite> {
  if (!localAppDbInstance) {
    const __filename = fileURLToPath(import.meta.url)
    const __dirname = dirname(__filename)
    const appDir = join(__dirname, '../../../app')

    // Prefer the miniflare D1 database (what NuxtHub actually uses in local dev)
    const miniflareDbPath = findMiniflareD1Path(appDir)
    const appDbPath = miniflareDbPath || join(appDir, '.data/db/sqlite.db')

    const sqlite = new Database(appDbPath)
    localAppDbInstance = drizzleSqlite(sqlite, { schema })
  }
  return localAppDbInstance
}

/**
 * Get a Drizzle database instance for the current admin environment
 *
 * In local dev, connects directly to the main app's SQLite DB to avoid
 * the stale/empty DB that NuxtHub/miniflare provisions per-package.
 *
 * In production, uses the D1 binding (which points to the main app's D1).
 *
 * @param event - H3 event from the request (used to determine environment from cookie)
 * @returns Drizzle database instance configured for the selected environment
 *
 * @example
 * ```typescript
 * export default defineEventHandler(async (event) => {
 *   const db = useAdminDb(event)
 *   const users = await db.select().from(schema.users).all()
 *   return users
 * })
 * ```
 */
export function useAdminDb(event: H3Event): DrizzleDb {
  // In local dev, connect directly to the main app's SQLite DB
  if (import.meta.dev) {
    return getLocalAppDb() as unknown as DrizzleDb
  }

  // In production, use the D1 binding (points to main app's D1)
  const { db: d1Binding } = useAdminEnv(event)
  return drizzleD1(d1Binding, { schema }) as unknown as DrizzleDb
}
