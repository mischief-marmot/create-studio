-- Migration number: 0018
-- Add SiteMeta table for flexible site settings and version update logs

CREATE TABLE IF NOT EXISTS SiteMeta (
  id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
  site_id INTEGER NOT NULL UNIQUE REFERENCES Sites(id) ON DELETE CASCADE,
  settings TEXT DEFAULT '{}',
  version_logs TEXT DEFAULT '[]',
  createdAt TEXT,
  updatedAt TEXT
);

CREATE INDEX IF NOT EXISTS idx_site_meta_site_id ON SiteMeta(site_id);
