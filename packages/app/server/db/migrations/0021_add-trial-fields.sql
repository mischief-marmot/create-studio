-- Migration number: 0021
-- Add trial fields to Subscriptions table for Pro trial feature

ALTER TABLE Subscriptions ADD COLUMN has_trialed INTEGER DEFAULT 0;
ALTER TABLE Subscriptions ADD COLUMN trial_end TEXT;
ALTER TABLE Subscriptions ADD COLUMN metadata TEXT;
ALTER TABLE Subscriptions ADD COLUMN trial_extensions TEXT;
