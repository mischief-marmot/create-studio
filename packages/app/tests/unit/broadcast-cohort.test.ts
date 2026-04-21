import { describe, it, expect } from 'vitest'

/**
 * Broadcast Cohorts — Unit Tests
 *
 * These tests mirror the pure logic used by:
 *   - Cohort builder: packages/admin/server/api/admin/broadcasts/[id]/cohort.post.ts
 *   - Pull endpoint:  packages/app/server/api/v2/plugin/broadcasts.get.ts
 *
 * The pure functions are duplicated here so the tests don't need a full DB
 * harness. If the server implementations diverge from these, update both.
 */

// ── Types ───────────────────────────────────────────────────────────────────

interface EligibleSite {
  id: number
  url: string
  create_version: string | null
  createdAt: string
  tier: string
}

interface BroadcastWithTargeting {
  id: number
  campaign_key: string | null
  targeting: { cohort_site_ids?: number[] } | null
  target_tiers: string[] | null
  target_create_version_min: string | null
  target_create_version_max: string | null
}

// ── Pure functions mirroring the server logic ───────────────────────────────

function compareSemver(a: string, b: string): number {
  const parse = (v: string) => v.replace(/[^0-9.]/g, '').split('.').map(Number)
  const pa = parse(a), pb = parse(b)
  for (let i = 0; i < 3; i++) {
    const na = pa[i] || 0, nb = pb[i] || 0
    if (na < nb) return -1
    if (na > nb) return 1
  }
  return 0
}

function deterministicShuffle<T>(arr: T[], seed: string): T[] {
  const out = [...arr]
  let h = 2166136261
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  let s = h >>> 0
  const rand = () => {
    s = (s + 0x6D2B79F5) >>> 0
    let t = s
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1))
    ;[out[i], out[j]] = [out[j], out[i]]
  }
  return out
}

function buildCohort(params: {
  eligible: EligibleSite[]
  peers: BroadcastWithTargeting[]
  currentBroadcastId: number
  tiers: string[]
  versionMin?: string
  versionMax?: string
  limit: number
  order: 'oldest' | 'newest' | 'alphabetical' | 'random_seeded'
  seed: string
}): { cohort: EligibleSite[]; excluded: number; totalEligible: number } {
  const tierAllowed = params.tiers.length === 0 || params.tiers.includes('all')
  let list = params.eligible.filter(s => {
    if (!tierAllowed && !params.tiers.includes(s.tier)) return false
    if (params.versionMin && (!s.create_version || compareSemver(s.create_version, params.versionMin) < 0)) return false
    if (params.versionMax && (!s.create_version || compareSemver(s.create_version, params.versionMax) > 0)) return false
    return true
  })
  const totalEligible = list.length

  const exclusion = new Set<number>()
  for (const p of params.peers) {
    if (p.id === params.currentBroadcastId) continue
    const ids = p.targeting?.cohort_site_ids
    if (Array.isArray(ids)) for (const sid of ids) exclusion.add(sid)
  }
  const before = list.length
  list = list.filter(s => !exclusion.has(s.id))
  const excluded = before - list.length

  if (params.order === 'oldest') list.sort((a, b) => a.createdAt.localeCompare(b.createdAt))
  else if (params.order === 'newest') list.sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  else if (params.order === 'alphabetical') list.sort((a, b) => a.url.localeCompare(b.url))
  else if (params.order === 'random_seeded') list = deterministicShuffle(list, params.seed)

  return { cohort: list.slice(0, params.limit), excluded, totalEligible }
}

function pullFilter(params: {
  broadcast: {
    campaign_key?: string | null
    targeting: { cohort_site_ids?: number[] } | null
    target_tiers: string[] | null
    target_create_version_min: string | null
    target_create_version_max: string | null
  }
  tier: string
  createVersion?: string
  resolvedSiteId: number | null
}): boolean {
  const cohort = params.broadcast.targeting?.cohort_site_ids
  const isCohortTargeted = params.broadcast.campaign_key != null || Array.isArray(cohort)
  if (isCohortTargeted) {
    if (params.resolvedSiteId == null) return false
    return Array.isArray(cohort) && cohort.includes(params.resolvedSiteId)
  }
  const tiers = params.broadcast.target_tiers
  if (tiers && !tiers.includes('all') && !tiers.includes(params.tier)) return false
  if (params.createVersion) {
    if (params.broadcast.target_create_version_min && compareSemver(params.createVersion, params.broadcast.target_create_version_min) < 0) return false
    if (params.broadcast.target_create_version_max && compareSemver(params.createVersion, params.broadcast.target_create_version_max) > 0) return false
  }
  return true
}

