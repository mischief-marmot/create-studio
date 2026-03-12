/**
 * Drizzle ORM Schema for Create Studio Analytics Database
 * Defines tables for event tracking, daily summaries, and real-time counters.
 */

import { sqliteTable, text, integer, real, index, uniqueIndex } from 'drizzle-orm/sqlite-core'

// Raw events table
export const events = sqliteTable('events', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  type: text('type').notNull(),
  body: text('body').notNull(), // JSON string
  domain: text('domain'),
  session_id: text('session_id'),
  sample_rate: real('sample_rate').notNull().default(1.0),
  created_at: integer('created_at').notNull(),
}, (table) => [
  index('idx_events_type_created').on(table.type, table.created_at),
  index('idx_events_domain_created').on(table.domain, table.created_at),
  index('idx_events_session').on(table.session_id),
])

// Pre-aggregated daily summaries
export const dailySummaries = sqliteTable('daily_summaries', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  date: text('date').notNull(),
  domain: text('domain'),
  site_id: integer('site_id'),
  metric: text('metric').notNull(),
  dimensions: text('dimensions'), // JSON string
  value: real('value').notNull(),
  sample_rate: real('sample_rate').notNull().default(1.0),
  created_at: integer('created_at').notNull(),
}, (table) => [
  uniqueIndex('idx_daily_summary_unique').on(table.date, table.domain, table.metric, table.dimensions),
  index('idx_daily_summary_date').on(table.date),
  index('idx_daily_summary_metric').on(table.metric, table.date),
  index('idx_daily_summary_site').on(table.site_id, table.date),
])

// Real-time counters
export const counters = sqliteTable('counters', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  key: text('key').notNull().unique(),
  value: integer('value').notNull().default(0),
  updated_at: integer('updated_at').notNull(),
}, (table) => [
  uniqueIndex('idx_counters_key').on(table.key),
])

// Type exports
export type Event = typeof events.$inferSelect
export type NewEvent = typeof events.$inferInsert
export type DailySummaryRow = typeof dailySummaries.$inferSelect
export type NewDailySummaryRow = typeof dailySummaries.$inferInsert
export type CounterRow = typeof counters.$inferSelect
export type NewCounterRow = typeof counters.$inferInsert
