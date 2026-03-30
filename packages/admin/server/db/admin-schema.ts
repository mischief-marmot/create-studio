/**
 * Drizzle ORM Schema for Admin Operations Database
 * Defines tables for admin authentication and audit logging
 */

import { sqliteTable, text, integer, index, primaryKey } from 'drizzle-orm/sqlite-core'

/**
 * Environment type for tracking where actions were performed
 */
export type Environment = 'production' | 'preview' | 'local'

// Admins table (separate from regular users for admin portal)
export const admins = sqliteTable('Admins', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  email: text('email').notNull().unique(),
  password: text('password').notNull(),
  firstname: text('firstname'),
  lastname: text('lastname'),
  role: text('role').notNull().default('admin'), // super_admin, admin
  last_login: text('last_login'),
  createdAt: text('createdAt'),
  updatedAt: text('updatedAt'),
}, (table) => [
  index('idx_admins_email').on(table.email),
  index('idx_admins_role').on(table.role),
])

// Audit logs table for tracking admin actions
export const auditLogs = sqliteTable('AuditLogs', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  admin_id: integer('admin_id').notNull().references(() => admins.id),
  action: text('action').notNull(), // create, update, delete, login, logout, password_reset, etc.
  entity_type: text('entity_type'), // user, subscription, site, admin, etc.
  entity_id: integer('entity_id'),
  changes: text('changes'), // JSON string of before/after values
  ip_address: text('ip_address'),
  user_agent: text('user_agent'),
  environment: text('environment').notNull().default('local'), // production, preview, local
  createdAt: text('createdAt'),
}, (table) => [
  index('idx_audit_logs_admin_id').on(table.admin_id),
  index('idx_audit_logs_action').on(table.action),
  index('idx_audit_logs_entity_type').on(table.entity_type),
  index('idx_audit_logs_created_at').on(table.createdAt),
  index('idx_audit_logs_environment').on(table.environment),
])

// Release emails — saved compositions that can be drafted and sent
export const releaseEmails = sqliteTable('ReleaseEmails', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  product: text('product').notNull(), // create-plugin, create-studio
  version: text('version').notNull(),
  title: text('title').notNull(),
  description: text('description').notNull(),
  heroImageUrl: text('hero_image_url'),
  releaseUrl: text('release_url'),
  highlights: text('highlights'), // JSON array
  status: text('status').notNull().default('draft'), // draft, sent
  sentAt: text('sent_at'),
  sentBy: integer('sent_by').references(() => admins.id),
  createdAt: text('createdAt'),
  updatedAt: text('updatedAt'),
}, (table) => [
  index('idx_release_emails_status').on(table.status),
  index('idx_release_emails_product').on(table.product),
  index('idx_release_emails_created_at').on(table.createdAt),
])

// ============================================================
// Publisher Intelligence Pipeline
// ============================================================

// --- Pipeline Types ---

export interface TopContentEntry {
  title: string
  comments: number
}

export interface SocialLinks {
  instagram?: string
  pinterest?: string
  youtube?: string
  facebook?: string
  twitter?: string
  tiktok?: string
}

export interface ScrapeJobError {
  domain?: string
  error: string
  timestamp: string
}

// Ad networks — reference table for sellers.json sources
export const adNetworks = sqliteTable('AdNetworks', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  slug: text('slug').notNull().unique(), // raptive, mediavine, shemedia, journey, pubnation, monumetric
  name: text('name').notNull(),
  sellersJsonUrl: text('sellers_json_url').notNull(),
  lastFetchedAt: text('last_fetched_at'),
  publisherCount: integer('publisher_count').default(0),
  createdAt: text('createdAt'),
  updatedAt: text('updatedAt'),
}, (table) => [
  index('idx_ad_networks_slug').on(table.slug),
])

