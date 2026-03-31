-- Add studio_data JSON field to Publishers for Create Studio linkage metadata
ALTER TABLE `Publishers` ADD COLUMN `studio_data` text;
