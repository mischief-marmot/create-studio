import { eq, and } from 'drizzle-orm'
import { sites, siteUsers } from '~~/server/utils/admin-db'
import { useAdminOpsDb, auditLogs, getAuditEnvironment } from '~~/server/utils/admin-ops-db'

/**
 * DELETE /api/admin/site-users/[siteId]/[userId]
 * Remove a user from a site
 *
 * Requirements:
 * - Cannot remove the site owner (user_id matches sites.user_id)
 * - Deletes the siteUser record
 * - Creates audit log entry 'site_user_removed'
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
  const siteId = parseInt(event.context.params?.siteId || '0')
  const userId = parseInt(event.context.params?.userId || '0')

  if (!siteId || isNaN(siteId)) {
    throw createError({
      statusCode: 400,
      message: 'Invalid site ID',
    })
  }

  if (!userId || isNaN(userId)) {
    throw createError({
      statusCode: 400,
      message: 'Invalid user ID',
    })
  }

  try {
    // Check if the user is the site owner
    const siteResult = await db
      .select({
        id: sites.id,
        user_id: sites.user_id,
        name: sites.name,
      })
      .from(sites)
      .where(eq(sites.id, siteId))
      .limit(1)

    if (siteResult.length === 0) {
      throw createError({
        statusCode: 404,
        message: 'Site not found',
      })
    }

    const site = siteResult[0]

    // Cannot remove the site owner
    if (site.user_id === userId) {
      throw createError({
        statusCode: 400,
        message: 'Cannot remove site owner',
      })
    }

    // Get the current siteUser record for audit log
    const siteUserResult = await db
      .select()
      .from(siteUsers)
      .where(
        and(
          eq(siteUsers.site_id, siteId),
          eq(siteUsers.user_id, userId)
        )
      )
      .limit(1)

    if (siteUserResult.length === 0) {
      throw createError({
        statusCode: 404,
        message: 'Site user not found',
      })
    }

    const currentSiteUser = siteUserResult[0]

    // Delete the siteUser record
    await db
      .delete(siteUsers)
      .where(
        and(
          eq(siteUsers.site_id, siteId),
          eq(siteUsers.user_id, userId)
        )
      )

    // Create audit log entry
    try {
      const adminOpsDb = useAdminOpsDb(event)
      await adminOpsDb.insert(auditLogs).values({
        admin_id: session.user.id,
        action: 'site_user_removed',
        entity_type: 'site_user',
        entity_id: siteId,
        environment: getAuditEnvironment(event),
        changes: JSON.stringify({
          site_id: siteId,
          user_id: userId,
          role: currentSiteUser.role,
          verified_at: currentSiteUser.verified_at,
          joined_at: currentSiteUser.joined_at,
        }),
        ip_address: getRequestIP(event) || null,
        user_agent: getHeader(event, 'user-agent') || null,
        createdAt: new Date().toISOString(),
      })
    } catch (auditError) {
      console.warn('Failed to create audit log:', auditError)
    }

    return {
      success: true,
      message: 'User removed from site successfully',
    }
  } catch (error) {
    // If it's already a createError, re-throw it
    if (error && typeof error === 'object' && 'statusCode' in error) {
      throw error
    }

    console.error('Error removing site user:', error)
    throw createError({
      statusCode: 500,
      message: 'Failed to remove user from site',
    })
  }
})
