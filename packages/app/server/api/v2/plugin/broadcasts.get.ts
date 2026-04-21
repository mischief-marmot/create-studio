import { eq, and, gte, or, isNull, desc } from 'drizzle-orm'
import { broadcasts, sites } from '~~/server/db/schema'
import { SiteUserRepository } from '~~/server/utils/database'

/**
 * GET /api/v2/plugin/broadcasts?tier={tier}&create_version={version}&site_token={token}
 *
 * Returns active broadcasts for the Create plugin.
 *
 * Site identification (best-effort, used for cohort filtering):
 *   1. `site_token` query param — decoded via SiteUserRepository
 *   2. User-Agent header — WordPress's default format is
 *      "WordPress/X.Y; https://site-url.com". Extract the URL and look it
 *      up in the Sites table.
 *   Without either, cohort-targeted broadcasts are excluded.
 */
export default defineEventHandler(async (event) => {
  // Response varies per polling site (cohort filter + UA-based resolution),
  // so it must NOT be shared across CDN/proxy caches. Keep a short private
  // cache so a single plugin can't hammer the origin. The plugin already
  // wraps this call in a 5-minute WordPress transient.
  setResponseHeaders(event, {
    'Cache-Control': 'private, max-age=60',
  })

  const query = getQuery(event)
  const tier = (query.tier as string) || 'free'
  const createVersion = query.create_version as string | undefined
  const siteToken = query.site_token as string | undefined

  let resolvedSiteId: number | null = null

  if (siteToken) {
    try {
      const siteUserRepo = new SiteUserRepository()
      const row = await siteUserRepo.findByUserToken(siteToken)
      if (row?.site_id) resolvedSiteId = row.site_id
    } catch {
      // Swallow — fall through to UA parsing.
    }
  }

  if (resolvedSiteId == null) {
    const ua = getHeader(event, 'user-agent')
    const extractedUrl = extractSiteUrlFromUA(ua)
    if (extractedUrl) {
      try {
        for (const candidate of urlCandidates(extractedUrl)) {
          const row = await db
            .select({ id: sites.id, canonical_site_id: sites.canonical_site_id })
            .from(sites)
            .where(eq(sites.url, candidate))
            .limit(1)
            .all()
          if (row.length > 0) {
            resolvedSiteId = row[0].canonical_site_id ?? row[0].id
            break
          }
        }
      } catch {
        // Swallow — cohort broadcasts will be excluded.
      }
    }
  }

  const now = new Date().toISOString()

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

  const filtered = results.filter((b) => {
    const cohort = (b.targeting as { cohort_site_ids?: number[] } | null)?.cohort_site_ids
    const isCohortTargeted = b.campaign_key != null || Array.isArray(cohort)

    if (isCohortTargeted) {
      if (resolvedSiteId == null) return false
      return Array.isArray(cohort) && cohort.includes(resolvedSiteId)
    }

    const tiers = b.target_tiers as string[] | null
    if (tiers && !tiers.includes('all') && !tiers.includes(tier)) return false

    if (createVersion) {
      if (b.target_create_version_min && compareSemver(createVersion, b.target_create_version_min) < 0) return false
      if (b.target_create_version_max && compareSemver(createVersion, b.target_create_version_max) > 0) return false
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

/**
 * Extract the site URL from a WordPress-style User-Agent header.
 * WP core sends: "WordPress/{version}; {home_url}"
 * e.g. "WordPress/6.9.1; http://create.test" or "WordPress/6.4; https://smittenkitchen.com/"
 * Returns null if the UA doesn't match the WordPress pattern.
 */
function extractSiteUrlFromUA(ua: string | undefined): string | null {
  if (!ua) return null
  const match = /WordPress\/[^;]+;\s*(https?:\/\/[^\s,;]+)/i.exec(ua)
  return match ? match[1] : null
}

/**
 * Produce candidate URL strings to match against `Sites.url`, which may be
 * stored with or without a trailing slash, in mixed case, etc.
 */
function urlCandidates(raw: string): string[] {
  const trimmed = raw.trim()
  const withoutTrailingSlash = trimmed.replace(/\/+$/, '')
  const withTrailingSlash = withoutTrailingSlash + '/'
  const set = new Set([
    trimmed,
    withoutTrailingSlash,
    withTrailingSlash,
    withoutTrailingSlash.toLowerCase(),
    withTrailingSlash.toLowerCase(),
  ])
  return [...set]
}
