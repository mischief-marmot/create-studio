/**
 * API endpoint for generating presigned upload URLs using NuxtHub blob storage
 */

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event)
    const { key, contentType } = body

    if (!key || !contentType) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Missing required fields: key and contentType'
      })
    }

    // Validate content type
    const allowedTypes = [
      'image/jpeg',
      'image/jpg',
      'image/png', 
      'image/webp',
      'image/gif'
    ]

    if (!allowedTypes.includes(contentType)) {
      throw createError({
        statusCode: 400,
        statusMessage: `Invalid content type: ${contentType}`
      })
    }

    // Generate presigned upload credentials using NuxtHub
    const credentials = await hubBlob().createCredentials({
      permission: 'write',
      pathname: key,
      contentType
    })

    return {
      uploadUrl: credentials.uploadURL,
      publicUrl: credentials.publicURL || `/api/blob/${key}`,
      key,
      credentials
    }

  } catch (error) {
    console.error('Error generating signed URL:', error)
    
    if (error.statusCode) {
      throw error
    }

    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to generate signed upload URL'
    })
  }
})