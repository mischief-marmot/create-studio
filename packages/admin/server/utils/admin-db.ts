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
  const { db: d1Binding, isLocal } = useAdminEnv(event)

  // In local development, use NuxtHub's auto-imported `db`
  // The `db` is auto-imported from 'hub:db' in the server context
  if (isLocal) {
    // @ts-expect-error - db is auto-imported by NuxtHub at compile time
    return db
  }

  // In production or preview, create a Drizzle instance from the D1 binding
  return drizzle(d1Binding, { schema })
}
