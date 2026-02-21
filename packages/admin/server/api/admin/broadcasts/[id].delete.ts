import { eq } from 'drizzle-orm'
import { useAdminDb, broadcasts } from '~~/server/utils/admin-db'
import { useAdminOpsDb, auditLogs, getAuditEnvironment } from '~~/server/utils/admin-ops-db'

/**
 * DELETE /api/admin/broadcasts/:id
 * Delete a broadcast
 */
export default defineEventHandler(async (event) => {
  const session = await getUserSession(event)
  if (!session?.user) {
    throw createError({
      statusCode: 401,
      message: 'Unauthorized',
    })
  }

  const db = useAdminDb(event)
  const id = Number(getRouterParam(event, 'id'))

  if (!id || isNaN(id)) {
    throw createError({
      statusCode: 400,
      message: 'Invalid broadcast ID',
    })
  }

  try {
    // Validate existence
    const existing = await db.select().from(broadcasts).where(eq(broadcasts.id, id)).limit(1)

    if (existing.length === 0) {
      throw createError({
        statusCode: 404,
        message: 'Broadcast not found',
      })
    }

    const deleted = existing[0]

    await db.delete(broadcasts).where(eq(broadcasts.id, id))

    const now = new Date().toISOString()

    try {
      const adminOpsDb = useAdminOpsDb(event)
      await adminOpsDb.insert(auditLogs).values({
        admin_id: session.user.id,
        action: 'broadcast_deleted',
        entity_type: 'broadcast',
        entity_id: id,
        environment: getAuditEnvironment(event),
        changes: JSON.stringify({
          title: deleted.title,
          type: deleted.type,
          status: deleted.status,
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
      message: 'Broadcast deleted successfully',
    }
  } catch (error) {
    if (error && typeof error === 'object' && 'statusCode' in error) {
      throw error
    }

    console.error('Error deleting broadcast:', error)
    throw createError({
      statusCode: 500,
      message: 'Failed to delete broadcast',
    })
  }
})
