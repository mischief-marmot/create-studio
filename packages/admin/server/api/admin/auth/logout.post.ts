import { useAdminOpsDb, auditLogs, getAuditEnvironment } from '~~/server/utils/admin-ops-db'

export default defineEventHandler(async (event) => {
  // Get current session
  const session = await getUserSession(event)

  if (!session?.user) {
    throw createError({
      statusCode: 401,
      message: 'Not authenticated',
    })
  }

  // Get request metadata for audit logging
  const headers = getHeaders(event)
  const ipAddress = headers['x-forwarded-for'] || headers['x-real-ip'] || 'unknown'
  const userAgent = headers['user-agent'] || 'unknown'

  // Create audit log entry (non-blocking - don't let audit failure block logout)
  try {
    const db = useAdminOpsDb(event)
    await db.insert(auditLogs).values({
      admin_id: session.user.id,
      action: 'logout',
      entity_type: 'admin',
      entity_id: session.user.id,
      ip_address: Array.isArray(ipAddress) ? ipAddress[0] : ipAddress,
      user_agent: Array.isArray(userAgent) ? userAgent[0] : userAgent,
      environment: getAuditEnvironment(event),
      createdAt: new Date().toISOString(),
    })
  } catch (auditError) {
    console.warn('Failed to create audit log:', auditError)
  }

  // Clear session
  await clearUserSession(event)

  return {
    success: true,
    message: 'Logged out successfully',
  }
})
