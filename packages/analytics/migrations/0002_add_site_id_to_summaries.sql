-- Migration number: 0002
-- Add site_id column to daily_summaries for resolved domain → site lookups

ALTER TABLE daily_summaries ADD COLUMN site_id INTEGER;
CREATE INDEX idx_daily_summary_site ON daily_summaries (site_id, date);
