import { broadcasts } from '~~/server/utils/admin-db'
import { useAdminOpsDb, auditLogs, getAuditEnvironment } from '~~/server/utils/admin-ops-db'

const VALID_TYPES = ['announcement', 'feature', 'promotion', 'beta']
const VALID_STATUSES = ['draft', 'published', 'archived']

/**
 * POST /api/admin/broadcasts
 * Create a new broadcast
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

  try {
    const body = await readBody(event)
    const { title, body: bodyText, type, status, priority, url, path, cta_text, target_tiers, target_create_version_min, target_create_version_max, targeting, published_at, expires_at } = body

    if (!title || typeof title !== 'string') {
      throw createError({
        statusCode: 400,
        message: 'title is required and must be a string',
      })
    }

    if (!bodyText || typeof bodyText !== 'string') {
      throw createError({
        statusCode: 400,
        message: 'body is required and must be a string',
      })
    }

    const broadcastType = type || 'announcement'
    if (!VALID_TYPES.includes(broadcastType)) {
      throw createError({
        statusCode: 400,
        message: `Invalid type. Must be one of: ${VALID_TYPES.join(', ')}`,
      })
    }

    const broadcastStatus = status || 'draft'
    if (!VALID_STATUSES.includes(broadcastStatus)) {
      throw createError({
        statusCode: 400,
        message: `Invalid status. Must be one of: ${VALID_STATUSES.join(', ')}`,
      })
    }

    const now = new Date().toISOString()

    const insertResult = await db.insert(broadcasts).values({
      title,
      body: bodyText,
      type: broadcastType,
      status: broadcastStatus,
      priority: priority ?? 0,
      url: url || null,
      path: path || null,
      cta_text: cta_text || null,
      target_tiers: target_tiers || ['all'],
      target_create_version_min: target_create_version_min || null,
      target_create_version_max: target_create_version_max || null,
      targeting: targeting || null,
      published_at: published_at || null,
      expires_at: expires_at || null,
      createdAt: now,
      updatedAt: now,
    }).returning()

    const created = insertResult[0]

    try {
      const adminOpsDb = useAdminOpsDb(event)
      await adminOpsDb.insert(auditLogs).values({
        admin_id: session.user.id,
        action: 'broadcast_created',
        entity_type: 'broadcast',
        entity_id: created.id,
        environment: getAuditEnvironment(event),
        changes: JSON.stringify({
          title,
          type: broadcastType,
          status: broadcastStatus,
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
      message: 'Broadcast created successfully',
      broadcast: created,
    }
  } catch (error) {
    if (error && typeof error === 'object' && 'statusCode' in error) {
      throw error
    }

    console.error('Error creating broadcast:', error)
    throw createError({
      statusCode: 500,
      message: 'Failed to create broadcast',
    })
  }
})
