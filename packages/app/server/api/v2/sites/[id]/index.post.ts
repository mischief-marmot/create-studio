/**
 * POST /api/v2/sites/:id
 * Update site version information (from WordPress plugin)
 *
 * This endpoint is called by the WordPress plugin to update version info.
 * It handles both canonical and non-canonical sites by updating the canonical site.
 *
 * Requires JWT authentication (from WordPress plugin token)
 * Body: { php_version?, wp_version?, create_version? }
 */

import { useLogger } from '@create-studio/shared/utils/logger'
import { SiteRepository } from '~~/server/utils/database'
import { sendErrorResponse } from '~~/server/utils/errors'
import { verifyJWT } from '~~/server/utils/auth'

export default defineEventHandler(async (event) => {
  const { debug } = useRuntimeConfig()
  const logger = useLogger('PostSiteEndpoint', debug)

  try {
    // Verify JWT authentication (WordPress plugin sends Bearer token)
    let jwtPayload
    try {
      jwtPayload = await verifyJWT(event)
    } catch (jwtError) {
      setResponseStatus(event, 401)
      logger.debug('JWT verification failed')
      return {
        success: false,
        error: 'Unauthorized'
      }
    }

    const siteIdParam = parseInt(getRouterParam(event, 'id') || '0')

    if (!siteIdParam || siteIdParam === 0) {
      setResponseStatus(event, 400)
      logger.debug('Invalid site ID', siteIdParam)
      return {
        success: false,
        error: 'Invalid site ID'
      }
    }

    // Verify JWT site_id matches the request
    if (jwtPayload.site_id && jwtPayload.site_id !== siteIdParam) {
      setResponseStatus(event, 403)
      logger.debug('JWT site_id mismatch', { jwt: jwtPayload.site_id, param: siteIdParam })
      return {
        success: false,
        error: 'Forbidden'
      }
    }

    // Read body
    const body = await readBody(event)
    const { php_version, wp_version, create_version, interactive_mode_enabled, interactive_mode_button_text } = body

    // Validate input - at least one field must be provided
    const hasFields = php_version || wp_version || create_version || interactive_mode_enabled !== undefined || interactive_mode_button_text !== undefined
    if (!hasFields) {
      setResponseStatus(event, 400)
      logger.debug('No fields to update')
      return {
        success: false,
        error: 'At least one field must be provided'
      }
    }

    const siteRepo = new SiteRepository()

    // Get existing site
    const existingSite = await siteRepo.findById(siteIdParam)
    if (!existingSite) {
      setResponseStatus(event, 404)
      logger.debug('Site not found', siteIdParam)
      return {
        success: false,
        error: 'Site not found'
      }
    }

    // Determine which site to update - use canonical site if this is non-canonical
    const siteIdToUpdate = existingSite.canonical_site_id || existingSite.id!

    // Build update object
    const updateData: Record<string, unknown> = {}
    if (php_version) updateData.php_version = php_version
    if (wp_version) updateData.wp_version = wp_version
    if (create_version) updateData.create_version = create_version
    if (interactive_mode_enabled !== undefined) updateData.interactive_mode_enabled = interactive_mode_enabled ? 1 : 0
    if (interactive_mode_button_text !== undefined) updateData.interactive_mode_button_text = interactive_mode_button_text || null

    logger.debug('Updating site versions', { siteIdParam, siteIdToUpdate, updateData })

    // Update the canonical site
    const updatedSite = await siteRepo.update(siteIdToUpdate, updateData)

    // Return response
    setResponseStatus(event, 200)
    logger.debug('Site versions updated successfully', { siteId: siteIdToUpdate })
    return {
      success: true,
      site: updatedSite
    }

  } catch (error) {
    logger.error('Site version update error:', error)
    return sendErrorResponse(event, error)
  }
})
