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
import * as schema from '../../../app/server/db/schema'
import { useAdminEnv } from './admin-env'
import type { H3Event } from 'h3'

// Re-export app schema tables for convenience in API routes
// Note: admins/auditLogs/Admin/NewAdmin/AuditLog/NewAuditLog are intentionally
// excluded here to avoid collisions with admin-ops-db.ts exports
export { users, sites, siteUsers, subscriptions, broadcasts, feedbackReports, siteMeta } from '../../../app/server/db/schema'
export type { User, NewUser, Site, NewSite, SiteUser, NewSiteUser, Subscription, NewSubscription, Broadcast, NewBroadcast, FeedbackReport, NewFeedbackReport, SiteMeta, NewSiteMeta, SiteSettings, VersionLogEntry } from '../../../app/server/db/schema'

// Type for Drizzle DB instance (union of D1 and SQLite drivers)
type DrizzleDb = ReturnType<typeof drizzleD1> | ReturnType<typeof drizzleSqlite>

// Cached local SQLite connection (singleton for the process lifetime)
let localAppDbInstance: ReturnType<typeof drizzleSqlite> | null = null

/**
 * Get the local app Drizzle instance pointing at the main app's SQLite DB (cached singleton)
 */
function getLocalAppDb(): ReturnType<typeof drizzleSqlite> {
  if (!localAppDbInstance) {
    const __filename = fileURLToPath(import.meta.url)
    const __dirname = dirname(__filename)
    // Navigate from admin/server/utils/ → app/.data/db/sqlite.db
    const appDbPath = join(__dirname, '../../../app/.data/db/sqlite.db')
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
    return getLocalAppDb()
  }

  // In production, use the D1 binding (points to main app's D1)
  const { db: d1Binding } = useAdminEnv(event)
  return drizzleD1(d1Binding, { schema })
}