// Contacts — deduplicated people, one person can own multiple publisher sites
export const contacts = sqliteTable('Contacts', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name'),
  email: text('email').notNull().unique(), // dedup key
  source: text('source'), // contact_page, about_page, feed, json_ld, manual
  siteCount: integer('site_count').default(0), // denormalized count of linked publishers
  createStudioUserId: integer('create_studio_user_id'), // cross-DB ref to main app Users (no FK constraint)
  createdAt: text('createdAt'),
  updatedAt: text('updatedAt'),
}, (table) => [
  index('idx_contacts_email').on(table.email),
  index('idx_contacts_create_studio_user_id').on(table.createStudioUserId),
])

// Publishers — one row per domain discovered from sellers.json
export const publishers = sqliteTable('Publishers', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  domain: text('domain').notNull().unique(),
  siteName: text('site_name'),
  adNetworks: text('ad_networks', { mode: 'json' }).$type<string[]>().default([]),
  isWordpress: integer('is_wordpress', { mode: 'boolean' }).default(false),
  restApiAvailable: integer('rest_api_available', { mode: 'boolean' }).default(false),
  siteCategory: text('site_category'), // food, diy, lifestyle, etc.
  postCount: integer('post_count'),
  oldestPostDate: text('oldest_post_date'),
  newestPostDate: text('newest_post_date'),
  topContent: text('top_content', { mode: 'json' }).$type<TopContentEntry[]>(),
  socialLinks: text('social_links', { mode: 'json' }).$type<SocialLinks>(),
  scrapeStatus: text('scrape_status').notNull().default('pending'), // pending, plugins_scraped, enriched, contacts_scraped, complete, failed
  scrapeError: text('scrape_error'),
  lastScrapedAt: text('last_scraped_at'),
  contactId: integer('contact_id').references(() => contacts.id),
  createStudioSiteId: integer('create_studio_site_id'), // cross-DB ref to main app Sites (no FK constraint)
  createdAt: text('createdAt'),
  updatedAt: text('updatedAt'),
}, (table) => [
  index('idx_publishers_domain').on(table.domain),
  index('idx_publishers_scrape_status').on(table.scrapeStatus),
  index('idx_publishers_site_category').on(table.siteCategory),
  index('idx_publishers_contact_id').on(table.contactId),
  index('idx_publishers_is_wordpress').on(table.isWordpress),
  index('idx_publishers_create_studio_site_id').on(table.createStudioSiteId),
])

// Plugins — known WordPress plugins identified by REST API namespace
export const plugins = sqliteTable('Plugins', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  namespace: text('namespace').notNull().unique(), // e.g. "wp-recipe-maker", "yoast/v1"
  name: text('name'), // human-readable, may be null initially when auto-discovered
  category: text('category'), // recipe, seo, forms, ecommerce, etc.
  isPaid: integer('is_paid', { mode: 'boolean' }).default(false),
  isCompetitor: integer('is_competitor', { mode: 'boolean' }).default(false),
  replaceableByCreate: integer('replaceable_by_create', { mode: 'boolean' }).default(false),
  createdAt: text('createdAt'),
  updatedAt: text('updatedAt'),
}, (table) => [
  index('idx_plugins_namespace').on(table.namespace),
  index('idx_plugins_category').on(table.category),
  index('idx_plugins_is_competitor').on(table.isCompetitor),
])

// PublisherPlugins — junction: which publishers have which plugins installed
export const publisherPlugins = sqliteTable('PublisherPlugins', {
  publisherId: integer('publisher_id').notNull().references(() => publishers.id, { onDelete: 'cascade' }),
  pluginId: integer('plugin_id').notNull().references(() => plugins.id, { onDelete: 'cascade' }),
  discoveredAt: text('discovered_at'),
}, (table) => [
  primaryKey({ columns: [table.publisherId, table.pluginId] }),
  index('idx_publisher_plugins_plugin_id').on(table.pluginId),
])

