-- Migration: 0028
-- Add an optional max_completions cap to Surveys. When NULL the survey is
-- unlimited; when set, the Nth completed response closes the survey to new
-- submissions and the public page surfaces a "spots remaining" countdown.

ALTER TABLE Surveys ADD COLUMN max_completions INTEGER;

-- Composite index so the cap check `SELECT count(*) WHERE survey_id=? AND
-- completed=1` is a pure index seek instead of scanning every response row
-- for the survey (the existing single-column indexes can't serve this).
CREATE INDEX idx_survey_responses_survey_id_completed
  ON SurveyResponses(survey_id, completed);
