import { eq, and } from 'drizzle-orm'
import { useAdminDb, broadcasts, sites, subscriptions } from '~~/server/utils/admin-db'
import { useAdminOpsDb, auditLogs, getAuditEnvironment } from '~~/server/utils/admin-ops-db'

/**
 * POST /api/admin/broadcasts/:id/cohort
 *
 * Build (or preview) a cohort for a broadcast. The cohort site IDs are
 * written to the broadcast's `targeting.cohort_site_ids` JSON field.
 *
 * Body:
 *   version_min?: string
 *   version_max?: string
 *   tiers?: string[]   // any of 'free' | 'free-plus' | 'pro' | 'trial' | 'all'
 *   limit: number      // capped at 5000
 *   order?: 'oldest' | 'newest' | 'alphabetical' | 'random_seeded'
 *   dry_run?: boolean  // when true, compute but do not persist
 *
 * Response:
 *   { cohort_size, total_eligible, excluded_count, sample_sites, persisted }
 */
export default defineEventHandler(async (event) => {
  const session = await getUserSession(event)
  if (!session?.user) {
    throw createError({ statusCode: 401, message: 'Unauthorized' })
  }

  const db = useAdminDb(event)
  const id = Number(getRouterParam(event, 'id'))
  if (!id || isNaN(id)) {
    throw createError({ statusCode: 400, message: 'Invalid broadcast ID' })
  }

  const broadcastRows = await db.select().from(broadcasts).where(eq(broadcasts.id, id)).limit(1)
  if (broadcastRows.length === 0) {
    throw createError({ statusCode: 404, message: 'Broadcast not found' })
  }
  const current = broadcastRows[0]
  if (!current.campaign_key) {
    throw createError({
      statusCode: 400,
      message: 'Broadcast has no campaign_key. Set one before building a cohort.',
    })
  }

  const body = await readBody(event).catch(() => ({} as any))
  const versionMin = typeof body.version_min === 'string' && body.version_min ? body.version_min : null
  const versionMax = typeof body.version_max === 'string' && body.version_max ? body.version_max : null
  const tiersIn = Array.isArray(body.tiers) ? body.tiers.filter((t: any) => typeof t === 'string') : []
  const rawLimit = Number(body.limit)
  const limit = Math.min(5000, Math.max(1, isNaN(rawLimit) ? 500 : rawLimit))
  const order = (['oldest', 'newest', 'alphabetical', 'random_seeded'].includes(body.order)
    ? body.order
    : 'oldest') as 'oldest' | 'newest' | 'alphabetical' | 'random_seeded'
  const dryRun = !!body.dry_run

  // 1. Fetch sites joined with subscription info so we can derive tier.
  //    Include canonical_site_id so we can store canonical IDs in the cohort
  //    (the pull endpoint resolves polls to `canonical_site_id ?? id`, so
  //    storing raw non-canonical IDs would silently miss all traffic).
  const siteRows = await db
    .select({
      id: sites.id,
      canonical_site_id: sites.canonical_site_id,
      url: sites.url,
      name: sites.name,
      create_version: sites.create_version,
      createdAt: sites.createdAt,
      sub_status: subscriptions.status,
      sub_tier: subscriptions.tier,
      sub_trial_end: subscriptions.trial_end,
    })
    .from(sites)
    .leftJoin(subscriptions, eq(subscriptions.site_id, sites.id))
    .all()

  // 2. Derive effective tier and apply tier + version filters.
  const effectiveTier = (sub_status: string | null, sub_tier: string | null, trial_end: string | null) => {
    if (!sub_status) return 'free'
    if (sub_status === 'active') return sub_tier || 'free'
    if (sub_status === 'trialing') {
      const expired = !!trial_end && new Date(trial_end) <= new Date()
      return expired ? 'free' : 'trial'
    }
    return 'free'
  }

  const tierAllowed = tiersIn.length === 0 || tiersIn.includes('all')
  const mapped = siteRows
    .map(r => ({
      id: r.canonical_site_id ?? r.id,
      url: r.url,
      name: r.name,
      create_version: r.create_version,
      createdAt: r.createdAt,
      tier: effectiveTier(r.sub_status, r.sub_tier, r.sub_trial_end),
    }))
    .filter(s => {
      if (!tierAllowed && !tiersIn.includes(s.tier)) return false
      if (versionMin && (!s.create_version || compareSemver(s.create_version, versionMin) < 0)) return false
      if (versionMax && (!s.create_version || compareSemver(s.create_version, versionMax) > 0)) return false
      return true
    })

  // Dedupe by canonical id — a single canonical site may appear multiple
  // times here if it has duplicate rows that each match the criteria.
  const seen = new Set<number>()
  let eligible = mapped.filter(s => {
    if (seen.has(s.id)) return false
    seen.add(s.id)
    return true
  })

  // 3. Build exclusion set from peer broadcasts sharing this campaign_key.
  const peers = await db
    .select({ id: broadcasts.id, targeting: broadcasts.targeting })
    .from(broadcasts)
    .where(eq(broadcasts.campaign_key, current.campaign_key))
    .all()

  const exclusion = new Set<number>()
  for (const p of peers) {
    if (p.id === id) continue
    const ids = (p.targeting as any)?.cohort_site_ids
    if (Array.isArray(ids)) for (const sid of ids) exclusion.add(Number(sid))
  }

  const totalEligible = eligible.length
  const beforeExclusion = eligible.length
  eligible = eligible.filter(s => !exclusion.has(s.id))
  const excludedCount = beforeExclusion - eligible.length

  // 4. Sort per `order`.
  if (order === 'oldest') {
    eligible.sort((a, b) => (a.createdAt || '').localeCompare(b.createdAt || ''))
  } else if (order === 'newest') {
    eligible.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''))
  } else if (order === 'alphabetical') {
    eligible.sort((a, b) => (a.url || '').localeCompare(b.url || ''))
  } else if (order === 'random_seeded') {
    eligible = deterministicShuffle(eligible, current.campaign_key)
  }

  // 5. Take first N.
  const cohort = eligible.slice(0, limit)
  const cohortIds = cohort.map(s => s.id)

  // 6. Persist (unless dry run).
  if (!dryRun) {
    const existingTargeting = (current.targeting as Record<string, any> | null) || {}
    const newTargeting = { ...existingTargeting, cohort_site_ids: cohortIds }
    const now = new Date().toISOString()
    await db
      .update(broadcasts)
      .set({ targeting: newTargeting, updatedAt: now })
      .where(eq(broadcasts.id, id))

    try {
      const adminOpsDb = useAdminOpsDb(event)
      await adminOpsDb.insert(auditLogs).values({
        admin_id: session.user.id,
        action: 'broadcast_cohort_built',
        entity_type: 'broadcast',
        entity_id: id,
        environment: getAuditEnvironment(event),
        changes: JSON.stringify({
          campaign_key: current.campaign_key,
          cohort_size: cohortIds.length,
          total_eligible: totalEligible,
          excluded_count: excludedCount,
          order,
          limit,
          version_min: versionMin,
          version_max: versionMax,
          tiers: tiersIn,
        }),
        ip_address: getRequestIP(event) || null,
        user_agent: getHeader(event, 'user-agent') || null,
        createdAt: now,
      })
    } catch (e) {
      console.warn('Failed to audit cohort build:', e)
    }
  }

  return {
    cohort_size: cohortIds.length,
    total_eligible: totalEligible,
    excluded_count: excludedCount,
    sample_sites: cohort.slice(0, 10).map(s => ({
      id: s.id,
      url: s.url,
      create_version: s.create_version,
      tier: s.tier,
    })),
    persisted: !dryRun,
  }
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

/** Deterministic Fisher-Yates using Mulberry32 seeded from the campaign_key. */
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
