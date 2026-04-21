/**
 * Drizzle ORM Schema for Create Studio
 * Defines all database tables for NuxtHub v0.10+
 */

import { sqliteTable, text, integer, real, primaryKey, index, uniqueIndex } from 'drizzle-orm/sqlite-core'

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
  metadata: text('metadata', { mode: 'json' }).$type<Record<string, any>>(),
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
  pending_verification_code: text('pending_verification_code'),
  last_active_at: text('last_active_at'),
  createdAt: text('createdAt'),
  updatedAt: text('updatedAt'),
}, (table) => [
  index('idx_sites_user_id').on(table.user_id),
  index('idx_sites_url').on(table.url),
  index('idx_sites_canonical').on(table.canonical_site_id),
  index('idx_sites_last_active').on(table.last_active_at),
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
  tier: text('tier').notNull().default('free'), // free, free-plus, pro
  current_period_start: text('current_period_start'),
  current_period_end: text('current_period_end'),
  cancel_at_period_end: integer('cancel_at_period_end', { mode: 'boolean' }).default(false),
  has_trialed: integer('has_trialed', { mode: 'boolean' }).default(false),
  trial_end: text('trial_end'),
  metadata: text('metadata', { mode: 'json' }).$type<Record<string, any>>(),
  trial_extensions: text('trial_extensions', { mode: 'json' }).$type<Record<string, string>>(),
  createdAt: text('createdAt'),
  updatedAt: text('updatedAt'),
}, (table) => [
  index('idx_subscriptions_site_id').on(table.site_id),
  index('idx_subscriptions_stripe_subscription_id').on(table.stripe_subscription_id),
  index('idx_subscriptions_stripe_customer_id').on(table.stripe_customer_id),
  index('idx_subscriptions_status').on(table.status),
])

// LinkSessions table (for user verification redirect flow)
export const linkSessions = sqliteTable('LinkSessions', {
  id: text('id').primaryKey(), // UUID
  site_id: integer('site_id').notNull().references(() => sites.id, { onDelete: 'cascade' }),
  user_id: integer('user_id').references(() => users.id, { onDelete: 'cascade' }),
  user_token: text('user_token'),
  return_url: text('return_url').notNull(),
  created_at: text('created_at').notNull(),
  expires_at: text('expires_at').notNull(),
}, (table) => [
  index('idx_link_sessions_site_id').on(table.site_id),
  index('idx_link_sessions_expires_at').on(table.expires_at),
])

// Broadcasts table (admin-managed announcements delivered to plugin instances)
export const broadcasts = sqliteTable('Broadcasts', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  title: text('title').notNull(),
  body: text('body').notNull(),
  type: text('type').notNull().default('announcement'), // announcement, feature, promotion, beta
  status: text('status').notNull().default('draft'), // draft, published, archived
  priority: integer('priority').notNull().default(0),
  url: text('url'),
  path: text('path'),
  cta_text: text('cta_text'),
  target_tiers: text('target_tiers', { mode: 'json' }).$type<string[]>().default(['all']),
  target_create_version_min: text('target_create_version_min'),
  target_create_version_max: text('target_create_version_max'),
  targeting: text('targeting', { mode: 'json' }).$type<Record<string, any>>(),
  published_at: text('published_at'),
  expires_at: text('expires_at'),
  createdAt: text('createdAt'),
  updatedAt: text('updatedAt'),
}, (table) => [
  index('idx_broadcasts_status').on(table.status),
  index('idx_broadcasts_type').on(table.type),
  index('idx_broadcasts_published_at').on(table.published_at),
  index('idx_broadcasts_expires_at').on(table.expires_at),
  index('idx_broadcasts_priority').on(table.priority),
])

// FeedbackReports table (error reports submitted from plugin admin UI)
export const feedbackReports = sqliteTable('FeedbackReports', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  site_id: integer('site_id').notNull().references(() => sites.id, { onDelete: 'cascade' }),
  error_message: text('error_message').notNull(),
  stack_trace: text('stack_trace'),
  component_stack: text('component_stack'),
  create_version: text('create_version'),
  wp_version: text('wp_version'),
  php_version: text('php_version'),
  browser_info: text('browser_info', { mode: 'json' }).$type<{ userAgent: string; platform: string; language: string }>(),
  current_url: text('current_url'),
  user_message: text('user_message'),
  user_email: text('user_email'),
  screenshot_base64: text('screenshot_base64'),
  status: text('status').notNull().default('new'), // new, acknowledged, resolved
  admin_notes: text('admin_notes'),
  createdAt: text('createdAt'),
  updatedAt: text('updatedAt'),
}, (table) => [
  index('idx_feedback_site_id').on(table.site_id),
  index('idx_feedback_status').on(table.status),
  index('idx_feedback_created_at').on(table.createdAt),
])

// SiteSettings JSON type (extensible site settings)
export interface SiteSettings {
  interactive_mode_enabled?: boolean
  interactive_mode_button_text?: string | null
  interactive_mode_cta_variant?: 'button' | 'inline-banner' | 'sticky-bar' | 'tooltip'
  interactive_mode_cta_title?: string | null
  interactive_mode_cta_subtitle?: string | null
}

// VersionLogEntry JSON type (plugin version update history)
export interface VersionLogEntry {
  from: string
  to: string
  at: string // ISO 8601 timestamp
}

// SiteMeta table (flexible per-site settings and metadata)
export const siteMeta = sqliteTable('SiteMeta', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  site_id: integer('site_id').notNull().unique().references(() => sites.id, { onDelete: 'cascade' }),
  settings: text('settings', { mode: 'json' }).$type<SiteSettings>().default({}),
  version_logs: text('version_logs', { mode: 'json' }).$type<VersionLogEntry[]>().default([]),
  createdAt: text('createdAt'),
  updatedAt: text('updatedAt'),
}, (table) => [
  index('idx_site_meta_site_id').on(table.site_id),
])

