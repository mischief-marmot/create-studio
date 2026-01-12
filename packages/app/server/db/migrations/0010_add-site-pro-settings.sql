-- Migration number: 0010 	 2025-12-05T18:48:20.565Z
-- Add Pro settings columns to Sites table for Interactive Mode configuration

ALTER TABLE Sites ADD COLUMN interactive_mode_enabled INTEGER DEFAULT 1;
ALTER TABLE Sites ADD COLUMN interactive_mode_button_text TEXT DEFAULT NULL;
