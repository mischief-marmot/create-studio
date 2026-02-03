import { eq, and, gte, lte, desc, count, sql } from 'drizzle-orm'
import { auditLogs, admins } from "~~/server/utils/db"

/**
 * GET /api/admin/audit-logs
 * Returns paginated list of audit logs with filtering
 *
 * Query params:
 * - page: number (default: 1)
 * - limit: number (default: 20)
 * - admin_id: number (filter by admin)
 * - action: string (filter by action type)
 * - entity_type: string (filter by entity type)
 * - date_from: string (ISO date, filter from date)
 * - date_to: string (ISO date, filter to date)
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

  // db is auto-imported from hub:db

  try {
    // Get query parameters
    const query = getQuery(event)
    const page = Math.max(1, Number(query.page) || 1)
    const limit = Math.min(100, Math.max(1, Number(query.limit) || 20))
    const offset = (page - 1) * limit

    const adminId = query.admin_id ? parseInt(query.admin_id as string) : undefined
    const action = query.action as string | undefined
    const entityType = query.entity_type as string | undefined
    const dateFrom = query.date_from as string | undefined
    const dateTo = query.date_to as string | undefined

    // Build WHERE conditions
    const conditions: any[] = []

    if (adminId) {
      conditions.push(eq(auditLogs.admin_id, adminId))
    }

    if (action) {
      conditions.push(eq(auditLogs.action, action))
    }

    if (entityType) {
      conditions.push(eq(auditLogs.entity_type, entityType))
    }

    if (dateFrom) {
      conditions.push(gte(auditLogs.createdAt, dateFrom))
    }

    if (dateTo) {
      conditions.push(lte(auditLogs.createdAt, dateTo))
    }

    // Combine conditions
    const whereClause = conditions.length > 0 ? and(...conditions) : undefined

    // Get total count for pagination
    const countResult = await db
      .select({ count: count() })
      .from(auditLogs)
      .where(whereClause)

    const total = countResult[0]?.count || 0
    const totalPages = Math.ceil(total / limit)

    // Get paginated audit logs with admin info
    const logs = await db
      .select({
        id: auditLogs.id,
        admin_id: auditLogs.admin_id,
        action: auditLogs.action,
        entity_type: auditLogs.entity_type,
        entity_id: auditLogs.entity_id,
        changes: auditLogs.changes,
        ip_address: auditLogs.ip_address,
        user_agent: auditLogs.user_agent,
        createdAt: auditLogs.createdAt,
        // Join admin info
        adminEmail: admins.email,
        adminFirstname: admins.firstname,
        adminLastname: admins.lastname,
      })
      .from(auditLogs)
      .innerJoin(admins, eq(auditLogs.admin_id, admins.id))
      .where(whereClause)
      .orderBy(desc(auditLogs.createdAt))
      .limit(limit)
      .offset(offset)

    // Format the response
    const formattedLogs = logs.map(log => ({
      id: log.id,
      admin_id: log.admin_id,
      adminName: `${log.adminFirstname || ''} ${log.adminLastname || ''}`.trim() || log.adminEmail,
      adminEmail: log.adminEmail,
      action: log.action,
      entity_type: log.entity_type,
      entity_id: log.entity_id,
      changes: log.changes ? JSON.parse(log.changes) : null,
      ip_address: log.ip_address,
      user_agent: log.user_agent,
      createdAt: log.createdAt,
    }))

    return {
      data: formattedLogs,
      pagination: {
        page,
        limit,
        total,
        totalPages,
      },
      filters: {
        admin_id: adminId,
        action,
        entity_type: entityType,
        date_from: dateFrom,
        date_to: dateTo,
      },
    }
  } catch (error) {
    console.error('Error fetching audit logs:', error)
    throw createError({
      statusCode: 500,
      message: 'Failed to fetch audit logs',
    })
  }
})
