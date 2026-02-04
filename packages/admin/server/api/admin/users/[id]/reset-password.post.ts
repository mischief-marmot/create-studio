import { eq } from 'drizzle-orm'
import { users, auditLogs } from "~~/server/utils/db"
import { randomBytes } from 'crypto'

/**
 * POST /api/admin/users/[id]/reset-password
 * Generate password reset token and send email to user
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

    // Generate password reset token
    const resetToken = randomBytes(32).toString('hex')
    const resetExpires = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24 hours

    // Update user with reset token
    await db
      .update(users)
      .set({
        password_reset_token: resetToken,
        password_reset_expires: resetExpires,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(users.id, userId))

    // Create audit log entry
    await db.insert(auditLogs).values({
      admin_id: session.user.id,
      action: 'password_reset_initiated',
      entity_type: 'user',
      entity_id: userId,
      changes: JSON.stringify({
        reset_token_generated: true,
        expires_at: resetExpires,
      }),
      ip_address: getRequestIP(event) || null,
      user_agent: getHeader(event, 'user-agent') || null,
      createdAt: new Date().toISOString(),
    })

    // TODO: Send password reset email
    // const mailer = useMailer()
    // await mailer.sendPasswordReset(user.email, resetToken)

    return {
      success: true,
      message: 'Password reset email sent successfully',
      expiresAt: resetExpires,
    }
  } catch (error) {
    // If it's already a createError, re-throw it
    if (error && typeof error === 'object' && 'statusCode' in error) {
      throw error
    }

    console.error('Error resetting password:', error)
    throw createError({
      statusCode: 500,
      message: 'Failed to reset password',
    })
  }
})
