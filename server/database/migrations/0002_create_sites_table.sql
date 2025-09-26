-- Migration number: 0002 	 2025-09-18T21:16:44.319Z
-- Migration: Create Sites table
-- This migrates the Sequelize Sites model to D1

CREATE TABLE IF NOT EXISTS Sites (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  url TEXT,
  user_id INTEGER NOT NULL,
  create_version TEXT,
  wp_version TEXT,
  php_version TEXT,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES Users(id) ON DELETE CASCADE
);

-- Create index on user_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_sites_user_id ON Sites(user_id);

-- Create index on url for faster lookups
CREATE INDEX IF NOT EXISTS idx_sites_url ON Sites(url);