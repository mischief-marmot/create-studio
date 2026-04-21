-- Migration number: 0029
-- Add campaign_key column to Broadcasts for cohort grouping. Cohort site IDs
-- live in the existing `targeting` JSON column as { cohort_site_ids: [...] }.

ALTER TABLE Broadcasts ADD COLUMN campaign_key TEXT;
CREATE INDEX IF NOT EXISTS idx_broadcasts_campaign_key ON Broadcasts(campaign_key);
