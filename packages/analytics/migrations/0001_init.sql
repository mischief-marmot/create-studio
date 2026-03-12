-- Migration number: 0001
-- Analytics database initial schema: events, daily_summaries, counters

CREATE TABLE events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  type TEXT NOT NULL,
  body TEXT NOT NULL,
  domain TEXT,
  session_id TEXT,
  sample_rate REAL NOT NULL DEFAULT 1.0,
  created_at INTEGER NOT NULL
);

CREATE INDEX idx_events_type_created ON events (type, created_at);
CREATE INDEX idx_events_domain_created ON events (domain, created_at);
CREATE INDEX idx_events_session ON events (session_id);

CREATE TABLE daily_summaries (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  date TEXT NOT NULL,
  domain TEXT,
  metric TEXT NOT NULL,
  dimensions TEXT,
  value REAL NOT NULL,
  sample_rate REAL NOT NULL DEFAULT 1.0,
  created_at INTEGER NOT NULL
);

CREATE UNIQUE INDEX idx_daily_summary_unique ON daily_summaries (date, domain, metric, dimensions);
CREATE INDEX idx_daily_summary_date ON daily_summaries (date);
CREATE INDEX idx_daily_summary_metric ON daily_summaries (metric, date);

CREATE TABLE counters (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  key TEXT NOT NULL UNIQUE,
  value INTEGER NOT NULL DEFAULT 0,
  updated_at INTEGER NOT NULL
);

CREATE UNIQUE INDEX idx_counters_key ON counters (key);
