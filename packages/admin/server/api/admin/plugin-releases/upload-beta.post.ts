import { getAdminEnvironment } from '~~/server/utils/admin-env'
import { useAdminOpsDb, auditLogs, getAuditEnvironment } from '~~/server/utils/admin-ops-db'

/**
 * POST /api/admin/plugin-releases/upload-beta
 *
 * Proxies a beta plugin upload from the admin UI to the main app.
 * Forwards the raw multipart body directly to avoid re-encoding issues.
 */
export default defineEventHandler(async (event) => {
  const session = await getUserSession(event)
  if (!session?.user) {
    throw createError({
      statusCode: 401,
      message: 'Unauthorized',
    })
  }

  const config = useRuntimeConfig()
  const adminEnv = getAdminEnvironment(event)
  const rawMainAppUrl = adminEnv === 'preview' ? config.mainAppPreviewUrl : config.mainAppUrl
  const mainAppUrl = rawMainAppUrl?.replace(/\/+$/, '')

  if (!mainAppUrl) {
    throw createError({
      statusCode: 500,
      message: 'Main app URL not configured',
    })
  }

  try {
    // Read the raw body and forward it as-is to preserve multipart encoding
    const rawBody = await readRawBody(event, false)

    if (!rawBody) {
      throw createError({
        statusCode: 400,
        message: 'No file provided',
      })
    }

    // Get the original Content-Type (includes the boundary)
    const contentType = getHeader(event, 'content-type')
    if (!contentType?.includes('multipart/form-data')) {
      throw createError({
        statusCode: 400,
        message: 'Expected multipart/form-data',
      })
    }

    // Get optional version from the form data (sent as a separate field)
    // We'll also peek at it from the X-Beta-Version header the frontend could set
    const version = getHeader(event, 'X-Beta-Version') || ''

    // Forward headers
    const headers: Record<string, string> = {
      'Content-Type': contentType,
      'X-Beta-Upload-Key': config.mainAppApiKey || '',
    }

    if (version) {
      headers['X-Beta-Version'] = version
    }

    const response = await fetch(`${mainAppUrl}/api/v2/internal/upload-beta-plugin`, {
      method: 'POST',
      headers,
      body: rawBody,
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error(`Beta upload proxy failed: ${response.status} ${errorText}`)
      throw createError({
        statusCode: response.status,
        message: `Upload failed: ${response.statusText}`,
      })
    }

    const result = await response.json() as { success: boolean; version?: string; size?: number }

    // Audit log the upload
    try {
      const adminOpsDb = useAdminOpsDb(event)
      await adminOpsDb.insert(auditLogs).values({
        admin_id: session.user.id,
        action: 'beta_plugin_uploaded',
        entity_type: 'plugin_release',
        environment: getAuditEnvironment(event),
        changes: JSON.stringify({
          version: result.version || version || 'unknown',
          size: result.size,
        }),
        ip_address: getRequestIP(event) || null,
        user_agent: getHeader(event, 'user-agent') || null,
        createdAt: new Date().toISOString(),
      })
    } catch (auditError) {
      console.warn('Failed to create audit log for beta upload:', auditError)
    }

    return result
  } catch (error) {
    if (error && typeof error === 'object' && 'statusCode' in error) {
      throw error
    }

    console.error('Error proxying beta plugin upload:', error)
    throw createError({
      statusCode: 500,
      message: 'Failed to upload beta plugin',
    })
  }
})