// USDA reference data for ingredient-specific unit conversion
export const usdaFoods = sqliteTable('usda_foods', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  fdc_id: integer('fdc_id').notNull(),
  name: text('name').notNull(),
  category: text('category'),
  is_liquid: integer('is_liquid', { mode: 'boolean' }).default(false),
  cup_grams: real('cup_grams'),
  tbsp_grams: real('tbsp_grams'),
  tsp_grams: real('tsp_grams'),
  created_at: text('created_at'),
}, (table) => [
  uniqueIndex('idx_usda_foods_name').on(table.name),
  index('idx_usda_foods_fdc_id').on(table.fdc_id),
])

export const usdaAliases = sqliteTable('usda_aliases', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  alias: text('alias').notNull(),
  usda_food_id: integer('usda_food_id').notNull().references(() => usdaFoods.id, { onDelete: 'cascade' }),
}, (table) => [
  uniqueIndex('idx_usda_aliases_alias').on(table.alias),
])

// Surveys table (survey definitions with SurveyJS JSON)
export const surveys = sqliteTable('Surveys', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  slug: text('slug').notNull().unique(),
  title: text('title').notNull(),
  description: text('description'),
  definition: text('definition', { mode: 'json' }).$type<Record<string, any>>(),
  status: text('status').notNull().default('draft'), // draft, active, closed
  promotion: text('promotion', { mode: 'json' }).$type<Record<string, any>>(),
  requires_auth: integer('requires_auth', { mode: 'boolean' }).default(false),
  max_completions: integer('max_completions'),
  createdAt: text('createdAt'),
  updatedAt: text('updatedAt'),
}, (table) => [
  index('idx_surveys_slug').on(table.slug),
  index('idx_surveys_status').on(table.status),
])

// SurveyResponses table (individual submissions)
export const surveyResponses = sqliteTable('SurveyResponses', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  survey_id: integer('survey_id').notNull().references(() => surveys.id, { onDelete: 'cascade' }),
  user_id: integer('user_id').references(() => users.id, { onDelete: 'set null' }),
  site_id: integer('site_id').references(() => sites.id, { onDelete: 'set null' }),
  respondent_email: text('respondent_email'),
  response_data: text('response_data', { mode: 'json' }).$type<Record<string, any>>(),
  completed: integer('completed', { mode: 'boolean' }).default(false),
  draft_token: text('draft_token'),
  createdAt: text('createdAt'),
}, (table) => [
  index('idx_survey_responses_survey_id').on(table.survey_id),
  index('idx_survey_responses_user_id').on(table.user_id),
  index('idx_survey_responses_site_id').on(table.site_id),
  index('idx_survey_responses_completed').on(table.completed),
  index('idx_survey_responses_draft_token').on(table.draft_token),
])

// MessageQueue — generic background message/dead-letter queue
// Used for webhooks to WP sites, trial-expiry notifications, and any future
// async work that should survive individual request failures.
export const messageQueue = sqliteTable('MessageQueue', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  type: text('type').notNull(), // e.g. 'wordpress_webhook'
  payload: text('payload', { mode: 'json' }).$type<Record<string, any>>().notNull(),
  status: text('status').notNull().default('pending'), // pending, processing, failed, dead, completed
  attempts: integer('attempts').notNull().default(0),
  max_attempts: integer('max_attempts').notNull().default(8),
  next_attempt_at: text('next_attempt_at').notNull(), // ISO8601 — worker picks rows where this <= now()
  last_error: text('last_error'),
  site_id: integer('site_id').references(() => sites.id, { onDelete: 'cascade' }),
  created_at: text('created_at').notNull(),
  updated_at: text('updated_at').notNull(),
}, (table) => [
  index('idx_message_queue_status_next_attempt').on(table.status, table.next_attempt_at),
  index('idx_message_queue_type').on(table.type),
  index('idx_message_queue_site_id').on(table.site_id),
])

// Note: Admins and AuditLogs tables are defined in the admin package's own database

// Type exports for use in application code
export type User = typeof users.$inferSelect
export type NewUser = typeof users.$inferInsert
export type Site = typeof sites.$inferSelect
export type NewSite = typeof sites.$inferInsert
export type SiteUser = typeof siteUsers.$inferSelect
export type NewSiteUser = typeof siteUsers.$inferInsert
export type Subscription = typeof subscriptions.$inferSelect
export type NewSubscription = typeof subscriptions.$inferInsert
export type LinkSession = typeof linkSessions.$inferSelect
export type NewLinkSession = typeof linkSessions.$inferInsert
export type Broadcast = typeof broadcasts.$inferSelect
export type NewBroadcast = typeof broadcasts.$inferInsert
export type FeedbackReport = typeof feedbackReports.$inferSelect
export type NewFeedbackReport = typeof feedbackReports.$inferInsert
export type SiteMeta = typeof siteMeta.$inferSelect
export type NewSiteMeta = typeof siteMeta.$inferInsert
export type UsdaFood = typeof usdaFoods.$inferSelect
export type UsdaAlias = typeof usdaAliases.$inferSelect
export type Survey = typeof surveys.$inferSelect
export type NewSurvey = typeof surveys.$inferInsert
export type SurveyResponse = typeof surveyResponses.$inferSelect
export type NewSurveyResponse = typeof surveyResponses.$inferInsert
export type MessageQueueRow = typeof messageQueue.$inferSelect
export type NewMessageQueueRow = typeof messageQueue.$inferInsert
