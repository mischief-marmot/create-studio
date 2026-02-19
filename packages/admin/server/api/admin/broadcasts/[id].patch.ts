import { eq } from 'drizzle-orm'
import { broadcasts } from '~~/server/utils/admin-db'
import { useAdminOpsDb, auditLogs, getAuditEnvironment } from '~~/server/utils/admin-ops-db'

const VALID_TYPES = ['announcement', 'feature', 'promotion', 'beta', 'urgent', 'bug']
const VALID_STATUSES = ['draft', 'published', 'archived']

/**
 * PATCH /api/admin/broadcasts/:id
 * Update an existing broadcast. Audit logs before/after diff.
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
    // Read current record
    const existing = await db.select().from(broadcasts).where(eq(broadcasts.id, id)).limit(1)

    if (existing.length === 0) {
      throw createError({
        statusCode: 404,
        message: 'Broadcast not found',
      })
    }

    const current = existing[0]
    const body = await readBody(event)

    // Validate enums if provided
    if (body.type && !VALID_TYPES.includes(body.type)) {
      throw createError({
        statusCode: 400,
        message: `Invalid type. Must be one of: ${VALID_TYPES.join(', ')}`,
      })
    }

    if (body.status && !VALID_STATUSES.includes(body.status)) {
      throw createError({
        statusCode: 400,
        message: `Invalid status. Must be one of: ${VALID_STATUSES.join(', ')}`,
      })
    }

    // Build update object from only changed fields
    const updatableFields = [
      'title', 'body', 'type', 'status', 'priority', 'url', 'path',
      'cta_text', 'target_tiers', 'target_create_version_min',
      'target_create_version_max', 'targeting', 'published_at', 'expires_at',
    ] as const

    const updates: Record<string, any> = {}
    const before: Record<string, any> = {}
    const after: Record<string, any> = {}

    for (const field of updatableFields) {
      if (field in body) {
        const oldVal = current[field]
        const newVal = body[field]
        // Compare serialized values for JSON fields
        const oldSerialized = typeof oldVal === 'object' ? JSON.stringify(oldVal) : oldVal
        const newSerialized = typeof newVal === 'object' ? JSON.stringify(newVal) : newVal
        if (oldSerialized !== newSerialized) {
          updates[field] = newVal
          before[field] = oldVal
          after[field] = newVal
        }
      }
    }

    if (Object.keys(updates).length === 0) {
      return {
        success: true,
        message: 'No changes detected',
        broadcast: current,
      }
    }

    const now = new Date().toISOString()
    updates.updatedAt = now

    await db.update(broadcasts).set(updates).where(eq(broadcasts.id, id))

    // Fetch updated record
    const updated = await db.select().from(broadcasts).where(eq(broadcasts.id, id)).limit(1)

    try {
      const adminOpsDb = useAdminOpsDb(event)
      await adminOpsDb.insert(auditLogs).values({
        admin_id: session.user.id,
        action: 'broadcast_updated',
        entity_type: 'broadcast',
        entity_id: id,
        environment: getAuditEnvironment(event),
        changes: JSON.stringify({ before, after }),
        ip_address: getRequestIP(event) || null,
        user_agent: getHeader(event, 'user-agent') || null,
        createdAt: now,
      })
    } catch (auditError) {
      console.warn('Failed to create audit log:', auditError)
    }

    return {
      success: true,
      message: 'Broadcast updated successfully',
      broadcast: updated[0],
    }
  } catch (error) {
    if (error && typeof error === 'object' && 'statusCode' in error) {
      throw error
    }

    console.error('Error updating broadcast:', error)
    throw createError({
      statusCode: 500,
      message: 'Failed to update broadcast',
    })
  }
})
