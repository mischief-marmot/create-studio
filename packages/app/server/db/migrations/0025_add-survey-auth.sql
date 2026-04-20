-- Migration number: 0025
-- Add user-only survey support.
-- Surveys.requires_auth: when true, only logged-in users can submit and responses are tied to user/site.
-- SurveyResponses.site_id: nullable FK to Sites for attributing responses to a specific publisher site.

ALTER TABLE Surveys ADD COLUMN requires_auth INTEGER DEFAULT 0;

ALTER TABLE SurveyResponses ADD COLUMN site_id INTEGER REFERENCES Sites(id) ON DELETE SET NULL;

CREATE INDEX idx_survey_responses_site_id ON SurveyResponses(site_id);
