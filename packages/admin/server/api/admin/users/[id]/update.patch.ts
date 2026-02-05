import { eq } from 'drizzle-orm'
import { users } from "~~/server/utils/admin-db"
import { useAdminOpsDb, auditLogs, getAuditEnvironment } from '~~/server/utils/admin-ops-db'

/**
 * PATCH /api/admin/users/[id]/update
 * Update user profile fields (firstname, lastname, email, validEmail)
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

    // Validate input - track which fields are being updated
    const updateData: {
      firstname?: string | null
      lastname?: string | null
      email?: string
      validEmail?: boolean
      updatedAt: string
    } = {
      updatedAt: new Date().toISOString(),
    }

    const allowedFields = ['firstname', 'lastname', 'email', 'validEmail']
    let hasUpdates = false

    if ('firstname' in body) {
      updateData.firstname = body.firstname?.trim() || null
      hasUpdates = true
    }

    if ('lastname' in body) {
      updateData.lastname = body.lastname?.trim() || null
      hasUpdates = true
    }

    if ('email' in body) {
      const newEmail = body.email?.trim()
      if (!newEmail || !newEmail.includes('@')) {
        throw createError({
          statusCode: 400,
          message: 'Invalid email address',
        })
      }
      updateData.email = newEmail
      hasUpdates = true
    }

    if ('validEmail' in body) {
      updateData.validEmail = Boolean(body.validEmail)
      hasUpdates = true
    }

    // Check if there are any changes
    if (!hasUpdates) {
      throw createError({
        statusCode: 400,
        message: 'No fields to update',
      })
    }

    // Update user
    await db
      .update(users)
      .set(updateData)
      .where(eq(users.id, userId))

    // Create audit log entry
    const changes: Record<string, any> = {
      before: {},
      after: {},
    }

    if ('firstname' in body) {
      changes.before.firstname = user.firstname
      changes.after.firstname = updateData.firstname
    }

    if ('lastname' in body) {
      changes.before.lastname = user.lastname
      changes.after.lastname = updateData.lastname
    }

    if ('email' in body) {
      changes.before.email = user.email
      changes.after.email = updateData.email
    }

    if ('validEmail' in body) {
      changes.before.validEmail = user.validEmail
      changes.after.validEmail = updateData.validEmail
    }

    // Wrap audit log in try-catch to prevent FK errors from stale sessions
    try {
      const adminOpsDb = useAdminOpsDb(event)
      await adminOpsDb.insert(auditLogs).values({
        admin_id: session.user.id,
        action: 'user_updated',
        entity_type: 'user',
        entity_id: userId,
        environment: getAuditEnvironment(event),
        changes: JSON.stringify(changes),
        ip_address: getRequestIP(event) || null,
        user_agent: getHeader(event, 'user-agent') || null,
        createdAt: new Date().toISOString(),
      })
    } catch (auditError) {
      console.warn('Failed to create audit log:', auditError)
    }

    // Get updated user
    const updatedUserResult = await db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1)

    return {
      success: true,
      message: 'User updated successfully',
      user: {
        id: updatedUserResult[0].id,
        email: updatedUserResult[0].email,
        firstname: updatedUserResult[0].firstname,
        lastname: updatedUserResult[0].lastname,
        validEmail: updatedUserResult[0].validEmail,
      },
    }
  } catch (error) {
    // If it's already a createError, re-throw it
    if (error && typeof error === 'object' && 'statusCode' in error) {
      throw error
    }

    console.error('Error updating user:', error)
    throw createError({
      statusCode: 500,
      message: 'Failed to update user',
    })
  }
})
