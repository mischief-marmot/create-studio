-- Migration number: 0011 	 2026-01-15T00:00:00.000Z
-- Add verification_code and user_token columns to SiteUsers table
-- for user-level verification flow from WordPress plugin

-- Add verification_code column for pending verifications
ALTER TABLE SiteUsers ADD COLUMN verification_code TEXT DEFAULT NULL;

-- Add user_token column for authenticated API calls from WordPress
ALTER TABLE SiteUsers ADD COLUMN user_token TEXT DEFAULT NULL;

-- Index for looking up by verification_code
CREATE INDEX IF NOT EXISTS idx_site_users_verification_code ON SiteUsers(verification_code);

-- Index for looking up by user_token
CREATE INDEX IF NOT EXISTS idx_site_users_user_token ON SiteUsers(user_token);
