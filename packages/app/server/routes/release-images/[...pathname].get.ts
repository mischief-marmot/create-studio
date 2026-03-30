/**
 * Serve release email images from blob storage.
 * GET /release-images/{filename}
 */

const IMAGE_TYPES: Record<string, string> = {
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  gif: 'image/gif',
  webp: 'image/webp',
}

export default defineEventHandler(async (event) => {
  const { pathname } = getRouterParams(event)

  if (pathname.includes('..') || pathname.includes('\\')) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid file path' })
  }

  const ext = pathname.split('.').pop()?.toLowerCase()
  if (!ext || !IMAGE_TYPES[ext]) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid file type' })
  }

  const fullPath = `release-images/${pathname}`

  try {
    const file = await blob.get(fullPath)
    if (!file) {
      throw createError({ statusCode: 404, statusMessage: 'Image not found' })
    }

    setResponseHeaders(event, {
      'Content-Type': IMAGE_TYPES[ext],
      'Cache-Control': 'public, max-age=31536000', // 1 year — images are immutable
      'CDN-Cache-Control': 'public, max-age=31536000',
    })

    return file.stream()
  }
  catch (error: any) {
    if (error.statusCode) throw error
    throw createError({ statusCode: 500, statusMessage: 'Failed to serve image' })
  }
})
