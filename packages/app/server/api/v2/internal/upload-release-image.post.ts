/**
 * POST /api/v2/internal/upload-release-image
 * Upload an image for use in release notes emails.
 *
 * Auth: X-Admin-Api-Key header (shared secret between admin and main app)
 *
 * Accepts multipart/form-data with a "file" field.
 * Stores in blob storage under release-images/ prefix.
 * Returns the public URL for embedding in emails.
 */

const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB
const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
const BLOB_PREFIX = 'release-images/'

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()

  const adminApiKey = getHeader(event, 'X-Admin-Api-Key')
  if (!adminApiKey || !config.adminApiKey || adminApiKey !== config.adminApiKey) {
    throw createError({ statusCode: 401, message: 'Unauthorized' })
  }

  const form = await readMultipartFormData(event)

  if (!form || form.length === 0) {
    throw createError({ statusCode: 400, message: 'No file uploaded' })
  }

  const fileField = form.find(field => field.name === 'file')

  if (!fileField || !fileField.data) {
    throw createError({ statusCode: 400, message: 'File field not found' })
  }

  const contentType = fileField.type || ''
  if (!ALLOWED_TYPES.includes(contentType)) {
    throw createError({
      statusCode: 400,
      message: `Invalid file type. Allowed: ${ALLOWED_TYPES.join(', ')}`,
    })
  }

  if (fileField.data.length > MAX_FILE_SIZE) {
    throw createError({
      statusCode: 400,
      message: `File too large. Maximum size: ${MAX_FILE_SIZE / 1024 / 1024}MB`,
    })
  }

  const extension = contentType === 'image/jpeg' ? 'jpg' : contentType.split('/')[1]
  const filename = `${BLOB_PREFIX}${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${extension}`

  const fileBlob = new Blob([fileField.data], { type: contentType })

  await blob.put(filename, fileBlob, {
    addRandomSuffix: false,
  })

  const baseUrl = config.public.rootUrl || 'https://create.studio'
  const servePath = filename.replace(BLOB_PREFIX, '')

  return {
    success: true,
    path: filename,
    url: `${baseUrl}/release-images/${servePath}`,
  }
})
