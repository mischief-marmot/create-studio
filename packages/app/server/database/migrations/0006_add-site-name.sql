-- Migration number: 0006 	 2025-10-08T15:04:45.952Z
-- Migration: Add name field to Sites table
-- This field stores a human-friendly name for the site (e.g., "My Food Blog")
-- Complements the URL field to provide better site identification in the admin UI

ALTER TABLE Sites ADD COLUMN name TEXT;
