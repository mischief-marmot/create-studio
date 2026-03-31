-- Migration: Add Publisher Intelligence Pipeline + CRM tables
-- Supports sellers.json scraping, plugin discovery, contact enrichment, and outreach tracking

CREATE TABLE `AdNetworks` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`slug` text NOT NULL,
	`name` text NOT NULL,
	`sellers_json_url` text NOT NULL,
	`last_fetched_at` text,
	`publisher_count` integer DEFAULT 0,
	`createdAt` text,
	`updatedAt` text
);
--> statement-breakpoint
CREATE UNIQUE INDEX `AdNetworks_slug_unique` ON `AdNetworks` (`slug`);
--> statement-breakpoint
CREATE INDEX `idx_ad_networks_slug` ON `AdNetworks` (`slug`);
--> statement-breakpoint
CREATE TABLE `Contacts` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text,
	`email` text NOT NULL,
	`source` text,
	`site_count` integer DEFAULT 0,
	`create_studio_user_id` integer,
	`createdAt` text,
	`updatedAt` text
);
--> statement-breakpoint
CREATE UNIQUE INDEX `Contacts_email_unique` ON `Contacts` (`email`);
--> statement-breakpoint
CREATE INDEX `idx_contacts_email` ON `Contacts` (`email`);
--> statement-breakpoint
CREATE INDEX `idx_contacts_create_studio_user_id` ON `Contacts` (`create_studio_user_id`);
--> statement-breakpoint
CREATE TABLE `Publishers` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`domain` text NOT NULL,
	`site_name` text,
	`ad_networks` text DEFAULT '[]',
	`is_wordpress` integer DEFAULT false,
	`rest_api_available` integer DEFAULT false,
	`site_category` text,
	`post_count` integer,
	`oldest_post_date` text,
	`newest_post_date` text,
	`top_content` text,
	`social_links` text,
	`scrape_status` text NOT NULL DEFAULT 'pending',
	`scrape_error` text,
	`last_scraped_at` text,
	`contact_id` integer REFERENCES `Contacts`(`id`),
	`create_studio_site_id` integer,
	`createdAt` text,
	`updatedAt` text
);
--> statement-breakpoint
CREATE UNIQUE INDEX `Publishers_domain_unique` ON `Publishers` (`domain`);
--> statement-breakpoint
CREATE INDEX `idx_publishers_domain` ON `Publishers` (`domain`);
--> statement-breakpoint
CREATE INDEX `idx_publishers_scrape_status` ON `Publishers` (`scrape_status`);
--> statement-breakpoint
CREATE INDEX `idx_publishers_site_category` ON `Publishers` (`site_category`);
--> statement-breakpoint
CREATE INDEX `idx_publishers_contact_id` ON `Publishers` (`contact_id`);
--> statement-breakpoint
CREATE INDEX `idx_publishers_is_wordpress` ON `Publishers` (`is_wordpress`);
--> statement-breakpoint
CREATE INDEX `idx_publishers_create_studio_site_id` ON `Publishers` (`create_studio_site_id`);
--> statement-breakpoint
CREATE TABLE `Plugins` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`namespace` text NOT NULL,
	`name` text,
	`category` text,
	`is_paid` integer DEFAULT false,
	`is_competitor` integer DEFAULT false,
	`replaceable_by_create` integer DEFAULT false,
	`createdAt` text,
	`updatedAt` text
);
--> statement-breakpoint
CREATE UNIQUE INDEX `Plugins_namespace_unique` ON `Plugins` (`namespace`);
--> statement-breakpoint
CREATE INDEX `idx_plugins_namespace` ON `Plugins` (`namespace`);
--> statement-breakpoint
CREATE INDEX `idx_plugins_category` ON `Plugins` (`category`);
--> statement-breakpoint
CREATE INDEX `idx_plugins_is_competitor` ON `Plugins` (`is_competitor`);
--> statement-breakpoint
CREATE TABLE `PublisherPlugins` (
	`publisher_id` integer NOT NULL REFERENCES `Publishers`(`id`) ON DELETE CASCADE,
	`plugin_id` integer NOT NULL REFERENCES `Plugins`(`id`) ON DELETE CASCADE,
	`discovered_at` text,
	PRIMARY KEY (`publisher_id`, `plugin_id`)
);
--> statement-breakpoint
CREATE INDEX `idx_publisher_plugins_plugin_id` ON `PublisherPlugins` (`plugin_id`);
--> statement-breakpoint
CREATE TABLE `ScrapeJobs` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`type` text NOT NULL,
	`status` text NOT NULL DEFAULT 'queued',
	`total_count` integer DEFAULT 0,
	`completed_count` integer DEFAULT 0,
	`failed_count` integer DEFAULT 0,
	`started_at` text,
	`completed_at` text,
	`error_log` text,
	`started_by` integer,
	`createdAt` text,
	`updatedAt` text
);
--> statement-breakpoint
CREATE INDEX `idx_scrape_jobs_type` ON `ScrapeJobs` (`type`);
--> statement-breakpoint
CREATE INDEX `idx_scrape_jobs_status` ON `ScrapeJobs` (`status`);
--> statement-breakpoint
CREATE INDEX `idx_scrape_jobs_started_by` ON `ScrapeJobs` (`started_by`);
--> statement-breakpoint
CREATE INDEX `idx_scrape_jobs_created_at` ON `ScrapeJobs` (`createdAt`);
--> statement-breakpoint
CREATE TABLE `Outreach` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`contact_type` text NOT NULL,
	`publisher_id` integer REFERENCES `Publishers`(`id`),
	`user_id` integer,
	`segment` text,
	`status` text NOT NULL DEFAULT 'queued',
	`stage` text NOT NULL DEFAULT 'queued',
	`rating` integer,
	`notes` text,
	`last_contacted_at` text,
	`createdAt` text,
	`updatedAt` text
);
--> statement-breakpoint
CREATE INDEX `idx_outreach_contact_type` ON `Outreach` (`contact_type`);
--> statement-breakpoint
CREATE INDEX `idx_outreach_publisher_id` ON `Outreach` (`publisher_id`);
--> statement-breakpoint
CREATE INDEX `idx_outreach_user_id` ON `Outreach` (`user_id`);
--> statement-breakpoint
CREATE INDEX `idx_outreach_status` ON `Outreach` (`status`);
--> statement-breakpoint
CREATE INDEX `idx_outreach_stage` ON `Outreach` (`stage`);
--> statement-breakpoint
CREATE INDEX `idx_outreach_created_at` ON `Outreach` (`createdAt`);
--> statement-breakpoint
CREATE TABLE `OutreachEmails` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`outreach_id` integer NOT NULL REFERENCES `Outreach`(`id`) ON DELETE CASCADE,
	`direction` text NOT NULL,
	`subject` text,
	`template_variant` text,
	`summary` text,
	`sent_at` text
);
--> statement-breakpoint
CREATE INDEX `idx_outreach_emails_outreach_id` ON `OutreachEmails` (`outreach_id`);
--> statement-breakpoint
CREATE INDEX `idx_outreach_emails_sent_at` ON `OutreachEmails` (`sent_at`);
