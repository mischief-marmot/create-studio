#!/usr/bin/env npx tsx
/**
 * Remote Admin User Seeding Script
 *
 * Creates an admin user in the remote D1 database via wrangler.
 *
 * Usage: npx tsx packages/admin/scripts/seed-admin-remote.ts
 */

import { execSync } from 'node:child_process'
import { createInterface } from 'node:readline'
import { stdin as input, stdout as output } from 'node:process'
import { hash } from 'bcrypt'

const BCRYPT_ROUNDS = 10
const DATABASE_NAME = 'create-studio' // Change to 'create-studio-preview' for preview

function prompt(question: string): Promise<string> {
  const rl = createInterface({ input, output })
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close()
      resolve(answer.trim())
    })
  })
}

async function main() {
  console.log('=== Remote Admin User Seeder ===\n')
  console.log(`Target database: ${DATABASE_NAME}\n`)

  // Get email
  const email = await prompt('Enter admin email: ')
  if (!email || !email.includes('@')) {
    console.error('Invalid email')
    process.exit(1)
  }

  // Get password
  const password = await prompt('Enter admin password (min 8 chars): ')
  if (!password || password.length < 8) {
    console.error('Password must be at least 8 characters')
    process.exit(1)
  }

  // Hash password
  console.log('\nHashing password...')
  const passwordHash = await hash(password, BCRYPT_ROUNDS)

  // Build SQL command
  const sql = `INSERT INTO Admins (email, password, role, createdAt, updatedAt) VALUES ('${email}', '${passwordHash}', 'super_admin', datetime('now'), datetime('now'))`

  console.log('\nExecuting on remote D1...')

  try {
    execSync(`npx wrangler d1 execute ${DATABASE_NAME} --remote --command "${sql}"`, {
      stdio: 'inherit',
      cwd: process.cwd()
    })
    console.log('\n✓ Admin user created successfully!')
    console.log(`  Email: ${email}`)
    console.log(`  Role: super_admin`)
  } catch (error) {
    console.error('\n✗ Failed to create admin user')
    process.exit(1)
  }
}

main()
