-- Migration 0022: Add USDA reference data tables for ingredient-specific unit conversion
-- Stores gram weights per household measure (cup, tbsp, tsp) from USDA SR Legacy dataset

CREATE TABLE usda_foods (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  fdc_id INTEGER NOT NULL,
  name TEXT NOT NULL,
  category TEXT,
  is_liquid INTEGER DEFAULT 0,
  cup_grams REAL,
  tbsp_grams REAL,
  tsp_grams REAL,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX idx_usda_foods_name ON usda_foods(name);
CREATE INDEX idx_usda_foods_fdc_id ON usda_foods(fdc_id);

CREATE TABLE usda_aliases (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  alias TEXT NOT NULL,
  usda_food_id INTEGER NOT NULL REFERENCES usda_foods(id) ON DELETE CASCADE
);

CREATE UNIQUE INDEX idx_usda_aliases_alias ON usda_aliases(alias);