function extractSiteUrlFromUA(ua: string | undefined): string | null {
  if (!ua) return null
  const match = /WordPress\/[^;]+;\s*(https?:\/\/[^\s,;]+)/i.exec(ua)
  return match ? match[1] : null
}

function urlCandidates(raw: string): string[] {
  const trimmed = raw.trim()
  const withoutTrailingSlash = trimmed.replace(/\/+$/, '')
  const withTrailingSlash = withoutTrailingSlash + '/'
  return [...new Set([
    trimmed,
    withoutTrailingSlash,
    withTrailingSlash,
    withoutTrailingSlash.toLowerCase(),
    withTrailingSlash.toLowerCase(),
  ])]
}

// ── Fixtures ────────────────────────────────────────────────────────────────

const makeSite = (
  id: number,
  tier = 'pro',
  version: string | null = '2.1.0',
  createdAt = '2025-01-01T00:00:00Z',
  url = `https://site${id}.test`,
): EligibleSite => ({
  id, url, create_version: version, createdAt, tier,
})

// ── Cohort builder tests ────────────────────────────────────────────────────

describe('buildCohort — respects limit', () => {
  it('takes first N sites when more are eligible', () => {
    const eligible = Array.from({ length: 10 }, (_, i) => makeSite(i + 1))
    const { cohort } = buildCohort({
      eligible, peers: [], currentBroadcastId: 1,
      tiers: ['pro'], limit: 5, order: 'oldest', seed: 'k',
    })
    expect(cohort).toHaveLength(5)
  })

  it('returns all sites when fewer than the limit match', () => {
    const eligible = Array.from({ length: 3 }, (_, i) => makeSite(i + 1))
    const { cohort } = buildCohort({
      eligible, peers: [], currentBroadcastId: 1,
      tiers: ['pro'], limit: 500, order: 'oldest', seed: 'k',
    })
    expect(cohort).toHaveLength(3)
  })
})

describe('buildCohort — exclusion by peer campaign_key', () => {
  it('excludes sites already assigned to another broadcast with the same campaign_key', () => {
    const eligible = Array.from({ length: 10 }, (_, i) => makeSite(i + 1))
    const peer: BroadcastWithTargeting = {
      id: 99, campaign_key: 'survey-2026-q2',
      targeting: { cohort_site_ids: [1, 2, 3] },
      target_tiers: null, target_create_version_min: null, target_create_version_max: null,
    }
    const { cohort, excluded } = buildCohort({
      eligible, peers: [peer], currentBroadcastId: 1,
      tiers: ['pro'], limit: 100, order: 'oldest', seed: 'k',
    })
    expect(excluded).toBe(3)
    expect(cohort.map(s => s.id)).toEqual([4, 5, 6, 7, 8, 9, 10])
  })

  it('does NOT exclude itself from its own peer list (so rebuild is idempotent)', () => {
    const eligible = Array.from({ length: 5 }, (_, i) => makeSite(i + 1))
    const self: BroadcastWithTargeting = {
      id: 1, campaign_key: 'survey-2026-q2',
      targeting: { cohort_site_ids: [1, 2, 3] },
      target_tiers: null, target_create_version_min: null, target_create_version_max: null,
    }
    const { cohort } = buildCohort({
      eligible, peers: [self], currentBroadcastId: 1,
      tiers: ['pro'], limit: 100, order: 'oldest', seed: 'k',
    })
    expect(cohort).toHaveLength(5)
  })
})

describe('buildCohort — order semantics', () => {
  it('oldest returns sites sorted by createdAt ASC', () => {
    const eligible = [
      makeSite(1, 'pro', '2.1.0', '2025-06-01T00:00:00Z'),
      makeSite(2, 'pro', '2.1.0', '2025-01-01T00:00:00Z'),
      makeSite(3, 'pro', '2.1.0', '2025-03-01T00:00:00Z'),
    ]
    const { cohort } = buildCohort({
      eligible, peers: [], currentBroadcastId: 1,
      tiers: ['pro'], limit: 10, order: 'oldest', seed: 'k',
    })
    expect(cohort.map(s => s.id)).toEqual([2, 3, 1])
  })

  it('random_seeded is deterministic for the same seed', () => {
    const eligible = Array.from({ length: 20 }, (_, i) => makeSite(i + 1))
    const run = () => buildCohort({
      eligible, peers: [], currentBroadcastId: 1,
      tiers: ['pro'], limit: 20, order: 'random_seeded', seed: 'survey-2026-q2',
    }).cohort.map(s => s.id)
    expect(run()).toEqual(run())
  })

  it('random_seeded with different seeds produces different orderings', () => {
    const eligible = Array.from({ length: 20 }, (_, i) => makeSite(i + 1))
    const a = buildCohort({ eligible, peers: [], currentBroadcastId: 1, tiers: ['pro'], limit: 20, order: 'random_seeded', seed: 'a' }).cohort.map(s => s.id)
    const b = buildCohort({ eligible, peers: [], currentBroadcastId: 1, tiers: ['pro'], limit: 20, order: 'random_seeded', seed: 'b' }).cohort.map(s => s.id)
    expect(a).not.toEqual(b)
  })
})

