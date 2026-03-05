CREATE TABLE `ReleaseEmails` (
  `id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
  `product` text NOT NULL,
  `version` text NOT NULL,
  `title` text NOT NULL,
  `description` text NOT NULL,
  `hero_image_url` text,
  `release_url` text,
  `highlights` text,
  `status` text NOT NULL DEFAULT 'draft',
  `sent_at` text,
  `sent_by` integer REFERENCES Admins(id),
  `createdAt` text,
  `updatedAt` text
);
--> statement-breakpoint
CREATE INDEX `idx_release_emails_status` ON `ReleaseEmails` (`status`);
--> statement-breakpoint
CREATE INDEX `idx_release_emails_product` ON `ReleaseEmails` (`product`);
--> statement-breakpoint
CREATE INDEX `idx_release_emails_created_at` ON `ReleaseEmails` (`createdAt`);
