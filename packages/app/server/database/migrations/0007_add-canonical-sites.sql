-- Migration number: 0007 	 2025-10-08T16:00:00.000Z
-- Migration: Add canonical sites support for many-to-many user-site relationships
-- This enables multiple users to collaborate on the same site
-- V1 API continues using user_id for backwards compatibility
-- V2 API uses canonical sites (canonical_site_id IS NULL) + SiteUsers pivot table

-- Add canonical_site_id to Sites table
-- NULL = this is a canonical site (the primary site for a URL)
-- NOT NULL = this is a legacy site pointing to its canonical site
ALTER TABLE Sites ADD COLUMN canonical_site_id INTEGER REFERENCES Sites(id);

-- Create SiteUsers pivot table for V2 many-to-many relationships
-- site_id here always references a canonical site (where Sites.canonical_site_id IS NULL)
CREATE TABLE IF NOT EXISTS SiteUsers (
  site_id INTEGER NOT NULL REFERENCES Sites(id) ON DELETE CASCADE,  -- Always canonical site
  user_id INTEGER NOT NULL REFERENCES Users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'admin',  -- owner, admin, editor
  joined_at TEXT DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (site_id, user_id)
);

-- Create indexes for fast lookups
CREATE INDEX idx_site_users_user_id ON SiteUsers(user_id);
CREATE INDEX idx_sites_canonical ON Sites(canonical_site_id);
