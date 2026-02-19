/**
 * GET /api/v2/sites/:id/debug
 * Proxy debug information from a WordPress site via signed webhook.
 *
 * Query params:
 * - scope: 'all' | 'logs' | 'log_download' | 'environment' | 'client_check' (default: 'all')
 * - lines: number of log lines to fetch (default: 200, max: 5000)
 * - search: filter string for log lines
 *
 * When scope=log_download, the WP plugin streams the raw debug.log file.
 * This endpoint pipes that stream directly to the client as a file download.
 *
 * Auth: user session + site access, OR admin API key (X-Admin-Api-Key header).
 */

import { useLogger } from '@create-studio/shared/utils/logger'
import { SiteRepository } from '~~/server/utils/database'
import { sendWebhookWithResponse } from '~~/server/utils/webhooks'
import { sendErrorResponse } from '~~/server/utils/errors'

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const logger = useLogger('DebugEndpoint', config.debug)

  try {
    const siteId = parseInt(getRouterParam(event, 'id') || '0')
    if (!siteId) {
      setResponseStatus(event, 400)
      return { success: false, error: 'Invalid site ID' }
    }

    // Auth: accept admin API key OR user session
    const adminApiKey = getHeader(event, 'X-Admin-Api-Key')
    const isAdminRequest = adminApiKey && config.adminApiKey && adminApiKey === config.adminApiKey

    if (!isAdminRequest) {
      // Fall back to user session auth
      const session = await requireUserSession(event)
      const userId = session.user.id

      const siteRepo = new SiteRepository()
      const hasAccess = await siteRepo.userHasAccessToSite(userId, siteId)
      if (!hasAccess) {
        setResponseStatus(event, 403)
        return { success: false, error: 'Forbidden' }
      }
    }

    const siteRepo = new SiteRepository()
    const existingSite = await siteRepo.findById(siteId)
    if (!existingSite) {
      setResponseStatus(event, 404)
      return { success: false, error: 'Site not found' }
    }

    const query = getQuery(event)
    const scope = (query.scope as string) || 'all'
    const lines = query.lines ? parseInt(query.lines as string) : undefined
    const search = (query.search as string) || undefined

    const webhookData: Record<string, unknown> = { scope }
    if (lines !== undefined) webhookData.lines = lines
    if (search) webhookData.search = search

    logger.debug(`Debug webhook for site ${siteId} (scope=${scope}, admin=${!!isAdminRequest})`)

    // For log_download, we need to stream the raw file response through
    if (scope === 'log_download') {
      return await handleLogDownload(event, existingSite.url, webhookData, config, logger)
    }

    const result = await sendWebhookWithResponse(existingSite.url, {
      type: 'debug',
      data: webhookData,
    })

    return { success: true, data: result }
  } catch (error: any) {
    logger.error('Debug endpoint error:', error)

    // Distinguish webhook delivery failures from internal errors
    if (error.message?.includes('Webhook failed') || error.cause?.code === 'ECONNREFUSED') {
      setResponseStatus(event, 502)
      return {
        success: false,
        error: 'Site is unreachable',
        details: error.message,
      }
    }

    return sendErrorResponse(event, error)
  }
})

/**
 * Handle log_download scope by sending the webhook and streaming the raw
 * file response from the WP site through to the client.
 */
async function handleLogDownload(
  event: any,
  siteUrl: string,
  webhookData: Record<string, unknown>,
  config: any,
  logger: any,
) {
  const { signPayload } = await import('~~/server/utils/webhooks')

  const payload = { type: 'debug', data: webhookData }
  const body = JSON.stringify(payload)
  const timestamp = Math.floor(Date.now() / 1000).toString()
  const signature = await signPayload(body, config.webhookPrivateKey)

  const baseUrl = siteUrl.replace(/\/+$/, '')
  const url = `${baseUrl}/wp-json/mv-create/v1/webhooks/studio`

  logger.debug(`Sending log_download webhook to ${url}`)

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Studio-Signature': signature,
      'X-Studio-Timestamp': timestamp,
    },
    body,
  })

  if (!response.ok) {
    const errorText = await response.text().catch(() => '')
    // Check if the error is JSON (e.g., "No debug log file found")
    try {
      const errorJson = JSON.parse(errorText)
      setResponseStatus(event, response.status)
      return { success: false, error: errorJson.error || 'Download failed' }
    } catch {
      setResponseStatus(event, 502)
      return { success: false, error: 'Download failed', details: errorText }
    }
  }

  // Stream the response through — the WP plugin sends Content-Type, Content-Disposition, etc.
  const contentType = response.headers.get('content-type') || 'text/plain'
  const contentLength = response.headers.get('content-length')
  const contentDisposition = response.headers.get('content-disposition') || 'attachment; filename="debug.log"'

  setResponseHeader(event, 'Content-Type', contentType)
  setResponseHeader(event, 'Content-Disposition', contentDisposition)
  setResponseHeader(event, 'Cache-Control', 'no-cache, no-store, must-revalidate')
  if (contentLength) {
    setResponseHeader(event, 'Content-Length', contentLength)
  }

  // Pipe the body stream
  if (response.body) {
    return sendStream(event, response.body as any)
  }

  // Fallback: read as arrayBuffer
  const buffer = await response.arrayBuffer()
  return new Uint8Array(buffer)
}
