import { eq } from 'drizzle-orm'
import { subscriptions, sites } from "~~/server/utils/admin-db"
import { useAdminOpsDb, auditLogs, getAuditEnvironment } from '~~/server/utils/admin-ops-db'

/**
 * POST /api/admin/subscriptions/create
 * Manually create a subscription for a site (no Stripe involvement)
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

  try {
    const body = await readBody(event)
    const { siteId, tier, status } = body

    // Validate siteId
    if (!siteId || typeof siteId !== 'number') {
      throw createError({
        statusCode: 400,
        message: 'siteId is required and must be a number',
      })
    }

    // Validate tier
    if (!tier || !['free', 'pro'].includes(tier)) {
      throw createError({
        statusCode: 400,
        message: 'Invalid tier. Must be "free" or "pro"',
      })
    }

    // Use provided status or default to 'active'
    const subscriptionStatus = status || 'active'

    // Check if site exists
    const siteResult = await db
      .select()
      .from(sites)
      .where(eq(sites.id, siteId))
      .limit(1)

    if (siteResult.length === 0) {
      throw createError({
        statusCode: 404,
        message: 'Site not found',
      })
    }

    // Check if site already has a subscription (unique constraint on site_id)
    const existingSubscription = await db
      .select()
      .from(subscriptions)
      .where(eq(subscriptions.site_id, siteId))
      .limit(1)

    if (existingSubscription.length > 0) {
      throw createError({
        statusCode: 409,
        message: 'Site already has a subscription',
      })
    }

    const now = new Date().toISOString()

    // Insert new subscription record
    const insertResult = await db.insert(subscriptions).values({
      site_id: siteId,
      status: subscriptionStatus,
      tier,
      createdAt: now,
      updatedAt: now,
    }).returning()

    const createdSubscription = insertResult[0]

    // Create audit log entry (don't let audit log failures break the main operation)
    try {
      const adminOpsDb = useAdminOpsDb(event)
      await adminOpsDb.insert(auditLogs).values({
        admin_id: session.user.id,
        action: 'subscription_created',
        entity_type: 'subscription',
        entity_id: createdSubscription.id,
        environment: getAuditEnvironment(event),
        changes: JSON.stringify({
          site_id: siteId,
          tier,
          status: subscriptionStatus,
        }),
        ip_address: getRequestIP(event) || null,
        user_agent: getHeader(event, 'user-agent') || null,
        createdAt: now,
      })
    } catch (auditError) {
      // Log but don't fail the operation - audit log FK errors can happen with stale sessions
      console.warn('Failed to create audit log:', auditError)
    }

    return {
      success: true,
      message: 'Subscription created successfully',
      subscription: createdSubscription,
    }
  } catch (error) {
    // If it's already a createError, re-throw it
    if (error && typeof error === 'object' && 'statusCode' in error) {
      throw error
    }

    console.error('Error creating subscription:', error)
    throw createError({
      statusCode: 500,
      message: 'Failed to create subscription',
    })
  }
})
