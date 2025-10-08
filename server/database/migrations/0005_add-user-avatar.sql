-- Migration number: 0005 	 2025-10-08T15:04:21.747Z
-- Migration: Add avatar field to Users table
-- This field stores the URL or path to the user's profile image
-- Can be a Cloudflare Images URL, external URL, or local path

ALTER TABLE Users ADD COLUMN avatar TEXT;
