import { eq } from 'drizzle-orm'
import { useAdminDb, subscriptions } from '~~/server/utils/admin-db'
import { useAdminOpsDb, auditLogs, getAuditEnvironment } from '~~/server/utils/admin-ops-db'
import { getAdminEnvironment } from '~~/server/utils/admin-env'

/**
 * POST /api/admin/subscriptions/[id]/sync
 * Re-push the subscription_change webhook to WordPress.
 */
export default defineEventHandler(async (event) => {
  const session = await getUserSession(event)
  if (!session?.user) {
    throw createError({ statusCode: 401, message: 'Unauthorized' })
  }

  const db = useAdminDb(event)
  const config = useRuntimeConfig()
  const subscriptionId = parseInt(event.context.params?.id || '0')

  if (!subscriptionId || isNaN(subscriptionId)) {
    throw createError({ statusCode: 400, message: 'Invalid subscription ID' })
  }

  const subscriptionResult = await db
    .select()
    .from(subscriptions)
    .where(eq(subscriptions.id, subscriptionId))
    .limit(1)

  if (subscriptionResult.length === 0) {
    throw createError({ statusCode: 404, message: 'Subscription not found' })
  }

  const sub = subscriptionResult[0]

  const adminEnv = getAdminEnvironment(event)
  const rawMainAppUrl = adminEnv === 'preview' ? config.mainAppPreviewUrl : config.mainAppUrl
  const mainAppUrl = rawMainAppUrl?.replace(/\/+$/, '')

  if (!mainAppUrl) {
    throw createError({
      statusCode: 500,
      message: `Main app URL not configured for ${adminEnv} environment`,
    })
  }

  const response = await fetch(`${mainAppUrl}/api/v2/internal/notify-subscription-change`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Admin-Api-Key': config.mainAppApiKey || '',
    },
    body: JSON.stringify({ siteId: sub.site_id, tier: sub.tier }),
  })

  const result = await response.json().catch(() => null)

  // Audit log
  try {
    const adminOpsDb = useAdminOpsDb(event)
    await adminOpsDb.insert(auditLogs).values({
      admin_id: session.user.id,
      action: 'subscription_sync_pushed',
      entity_type: 'subscription',
      entity_id: subscriptionId,
      environment: getAuditEnvironment(event),
      changes: JSON.stringify({
        site_id: sub.site_id,
        tier: sub.tier,
        webhookStatus: response.status,
        webhookSent: result?.webhookSent ?? false,
      }),
      ip_address: getRequestIP(event) || null,
      user_agent: getHeader(event, 'user-agent') || null,
      createdAt: new Date().toISOString(),
    })
  } catch (auditError) {
    console.warn('Failed to create audit log:', auditError)
  }

  if (!response.ok) {
    throw createError({
      statusCode: 502,
      message: `Webhook push failed: ${response.status} ${response.statusText}`,
    })
  }

  return {
    success: true,
    webhookSent: result?.webhookSent ?? false,
    message: result?.webhookSent
      ? 'Subscription synced to WordPress successfully'
      : 'Tier update sent but webhook delivery to WordPress failed',
  }
})
