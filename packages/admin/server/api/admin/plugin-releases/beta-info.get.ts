import { getAdminEnvironment } from '~~/server/utils/admin-env'

/**
 * GET /api/admin/plugin-releases/beta-info
 *
 * Proxies to the main app to get current beta plugin info.
 */
export default defineEventHandler(async (event) => {
  const session = await getUserSession(event)
  if (!session?.user) {
    throw createError({
      statusCode: 401,
      message: 'Unauthorized',
    })
  }

  const config = useRuntimeConfig()
  const adminEnv = getAdminEnvironment(event)
  const rawMainAppUrl = adminEnv === 'preview' ? config.mainAppPreviewUrl : config.mainAppUrl
  const mainAppUrl = rawMainAppUrl?.replace(/\/+$/, '')

  if (!mainAppUrl) {
    throw createError({
      statusCode: 500,
      message: 'Main app URL not configured',
    })
  }

  try {
    const response = await fetch(`${mainAppUrl}/api/v2/internal/beta-plugin-info`, {
      method: 'GET',
      headers: {
        'X-Beta-Upload-Key': config.mainAppApiKey || '',
      },
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error(`Beta info fetch failed: ${response.status} ${errorText}`)
      throw createError({
        statusCode: response.status,
        message: `Failed to fetch beta info: ${response.statusText}`,
      })
    }

    return await response.json()
  } catch (error) {
    if (error && typeof error === 'object' && 'statusCode' in error) {
      throw error
    }

    console.error('Error fetching beta plugin info:', error)
    throw createError({
      statusCode: 500,
      message: 'Failed to fetch beta plugin info from main app',
    })
  }
})
