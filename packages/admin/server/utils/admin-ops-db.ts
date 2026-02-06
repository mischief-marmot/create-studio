/**
 * Admin Operations Database Factory
 *
 * Returns a Drizzle database instance for the admin operations database (create-studio-admin).
 * This database stores admin accounts (Admins) and audit logs (AuditLogs).
 *
 * This is SEPARATE from `useAdminDb` which connects to the environment-specific
 * app database (for Users, Sites, Subscriptions, etc.).
 *
 * In local development, uses its own SQLite file (packages/admin/.data/admin-ops.db).
 * In production, creates a Drizzle instance from the DB_ADMIN D1 binding.
 */

import { drizzle as drizzleD1 } from 'drizzle-orm/d1'
import { drizzle as drizzleSqlite } from 'drizzle-orm/better-sqlite3'
import Database from 'better-sqlite3'
import { existsSync, mkdirSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import type { H3Event } from 'h3'
import { useAdminEnv, type AdminEnvironment } from './admin-env'
import * as adminSchema from '../db/admin-schema'

// Re-export admin schema tables for convenience in API routes
export * from '../db/admin-schema'

// Type for Drizzle DB instance (union of D1 and SQLite drivers)
type DrizzleDb = ReturnType<typeof drizzleD1> | ReturnType<typeof drizzleSqlite>

// Cached local SQLite connection (singleton for the process lifetime)
let localDbInstance: ReturnType<typeof drizzleSqlite> | null = null

/**
 * Environment type that includes 'local' for audit logging
 */
export type AuditEnvironment = AdminEnvironment | 'local'

/**
 * Get the current environment name for audit log entries
 *
 * @param event - H3 event from the request
 * @returns The environment name ('production', 'preview', or 'local')
 */
export function getAuditEnvironment(event: H3Event): AuditEnvironment {
  const { isLocal, environment } = useAdminEnv(event)

  if (isLocal) {
    return 'local'
  }

  return environment
}

/**
 * Get the path to the local admin ops SQLite database
 */
function getLocalDbPath(): string {
  const __filename = fileURLToPath(import.meta.url)
  const __dirname = dirname(__filename)
  // Navigate from server/utils/ to packages/admin/.data/
  const adminPkgRoot = join(__dirname, '../..')
  const dataDir = join(adminPkgRoot, '.data')

  if (!existsSync(dataDir)) {
    mkdirSync(dataDir, { recursive: true })
  }

  return join(dataDir, 'admin-ops.db')
}

/**
 * Initialize the local SQLite database with admin tables if they don't exist
 */
function initLocalDb(sqlite: InstanceType<typeof Database>): void {
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS Admins (
      id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      password TEXT NOT NULL,
      firstname TEXT,
      lastname TEXT,
      role TEXT NOT NULL DEFAULT 'admin',
      last_login TEXT,
      createdAt TEXT,
      updatedAt TEXT
    );
    CREATE INDEX IF NOT EXISTS idx_admins_email ON Admins (email);
    CREATE INDEX IF NOT EXISTS idx_admins_role ON Admins (role);

    CREATE TABLE IF NOT EXISTS AuditLogs (
      id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
      admin_id INTEGER NOT NULL REFERENCES Admins(id),
      action TEXT NOT NULL,
      entity_type TEXT,
      entity_id INTEGER,
      changes TEXT,
      ip_address TEXT,
      user_agent TEXT,
      environment TEXT NOT NULL DEFAULT 'local',
      createdAt TEXT
    );
    CREATE INDEX IF NOT EXISTS idx_audit_logs_admin_id ON AuditLogs (admin_id);
    CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON AuditLogs (action);
    CREATE INDEX IF NOT EXISTS idx_audit_logs_entity_type ON AuditLogs (entity_type);
    CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON AuditLogs (createdAt);
    CREATE INDEX IF NOT EXISTS idx_audit_logs_environment ON AuditLogs (environment);
  `)
}

/**
 * Get the local admin ops Drizzle instance (cached singleton)
 */
function getLocalAdminOpsDb(): ReturnType<typeof drizzleSqlite> {
  if (!localDbInstance) {
    const dbPath = getLocalDbPath()
    const sqlite = new Database(dbPath)
    initLocalDb(sqlite)
    localDbInstance = drizzleSqlite(sqlite, { schema: adminSchema })
  }
  return localDbInstance
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
 */
export function useAdminOpsDb(event: H3Event): DrizzleDb {
  const { adminDb, isLocal } = useAdminEnv(event)

  // In local development, use a dedicated SQLite file for admin ops
  if (isLocal) {
    return getLocalAdminOpsDb()
  }

  // In production, use the DB_ADMIN binding
  if (!adminDb) {
    throw new Error(
      'Admin operations database (DB_ADMIN) is not configured. ' +
      'Please ensure the DB_ADMIN binding is set in your Cloudflare Workers configuration.'
    )
  }

  // Create a Drizzle instance from the D1 binding with admin schema
  return drizzleD1(adminDb, { schema: adminSchema })
}
