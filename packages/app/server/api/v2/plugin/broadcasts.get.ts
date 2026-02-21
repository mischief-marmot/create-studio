import { eq, and, gte, or, isNull, desc } from 'drizzle-orm'
import { broadcasts } from '~~/server/db/schema'

/**
 * GET /api/v2/plugin/broadcasts?tier={tier}&create_version={version}
 *
 * Returns active broadcasts for the Create plugin.
 * No authentication required - public endpoint fetched server-to-server
 * by the WordPress plugin and cached via transient.
 *
 * Filters:
 * - Only published broadcasts
 * - Only non-expired (expires_at is null or in the future)
 * - Tier matching: target_tiers contains "all" or the requested tier
 * - Version matching: basic semver comparison against min/max
 */
export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const tier = (query.tier as string) || 'free'
  const createVersion = query.create_version as string | undefined

  const now = new Date().toISOString()

  // Fetch published, non-expired broadcasts ordered by priority desc
  const results = await db
    .select()
    .from(broadcasts)
    .where(
      and(
        eq(broadcasts.status, 'published'),
        or(isNull(broadcasts.expires_at), gte(broadcasts.expires_at, now))
      )
    )
    .orderBy(desc(broadcasts.priority), desc(broadcasts.published_at))
    .all()

  // Filter by tier and version in app code (JSON fields not queryable via SQL easily)
  const filtered = results.filter((b) => {
    // Tier check
    const tiers = b.target_tiers as string[] | null
    if (tiers && !tiers.includes('all') && !tiers.includes(tier)) {
      return false
    }

    // Version check
    if (createVersion) {
      if (b.target_create_version_min && compareSemver(createVersion, b.target_create_version_min) < 0) {
        return false
      }
      if (b.target_create_version_max && compareSemver(createVersion, b.target_create_version_max) > 0) {
        return false
      }
    }

    return true
  })

  return filtered.map((b) => ({
    id: b.id,
    type: b.type,
    title: b.title,
    body: b.body,
    url: b.url,
    path: b.path,
    cta_text: b.cta_text,
    published_at: b.published_at,
    expires_at: b.expires_at,
  }))
})

/**
 * Basic semver comparison. Returns -1, 0, or 1.
 * Handles versions like "1.2.3", "2.0.0-beta", etc.
 * Only compares numeric major.minor.patch segments.
 */
function compareSemver(a: string, b: string): number {
  const parse = (v: string) => v.replace(/[^0-9.]/g, '').split('.').map(Number)
  const pa = parse(a)
  const pb = parse(b)
  for (let i = 0; i < 3; i++) {
    const na = pa[i] || 0
    const nb = pb[i] || 0
    if (na < nb) return -1
    if (na > nb) return 1
  }
  return 0
}
