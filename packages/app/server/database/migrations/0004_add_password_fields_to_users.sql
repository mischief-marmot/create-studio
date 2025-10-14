-- Migration number: 0004 	 2025-10-07T00:00:01.000Z
-- Migration: Add password reset fields to Users table
-- Note: password column already exists, we just add reset functionality

-- Add password reset token and expiration
ALTER TABLE Users ADD COLUMN password_reset_token TEXT;
ALTER TABLE Users ADD COLUMN password_reset_expires DATETIME;

-- Create index on password_reset_token for faster lookups during reset flow
CREATE INDEX IF NOT EXISTS idx_users_password_reset_token ON Users(password_reset_token);
