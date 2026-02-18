-- Migration number: 0013
-- Add pending_verification_code to Sites table for email-decoupled verification flow

ALTER TABLE Sites ADD COLUMN pending_verification_code TEXT DEFAULT NULL;
