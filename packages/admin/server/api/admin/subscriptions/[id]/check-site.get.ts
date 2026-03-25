import { eq } from 'drizzle-orm'
import { useAdminDb, subscriptions } from '~~/server/utils/admin-db'
import { getAdminEnvironment } from '~~/server/utils/admin-env'

/**
 * GET /api/admin/subscriptions/[id]/check-site
 * Check what tier WordPress thinks a subscription has vs what Studio has.
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
  const studioTier = sub.status === 'trialing' ? 'trial' : sub.tier

  const adminEnv = getAdminEnvironment(event)
  const rawMainAppUrl = adminEnv === 'preview' ? config.mainAppPreviewUrl : config.mainAppUrl
  const mainAppUrl = rawMainAppUrl?.replace(/\/+$/, '')

  if (!mainAppUrl) {
    throw createError({
      statusCode: 500,
      message: `Main app URL not configured for ${adminEnv} environment`,
    })
  }

  try {
    const response = await fetch(
      `${mainAppUrl}/api/v2/sites/${sub.site_id}/debug?scope=all`,
      {
        headers: {
          'X-Admin-Api-Key': config.mainAppApiKey || '',
        },
      },
    )

    if (!response.ok) {
      throw createError({
        statusCode: 502,
        message: `Debug endpoint returned ${response.status}`,
      })
    }

    const debugData = await response.json()
    // Debug response is { success, data: { settings: [...], ... } }
    // Settings is an array of { slug, value, group } objects from WP's mv_settings table
    const settings = debugData?.data?.settings || debugData?.settings || []
    const tierSetting = Array.isArray(settings)
      ? settings.find((s: any) => s.slug === 'mv_create_subscription_tier')
      : null
    const siteTier = tierSetting?.value || null

    return {
      siteTier,
      studioTier,
      inSync: siteTier === studioTier,
    }
  } catch (error: any) {
    if (error.statusCode) throw error
    console.error('Check site status error:', error)
    throw createError({
      statusCode: 502,
      message: 'Failed to reach site debug endpoint',
      data: { details: error.message },
    })
  }
})
