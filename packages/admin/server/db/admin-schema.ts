/**
 * Drizzle ORM Schema for Admin Operations Database
 * Defines tables for admin authentication and audit logging
 */

import { sqliteTable, text, integer, index } from 'drizzle-orm/sqlite-core'

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

// Type exports for use in application code
export type Admin = typeof admins.$inferSelect
export type NewAdmin = typeof admins.$inferInsert
export type AuditLog = typeof auditLogs.$inferSelect
export type NewAuditLog = typeof auditLogs.$inferInsert
export type ReleaseEmail = typeof releaseEmails.$inferSelect
export type NewReleaseEmail = typeof releaseEmails.$inferInsert
