-- Migration number: 0016
-- Add FeedbackReports table for error reports submitted from plugin admin UI

CREATE TABLE IF NOT EXISTS FeedbackReports (
  id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
  site_id INTEGER NOT NULL REFERENCES Sites(id) ON DELETE CASCADE,
  error_message TEXT NOT NULL,
  stack_trace TEXT,
  component_stack TEXT,
  create_version TEXT,
  wp_version TEXT,
  php_version TEXT,
  browser_info TEXT,
  current_url TEXT,
  user_message TEXT,
  screenshot_base64 TEXT,
  status TEXT NOT NULL DEFAULT 'new',
  admin_notes TEXT,
  createdAt TEXT,
  updatedAt TEXT
);

CREATE INDEX IF NOT EXISTS idx_feedback_site_id ON FeedbackReports(site_id);
CREATE INDEX IF NOT EXISTS idx_feedback_status ON FeedbackReports(status);
CREATE INDEX IF NOT EXISTS idx_feedback_created_at ON FeedbackReports(createdAt);
