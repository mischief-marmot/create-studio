import { eq, desc, count } from 'drizzle-orm'
import { users, sites, subscriptions, siteUsers, auditLogs } from "~~/server/utils/db"

/**
 * GET /api/admin/users/[id]
 * Returns detailed information about a specific user
 *
 * Includes:
 * - User basic info
 * - Associated sites with verification status
 * - Subscription information
 * - Audit log summary
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

  const db = hubDatabase()
  const userId = parseInt(event.context.params?.id || '0')

  if (!userId || isNaN(userId)) {
    throw createError({
      statusCode: 400,
      message: 'Invalid user ID',
    })
  }

  try {
    // Get user details
    const userResult = await db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1)

    if (userResult.length === 0) {
      throw createError({
        statusCode: 404,
        message: 'User not found',
      })
    }

    const user = userResult[0]

    // Get user's sites with verification status
    const userSites = await db
      .select({
        id: sites.id,
        name: sites.name,
        url: sites.url,
        createdAt: sites.createdAt,
        verifiedAt: siteUsers.verified_at,
        role: siteUsers.role,
        create_version: sites.create_version,
        wp_version: sites.wp_version,
      })
      .from(sites)
      .leftJoin(siteUsers, eq(sites.id, siteUsers.site_id))
      .where(eq(sites.user_id, userId))
      .orderBy(desc(sites.createdAt))

    // Get subscription info for user's sites
    const userSubscriptions = await db
      .select({
        siteId: subscriptions.site_id,
        status: subscriptions.status,
        tier: subscriptions.tier,
        current_period_start: subscriptions.current_period_start,
        current_period_end: subscriptions.current_period_end,
        cancel_at_period_end: subscriptions.cancel_at_period_end,
      })
      .from(subscriptions)
      .innerJoin(sites, eq(subscriptions.site_id, sites.id))
      .where(eq(sites.user_id, userId))

    // Get audit log summary for this user
    const auditLogCountResult = await db
      .select({ count: count() })
      .from(auditLogs)
      .where(eq(auditLogs.entity_type, 'user'))
      .where(eq(auditLogs.entity_id, userId))
    const totalAuditActions = auditLogCountResult[0]?.count || 0

    // Get last audit action
    const lastAuditAction = await db
      .select({
        action: auditLogs.action,
        createdAt: auditLogs.createdAt,
      })
      .from(auditLogs)
      .where(eq(auditLogs.entity_type, 'user'))
      .where(eq(auditLogs.entity_id, userId))
      .orderBy(desc(auditLogs.createdAt))
      .limit(1)

    return {
      id: user.id,
      email: user.email,
      firstname: user.firstname,
      lastname: user.lastname,
      avatar: user.avatar,
      validEmail: user.validEmail,
      mediavine_publisher: user.mediavine_publisher,
      marketing_opt_in: user.marketing_opt_in,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      sites: userSites.map(site => ({
        id: site.id,
        name: site.name,
        url: site.url,
        createdAt: site.createdAt,
        verifiedAt: site.verifiedAt,
        role: site.role,
        isVerified: !!site.verifiedAt,
        versions: {
          create: site.create_version,
          wordpress: site.wp_version,
        },
        // Add subscription info if exists
        subscription: userSubscriptions.find(sub => sub.siteId === site.id) || null,
      })),
      auditLogSummary: {
        totalActions: totalAuditActions,
        lastAction: lastAuditAction.length > 0 ? {
          action: lastAuditAction[0].action,
          timestamp: lastAuditAction[0].createdAt,
        } : null,
      },
    }
  } catch (error) {
    // If it's already a createError, re-throw it
    if (error && typeof error === 'object' && 'statusCode' in error) {
      throw error
    }

    console.error('Error fetching user details:', error)
    throw createError({
      statusCode: 500,
      message: 'Failed to fetch user details',
    })
  }
})
