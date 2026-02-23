/**
 * POST /api/v2/sites/:id/version-log
 * Log a plugin version update
 *
 * Called by the WordPress plugin when it detects it has been updated
 * (e.g. in upgrader_process_complete hook or version comparison on init).
 *
 * Requires JWT authentication (from WordPress plugin token)
 * Body: { from: string, to: string }
 */

import { useLogger } from '@create-studio/shared/utils/logger'
import { SiteRepository, SiteMetaRepository } from '~~/server/utils/database'
import { sendErrorResponse } from '~~/server/utils/errors'
import { verifyJWT } from '~~/server/utils/auth'

export default defineEventHandler(async (event) => {
  const { debug } = useRuntimeConfig()
  const logger = useLogger('VersionLogEndpoint', debug)

  try {
    // Verify JWT authentication
    let jwtPayload
    try {
      jwtPayload = await verifyJWT(event)
    } catch (jwtError) {
      setResponseStatus(event, 401)
      return { success: false, error: 'Unauthorized' }
    }

    const siteIdParam = parseInt(getRouterParam(event, 'id') || '0')

    if (!siteIdParam || siteIdParam === 0) {
      setResponseStatus(event, 400)
      return { success: false, error: 'Invalid site ID' }
    }

    // Verify JWT site_id matches
    if (jwtPayload.site_id && jwtPayload.site_id !== siteIdParam) {
      setResponseStatus(event, 403)
      return { success: false, error: 'Forbidden' }
    }

    const body = await readBody(event)
    const { from, to } = body

    if (!from || !to) {
      setResponseStatus(event, 400)
      return { success: false, error: '"from" and "to" version strings are required' }
    }

    if (from === to) {
      setResponseStatus(event, 400)
      return { success: false, error: 'Versions must be different' }
    }

    const siteRepo = new SiteRepository()
    const existingSite = await siteRepo.findById(siteIdParam)
    if (!existingSite) {
      setResponseStatus(event, 404)
      return { success: false, error: 'Site not found' }
    }

    // Use canonical site ID
    const siteIdToUpdate = existingSite.canonical_site_id || existingSite.id!

    const siteMetaRepo = new SiteMetaRepository()
    await siteMetaRepo.addVersionLog(siteIdToUpdate, from, to)

    logger.debug('Version log entry added', { siteId: siteIdToUpdate, from, to })

    setResponseStatus(event, 200)
    return {
      success: true,
      message: 'Version log entry recorded',
    }

  } catch (error) {
    logger.error('Version log error:', error)
    return sendErrorResponse(event, error)
  }
})
