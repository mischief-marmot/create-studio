/**
 * Admin Database Factory
 *
 * Returns a Drizzle database instance for the selected admin environment.
 * In local development, falls back to the default NuxtHub database.
 * In production, creates a Drizzle instance from the environment-specific D1 binding.
 */

import { drizzle } from 'drizzle-orm/d1'
import * as schema from '../../../app/server/db/schema'
import { useAdminEnv } from './admin-env'
import type { H3Event } from 'h3'

// Re-export schema tables for convenience in API routes
export * from '../../../app/server/db/schema'

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
export function useAdminDb(event: H3Event) {
  const { db: d1Binding, isLocal } = useAdminEnv(event)

  // In local development, fall back to the default NuxtHub database
  // which is auto-imported and uses the local SQLite database
  if (isLocal) {
    // db is auto-imported from hub:db in NuxtHub
    return db
  }

  // In production or preview, create a Drizzle instance from the D1 binding
  return drizzle(d1Binding, { schema })
}
