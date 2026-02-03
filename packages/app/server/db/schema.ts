/**
 * Drizzle ORM Schema for Create Studio
 * Defines all database tables for NuxtHub v0.10+
 */

import { sqliteTable, text, integer, primaryKey, index } from 'drizzle-orm/sqlite-core'

// Users table
export const users = sqliteTable('Users', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  email: text('email').notNull().unique(),
  password: text('password'),
  password_reset_token: text('password_reset_token'),
  password_reset_expires: text('password_reset_expires'),
  firstname: text('firstname'),
  lastname: text('lastname'),
  avatar: text('avatar'),
  mediavine_publisher: integer('mediavine_publisher', { mode: 'boolean' }).default(false),
  validEmail: integer('validEmail', { mode: 'boolean' }).default(false),
  marketing_opt_in: integer('marketing_opt_in', { mode: 'boolean' }).default(false),
  consent_tos_accepted_at: text('consent_tos_accepted_at'),
  consent_privacy_accepted_at: text('consent_privacy_accepted_at'),
  consent_cookies_accepted_at: text('consent_cookies_accepted_at'),
  createdAt: text('createdAt'),
  updatedAt: text('updatedAt'),
}, (table) => [
  index('idx_users_email').on(table.email),
  index('idx_users_valid_email').on(table.validEmail),
  index('idx_users_password_reset_token').on(table.password_reset_token),
])

// Sites table
export const sites = sqliteTable('Sites', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name'),
  url: text('url'),
  user_id: integer('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  canonical_site_id: integer('canonical_site_id').references(() => sites.id),
  create_version: text('create_version'),
  wp_version: text('wp_version'),
  php_version: text('php_version'),
  interactive_mode_enabled: integer('interactive_mode_enabled', { mode: 'boolean' }).default(true),
  interactive_mode_button_text: text('interactive_mode_button_text'),
  createdAt: text('createdAt'),
  updatedAt: text('updatedAt'),
}, (table) => [
  index('idx_sites_user_id').on(table.user_id),
  index('idx_sites_url').on(table.url),
  index('idx_sites_canonical').on(table.canonical_site_id),
])

// SiteUsers pivot table (many-to-many between Users and canonical Sites)
export const siteUsers = sqliteTable('SiteUsers', {
  site_id: integer('site_id').notNull().references(() => sites.id, { onDelete: 'cascade' }),
  user_id: integer('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  role: text('role').notNull().default('admin'), // owner, admin, editor
  verified_at: text('verified_at'),
  joined_at: text('joined_at'),
  verification_code: text('verification_code'), // Pending verification code from WordPress
  user_token: text('user_token'), // User-specific API token for WordPress plugin auth
}, (table) => [
  primaryKey({ columns: [table.site_id, table.user_id] }),
  index('idx_site_users_user_id').on(table.user_id),
  index('idx_site_users_verified_at').on(table.verified_at),
  index('idx_site_users_verification_code').on(table.verification_code),
  index('idx_site_users_user_token').on(table.user_token),
])

// Subscriptions table
export const subscriptions = sqliteTable('Subscriptions', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  site_id: integer('site_id').notNull().unique().references(() => sites.id, { onDelete: 'cascade' }),
  stripe_customer_id: text('stripe_customer_id'),
  stripe_subscription_id: text('stripe_subscription_id').unique(),
  status: text('status').notNull().default('free'), // free, active, canceled, past_due, trialing, unpaid
  tier: text('tier').notNull().default('free'), // free, pro
  current_period_start: text('current_period_start'),
  current_period_end: text('current_period_end'),
  cancel_at_period_end: integer('cancel_at_period_end', { mode: 'boolean' }).default(false),
  createdAt: text('createdAt'),
  updatedAt: text('updatedAt'),
}, (table) => [
  index('idx_subscriptions_site_id').on(table.site_id),
  index('idx_subscriptions_stripe_subscription_id').on(table.stripe_subscription_id),
  index('idx_subscriptions_stripe_customer_id').on(table.stripe_customer_id),
  index('idx_subscriptions_status').on(table.status),
])

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
  createdAt: text('createdAt'),
}, (table) => [
  index('idx_audit_logs_admin_id').on(table.admin_id),
  index('idx_audit_logs_action').on(table.action),
  index('idx_audit_logs_entity_type').on(table.entity_type),
  index('idx_audit_logs_created_at').on(table.createdAt),
])

// Type exports for use in application code
export type User = typeof users.$inferSelect
export type NewUser = typeof users.$inferInsert
export type Site = typeof sites.$inferSelect
export type NewSite = typeof sites.$inferInsert
export type SiteUser = typeof siteUsers.$inferSelect
export type NewSiteUser = typeof siteUsers.$inferInsert
export type Subscription = typeof subscriptions.$inferSelect
export type NewSubscription = typeof subscriptions.$inferInsert
export type Admin = typeof admins.$inferSelect
export type NewAdmin = typeof admins.$inferInsert
export type AuditLog = typeof auditLogs.$inferSelect
export type NewAuditLog = typeof auditLogs.$inferInsert
