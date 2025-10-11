/**
 * POST /api/v2/users/avatar
 * Upload user avatar image
 *
 * Requires authentication (session)
 * Accepts multipart/form-data with file field
 * Validates file type (images only) and size (max 2MB)
 * Stores in NuxtHub blob storage with prefix "avatars/"
 */

import { useLogger } from '@create-studio/shared/utils/logger'
import { UserRepository } from '~~/server/utils/database'
import { sendErrorResponse } from '~~/server/utils/errors'

const MAX_FILE_SIZE = 2 * 1024 * 1024 // 2MB
const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
const AVATAR_PREFIX = 'avatars/'

export default defineEventHandler(async (event) => {
  const {debug} = useRuntimeConfig()
  const logger = useLogger('UploadAvatarEndpoint', debug)
  try {
    // Require user session
    const session = await requireUserSession(event)
    const userId = session.user.id

    // Parse multipart form data
    const form = await readMultipartFormData(event)

    if (!form || form.length === 0) {
      setResponseStatus(event, 400)
      logger.debug('No file uploaded')
      return {
        success: false,
        error: 'No file uploaded'
      }
    }

    // Find the file field
    const fileField = form.find(field => field.name === 'file' || field.name === 'avatar')

    if (!fileField || !fileField.data) {
      setResponseStatus(event, 400)
      logger.debug('File field not found')
      return {
        success: false,
        error: 'File field not found'
      }
    }

    // Validate file type
    const contentType = fileField.type || ''
    if (!ALLOWED_TYPES.includes(contentType)) {
      setResponseStatus(event, 400)
      logger.debug('Invalid file type', contentType)
      return {
        success: false,
        error: `Invalid file type. Allowed types: ${ALLOWED_TYPES.join(', ')}`
      }
    }

    // Validate file size
    const fileSize = fileField.data.length
    if (fileSize > MAX_FILE_SIZE) {
      setResponseStatus(event, 400)
      logger.debug('File too large', fileSize)
      return {
        success: false,
        error: `File too large. Maximum size: ${MAX_FILE_SIZE / 1024 / 1024}MB`
      }
    }

    // Get file extension
    const extension = contentType.split('/')[1] || 'jpg'

    // Generate unique filename with user ID and timestamp
    const filename = `${AVATAR_PREFIX}${userId}-${Date.now()}.${extension}`

    // Delete old avatar if exists
    const userRepo = new UserRepository()
    const user = await userRepo.findById(userId)
    if (user?.avatar && user.avatar.startsWith(AVATAR_PREFIX)) {
      try {
        // Extract just the path part (remove any base URL)
        const oldPath = user.avatar.replace(/^.*?avatars\//, 'avatars/')
        await hubBlob().del(oldPath)
        logger.debug('Deleted old avatar', oldPath)
      } catch (error) {
        logger.error('Error deleting old avatar:', error)
        // Continue even if deletion fails
      }
    }

    // Convert Buffer to Blob for NuxtHub blob storage
    const fileBlob = new Blob([fileField.data], { type: contentType })

    // Upload to NuxtHub blob storage
    const blob = await hubBlob().put(filename, fileBlob, {
      addRandomSuffix: false
    })

    logger.debug('Avatar uploaded successfully', { filename, size: fileSize })

    // Update user's avatar in database
    const updatedUser = await userRepo.update(userId, {
      avatar: filename
    })

    // Update session with new avatar
    await setUserSession(event, {
      user: {
        id: updatedUser.id!,
        email: updatedUser.email,
        validEmail: Boolean(updatedUser.validEmail),
        firstname: updatedUser.firstname,
        lastname: updatedUser.lastname,
        avatar: updatedUser.avatar
      }
    })

    // Return response
    setResponseStatus(event, 200)
    return {
      success: true,
      avatar: filename,
      url: `/api/_hub/blob/${filename}`
    }

  } catch (error) {
    logger.error('Avatar upload error:', error)
    return sendErrorResponse(event, error)
  }
})
