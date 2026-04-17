-- Migration number: 0027
-- Add MessageQueue table for background message processing (webhooks, notifications, etc.)

CREATE TABLE IF NOT EXISTS MessageQueue (
  id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
  type TEXT NOT NULL,
  payload TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  attempts INTEGER NOT NULL DEFAULT 0,
  max_attempts INTEGER NOT NULL DEFAULT 8,
  next_attempt_at TEXT NOT NULL,
  last_error TEXT,
  site_id INTEGER REFERENCES Sites(id) ON DELETE CASCADE,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_message_queue_status_next_attempt ON MessageQueue(status, next_attempt_at);
CREATE INDEX IF NOT EXISTS idx_message_queue_type ON MessageQueue(type);
CREATE INDEX IF NOT EXISTS idx_message_queue_site_id ON MessageQueue(site_id);
