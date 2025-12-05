-- Migration number: 0009
-- Migration: Add site user verification tracking
-- This adds verified_at to SiteUsers table for tracking when users verify their access to sites

-- Add verification tracking to SiteUsers table
ALTER TABLE SiteUsers ADD COLUMN verified_at DATETIME;

-- Mark ALL existing SiteUsers as verified (V1 users already proved ownership via plugin registration)
UPDATE SiteUsers SET verified_at = CURRENT_TIMESTAMP WHERE verified_at IS NULL;

-- Index for querying verified/unverified users
CREATE INDEX IF NOT EXISTS idx_site_users_verified_at ON SiteUsers(verified_at);

-- Note: We do NOT add a unique index on Sites.url because existing data may have duplicates
-- The application layer (findOrCreateCanonicalSite) handles ensuring uniqueness for new canonical sites
