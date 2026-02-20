-- Migration: Add user_email column to FeedbackReports
-- Allows feedback submitters to include their email for follow-up

ALTER TABLE FeedbackReports ADD COLUMN user_email TEXT;
