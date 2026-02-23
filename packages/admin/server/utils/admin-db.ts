/**
 * Admin Database Factory
 *
 * Returns a Drizzle database instance for the selected admin environment.
 * Always uses the D1 binding from wrangler (local dev) or Cloudflare Workers (production).
 */

import { drizzle } from 'drizzle-orm/d1'
import * as schema from '../../../app/server/db/schema'
import { useAdminEnv } from './admin-env'
import type { H3Event } from 'h3'

// Re-export app schema tables for convenience in API routes
// Note: admins/auditLogs/Admin/NewAdmin/AuditLog/NewAuditLog are intentionally
// excluded here to avoid collisions with admin-ops-db.ts exports
export { users, sites, siteUsers, subscriptions, broadcasts, feedbackReports, siteMeta } from '../../../app/server/db/schema'
export type { User, NewUser, Site, NewSite, SiteUser, NewSiteUser, Subscription, NewSubscription, Broadcast, NewBroadcast, FeedbackReport, NewFeedbackReport, SiteMeta, NewSiteMeta, SiteSettings, VersionLogEntry } from '../../../app/server/db/schema'

// Type for NuxtHub's auto-imported db
type DrizzleDb = ReturnType<typeof drizzle>

/**
 * Get a Drizzle database instance for the current admin environment
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
  const { db: d1Binding } = useAdminEnv(event)

  // Create a Drizzle instance from the D1 binding (wrangler miniflare locally, Cloudflare Workers in production)
  return drizzle(d1Binding, { schema })
}
