CREATE TABLE `Admins` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`email` text NOT NULL,
	`password` text NOT NULL,
	`firstname` text,
	`lastname` text,
	`role` text DEFAULT 'admin' NOT NULL,
	`last_login` text,
	`createdAt` text,
	`updatedAt` text
);
--> statement-breakpoint
CREATE UNIQUE INDEX `Admins_email_unique` ON `Admins` (`email`);--> statement-breakpoint
CREATE INDEX `idx_admins_email` ON `Admins` (`email`);--> statement-breakpoint
CREATE INDEX `idx_admins_role` ON `Admins` (`role`);--> statement-breakpoint
CREATE TABLE `AuditLogs` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`admin_id` integer NOT NULL,
	`action` text NOT NULL,
	`entity_type` text,
	`entity_id` integer,
	`changes` text,
	`ip_address` text,
	`user_agent` text,
	`createdAt` text,
	FOREIGN KEY (`admin_id`) REFERENCES `Admins`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_audit_logs_admin_id` ON `AuditLogs` (`admin_id`);--> statement-breakpoint
CREATE INDEX `idx_audit_logs_action` ON `AuditLogs` (`action`);--> statement-breakpoint
CREATE INDEX `idx_audit_logs_entity_type` ON `AuditLogs` (`entity_type`);--> statement-breakpoint
CREATE INDEX `idx_audit_logs_created_at` ON `AuditLogs` (`createdAt`);--> statement-breakpoint
ALTER TABLE `SiteUsers` ADD `verification_code` text;--> statement-breakpoint
ALTER TABLE `SiteUsers` ADD `user_token` text;--> statement-breakpoint
CREATE INDEX `idx_site_users_verification_code` ON `SiteUsers` (`verification_code`);--> statement-breakpoint
CREATE INDEX `idx_site_users_user_token` ON `SiteUsers` (`user_token`);