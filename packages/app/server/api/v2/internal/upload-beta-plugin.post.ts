import { useLogger } from '@create-studio/shared/utils/logger'

/**
 * POST /api/v2/internal/upload-beta-plugin
 *
 * Upload a beta version of the Create plugin to blob storage.
 * Secured by the X-Beta-Upload-Key header.
 *
 * Auth: X-Beta-Upload-Key header (shared secret for GitHub Actions / admin uploads)
 *
 * Body: multipart/form-data with:
 *   - file: the .zip file (required)
 *
 * Headers:
 *   - X-Beta-Upload-Key: API key for authentication (required)
 *   - X-Beta-Version: version string, e.g. "2.0.0-beta.1" (optional metadata)
 */

const BETA_BLOB_KEY = 'create-plugin-beta.zip'
const MAX_FILE_SIZE = 50 * 1024 * 1024 // 50MB
const ALLOWED_TYPES = ['application/zip', 'application/x-zip-compressed', 'application/octet-stream']

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const logger = useLogger('BetaPluginUpload', config.debug)

  // Authenticate with API key
  const apiKey = getHeader(event, 'X-Beta-Upload-Key')
  if (!apiKey || !config.betaUploadApiKey || apiKey !== config.betaUploadApiKey) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Unauthorized',
    })
  }

  try {
    logger.info('Starting beta plugin upload...')

    // Read multipart form data
    const formData = await readMultipartFormData(event)

    if (!formData || formData.length === 0) {
      throw createError({
        statusCode: 400,
        statusMessage: 'No file provided. Upload a .zip file as multipart form data.',
      })
    }

    // Find the file part
    const filePart = formData.find(part => part.name === 'file')

    if (!filePart || !filePart.data) {
      throw createError({
        statusCode: 400,
        statusMessage: 'No file provided. Upload a .zip file with the field name "file".',
      })
    }

    // Validate file type
    const filename = filePart.filename || ''
    if (!filename.endsWith('.zip')) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Invalid file type. Only .zip files are accepted.',
      })
    }

    if (filePart.type && !ALLOWED_TYPES.includes(filePart.type)) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Invalid file type. Only .zip files are accepted.',
      })
    }

    // Validate file size
    if (filePart.data.length > MAX_FILE_SIZE) {
      throw createError({
        statusCode: 400,
        statusMessage: `File too large. Maximum size is ${MAX_FILE_SIZE / 1024 / 1024}MB.`,
      })
    }

    // Get optional version metadata from header
    const version = getHeader(event, 'X-Beta-Version') || 'unknown'

    // Upload to blob storage, overwriting any existing beta
    const uploadResult = await blob.put(
      BETA_BLOB_KEY,
      filePart.data,
      {
        addRandomSuffix: false,
        contentType: 'application/zip',
        customMetadata: {
          version,
          originalFilename: filename,
          uploadedAt: new Date().toISOString(),
          uploadedBy: 'api',
        },
      }
    )

    logger.success(`Beta plugin uploaded: ${filename} (${Math.floor(uploadResult.size / 1024)}KB, version: ${version})`)

    return {
      success: true,
      message: 'Beta plugin uploaded successfully',
      filename: BETA_BLOB_KEY,
      version,
      size: uploadResult.size,
      uploadedAt: new Date().toISOString(),
    }
  } catch (error) {
    if (error && typeof error === 'object' && 'statusCode' in error) {
      throw error
    }

    logger.error('Beta plugin upload failed:', error)
    throw createError({
      statusCode: 500,
      statusMessage: `Failed to upload beta plugin: ${(error as Error).message}`,
    })
  }
})
