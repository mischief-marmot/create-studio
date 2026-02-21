import { useLogger } from '@create-studio/shared/utils/logger'

/**
 * Download endpoint: GET /downloads/beta
 *
 * Serves the beta version of the Create plugin from blob storage.
 * The beta zip is stored as 'create-plugin-beta.zip' in blob storage.
 *
 * Security:
 * - Public endpoint (no auth required)
 * - Only serves a single known file
 * - CORS enabled for cross-origin access
 */

const BETA_BLOB_KEY = 'create-plugin-beta.zip'

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const logger = useLogger('BetaDownload', config.debug)

  logger.debug('Beta plugin download request')

  try {
    const file = await blob.get(BETA_BLOB_KEY)

    if (!file) {
      logger.error('Beta plugin not found in blob storage')
      throw createError({
        statusCode: 404,
        statusMessage: 'Beta plugin not available. No beta version has been uploaded yet.',
      })
    }

    const headers: Record<string, string> = {
      'Content-Type': 'application/zip',
      'Cache-Control': config.debug ? 'public, max-age=0' : 'public, max-age=86400',
      'Content-Disposition': `attachment; filename="${BETA_BLOB_KEY}"`,
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET',
      'Access-Control-Allow-Headers': 'Content-Type',
    }

    setResponseHeaders(event, headers)

    return file.stream()
  } catch (error) {
    if (error && typeof error === 'object' && 'statusCode' in error) {
      throw error
    }

    logger.error('Error serving beta plugin download:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to serve beta plugin',
    })
  }
})
