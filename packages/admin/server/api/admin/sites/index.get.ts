import { eq, like, or, desc, count, isNotNull, isNull, and, gte } from 'drizzle-orm'
import { useAdminDb, users, sites, subscriptions, siteUsers } from "~~/server/utils/admin-db"

/**
 * Compare two version strings semantically (e.g. "1.10.5" vs "1.9.0").
 * Returns negative if a < b, 0 if equal, positive if a > b.
 */
function compareVersions(a: string, b: string): number {
  const aParts = a.split('.').map(s => parseInt(s, 10) || 0)
  const bParts = b.split('.').map(s => parseInt(s, 10) || 0)
  const len = Math.max(aParts.length, bParts.length)
  for (let i = 0; i < len; i++) {
    const diff = (aParts[i] ?? 0) - (bParts[i] ?? 0)
    if (diff !== 0) return diff
  }
  return 0
}

/**
 * GET /api/admin/sites
 * Returns paginated list of sites with filtering and search
 *
 * Query params:
 * - page: number (default: 1)
 * - limit: number (default: 20)
 * - search: string (search in site name, URL)
 * - filter: 'verified' | 'has_subscription' (filter by site status)
 * - vf_field: 'create' | 'wp' | 'php' — version field to filter
 * - vf_op: 'lt' | 'lte' | 'eq' | 'gte' | 'gt' | 'between' — comparison operator
 * - vf_value: string — version to compare against
 * - vf_value2: string — upper bound for 'between'
 * - activity: 'active_7d' | 'active_30d' | 'never_active' (filter by last_active_at)
 */
