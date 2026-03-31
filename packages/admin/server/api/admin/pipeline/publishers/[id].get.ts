/**
 * GET /api/admin/pipeline/publishers/:id
 *
 * Returns a single publisher with their full plugin stack and derived stats.
 */
import { eq } from 'drizzle-orm'
import { useAdminOpsDb, publishers, contacts, plugins, publisherPlugins } from '~~/server/utils/admin-ops-db'

export default defineEventHandler(async (event) => {
  const session = await getUserSession(event)
  if (!session?.user) {
    throw createError({ statusCode: 401, message: 'Unauthorized' })
  }

  const id = Number(event.context.params?.id)
  if (!id || Number.isNaN(id)) {
    throw createError({ statusCode: 400, message: 'Invalid publisher ID' })
  }

  const db = useAdminOpsDb(event)

  // Fetch publisher with contact info
  const rows = await db.select({
    publisher: publishers,
    contactEmail: contacts.email,
    contactName: contacts.name,
    contactSource: contacts.source,
  })
    .from(publishers)
    .leftJoin(contacts, eq(publishers.contactId, contacts.id))
    .where(eq(publishers.id, id))
    .limit(1)

  if (rows.length === 0) {
    throw createError({ statusCode: 404, message: 'Publisher not found' })
  }

  const row = rows[0]

  // Fetch plugins for this publisher
  const pluginRows = await db.select({
    namespace: plugins.namespace,
    name: plugins.name,
    category: plugins.category,
    isPaid: plugins.isPaid,
    isCompetitor: plugins.isCompetitor,
    replaceableByCreate: plugins.replaceableByCreate,
    wpSlug: plugins.wpSlug,
    wpUrl: plugins.wpUrl,
    homepageUrl: plugins.homepageUrl,
    description: plugins.description,
    activeInstalls: plugins.activeInstalls,
    rating: plugins.rating,
  })
    .from(publisherPlugins)
    .innerJoin(plugins, eq(publisherPlugins.pluginId, plugins.id))
    .where(eq(publisherPlugins.publisherId, id))

  // Deduplicate plugins by base namespace
  const seen = new Set<string>()
  const dedupedPlugins = pluginRows.filter((p) => {
    const base = (p.namespace.split('/')[0] || p.namespace).toLowerCase()
    if (seen.has(base)) return false
    seen.add(base)
    return true
  })

  // Compute derived stats
  const now = new Date()
  const newestPostDate = row.publisher.newestPostDate ? new Date(row.publisher.newestPostDate) : null
  const oldestPostDate = row.publisher.oldestPostDate ? new Date(row.publisher.oldestPostDate) : null

  const daysSinceNewest = newestPostDate
    ? (now.getTime() - newestPostDate.getTime()) / (1000 * 60 * 60 * 24)
    : null

  const monthsSinceOldest = oldestPostDate
    ? (now.getTime() - oldestPostDate.getTime()) / (1000 * 60 * 60 * 24 * 30.44)
    : null

  const yearsSinceOldest = oldestPostDate
    ? (now.getTime() - oldestPostDate.getTime()) / (1000 * 60 * 60 * 24 * 365.25)
    : null

  const isActive = daysSinceNewest !== null ? daysSinceNewest <= 90 : false
  const yearsPublishing = yearsSinceOldest !== null ? Math.round(yearsSinceOldest * 10) / 10 : null
  const postsPerMonth = monthsSinceOldest && monthsSinceOldest > 0 && row.publisher.postCount
    ? Math.round((row.publisher.postCount / monthsSinceOldest) * 10) / 10
    : null

  const paidPluginCount = dedupedPlugins.filter((p) => p.isPaid).length
  const competitorPluginCount = dedupedPlugins.filter((p) => p.isCompetitor).length
  const replaceablePluginCount = dedupedPlugins.filter((p) => p.replaceableByCreate).length

  return {
    publisher: {
      ...row.publisher,
      contactEmail: row.contactEmail,
      contactName: row.contactName,
      contactSource: row.contactSource,
    },
    plugins: dedupedPlugins,
    stats: {
      isActive,
      yearsPublishing,
      postsPerMonth,
      paidPluginCount,
      competitorPluginCount,
      replaceablePluginCount,
    },
  }
})
