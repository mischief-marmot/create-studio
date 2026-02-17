import { eq } from 'drizzle-orm'
import { sites } from '~~/server/utils/admin-db'
import { getAdminEnvironment } from '~~/server/utils/admin-env'

/**
 * GET /api/admin/sites/[id]/debug
 * Proxy debug data from a WordPress site via the main Create Studio app.
 *
 * Flow: Admin UI → this endpoint → Main App /api/v2/sites/:id/debug → webhook → WP plugin
 *
 * Query params are forwarded: scope, lines, search
 *
 * When scope=log_download, the response is streamed as a file download
 * rather than parsed as JSON.
 */
export default defineEventHandler(async (event) => {
  // Check admin session
  const session = await getUserSession(event)
  if (!session?.user) {
    throw createError({
      statusCode: 401,
      message: 'Unauthorized',
    })
  }

  const config = useRuntimeConfig()
  const db = useAdminDb(event)
  const siteId = parseInt(event.context.params?.id || '0')

  if (!siteId || isNaN(siteId)) {
    throw createError({
      statusCode: 400,
      message: 'Invalid site ID',
    })
  }

  // Verify site exists
  const siteResult = await db
    .select({ id: sites.id, url: sites.url })
    .from(sites)
    .where(eq(sites.id, siteId))
    .limit(1)

  if (siteResult.length === 0) {
    throw createError({
      statusCode: 404,
      message: 'Site not found',
    })
  }

  // Forward query params to main app
  const query = getQuery(event)
  const scope = (query.scope as string) || 'all'
  const params = new URLSearchParams()
  if (query.scope) params.set('scope', scope)
  if (query.lines) params.set('lines', query.lines as string)
  if (query.search) params.set('search', query.search as string)

  // Pick the correct main app URL based on admin environment (production/preview toggle)
  const adminEnv = getAdminEnvironment(event)
  const rawMainAppUrl = adminEnv === 'preview' ? config.mainAppPreviewUrl : config.mainAppUrl
  const mainAppUrl = rawMainAppUrl?.replace(/\/+$/, '')
  if (!mainAppUrl) {
    throw createError({
      statusCode: 500,
      message: `Main app URL not configured for ${adminEnv} environment`,
    })
  }

  const url = `${mainAppUrl}/api/v2/sites/${siteId}/debug?${params.toString()}`

  try {
    const response = await fetch(url, {
      headers: {
        'X-Admin-Api-Key': config.mainAppApiKey || '',
      },
    })

    // For log_download, stream the file response directly to the client
    if (scope === 'log_download') {
      if (!response.ok) {
        // Try to parse error JSON
        const errorText = await response.text().catch(() => '')
        try {
          const errorJson = JSON.parse(errorText)
          setResponseStatus(event, response.status)
          return errorJson
        } catch {
          throw createError({
            statusCode: response.status,
            message: 'Download failed',
          })
        }
      }

      // Forward download headers
      const contentType = response.headers.get('content-type') || 'text/plain'
      const contentLength = response.headers.get('content-length')
      const contentDisposition = response.headers.get('content-disposition') || 'attachment; filename="debug.log"'

      setResponseHeader(event, 'Content-Type', contentType)
      setResponseHeader(event, 'Content-Disposition', contentDisposition)
      setResponseHeader(event, 'Cache-Control', 'no-cache, no-store, must-revalidate')
      if (contentLength) {
        setResponseHeader(event, 'Content-Length', contentLength)
      }

      // Stream the body through
      if (response.body) {
        return sendStream(event, response.body as any)
      }

      // Fallback
      const buffer = await response.arrayBuffer()
      return new Uint8Array(buffer)
    }

    // Normal JSON response for other scopes
    const data = await response.json()

    if (!response.ok) {
      setResponseStatus(event, response.status)
      return data
    }

    return data
  } catch (error: any) {
    if (error.statusCode) throw error
    console.error('Debug proxy error:', error)
    throw createError({
      statusCode: 502,
      message: 'Failed to reach main application',
      data: { details: error.message },
    })
  }
})
