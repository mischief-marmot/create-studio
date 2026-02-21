import { useLogger } from '@create-studio/shared/utils/logger'

/**
 * GET /api/v2/internal/beta-plugin-info
 *
 * Returns metadata about the currently uploaded beta plugin.
 * Secured by X-Beta-Upload-Key header.
 *
 * Auth: X-Beta-Upload-Key header
 */

const BETA_BLOB_KEY = 'create-plugin-beta.zip'

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const logger = useLogger('BetaPluginInfo', config.debug)

  // Authenticate with API key (accepts either dedicated beta key or admin API key)
  const apiKey = getHeader(event, 'X-Beta-Upload-Key')
  const isValidBetaKey = apiKey && config.betaUploadApiKey && apiKey === config.betaUploadApiKey
  const isValidAdminKey = apiKey && config.adminApiKey && apiKey === config.adminApiKey
  if (!isValidBetaKey && !isValidAdminKey) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Unauthorized',
    })
  }

  try {
    const meta = await blob.head(BETA_BLOB_KEY)

    if (!meta) {
      return {
        exists: false,
        message: 'No beta plugin has been uploaded yet.',
      }
    }

    return {
      exists: true,
      filename: BETA_BLOB_KEY,
      size: meta.size,
      uploadedAt: meta.uploadedAt,
      version: meta.customMetadata?.version || 'unknown',
      originalFilename: meta.customMetadata?.originalFilename || 'unknown',
      downloadUrl: '/downloads/beta',
    }
  } catch (error) {
    logger.error('Error fetching beta plugin info:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to fetch beta plugin info',
    })
  }
})
