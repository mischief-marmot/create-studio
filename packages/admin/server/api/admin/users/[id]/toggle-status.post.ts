import { eq } from 'drizzle-orm'
import { users } from "~~/server/utils/db"
import { useAdminOpsDb, auditLogs, getAuditEnvironment } from '~~/server/utils/admin-ops-db'

/**
 * POST /api/admin/users/[id]/toggle-status
 * Toggle user account enabled/disabled status
 * Uses validEmail field to disable accounts (set to false)
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
    const body = await readBody(event)
    const newStatus = body.enabled !== undefined ? body.enabled : !user.validEmail

    // Update user status
    await db
      .update(users)
      .set({
        validEmail: newStatus,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(users.id, userId))

    // Create audit log entry
    try {
      const adminOpsDb = useAdminOpsDb(event)
      await adminOpsDb.insert(auditLogs).values({
        admin_id: session.user.id,
        action: newStatus ? 'user_enabled' : 'user_disabled',
        entity_type: 'user',
        entity_id: userId,
        environment: getAuditEnvironment(event),
        changes: JSON.stringify({
          before: { validEmail: user.validEmail },
          after: { validEmail: newStatus },
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
      message: newStatus ? 'Account enabled successfully' : 'Account disabled successfully',
      enabled: newStatus,
    }
  } catch (error) {
    // If it's already a createError, re-throw it
    if (error && typeof error === 'object' && 'statusCode' in error) {
      throw error
    }

    console.error('Error toggling user status:', error)
    throw createError({
      statusCode: 500,
      message: 'Failed to toggle user status',
    })
  }
})
