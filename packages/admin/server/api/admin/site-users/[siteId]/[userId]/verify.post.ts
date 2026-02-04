import { eq, and } from 'drizzle-orm'
import { siteUsers, auditLogs } from "~~/server/utils/db"

/**
 * POST /api/admin/site-users/[siteId]/[userId]/verify
 * Verify a user's association with a site
 * Sets verified_at timestamp on the siteUser record
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
  const siteId = parseInt(event.context.params?.siteId || '0')
  const userId = parseInt(event.context.params?.userId || '0')

  if (!siteId || isNaN(siteId)) {
    throw createError({
      statusCode: 400,
      message: 'Invalid site ID',
    })
  }

  if (!userId || isNaN(userId)) {
    throw createError({
      statusCode: 400,
      message: 'Invalid user ID',
    })
  }

  try {
    // Get current siteUser record
    const siteUserResult = await db
      .select()
      .from(siteUsers)
      .where(and(
        eq(siteUsers.site_id, siteId),
        eq(siteUsers.user_id, userId)
      ))
      .limit(1)

    if (siteUserResult.length === 0) {
      throw createError({
        statusCode: 404,
        message: 'Site user relationship not found',
      })
    }

    const currentSiteUser = siteUserResult[0]

    // If already verified, return success without updating
    if (currentSiteUser.verified_at) {
      return {
        success: true,
        message: 'User already verified',
        siteUser: {
          site_id: siteId,
          user_id: userId,
          role: currentSiteUser.role,
          verified_at: currentSiteUser.verified_at,
        },
      }
    }

    const verifiedAt = new Date().toISOString()

    // Update verified_at timestamp
    await db
      .update(siteUsers)
      .set({ verified_at: verifiedAt })
      .where(and(
        eq(siteUsers.site_id, siteId),
        eq(siteUsers.user_id, userId)
      ))

    // Create audit log entry
    try {
      await db.insert(auditLogs).values({
        admin_id: session.user.id,
        action: 'site_user_verified',
        entity_type: 'site_user',
        entity_id: siteId,
        changes: JSON.stringify({
          site_id: siteId,
          user_id: userId,
          before: {
            verified_at: null,
          },
          after: {
            verified_at: verifiedAt,
          },
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
      message: 'User verified successfully',
      siteUser: {
        site_id: siteId,
        user_id: userId,
        role: currentSiteUser.role,
        verified_at: verifiedAt,
      },
    }
  } catch (error) {
    // If it's already a createError, re-throw it
    if (error && typeof error === 'object' && 'statusCode' in error) {
      throw error
    }

    console.error('Error verifying site user:', error)
    throw createError({
      statusCode: 500,
      message: 'Failed to verify site user',
    })
  }
})
