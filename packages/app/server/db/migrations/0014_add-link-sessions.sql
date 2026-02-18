-- Migration number: 0014
-- Add LinkSessions table for user verification redirect flow

CREATE TABLE IF NOT EXISTS LinkSessions (
  id TEXT PRIMARY KEY,
  site_id INTEGER NOT NULL REFERENCES Sites(id) ON DELETE CASCADE,
  user_id INTEGER REFERENCES Users(id) ON DELETE CASCADE,
  user_token TEXT,
  return_url TEXT NOT NULL,
  created_at TEXT NOT NULL,
  expires_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_link_sessions_site_id ON LinkSessions(site_id);
CREATE INDEX IF NOT EXISTS idx_link_sessions_expires_at ON LinkSessions(expires_at);
