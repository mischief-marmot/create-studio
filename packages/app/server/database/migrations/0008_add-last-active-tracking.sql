-- Migration number: 0008 	 2025-11-06T17:51:00.000Z
-- Migration: Add last_active_at tracking for Users and Sites
-- This enables reporting on last active user and site by API usage

-- Add last_active_at column to Users table
ALTER TABLE Users ADD COLUMN last_active_at DATETIME;

-- Add last_active_at column to Sites table
ALTER TABLE Sites ADD COLUMN last_active_at DATETIME;

-- Create index on last_active_at for faster queries
CREATE INDEX IF NOT EXISTS idx_users_last_active ON Users(last_active_at);
CREATE INDEX IF NOT EXISTS idx_sites_last_active ON Sites(last_active_at);
