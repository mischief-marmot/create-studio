import { eq, and } from 'drizzle-orm'
import { sites, users, siteUsers } from "~~/server/utils/db"
import { useAdminOpsDb, auditLogs, getAuditEnvironment } from '~~/server/utils/admin-ops-db'

/**
 * POST /api/admin/sites/[id]/users
 * Add a user to a site
 * Body: { userId: number, role: 'owner' | 'admin' | 'editor' }
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
  const siteId = parseInt(event.context.params?.id || '0')

  if (!siteId || isNaN(siteId)) {
    throw createError({
      statusCode: 400,
      message: 'Invalid site ID',
    })
  }

  try {
    const body = await readBody(event)
    const { userId, role } = body

    // Validate userId
    if (!userId || typeof userId !== 'number') {
      throw createError({
        statusCode: 400,
        message: 'Invalid userId. Must be a number.',
      })
    }

    // Validate role
    const validRoles = ['owner', 'admin', 'editor']
    if (!role || !validRoles.includes(role)) {
      throw createError({
        statusCode: 400,
        message: 'Invalid role. Must be "owner", "admin", or "editor".',
      })
    }

    // Verify site exists
    const siteResult = await db
      .select()
      .from(sites)
      .where(eq(sites.id, siteId))
      .limit(1)

    if (siteResult.length === 0) {
      throw createError({
        statusCode: 404,
        message: 'Site not found',
      })
    }

    // Verify user exists
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

    // Check if user is already a member of this site
    const existingSiteUser = await db
      .select()
      .from(siteUsers)
      .where(and(
        eq(siteUsers.site_id, siteId),
        eq(siteUsers.user_id, userId)
      ))
      .limit(1)

    if (existingSiteUser.length > 0) {
      throw createError({
        statusCode: 409,
        message: 'User is already a member of this site',
      })
    }

    const now = new Date().toISOString()

    // Create siteUser record
    await db.insert(siteUsers).values({
      site_id: siteId,
      user_id: userId,
      role,
      joined_at: now,
    })

    // Create audit log entry
    try {
      const adminOpsDb = useAdminOpsDb(event)
      await adminOpsDb.insert(auditLogs).values({
        admin_id: session.user.id,
        action: 'site_user_added',
        entity_type: 'site_user',
        entity_id: siteId,
        environment: getAuditEnvironment(event),
        changes: JSON.stringify({
          site_id: siteId,
          user_id: userId,
          role,
          joined_at: now,
        }),
        ip_address: getRequestIP(event) || null,
        user_agent: getHeader(event, 'user-agent') || null,
        createdAt: now,
      })
    } catch (auditError) {
      console.warn('Failed to create audit log:', auditError)
    }

    return {
      success: true,
      message: 'User added to site successfully',
      siteUser: {
        site_id: siteId,
        user_id: userId,
        role,
        joined_at: now,
      },
    }
  } catch (error) {
    // If it's already a createError, re-throw it
    if (error && typeof error === 'object' && 'statusCode' in error) {
      throw error
    }

    console.error('Error adding user to site:', error)
    throw createError({
      statusCode: 500,
      message: 'Failed to add user to site',
    })
  }
})
