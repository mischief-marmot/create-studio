-- Migration number: 0019
-- Remove interactive_mode_enabled and interactive_mode_button_text from Sites table
-- These settings are now stored in SiteMeta.settings

ALTER TABLE Sites DROP COLUMN interactive_mode_enabled;
ALTER TABLE Sites DROP COLUMN interactive_mode_button_text;
