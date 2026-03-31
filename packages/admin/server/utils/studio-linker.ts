/**
 * Create Studio linker
 *
 * Matches publishers and contacts to existing Create Studio
 * sites and users by domain/email. Uses wrangler CLI to query
 * the production D1 database in local dev.
 */

import { execSync } from 'node:child_process'
import type { StudioData } from '../db/admin-schema'

interface StudioSite {
  id: number
  url: string
  create_version: string | null
  last_active_at: string | null
  tier: string | null
  status: string | null
}

interface StudioUser {
  id: number
  email: string
}

/**
 * Normalize a URL to a bare domain for matching.
 */
function urlToDomain(url: string): string {
  return url
    .toLowerCase()
    .replace(/^https?:\/\//, '')
    .replace(/^www\./, '')
    .split('/')[0]!
    .split('?')[0]!
    .replace(/\.$/, '')
    .trim()
}

/**
 * Check if a version string is pre-2.0 (legacy).
 */
function isLegacyVersion(version: string | null): boolean {
  if (!version) return true // unknown version = legacy
  const major = parseInt(version.split('.')[0] || '0', 10)
  return major < 2
}

/**
 * Check if a date is within the last N days.
 */
function isRecentlyActive(dateStr: string | null, days: number = 30): boolean {
  if (!dateStr) return false
  const date = new Date(dateStr)
  const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000)
  return date > cutoff
}

/**
 * Build StudioData from a site record.
 */
export function buildStudioData(site: StudioSite): StudioData {
  return {
    createVersion: site.create_version,
    lastActiveAt: site.last_active_at,
    subscriptionTier: site.tier,
    subscriptionStatus: site.status,
    isActive: isRecentlyActive(site.last_active_at),
    isLegacy: isLegacyVersion(site.create_version),
  }
}

/**
 * Fetch all sites from Create Studio production D1 via wrangler.
 * Includes subscription data for tier/status info.
 */
export function fetchStudioSites(): Map<string, StudioSite> {
  const sql = 'SELECT s.id, s.url, s.create_version, s.last_active_at, sub.tier, sub.status FROM Sites s LEFT JOIN Subscriptions sub ON s.id = sub.site_id WHERE s.url IS NOT NULL'

  const result = execSync(
    `npx wrangler d1 execute create-studio --remote --json --command "${sql}"`,
    { timeout: 60000, encoding: 'utf-8' }
  )

  const parsed = JSON.parse(result)
  const sites = parsed[0]?.results as StudioSite[] || []

  const siteMap = new Map<string, StudioSite>()
  for (const site of sites) {
    if (!site.url) continue
    const domain = urlToDomain(site.url)
    if (domain && domain !== 'localhost' && domain.includes('.')) {
      const existing = siteMap.get(domain)
      if (!existing || site.id > existing.id) {
        siteMap.set(domain, site)
      }
    }
  }

  return siteMap
}

/**
 * Fetch all users from Create Studio production D1 via wrangler.
 */
export function fetchStudioUsers(): Map<string, StudioUser> {
  const result = execSync(
    'npx wrangler d1 execute create-studio --remote --json --command "SELECT id, email FROM Users WHERE email IS NOT NULL"',
    { timeout: 60000, encoding: 'utf-8' }
  )

  const parsed = JSON.parse(result)
  const users = parsed[0]?.results as StudioUser[] || []

  const userMap = new Map<string, StudioUser>()
  for (const user of users) {
    if (user.email) {
      userMap.set(user.email.toLowerCase(), user)
    }
  }

  return userMap
}
