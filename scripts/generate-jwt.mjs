#!/usr/bin/env node
/**
 * Generate a JWT token for testing site linking
 *
 * Usage:
 *   node scripts/generate-jwt.mjs --id=1 --email=you@example.com --site_id=1
 *
 * Or set env vars and run:
 *   NUXT_SERVICES_API_JWT_SECRET=your-secret node scripts/generate-jwt.mjs --id=1 --email=you@example.com --site_id=1
 */

import { SignJWT } from 'jose'
import { config } from 'dotenv'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))

// Load .env from packages/app
config({ path: resolve(__dirname, '../packages/app/.env') })

const secret = process.env.NUXT_SERVICES_API_JWT_SECRET

if (!secret) {
  console.error('Error: NUXT_SERVICES_API_JWT_SECRET not found in environment')
  process.exit(1)
}

// Parse command line args
const args = process.argv.slice(2).reduce((acc, arg) => {
  const [key, value] = arg.replace('--', '').split('=')
  acc[key] = value
  return acc
}, {})

const { id, email, site_id } = args

if (!id || !email || !site_id) {
  console.error('Usage: node scripts/generate-jwt.mjs --id=<user_id> --email=<email> --site_id=<site_id>')
  console.error('')
  console.error('Example:')
  console.error('  node scripts/generate-jwt.mjs --id=1 --email=user@example.com --site_id=1')
  process.exit(1)
}

const payload = {
  id: parseInt(id, 10),
  email,
  validEmail: true,
  site_id: parseInt(site_id, 10)
}

const secretBytes = new TextEncoder().encode(secret)

const token = await new SignJWT(payload)
  .setProtectedHeader({ alg: 'HS256' })
  .setIssuedAt()
  .sign(secretBytes)

console.log('\n=== Generated JWT Token ===\n')
console.log(token)
console.log('\n=== Payload ===\n')
console.log(JSON.stringify(payload, null, 2))
console.log('\n=== SQL to insert into WordPress ===\n')
console.log(`INSERT INTO wp_mv_settings (slug, value, \`group\`) VALUES
('mv_create_api_token', '${token}', 'mv_create_api'),
('mv_create_api_email_confirmed', '1', 'hidden'),
('mv_create_api_user_id', '${id}', 'hidden'),
('site_verification_code', '', 'hidden')
ON DUPLICATE KEY UPDATE value = VALUES(value);`)
console.log('')
