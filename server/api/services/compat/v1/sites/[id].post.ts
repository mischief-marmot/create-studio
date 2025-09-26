/**
 * POST /api/services/compat/v1/sites/:id
 * Update site information
 *
 * Maintains compatibility with original Express API
 */

import { SiteRepository } from '~~/server/utils/database'
import { verifyJWT } from '~~/server/utils/auth'
import { sendErrorResponse } from '~~/server/utils/errors'

export default defineEventHandler(async (event) => {
  const {debug} = useRuntimeConfig()
  const logger = useLogger('UpsertSiteEndpoint', debug)
  try {
    // Verify JWT token
    await verifyJWT(event)

    const siteId = parseInt(getRouterParam(event, 'id') || '0')
    const body = await readBody(event)

    if (!siteId || siteId === 0) {
      setResponseStatus(event, 400)
      logger.debug('Invalid site ID', siteId)
      return { error: 'Invalid site ID' }
    }

    const siteRepo = new SiteRepository()

    // Get existing site
    const existingSite = await siteRepo.findById(siteId)
    if (!existingSite) {
      setResponseStatus(event, 404)
      logger.debug('Site not found', existingSite)
      return { error: 'Site not found' }
    }

    // Update site with provided fields
    const updates: any = {}
    if (body.wp_version !== undefined) {
      updates.wp_version = body.wp_version
    }
    if (body.php_version !== undefined) {
      updates.php_version = body.php_version
    }
    if (body.create_version !== undefined) {
      updates.create_version = body.create_version
    }
    logger.debug('Updating site', updates)
    const updatedSite = await siteRepo.update(siteId, updates)

    // Return response in original format
    setResponseStatus(event, 200)
    return {
      data: updatedSite
    }

  } catch (error) {
    logger.error('Site update error:', error)
    return sendErrorResponse(event, error)
  }
})