-- Migration number: 0015
-- Add Broadcasts table for admin-managed announcements delivered to plugin instances

CREATE TABLE IF NOT EXISTS Broadcasts (
  id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'announcement',
  status TEXT NOT NULL DEFAULT 'draft',
  priority INTEGER NOT NULL DEFAULT 0,
  url TEXT,
  path TEXT,
  cta_text TEXT,
  target_tiers TEXT DEFAULT '["all"]',
  target_create_version_min TEXT,
  target_create_version_max TEXT,
  targeting TEXT,
  published_at TEXT,
  expires_at TEXT,
  createdAt TEXT,
  updatedAt TEXT
);

CREATE INDEX IF NOT EXISTS idx_broadcasts_status ON Broadcasts(status);
CREATE INDEX IF NOT EXISTS idx_broadcasts_type ON Broadcasts(type);
CREATE INDEX IF NOT EXISTS idx_broadcasts_published_at ON Broadcasts(published_at);
CREATE INDEX IF NOT EXISTS idx_broadcasts_expires_at ON Broadcasts(expires_at);
CREATE INDEX IF NOT EXISTS idx_broadcasts_priority ON Broadcasts(priority);
