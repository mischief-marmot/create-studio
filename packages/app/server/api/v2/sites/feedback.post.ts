/**
 * POST /api/v2/sites/feedback
 * Receive error feedback reports from the WordPress plugin admin UI.
 *
 * Requires JWT authentication (Bearer token - site or user token)
 * Rate limited: 10 reports per hour per site
 */

import { useLogger } from '@create-studio/shared/utils/logger'
import { sendErrorResponse } from '~~/server/utils/errors'
import { verifyAnyJWT } from '~~/server/utils/auth'
import { rateLimitMiddleware } from '~~/server/utils/rateLimiter'

export default defineEventHandler(async (event) => {
  const { debug } = useRuntimeConfig()
  const logger = useLogger('API:Sites:Feedback', debug)

  try {
    const tokenPayload = await verifyAnyJWT(event)
    const siteId = tokenPayload.site_id

    if (!siteId) {
      setResponseStatus(event, 400)
      return { success: false, error: 'Token does not contain site_id' }
    }

    // Rate limit: 10 reports per hour per site
    await rateLimitMiddleware(event, {
      maxRequests: 10,
      windowMs: 60 * 60 * 1000, // 1 hour
      keyPrefix: 'feedback:',
      getKey: () => siteId.toString(),
    })

    const body = await readBody(event)

    if (!body?.error_message) {
      setResponseStatus(event, 400)
      return { success: false, error: 'error_message is required' }
    }

    // Validate screenshot size (~2MB base64 limit)
    if (body.screenshot_base64 && body.screenshot_base64.length > 2 * 1024 * 1024 * 1.37) {
      setResponseStatus(event, 400)
      return { success: false, error: 'Screenshot exceeds maximum size of 2MB' }
    }

    const now = new Date().toISOString()

    const result = await db.insert(schema.feedbackReports).values({
      site_id: siteId,
      error_message: body.error_message,
      stack_trace: body.stack_trace || null,
      component_stack: body.component_stack || null,
      create_version: body.create_version || null,
      wp_version: body.wp_version || null,
      php_version: body.php_version || null,
      browser_info: body.browser_info || null,
      current_url: body.current_url || null,
      user_message: body.user_message || null,
      screenshot_base64: body.screenshot_base64 || null,
      status: 'new',
      createdAt: now,
      updatedAt: now,
    }).returning({ id: schema.feedbackReports.id })

    logger.debug('Feedback report created', { siteId, reportId: result[0]?.id })

    return {
      success: true,
      id: result[0]?.id,
    }
  }
  catch (error: any) {
    logger.error('Error creating feedback report:', error)
    return sendErrorResponse(event, error)
  }
})
