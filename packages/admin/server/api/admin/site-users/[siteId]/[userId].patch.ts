import { eq, and } from 'drizzle-orm'
import { siteUsers } from "~~/server/utils/db"
import { useAdminOpsDb, auditLogs, getAuditEnvironment } from '~~/server/utils/admin-ops-db'

/**
 * PATCH /api/admin/site-users/[siteId]/[userId]
 * Update a user's role on a site
 * Body: { role: 'owner' | 'admin' | 'editor' }
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
    const body = await readBody(event)
    const { role } = body

    // Validate role
    const validRoles = ['owner', 'admin', 'editor']
    if (!role || !validRoles.includes(role)) {
      throw createError({
        statusCode: 400,
        message: 'Invalid role. Must be "owner", "admin", or "editor"',
      })
    }

    // Get current siteUser record
    const siteUserResult = await db
      .select()
      .from(siteUsers)
      .where(and(
        eq(siteUsers.site_id, siteId),
        eq(siteUsers.user_id, userId)
      ))
      .limit(1)

    if (siteUserResult.length === 0) {
      throw createError({
        statusCode: 404,
        message: 'Site user relationship not found',
      })
    }

    const currentSiteUser = siteUserResult[0]

    // Check if role is already set to the same value
    if (currentSiteUser.role === role) {
      throw createError({
        statusCode: 400,
        message: `User already has the "${role}" role on this site`,
      })
    }

    // Update the role
    await db
      .update(siteUsers)
      .set({ role })
      .where(and(
        eq(siteUsers.site_id, siteId),
        eq(siteUsers.user_id, userId)
      ))

    // Create audit log entry
    try {
      const adminOpsDb = useAdminOpsDb(event)
      await adminOpsDb.insert(auditLogs).values({
        admin_id: session.user.id,
        action: 'site_user_role_updated',
        entity_type: 'site_user',
        entity_id: siteId, // Using siteId as primary identifier
        environment: getAuditEnvironment(event),
        changes: JSON.stringify({
          site_id: siteId,
          user_id: userId,
          before: {
            role: currentSiteUser.role,
          },
          after: {
            role,
          },
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
      message: `User role updated to "${role}" successfully`,
      siteUser: {
        site_id: siteId,
        user_id: userId,
        role,
      },
    }
  } catch (error) {
    // If it's already a createError, re-throw it
    if (error && typeof error === 'object' && 'statusCode' in error) {
      throw error
    }

    console.error('Error updating site user role:', error)
    throw createError({
      statusCode: 500,
      message: 'Failed to update site user role',
    })
  }
})
