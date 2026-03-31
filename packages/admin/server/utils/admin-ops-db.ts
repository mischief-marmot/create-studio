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
import type { DrizzleD1Database } from 'drizzle-orm/d1'
import type { H3Event } from 'h3'
import { useAdminEnv, type AdminEnvironment } from './admin-env'
import * as adminSchema from '../db/admin-schema'

// Re-export admin schema tables for convenience in API routes
export * from '../db/admin-schema'

// Use D1 database type as the common interface — both D1 (production) and
// better-sqlite3 (local dev) share the same query API surface
type DrizzleDb = DrizzleD1Database

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
  if (import.meta.dev) {
    return 'local'
  }

  const { environment } = useAdminEnv(event)
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

    CREATE TABLE IF NOT EXISTS ReleaseEmails (
      id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
      product TEXT NOT NULL,
      version TEXT NOT NULL,
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      hero_image_url TEXT,
      release_url TEXT,
      highlights TEXT,
      status TEXT NOT NULL DEFAULT 'draft',
      sent_at TEXT,
      sent_by INTEGER REFERENCES Admins(id),
      createdAt TEXT,
      updatedAt TEXT
    );
    CREATE INDEX IF NOT EXISTS idx_release_emails_status ON ReleaseEmails (status);
    CREATE INDEX IF NOT EXISTS idx_release_emails_product ON ReleaseEmails (product);
    CREATE INDEX IF NOT EXISTS idx_release_emails_created_at ON ReleaseEmails (createdAt);

    -- Publisher Intelligence Pipeline

    CREATE TABLE IF NOT EXISTS AdNetworks (
      id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
      slug TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL,
      sellers_json_url TEXT NOT NULL,
      last_fetched_at TEXT,
      publisher_count INTEGER DEFAULT 0,
      createdAt TEXT,
      updatedAt TEXT
    );
    CREATE INDEX IF NOT EXISTS idx_ad_networks_slug ON AdNetworks (slug);

    CREATE TABLE IF NOT EXISTS Contacts (
      id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
      name TEXT,
      email TEXT NOT NULL UNIQUE,
      source TEXT,
      site_count INTEGER DEFAULT 0,
      create_studio_user_id INTEGER,
      createdAt TEXT,
      updatedAt TEXT
    );
    CREATE INDEX IF NOT EXISTS idx_contacts_email ON Contacts (email);
    CREATE INDEX IF NOT EXISTS idx_contacts_create_studio_user_id ON Contacts (create_studio_user_id);

    CREATE TABLE IF NOT EXISTS Publishers (
      id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
      domain TEXT NOT NULL UNIQUE,
      site_name TEXT,
      ad_networks TEXT DEFAULT '[]',
      is_wordpress INTEGER DEFAULT 0,
      rest_api_available INTEGER DEFAULT 0,
      site_category TEXT,
      post_count INTEGER,
      oldest_post_date TEXT,
      newest_post_date TEXT,
      top_content TEXT,
      social_links TEXT,
      scrape_status TEXT NOT NULL DEFAULT 'pending',
      scrape_error TEXT,
      last_scraped_at TEXT,
      contact_id INTEGER REFERENCES Contacts(id),
      create_studio_site_id INTEGER,
      createdAt TEXT,
      updatedAt TEXT
    );
    CREATE INDEX IF NOT EXISTS idx_publishers_domain ON Publishers (domain);
    CREATE INDEX IF NOT EXISTS idx_publishers_scrape_status ON Publishers (scrape_status);
    CREATE INDEX IF NOT EXISTS idx_publishers_site_category ON Publishers (site_category);
    CREATE INDEX IF NOT EXISTS idx_publishers_contact_id ON Publishers (contact_id);
    CREATE INDEX IF NOT EXISTS idx_publishers_is_wordpress ON Publishers (is_wordpress);
    CREATE INDEX IF NOT EXISTS idx_publishers_create_studio_site_id ON Publishers (create_studio_site_id);

    CREATE TABLE IF NOT EXISTS Plugins (
      id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
      namespace TEXT NOT NULL UNIQUE,
      name TEXT,
      category TEXT,
      is_paid INTEGER DEFAULT 0,
      is_competitor INTEGER DEFAULT 0,
      replaceable_by_create INTEGER DEFAULT 0,
      wp_slug TEXT,
      wp_url TEXT,
      homepage_url TEXT,
      description TEXT,
      active_installs INTEGER,
      rating INTEGER,
      enriched_at TEXT,
      createdAt TEXT,
      updatedAt TEXT
    );
    CREATE INDEX IF NOT EXISTS idx_plugins_namespace ON Plugins (namespace);
    CREATE INDEX IF NOT EXISTS idx_plugins_category ON Plugins (category);
    CREATE INDEX IF NOT EXISTS idx_plugins_wp_slug ON Plugins (wp_slug);
    CREATE INDEX IF NOT EXISTS idx_plugins_is_competitor ON Plugins (is_competitor);

    CREATE TABLE IF NOT EXISTS PublisherPlugins (
      publisher_id INTEGER NOT NULL REFERENCES Publishers(id) ON DELETE CASCADE,
      plugin_id INTEGER NOT NULL REFERENCES Plugins(id) ON DELETE CASCADE,
      discovered_at TEXT,
      PRIMARY KEY (publisher_id, plugin_id)
    );
    CREATE INDEX IF NOT EXISTS idx_publisher_plugins_plugin_id ON PublisherPlugins (plugin_id);

    CREATE TABLE IF NOT EXISTS ScrapeJobs (
      id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
      type TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'queued',
      total_count INTEGER DEFAULT 0,
      completed_count INTEGER DEFAULT 0,
      failed_count INTEGER DEFAULT 0,
      started_at TEXT,
      completed_at TEXT,
      error_log TEXT,
      started_by INTEGER,
      createdAt TEXT,
      updatedAt TEXT
    );
    CREATE INDEX IF NOT EXISTS idx_scrape_jobs_type ON ScrapeJobs (type);
    CREATE INDEX IF NOT EXISTS idx_scrape_jobs_status ON ScrapeJobs (status);
    CREATE INDEX IF NOT EXISTS idx_scrape_jobs_started_by ON ScrapeJobs (started_by);
    CREATE INDEX IF NOT EXISTS idx_scrape_jobs_created_at ON ScrapeJobs (createdAt);

    -- CRM Layer

    CREATE TABLE IF NOT EXISTS Outreach (
      id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
      contact_type TEXT NOT NULL,
      publisher_id INTEGER REFERENCES Publishers(id),
      user_id INTEGER,
      segment TEXT,
      status TEXT NOT NULL DEFAULT 'queued',
      stage TEXT NOT NULL DEFAULT 'queued',
      rating INTEGER,
      notes TEXT,
      last_contacted_at TEXT,
      createdAt TEXT,
      updatedAt TEXT
    );
    CREATE INDEX IF NOT EXISTS idx_outreach_contact_type ON Outreach (contact_type);
    CREATE INDEX IF NOT EXISTS idx_outreach_publisher_id ON Outreach (publisher_id);
    CREATE INDEX IF NOT EXISTS idx_outreach_user_id ON Outreach (user_id);
    CREATE INDEX IF NOT EXISTS idx_outreach_status ON Outreach (status);
    CREATE INDEX IF NOT EXISTS idx_outreach_stage ON Outreach (stage);
    CREATE INDEX IF NOT EXISTS idx_outreach_created_at ON Outreach (createdAt);

    CREATE TABLE IF NOT EXISTS OutreachEmails (
      id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
      outreach_id INTEGER NOT NULL REFERENCES Outreach(id) ON DELETE CASCADE,
      direction TEXT NOT NULL,
      subject TEXT,
      template_variant TEXT,
      summary TEXT,
      sent_at TEXT
    );
    CREATE INDEX IF NOT EXISTS idx_outreach_emails_outreach_id ON OutreachEmails (outreach_id);
    CREATE INDEX IF NOT EXISTS idx_outreach_emails_sent_at ON OutreachEmails (sent_at);
  `)

  // Seed admin user if none exists
  const adminCount = sqlite.prepare('SELECT COUNT(*) as count FROM Admins').get() as { count: number }
  if (adminCount.count === 0) {
    sqlite.exec(`
      INSERT INTO Admins (email, password, firstname, lastname, role, createdAt) VALUES
        ('jmlallier1291@gmail.com', '$2b$10$9z.9.hYh9lma7Ers6NeuQ.PuRSwYTctjLjQ.fqlVuMnX9AZcyUpNW', 'JM', 'Lallier', 'super_admin', datetime('now'));
    `)
  }

  // Seed reference data if tables are empty
  const networkCount = sqlite.prepare('SELECT COUNT(*) as count FROM AdNetworks').get() as { count: number }
  if (networkCount.count === 0) {
    sqlite.exec(`
      INSERT INTO AdNetworks (slug, name, sellers_json_url, createdAt) VALUES
        ('raptive', 'Raptive', 'https://ads.cafemedia.com/sellers.json', datetime('now')),
        ('mediavine', 'Mediavine', 'https://mediavine.com/sellers.json', datetime('now')),
        ('shemedia', 'SHE Media', 'https://ads.shemedia.com/sellers.json', datetime('now')),
        ('journey', 'Journey', 'https://sellers.journeymv.com/sellers.json', datetime('now')),
        ('pubnation', 'PubNation', 'https://sellers.pubnation.com/sellers.json', datetime('now')),
        ('monumetric', 'Monumetric', 'https://monumetric.com/sellers.json', datetime('now'));

      INSERT INTO Plugins (namespace, name, category, is_paid, is_competitor, replaceable_by_create, createdAt) VALUES
        ('wp-recipe-maker', 'WP Recipe Maker', 'recipe', 1, 1, 1, datetime('now')),
        ('flavor', 'Flavor', 'recipe', 0, 1, 1, datetime('now')),
        ('tasty-recipes', 'Tasty Recipes', 'recipe', 1, 1, 1, datetime('now')),
        ('jeherve-flavors-flavor', 'Flavor (Jeherve)', 'recipe', 0, 1, 1, datetime('now')),
        ('mv-create', 'Create', 'recipe', 0, 0, 0, datetime('now')),
        ('zip-recipes', 'Zip Recipes', 'recipe', 1, 1, 1, datetime('now')),
        ('easy-recipe', 'Easy Recipe', 'recipe', 0, 1, 1, datetime('now')),
        ('yoast', 'Yoast SEO', 'seo', 0, 0, 0, datetime('now')),
        ('rankmath', 'Rank Math', 'seo', 1, 0, 0, datetime('now')),
        ('aioseo', 'All in One SEO', 'seo', 1, 0, 0, datetime('now')),
        ('mediavine-control-panel', 'Mediavine Control Panel', 'ads', 0, 0, 0, datetime('now')),
        ('wpforms', 'WPForms', 'forms', 1, 0, 0, datetime('now')),
        ('woocommerce', 'WooCommerce', 'ecommerce', 1, 0, 0, datetime('now'));
    `)
  }
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
  const { adminDb } = useAdminEnv(event)

  // In local development, use a dedicated SQLite file for admin ops
  // (DB_ADMIN D1 binding is only available in production Cloudflare Workers)
  if (import.meta.dev) {
    return getLocalAdminOpsDb() as unknown as DrizzleDb
  }

  // In production, use the DB_ADMIN binding
  if (!adminDb) {
    throw new Error(
      'Admin operations database (DB_ADMIN) is not configured. ' +
      'Please ensure the DB_ADMIN binding is set in your Cloudflare Workers configuration.'
    )
  }

  // Create a Drizzle instance from the D1 binding with admin schema
  return drizzleD1(adminDb, { schema: adminSchema }) as unknown as DrizzleDb
}
