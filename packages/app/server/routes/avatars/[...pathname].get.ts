/**
 * Avatar serving route: GET /avatars/{filename}
 *
 * Serves avatar images from blob storage
 * Examples:
 * - GET /avatars/1-1768501945913.png → serves the avatar image
 *
 * Security:
 * - Only serves files from the avatars/ prefix in blob storage
 * - Validates file exists before serving
 * - Returns proper image content types
 */

const IMAGE_TYPES: Record<string, string> = {
  'jpg': 'image/jpeg',
  'jpeg': 'image/jpeg',
  'png': 'image/png',
  'gif': 'image/gif',
  'webp': 'image/webp'
}

export default defineEventHandler(async (event) => {
  const { pathname } = getRouterParams(event)

  // Security: Prevent directory traversal
  if (pathname.includes('..') || pathname.includes('\\')) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Invalid file path'
    })
  }

  // Validate file extension is an allowed image type
  const ext = pathname.split('.').pop()?.toLowerCase()
  if (!ext || !IMAGE_TYPES[ext]) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Invalid file type'
    })
  }

  // Build full path with avatars/ prefix
  const fullPath = `avatars/${pathname}`

  try {
    // Fetch file from NuxtHub blob storage
    const file = await blob.get(fullPath)
    if (!file) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Avatar not found'
      })
    }

    // Set response headers
    setResponseHeaders(event, {
      'Content-Type': IMAGE_TYPES[ext],
      'Cache-Control': 'public, max-age=86400', // Cache for 1 day
    })

    // Return the blob stream
    return file.stream()
  } catch (error: any) {
    // Re-throw H3 errors
    if (error.statusCode) {
      throw error
    }

    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to serve avatar'
    })
  }
})
