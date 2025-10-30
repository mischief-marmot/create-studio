-- Migration number: 0003 	 2025-10-07T00:00:00.000Z
-- Migration: Create Subscriptions table
-- This creates the subscriptions table linked to Sites

CREATE TABLE IF NOT EXISTS Subscriptions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  site_id INTEGER NOT NULL UNIQUE,
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT UNIQUE,
  status TEXT NOT NULL DEFAULT 'free', -- free, active, canceled, past_due, trialing, unpaid
  tier TEXT NOT NULL DEFAULT 'free', -- free, pro
  current_period_start DATETIME,
  current_period_end DATETIME,
  cancel_at_period_end INTEGER DEFAULT 0,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (site_id) REFERENCES Sites(id) ON DELETE CASCADE
);

-- Create index on site_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_subscriptions_site_id ON Subscriptions(site_id);

-- Create index on stripe_subscription_id for webhook processing
CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe_subscription_id ON Subscriptions(stripe_subscription_id);

-- Create index on stripe_customer_id for customer portal
CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe_customer_id ON Subscriptions(stripe_customer_id);

-- Create index on status for filtering
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON Subscriptions(status);
