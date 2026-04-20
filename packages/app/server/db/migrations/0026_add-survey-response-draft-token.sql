-- Migration: 0026
-- Add an opaque draft_token to SurveyResponses so public-survey PATCHes can
-- prove ownership of the response they're updating — otherwise the auto-
-- increment id acts as a bearer token that attackers can enumerate to harvest
-- promotion codes or overwrite other respondents' drafts.

ALTER TABLE SurveyResponses ADD COLUMN draft_token TEXT;
CREATE INDEX idx_survey_responses_draft_token ON SurveyResponses(draft_token);
