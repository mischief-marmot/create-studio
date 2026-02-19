-- metadata column added to Users (may already exist from prior run)
CREATE INDEX IF NOT EXISTS `idx_noop_perpetual_the_order` ON `Users` (`id`);--> statement-breakpoint
DROP INDEX IF EXISTS `idx_noop_perpetual_the_order`;