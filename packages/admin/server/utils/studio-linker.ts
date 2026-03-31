/**
 * Create Studio linker
 *
 * Matches publishers and contacts to existing Create Studio
 * sites and users by domain/email. Reads from local JSON fixtures
 * dumped from production D1 via wrangler.
 *
 * To refresh fixtures:
 *   npx wrangler d1 execute create-studio --remote --json \
 *     --command "SELECT s.id, s.url, s.create_version, s.last_active_at, sub.tier, sub.status FROM Sites s LEFT JOIN Subscriptions sub ON s.id = sub.site_id WHERE s.url IS NOT NULL" \
 *     | python3 -c "import sys,json; json.dump(json.load(sys.stdin)[0]['results'], open('packages/admin/server/data/studio-sites.json','w'))"
 *
 *   npx wrangler d1 execute create-studio --remote --json \
 *     --command "SELECT id, email FROM Users WHERE email IS NOT NULL" \
 *     | python3 -c "import sys,json; json.dump(json.load(sys.stdin)[0]['results'], open('packages/admin/server/data/studio-users.json','w'))"
 */

import { readFileSync, existsSync } from 'node:fs'
import { join } from 'node:path'
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

function getDataDir(): string {
  // Try multiple possible locations since import.meta.url resolves to .nuxt at runtime
  const candidates = [
    join(process.cwd(), 'server/data'),
    join(process.cwd(), 'packages/admin/server/data'),
  ]
  for (const dir of candidates) {
    if (existsSync(dir)) return dir
  }
  return candidates[0]!
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

function isLegacyVersion(version: string | null): boolean {
  if (!version) return true
  const major = parseInt(version.split('.')[0] || '0', 10)
  return major < 2
}

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
 * Load Studio sites from local JSON fixture.
 */
export function fetchStudioSites(): Map<string, StudioSite> {
  const filePath = join(getDataDir(), 'studio-sites.json')
  const raw = readFileSync(filePath, 'utf-8')
  const sites: StudioSite[] = JSON.parse(raw)

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
 * Load Studio users from local JSON fixture.
 */
export function fetchStudioUsers(): Map<string, StudioUser> {
  const filePath = join(getDataDir(), 'studio-users.json')
  const raw = readFileSync(filePath, 'utf-8')
  const users: StudioUser[] = JSON.parse(raw)

  const userMap = new Map<string, StudioUser>()
  for (const user of users) {
    if (user.email) {
      userMap.set(user.email.toLowerCase(), user)
    }
  }

  return userMap
}
