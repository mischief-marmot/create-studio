/**
 * POST /api/admin/releases/upload-image
 * Proxies release image uploads from admin UI to the main app.
 * Forwards the raw multipart body to preserve encoding.
 */

export default defineEventHandler(async (event) => {
  const session = await getUserSession(event)
  if (!session?.user) {
    throw createError({ statusCode: 401, message: 'Unauthorized' })
  }

  const config = useRuntimeConfig()
  const mainAppUrl = config.mainAppUrl || 'http://localhost:3000'

  const rawBody = await readRawBody(event, false)
  if (!rawBody) {
    throw createError({ statusCode: 400, message: 'No file provided' })
  }

  const contentType = getHeader(event, 'content-type')
  if (!contentType?.includes('multipart/form-data')) {
    throw createError({ statusCode: 400, message: 'Expected multipart/form-data' })
  }

  try {
    const response = await fetch(`${mainAppUrl}/api/v2/internal/upload-release-image`, {
      method: 'POST',
      headers: {
        'Content-Type': contentType,
        'X-Admin-Api-Key': config.mainAppApiKey || '',
      },
      body: rawBody,
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error(`Release image upload proxy failed: ${response.status} ${errorText}`)
      throw createError({
        statusCode: response.status,
        message: `Upload failed: ${response.statusText}`,
      })
    }

    return await response.json()
  }
  catch (error: any) {
    if (error?.statusCode) throw error
    console.error('Error proxying release image upload:', error)
    throw createError({ statusCode: 500, message: 'Failed to upload image' })
  }
})
