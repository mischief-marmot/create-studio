-- Migration number: 0001 	 2025-09-18T21:16:43.512Z
-- Migration: Create Users table
-- This migrates the Sequelize Users model to D1

CREATE TABLE IF NOT EXISTS Users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT NOT NULL UNIQUE,
  password TEXT,
  firstname TEXT,
  lastname TEXT,
  mediavine_publisher INTEGER DEFAULT 0, -- SQLite uses INTEGER for boolean
  validEmail INTEGER DEFAULT 0, -- SQLite uses INTEGER for boolean
  marketing_opt_in INTEGER DEFAULT 0, -- SQLite uses INTEGER for boolean
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Create index on email for faster lookups
CREATE INDEX IF NOT EXISTS idx_users_email ON Users(email);

-- Create index on validEmail for filtering
CREATE INDEX IF NOT EXISTS idx_users_valid_email ON Users(validEmail);