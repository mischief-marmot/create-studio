-- Migration number: 0020
-- Add last_active_at timestamp to Sites table for activity tracking

ALTER TABLE Sites ADD COLUMN last_active_at TEXT;
CREATE INDEX idx_sites_last_active ON Sites(last_active_at);
