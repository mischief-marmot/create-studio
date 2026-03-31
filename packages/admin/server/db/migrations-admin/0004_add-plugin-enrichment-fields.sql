-- Add wordpress.org enrichment fields to Plugins table
ALTER TABLE `Plugins` ADD COLUMN `wp_slug` text;
--> statement-breakpoint
ALTER TABLE `Plugins` ADD COLUMN `wp_url` text;
--> statement-breakpoint
ALTER TABLE `Plugins` ADD COLUMN `homepage_url` text;
--> statement-breakpoint
ALTER TABLE `Plugins` ADD COLUMN `description` text;
--> statement-breakpoint
ALTER TABLE `Plugins` ADD COLUMN `active_installs` integer;
--> statement-breakpoint
ALTER TABLE `Plugins` ADD COLUMN `rating` integer;
--> statement-breakpoint
ALTER TABLE `Plugins` ADD COLUMN `enriched_at` text;
--> statement-breakpoint
CREATE INDEX `idx_plugins_wp_slug` ON `Plugins` (`wp_slug`);
