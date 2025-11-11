-- Migration number: 0008   2025-01-10T00:00:00.000Z
-- Migration: Add consent tracking fields to Users table
-- Purpose: Track when users accept Terms of Service, Privacy Policy, and Cookie Policy
-- These timestamps are used for audit trails and compliance with GDPR/CCPA

ALTER TABLE Users ADD COLUMN consent_tos_accepted_at TEXT;
ALTER TABLE Users ADD COLUMN consent_privacy_accepted_at TEXT;
ALTER TABLE Users ADD COLUMN consent_cookies_accepted_at TEXT;