describe('buildCohort — tier and version filters', () => {
  it('filters by tier', () => {
    const eligible = [makeSite(1, 'pro'), makeSite(2, 'free'), makeSite(3, 'pro')]
    const { cohort } = buildCohort({
      eligible, peers: [], currentBroadcastId: 1,
      tiers: ['pro'], limit: 10, order: 'oldest', seed: 'k',
    })
    expect(cohort.map(s => s.id)).toEqual([1, 3])
  })

  it('applies version_min as a lower bound', () => {
    const eligible = [
      makeSite(1, 'pro', '1.9.0'),
      makeSite(2, 'pro', '2.0.0'),
      makeSite(3, 'pro', '2.1.3'),
      makeSite(4, 'pro', null),
    ]
    const { cohort } = buildCohort({
      eligible, peers: [], currentBroadcastId: 1,
      tiers: ['pro'], versionMin: '2.0.0', limit: 10, order: 'oldest', seed: 'k',
    })
    expect(cohort.map(s => s.id)).toEqual([2, 3])
  })

  it('returns empty when no sites match', () => {
    const eligible = [makeSite(1, 'free'), makeSite(2, 'free')]
    const { cohort } = buildCohort({
      eligible, peers: [], currentBroadcastId: 1,
      tiers: ['pro'], limit: 10, order: 'oldest', seed: 'k',
    })
    expect(cohort).toHaveLength(0)
  })
})

// ── Pull-endpoint filter tests ──────────────────────────────────────────────

describe('pullFilter — cohort-targeted broadcasts', () => {
  it('returns the broadcast to a site inside the cohort', () => {
    const result = pullFilter({
      broadcast: {
        targeting: { cohort_site_ids: [101, 102, 103] },
        target_tiers: null, target_create_version_min: null, target_create_version_max: null,
      },
      tier: 'pro', createVersion: '2.1.0', resolvedSiteId: 102,
    })
    expect(result).toBe(true)
  })

  it('blocks a site outside the cohort', () => {
    const result = pullFilter({
      broadcast: {
        targeting: { cohort_site_ids: [101, 102, 103] },
        target_tiers: null, target_create_version_min: null, target_create_version_max: null,
      },
      tier: 'pro', createVersion: '2.1.0', resolvedSiteId: 999,
    })
    expect(result).toBe(false)
  })

  it('blocks when no site_token could be resolved', () => {
    const result = pullFilter({
      broadcast: {
        targeting: { cohort_site_ids: [101] },
        target_tiers: null, target_create_version_min: null, target_create_version_max: null,
      },
      tier: 'pro', createVersion: '2.1.0', resolvedSiteId: null,
    })
    expect(result).toBe(false)
  })

  it('empty cohort array excludes everyone (a cohort-targeted broadcast with 0 matches)', () => {
    // If a site has campaign_key set OR an explicit cohort_site_ids array,
    // the broadcast is cohort-targeted. An empty cohort means "nobody"
    // rather than "fall through to legacy" — otherwise an admin building
    // a cohort with zero matches would surprise-broadcast to everyone.
    const resolvedSite = pullFilter({
      broadcast: {
        campaign_key: 'survey-2026-q2',
        targeting: { cohort_site_ids: [] },
        target_tiers: ['all'], target_create_version_min: null, target_create_version_max: null,
      },
      tier: 'pro', createVersion: '2.1.0', resolvedSiteId: 42,
    })
    expect(resolvedSite).toBe(false)

    const noToken = pullFilter({
      broadcast: {
        campaign_key: 'survey-2026-q2',
        targeting: { cohort_site_ids: [] },
        target_tiers: ['all'], target_create_version_min: null, target_create_version_max: null,
      },
      tier: 'pro', createVersion: '2.1.0', resolvedSiteId: null,
    })
    expect(noToken).toBe(false)
  })

  it('broadcast with a campaign_key but no targeting yet excludes everyone', () => {
    // Before "Build cohort" is clicked — campaign_key is set but targeting
    // is null. We should NOT fall through to legacy, because the admin
    // clearly intends this to be cohort-targeted.
    const result = pullFilter({
      broadcast: {
        campaign_key: 'survey-2026-q2',
        targeting: null,
        target_tiers: ['all'], target_create_version_min: null, target_create_version_max: null,
      },
      tier: 'pro', createVersion: '2.1.0', resolvedSiteId: 42,
    })
    expect(result).toBe(false)
  })
})

