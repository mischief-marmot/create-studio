import { auditLogs } from "~~/server/utils/db"

export default defineEventHandler(async (event) => {
  // db is auto-imported from hub:db

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

  // Create audit log entry
  await db.insert(auditLogs).values({
    admin_id: session.user.id,
    action: 'logout',
    entity_type: 'admin',
    entity_id: session.user.id,
    ip_address: Array.isArray(ipAddress) ? ipAddress[0] : ipAddress,
    user_agent: Array.isArray(userAgent) ? userAgent[0] : userAgent,
    createdAt: new Date().toISOString(),
  })

  // Clear session
  await clearUserSession(event)

  return {
    success: true,
    message: 'Logged out successfully',
  }
})
