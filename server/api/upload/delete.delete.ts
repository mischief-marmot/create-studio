/**
 * API endpoint for deleting files using NuxtHub blob storage
 */

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event)
    const { key } = body

    if (!key) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Missing required field: key'
      })
    }

    // Delete the blob using NuxtHub
    await hubBlob().del(key)

    return {
      success: true,
      message: 'File deleted successfully'
    }

  } catch (error) {
    console.error('Error deleting file:', error)
    
    if (error.statusCode) {
      throw error
    }

    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to delete file'
    })
  }
})