describe('pullFilter — legacy tier/version behavior unchanged', () => {
  it('matches "all" tier by default', () => {
    const result = pullFilter({
      broadcast: { targeting: null, target_tiers: ['all'], target_create_version_min: null, target_create_version_max: null },
      tier: 'free', resolvedSiteId: null,
    })
    expect(result).toBe(true)
  })

  it('filters by specific tier', () => {
    const b = { targeting: null, target_tiers: ['pro'], target_create_version_min: null, target_create_version_max: null }
    expect(pullFilter({ broadcast: b, tier: 'pro', resolvedSiteId: null })).toBe(true)
    expect(pullFilter({ broadcast: b, tier: 'free', resolvedSiteId: null })).toBe(false)
  })

  it('applies version_min and version_max bounds', () => {
    const b = { targeting: null, target_tiers: ['all'], target_create_version_min: '2.0.0', target_create_version_max: '3.0.0' }
    expect(pullFilter({ broadcast: b, tier: 'pro', createVersion: '1.9.0', resolvedSiteId: null })).toBe(false)
    expect(pullFilter({ broadcast: b, tier: 'pro', createVersion: '2.1.0', resolvedSiteId: null })).toBe(true)
    expect(pullFilter({ broadcast: b, tier: 'pro', createVersion: '3.5.0', resolvedSiteId: null })).toBe(false)
  })
})

// ── User-Agent parsing (identifies the site without a token) ────────────────

describe('extractSiteUrlFromUA', () => {
  it('extracts URL from standard WP User-Agent', () => {
    expect(extractSiteUrlFromUA('WordPress/6.9.1; http://create.test')).toBe('http://create.test')
    expect(extractSiteUrlFromUA('WordPress/6.4.2; https://smittenkitchen.com')).toBe('https://smittenkitchen.com')
  })

  it('extracts URL when UA has a trailing slash', () => {
    expect(extractSiteUrlFromUA('WordPress/6.4.2; https://smittenkitchen.com/')).toBe('https://smittenkitchen.com/')
  })

  it('returns null when UA is missing or not WordPress', () => {
    expect(extractSiteUrlFromUA(undefined)).toBeNull()
    expect(extractSiteUrlFromUA('')).toBeNull()
    expect(extractSiteUrlFromUA('Mozilla/5.0 Chrome/120')).toBeNull()
    expect(extractSiteUrlFromUA('curl/8.0.0')).toBeNull()
  })

  it('is case-insensitive on the WordPress literal', () => {
    expect(extractSiteUrlFromUA('wordpress/6.4; https://example.com')).toBe('https://example.com')
  })
})

describe('urlCandidates', () => {
  it('includes the raw URL with and without trailing slash', () => {
    const out = urlCandidates('http://create.test')
    expect(out).toContain('http://create.test')
    expect(out).toContain('http://create.test/')
  })

  it('includes a lowercased variant', () => {
    const out = urlCandidates('https://Smitten-Kitchen.COM/')
    expect(out).toContain('https://smitten-kitchen.com')
    expect(out).toContain('https://smitten-kitchen.com/')
  })
})

// ── End-to-end scenarios from the spec ──────────────────────────────────────

describe('Two broadcasts with same campaign_key — exclusion works', () => {
  it('second build does not overlap with the first', () => {
    const eligible = Array.from({ length: 1000 }, (_, i) => makeSite(i + 1))

    const first = buildCohort({
      eligible, peers: [], currentBroadcastId: 1,
      tiers: ['pro'], limit: 500, order: 'oldest', seed: 's',
    })
    expect(first.cohort).toHaveLength(500)

    const firstPeer: BroadcastWithTargeting = {
      id: 1, campaign_key: 'survey-2026-q2',
      targeting: { cohort_site_ids: first.cohort.map(s => s.id) },
      target_tiers: null, target_create_version_min: null, target_create_version_max: null,
    }
    const second = buildCohort({
      eligible, peers: [firstPeer], currentBroadcastId: 2,
      tiers: ['pro'], limit: 500, order: 'oldest', seed: 's',
    })
    expect(second.cohort).toHaveLength(500)

    const firstIds = new Set(first.cohort.map(s => s.id))
    const overlap = second.cohort.filter(s => firstIds.has(s.id))
    expect(overlap).toHaveLength(0)
  })
})
