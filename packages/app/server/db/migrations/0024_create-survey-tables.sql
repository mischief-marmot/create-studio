-- Migration 0024: Create survey tables for publisher surveys
-- Surveys stores SurveyJS JSON definitions; SurveyResponses stores flat JSON answers

CREATE TABLE Surveys (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  description TEXT,
  definition TEXT,
  status TEXT NOT NULL DEFAULT 'draft',
  promotion TEXT,
  createdAt TEXT,
  updatedAt TEXT
);

CREATE INDEX idx_surveys_slug ON Surveys(slug);
CREATE INDEX idx_surveys_status ON Surveys(status);

CREATE TABLE SurveyResponses (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  survey_id INTEGER NOT NULL REFERENCES Surveys(id) ON DELETE CASCADE,
  user_id INTEGER REFERENCES Users(id) ON DELETE SET NULL,
  respondent_email TEXT,
  response_data TEXT,
  completed INTEGER DEFAULT 0,
  createdAt TEXT
);

CREATE INDEX idx_survey_responses_survey_id ON SurveyResponses(survey_id);
CREATE INDEX idx_survey_responses_user_id ON SurveyResponses(user_id);
CREATE INDEX idx_survey_responses_completed ON SurveyResponses(completed);