export default defineEventHandler(async (event) => {
  // Check admin session
  const session = await getUserSession(event)
  if (!session?.user) {
    throw createError({
      statusCode: 401,
      message: 'Unauthorized',
    })
  }

  const db = useAdminDb(event)

  try {
    // Get query parameters
    const query = getQuery(event)
    const page = Math.max(1, Number(query.page) || 1)
    const limit = Math.min(100, Math.max(1, Number(query.limit) || 20))
    const search = query.search as string | undefined
    const filter = query.filter as string | undefined
    const activityFilter = query.activity as string | undefined
    const vfField = query.vf_field as string | undefined
    const vfOp = query.vf_op as string | undefined
    const vfValue = query.vf_value as string | undefined
    const vfValue2 = query.vf_value2 as string | undefined
    const hasVersionFilter = !!(vfField && vfOp && vfValue)
    const offset = (page - 1) * limit

    // Build SQL-level where conditions (search + activity — version uses JS comparison)
    const conditions: any[] = []

    if (search) {
      const searchPattern = `%${search}%`
      conditions.push(
        or(
          like(sites.name, searchPattern),
          like(sites.url, searchPattern)
        )
      )
    }

    if (activityFilter === 'active_7d') {
      const cutoff = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
      conditions.push(gte(sites.last_active_at, cutoff))
    } else if (activityFilter === 'active_30d') {
      const cutoff = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
      conditions.push(gte(sites.last_active_at, cutoff))
    } else if (activityFilter === 'never_active') {
      conditions.push(isNull(sites.last_active_at))
    }

    // Build base query
    let sitesQuery = db
      .select({
        id: sites.id,
        name: sites.name,
        url: sites.url,
        user_id: sites.user_id,
        create_version: sites.create_version,
        wp_version: sites.wp_version,
        php_version: sites.php_version,
        last_active_at: sites.last_active_at,
        createdAt: sites.createdAt,
        updatedAt: sites.updatedAt,
        ownerEmail: users.email,
        ownerFirstname: users.firstname,
        ownerLastname: users.lastname,
      })
      .from(sites)
      .innerJoin(users, eq(sites.user_id, users.id))

    if (conditions.length > 0) {
      sitesQuery = sitesQuery.where(and(...conditions)) as any
    }

    // When a version filter is active, fetch all matching rows first (for accurate pagination)
    // otherwise use DB-level pagination for efficiency
    let sitesList: typeof sitesQuery extends { then: any } ? never : Awaited<ReturnType<typeof sitesQuery.execute>>
    let total: number

    if (hasVersionFilter) {
      const allRows = await sitesQuery.orderBy(desc(sites.createdAt))
      // Apply semantic version filter in JS
      const versionFieldMap: Record<string, 'create_version' | 'wp_version' | 'php_version'> = {
        create: 'create_version',
        wp: 'wp_version',
        php: 'php_version',
      }
      const dbField = versionFieldMap[vfField!] ?? 'php_version'

      const filtered = allRows.filter((site) => {
        const siteVersion = site[dbField]
        if (!siteVersion) return false
        const cmp = compareVersions(siteVersion, vfValue!)
        switch (vfOp) {
          case 'lt': return cmp < 0
          case 'lte': return cmp <= 0
          case 'eq': return cmp === 0
          case 'gte': return cmp >= 0
          case 'gt': return cmp > 0
          case 'between':
            if (!vfValue2) return false
            return cmp >= 0 && compareVersions(siteVersion, vfValue2) <= 0
          default: return true
        }
      })

      total = filtered.length
      sitesList = filtered.slice(offset, offset + limit) as any
    } else {
      // DB-level count + pagination
      let countQuery = db.select({ count: count() }).from(sites)
      if (conditions.length > 0) {
        countQuery = countQuery.where(and(...conditions)) as any
      }
      const countResult = await countQuery
      total = countResult[0]?.count || 0
      sitesList = await sitesQuery.orderBy(desc(sites.createdAt)).limit(limit).offset(offset) as any
    }

    const totalPages = Math.ceil(total / limit)

    // For each site, get users count, subscription info, and verified status
    const sitesWithDetails = await Promise.all(
      (sitesList as any[]).map(async (site) => {
        const usersCountResult = await db
          .select({ count: count() })
          .from(siteUsers)
          .where(eq(siteUsers.site_id, site.id))
        const usersCount = usersCountResult[0]?.count || 0

        const verifiedResult = await db
          .select({ verified_at: siteUsers.verified_at })
          .from(siteUsers)
          .where(eq(siteUsers.site_id, site.id))
          .where(isNotNull(siteUsers.verified_at))
          .limit(1)
        const isVerified = verifiedResult.length > 0

        const subscriptionResult = await db
          .select({
            id: subscriptions.id,
            status: subscriptions.status,
            tier: subscriptions.tier,
          })
          .from(subscriptions)
          .where(eq(subscriptions.site_id, site.id))
          .limit(1)

        const subscription = subscriptionResult[0] || null

        let displayName = site.name
        if (!displayName && site.url) {
          try {
            displayName = new URL(site.url).hostname
          } catch {
            displayName = site.url
          }
        }

        return {
          id: site.id,
          name: displayName || '',
          url: site.url || '',
          versions: {
            create: site.create_version || null,
            wordpress: site.wp_version || null,
            php: site.php_version || null,
          },
          lastActiveAt: site.last_active_at || null,
          owner: {
            id: site.user_id,
            email: site.ownerEmail,
            firstname: site.ownerFirstname,
            lastname: site.ownerLastname,
          },
          usersCount,
          subscription: subscription ? {
            tier: subscription.tier,
            status: subscription.status,
          } : null,
          isVerified,
          createdAt: site.createdAt,
        }
      })
    )

    // Apply post-fetch filters (verified/subscription require additional queries)
    let filteredSites = sitesWithDetails

    if (filter === 'verified') {
      filteredSites = sitesWithDetails.filter(s => s.isVerified)
    } else if (filter === 'has_subscription') {
      filteredSites = sitesWithDetails.filter(s => s.subscription !== null && s.subscription.tier !== 'free')
    }

    return {
      data: filteredSites,
      pagination: {
        page,
        limit,
        total,
        totalPages,
      },
    }
  } catch (error) {
    console.error('Error fetching sites:', error)
    throw createError({
      statusCode: 500,
      message: 'Failed to fetch sites',
    })
  }
})
