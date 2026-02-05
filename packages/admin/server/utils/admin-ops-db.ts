/**
 * Admin Operations Database Factory
 *
 * Returns a Drizzle database instance for the admin operations database (create-studio-admin).
 * This database stores admin accounts (Admins) and audit logs (AuditLogs).
 *
 * This is SEPARATE from `useAdminDb` which connects to the environment-specific
 * app database (for Users, Sites, Subscriptions, etc.).
 *
 * In local development, falls back to the default NuxtHub database.
 * In production, creates a Drizzle instance from the DB_ADMIN D1 binding.
 */

import { drizzle } from 'drizzle-orm/d1'
import type { H3Event } from 'h3'
import { useAdminEnv, type AdminEnvironment } from './admin-env'
import * as adminSchema from '../db/admin-schema'

// Re-export admin schema tables for convenience in API routes
export * from '../db/admin-schema'

// Type for NuxtHub's auto-imported db
type DrizzleDb = ReturnType<typeof drizzle>

/**
 * Environment type that includes 'local' for audit logging
 */
export type AuditEnvironment = AdminEnvironment | 'local'

/**
 * Get the current environment name for audit log entries
 *
 * @param event - H3 event from the request
 * @returns The environment name ('production', 'preview', or 'local')
 *
 * @example
 * ```typescript
 * export default defineEventHandler(async (event) => {
 *   const environment = getAuditEnvironment(event)
 *   // Use in audit log entry: { environment }
 * })
 * ```
 */
export function getAuditEnvironment(event: H3Event): AuditEnvironment {
  const { isLocal, environment } = useAdminEnv(event)

  if (isLocal) {
    return 'local'
  }

  return environment
}

/**
 * Get a Drizzle database instance for the admin operations database
 *
 * This database contains:
 * - `admins` table: Admin user accounts for the admin portal
 * - `auditLogs` table: Audit trail of all admin actions
 *
 * @param event - H3 event from the request
 * @returns Drizzle database instance configured for the admin operations database
 *
 * @example
 * ```typescript
 * import { admins, auditLogs } from '~/server/utils/admin-ops-db'
 *
 * export default defineEventHandler(async (event) => {
 *   const adminOpsDb = useAdminOpsDb(event)
 *
 *   // Query admin users
 *   const adminUsers = await adminOpsDb.select().from(admins).all()
 *
 *   // Insert audit log
 *   await adminOpsDb.insert(auditLogs).values({
 *     admin_id: 1,
 *     action: 'user_update',
 *     entity_type: 'user',
 *     entity_id: 123,
 *     environment: getAuditEnvironment(event),
 *     createdAt: new Date().toISOString(),
 *   })
 *
 *   return adminUsers
 * })
 * ```
 */
export function useAdminOpsDb(event: H3Event): DrizzleDb {
  const { adminDb, isLocal } = useAdminEnv(event)

  // In local development, use NuxtHub's auto-imported `db`
  // Note: In local dev, admin tables live in the same DB as app data
  // The `db` is auto-imported from 'hub:db' in the server context
  if (isLocal) {
    // @ts-expect-error - db is auto-imported by NuxtHub at compile time
    return db
  }

  // In production, use the DB_ADMIN binding
  // If adminDb is not configured, throw an error
  if (!adminDb) {
    throw new Error(
      'Admin operations database (DB_ADMIN) is not configured. ' +
      'Please ensure the DB_ADMIN binding is set in your Cloudflare Workers configuration.'
    )
  }

  // Create a Drizzle instance from the D1 binding with admin schema
  return drizzle(adminDb, { schema: adminSchema })
}