// ScrapeJobs — pipeline orchestration, tracks batch scraping runs
export const scrapeJobs = sqliteTable('ScrapeJobs', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  type: text('type').notNull(), // sellers_json, plugin_probe, enrichment, contact_scrape
  status: text('status').notNull().default('queued'), // queued, running, completed, failed
  totalCount: integer('total_count').default(0),
  completedCount: integer('completed_count').default(0),
  failedCount: integer('failed_count').default(0),
  startedAt: text('started_at'),
  completedAt: text('completed_at'),
  errorLog: text('error_log', { mode: 'json' }).$type<ScrapeJobError[]>(),
  startedBy: integer('started_by').references(() => admins.id),
  createdAt: text('createdAt'),
  updatedAt: text('updatedAt'),
}, (table) => [
  index('idx_scrape_jobs_type').on(table.type),
  index('idx_scrape_jobs_status').on(table.status),
  index('idx_scrape_jobs_started_by').on(table.startedBy),
  index('idx_scrape_jobs_created_at').on(table.createdAt),
])

// ============================================================
// CRM Layer — Outreach tracking
// ============================================================

// Outreach — tracks contact activity for both cold leads (publishers) and existing Create users
// Has either publisher_id (cold lead) or user_id (existing user), never both.
// contact_type determines which FK is active.
export const outreach = sqliteTable('Outreach', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  contactType: text('contact_type').notNull(), // lead, user
  publisherId: integer('publisher_id').references(() => publishers.id), // for cold leads
  userId: integer('user_id'), // cross-DB ref to main app Users (no FK constraint), for existing users
  segment: text('segment'), // stored for leads (e.g. "wprm"), derived at query time for users
  status: text('status').notNull().default('queued'), // queued, contacted, responded, engaged
  stage: text('stage').notNull().default('queued'), // queued → contacted → responded → engaged
  rating: integer('rating'), // 1-5
  notes: text('notes'),
  lastContactedAt: text('last_contacted_at'),
  createdAt: text('createdAt'),
  updatedAt: text('updatedAt'),
}, (table) => [
  index('idx_outreach_contact_type').on(table.contactType),
  index('idx_outreach_publisher_id').on(table.publisherId),
  index('idx_outreach_user_id').on(table.userId),
  index('idx_outreach_status').on(table.status),
  index('idx_outreach_stage').on(table.stage),
  index('idx_outreach_created_at').on(table.createdAt),
])

// OutreachEmails — full email history per outreach contact
export const outreachEmails = sqliteTable('OutreachEmails', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  outreachId: integer('outreach_id').notNull().references(() => outreach.id, { onDelete: 'cascade' }),
  direction: text('direction').notNull(), // sent, received
  subject: text('subject'),
  templateVariant: text('template_variant'), // e.g. "legacy-a", "wprm-friendly"
  summary: text('summary'),
  sentAt: text('sent_at'),
}, (table) => [
  index('idx_outreach_emails_outreach_id').on(table.outreachId),
  index('idx_outreach_emails_sent_at').on(table.sentAt),
])

// Type exports for use in application code
export type Admin = typeof admins.$inferSelect
export type NewAdmin = typeof admins.$inferInsert
export type AuditLog = typeof auditLogs.$inferSelect
export type NewAuditLog = typeof auditLogs.$inferInsert
export type ReleaseEmail = typeof releaseEmails.$inferSelect
export type NewReleaseEmail = typeof releaseEmails.$inferInsert
export type AdNetwork = typeof adNetworks.$inferSelect
export type NewAdNetwork = typeof adNetworks.$inferInsert
export type Contact = typeof contacts.$inferSelect
export type NewContact = typeof contacts.$inferInsert
export type Publisher = typeof publishers.$inferSelect
export type NewPublisher = typeof publishers.$inferInsert
export type Plugin = typeof plugins.$inferSelect
export type NewPlugin = typeof plugins.$inferInsert
export type PublisherPlugin = typeof publisherPlugins.$inferSelect
export type NewPublisherPlugin = typeof publisherPlugins.$inferInsert
export type ScrapeJob = typeof scrapeJobs.$inferSelect
export type NewScrapeJob = typeof scrapeJobs.$inferInsert
export type Outreach = typeof outreach.$inferSelect
export type NewOutreach = typeof outreach.$inferInsert
export type OutreachEmail = typeof outreachEmails.$inferSelect
export type NewOutreachEmail = typeof outreachEmails.$inferInsert
