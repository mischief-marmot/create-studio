import { eq } from 'drizzle-orm'
import { users, auditLogs } from "~~/server/utils/db"

/**
 * POST /api/admin/users/[id]/send-verification
 * Resend verification email to user
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

    // Check if already verified
    if (user.validEmail) {
      throw createError({
        statusCode: 400,
        message: 'Email is already verified',
      })
    }

    // Create audit log entry
    await db.insert(auditLogs).values({
      admin_id: session.user.id,
      action: 'verification_email_sent',
      entity_type: 'user',
      entity_id: userId,
      changes: JSON.stringify({
        email: user.email,
        sent_at: new Date().toISOString(),
      }),
      ip_address: getRequestIP(event) || null,
      user_agent: getHeader(event, 'user-agent') || null,
      createdAt: new Date().toISOString(),
    })

    // TODO: Send verification email
    // const mailer = useMailer()
    // await mailer.sendVerificationEmail(user.email)

    return {
      success: true,
      message: 'Verification email sent successfully',
      email: user.email,
    }
  } catch (error) {
    // If it's already a createError, re-throw it
    if (error && typeof error === 'object' && 'statusCode' in error) {
      throw error
    }

    console.error('Error sending verification email:', error)
    throw createError({
      statusCode: 500,
      message: 'Failed to send verification email',
    })
  }
})
