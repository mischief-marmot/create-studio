-- Migration: 0028
-- Add an optional max_completions cap to Surveys. When NULL the survey is
-- unlimited; when set, the Nth completed response closes the survey to new
-- submissions and the public page surfaces a "spots remaining" countdown.

ALTER TABLE Surveys ADD COLUMN max_completions INTEGER;
