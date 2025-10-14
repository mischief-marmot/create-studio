/**
 * PATCH /api/v2/users/:id
 * Update user profile information
 *
 * Requires authentication (session)
 * Verifies user is updating their own account
 */

import { useLogger } from '@create-studio/shared/utils/logger'
import { UserRepository } from '~~/server/utils/database'
import { sendErrorResponse } from '~~/server/utils/errors'

export default defineEventHandler(async (event) => {
  const {debug} = useRuntimeConfig()
  const logger = useLogger('PatchUserEndpoint', debug)
  try {
    // Require user session
    const session = await requireUserSession(event)
    const sessionUserId = session.user.id

    const userId = parseInt(getRouterParam(event, 'id') || '0')

    if (!userId || userId === 0) {
      setResponseStatus(event, 400)
      logger.debug('Invalid user ID', userId)
      return {
        success: false,
        error: 'Invalid user ID'
      }
    }

    // Verify user is updating their own account
    if (userId !== sessionUserId) {
      setResponseStatus(event, 403)
      logger.debug('User can only update their own account', { sessionUserId, userId })
      return {
        success: false,
        error: 'Forbidden'
      }
    }

    // Read body
    const body = await readBody(event)
    const { firstname, lastname, email, avatar } = body

    // Validate input - at least one field must be provided
    if (!firstname && !lastname && !email && !avatar) {
      setResponseStatus(event, 400)
      logger.debug('No fields to update')
      return {
        success: false,
        error: 'At least one field must be provided'
      }
    }

    const userRepo = new UserRepository()

    // Get existing user
    const existingUser = await userRepo.findById(userId)
    if (!existingUser) {
      setResponseStatus(event, 404)
      logger.debug('User not found', existingUser)
      return {
        success: false,
        error: 'User not found'
      }
    }

    // If email is being changed, check if it's already in use
    if (email && email !== existingUser.email) {
      const emailExists = await userRepo.findByEmail(email)
      if (emailExists) {
        setResponseStatus(event, 400)
        logger.debug('Email already in use', email)
        return {
          success: false,
          error: 'Email already in use'
        }
      }
    }

    // Update user
    const updatedUser = await userRepo.update(userId, {
      firstname: firstname !== undefined ? firstname : existingUser.firstname,
      lastname: lastname !== undefined ? lastname : existingUser.lastname,
      email: email !== undefined ? email : existingUser.email,
      avatar: avatar !== undefined ? avatar : existingUser.avatar
    })

    // Update session with new user data
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

    // Return response (exclude password)
    setResponseStatus(event, 200)
    logger.debug('User updated successfully', { userId })
    return {
      success: true,
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        firstname: updatedUser.firstname,
        lastname: updatedUser.lastname,
        avatar: updatedUser.avatar,
        validEmail: updatedUser.validEmail,
        mediavine_publisher: updatedUser.mediavine_publisher,
        createdAt: updatedUser.createdAt,
        updatedAt: updatedUser.updatedAt
      }
    }

  } catch (error) {
    logger.error('User update error:', error)
    return sendErrorResponse(event, error)
  }
})
