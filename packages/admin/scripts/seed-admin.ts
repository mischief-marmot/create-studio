#!/usr/bin/env node
/**
 * Admin User Seeding Script
 *
 * Creates a super admin user for the Create Studio admin portal.
 * Prompts for email and password, validates input, hashes password with bcrypt,
 * and inserts the admin record into the database.
 *
 * Usage: npm run seed (from packages/admin directory)
 *
 * This script connects to the local SQLite database used by NuxtHub/Wrangler.
 * Make sure the dev server has run at least once to create the database.
 */

import { createInterface } from 'node:readline'
import { stdin as input, stdout as output } from 'node:process'
import { hash } from 'bcrypt'
import { drizzle } from 'drizzle-orm/better-sqlite3'
import Database from 'better-sqlite3'
import { existsSync, readdirSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { sqliteTable, text, integer, index } from 'drizzle-orm/sqlite-core'

// Define the admins table schema locally (since we can't import from the app easily in a script context)
const admins = sqliteTable('Admins', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  email: text('email').notNull().unique(),
  password: text('password').notNull(),
  firstname: text('firstname'),
  lastname: text('lastname'),
  role: text('role').notNull().default('admin'),
  last_login: text('last_login'),
  createdAt: text('createdAt'),
  updatedAt: text('updatedAt'),
}, (table) => [
  index('idx_admins_email').on(table.email),
  index('idx_admins_role').on(table.role),
])

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const BCRYPT_ROUNDS = 10

/**
 * Finds the Wrangler D1 database file
 */
function findDatabasePath(): string {
  // Look for the database in the app's .wrangler directory
  // Script is in packages/admin/scripts/, so go up to root, then to app
  const rootDir = join(__dirname, '../../..')
  const wranglerDir = join(rootDir, 'packages/app/.wrangler/state/v3/d1/miniflare-D1DatabaseObject')

  if (!existsSync(wranglerDir)) {
    throw new Error(
      'Database directory not found. Please run the dev server at least once to create the database:\n' +
      '  cd packages/app && npm run dev'
    )
  }

  // Find the .sqlite file
  const files = readdirSync(wranglerDir)
  const sqliteFile = files.find(f => f.endsWith('.sqlite'))

  if (!sqliteFile) {
    throw new Error('Database file not found in .wrangler directory')
  }

  return join(wranglerDir, sqliteFile)
}

/**
 * Validates email format using a simple regex
 */
function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

/**
 * Validates password strength (minimum 8 characters)
 */
function validatePassword(password: string): boolean {
  return password.length >= 8
}

/**
 * Prompts user for input with a question
 */
function prompt(question: string): Promise<string> {
  const rl = createInterface({ input, output })

  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close()
      resolve(answer.trim())
    })
  })
}

/**
 * Prompts for password without echoing to terminal
 */
function promptPassword(question: string): Promise<string> {
  const rl = createInterface({ input, output })

  return new Promise((resolve) => {
    // Hide input for password
    rl.question(question, (answer) => {
      rl.close()
      console.log() // New line after password input
      resolve(answer.trim())
    })

    // Mute stdin to hide password input
    if ((input as any)._readableState) {
      (input as any).setRawMode(true)
      input.on('data', (char) => {
        const c = char.toString()
        switch (c) {
          case '\n':
          case '\r':
          case '\u0004': // Ctrl+D
            (input as any).setRawMode(false)
            input.pause()
            break
          case '\u0003': // Ctrl+C
            process.exit()
            break
          default:
            output.write('*')
            break
        }
      })
    }
  })
}

/**
 * Main seeding function
 */
async function seedAdmin() {
  console.log('=== Create Studio Admin User Seeder ===\n')

  // Prompt for email
  let email = ''
  while (!email) {
    email = await prompt('Enter admin email: ')

    if (!email) {
      console.error('Error: Email is required\n')
      continue
    }

    if (!validateEmail(email)) {
      console.error('Error: Invalid email format\n')
      email = ''
      continue
    }
  }

  // Prompt for password
  let password = ''
  while (!password) {
    password = await promptPassword('Enter admin password (min 8 characters): ')

    if (!password) {
      console.error('Error: Password is required\n')
      continue
    }

    if (!validatePassword(password)) {
      console.error('Error: Password must be at least 8 characters\n')
      password = ''
      continue
    }
  }

  // Confirm password
  const confirmPassword = await promptPassword('Confirm password: ')
  if (password !== confirmPassword) {
    console.error('Error: Passwords do not match')
    process.exit(1)
  }

  try {
    // Hash password
    console.log('\nHashing password...')
    const passwordHash = await hash(password, BCRYPT_ROUNDS)

    // Connect to database
    console.log('Connecting to database...')
    const dbPath = findDatabasePath()
    console.log(`Using database: ${dbPath}`)

    const sqlite = new Database(dbPath)
    const db = drizzle(sqlite)

    // Create admin record
    console.log('Creating admin user...')
    const now = new Date().toISOString()

    const newAdmin = db.insert(admins).values({
      email,
      password: passwordHash,
      role: 'super_admin',
      createdAt: now,
      updatedAt: now,
    }).returning().get()

    // Close database connection
    sqlite.close()

    console.log('\n✓ Success! Admin user created:')
    console.log(`  Email: ${newAdmin.email}`)
    console.log(`  Role: ${newAdmin.role}`)
    console.log(`  ID: ${newAdmin.id}`)

  } catch (error: any) {
    console.error('\n✗ Error creating admin user:')

    if (error.message && error.message.includes('UNIQUE constraint failed')) {
      console.error(`  An admin with email "${email}" already exists`)
    } else {
      console.error(`  ${error.message || error}`)
    }

    process.exit(1)
  }
}

// Run the seeder
seedAdmin().catch((error) => {
  console.error('Unexpected error:', error)
  process.exit(1)
})
