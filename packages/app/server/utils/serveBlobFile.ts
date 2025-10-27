import { useLogger } from '@create-studio/shared/utils/logger'
import { H3Error, type H3Event } from 'h3'

/**
 * Options for serving blob files
 */
export interface ServeBlobFileOptions {
  /** Hardcoded array of allowed filenames */
  allowlist: string[]
  /** Map of file extensions to content types (e.g., { 'zip': 'application/zip' }) */
  fileTypes?: Record<string, string>
  /** Optional prefix for blob storage path */
  prefix?: string
  /** Cache control header (default: 'public, max-age=3600') */
  cacheControl?: string
  /** Enable CORS headers (default: true) */
  cors?: boolean
  /** Content disposition: 'attachment' (download) or 'inline' (display) */
  contentDisposition?: 'inline' | 'attachment'
}

/**
 * Serve a file from NuxtHub blob storage with security validation
 *
 * Features:
 * - Allowlist validation (only explicitly allowed files)
 * - File type validation (only allowed extensions)
 * - Path traversal prevention
 * - Configurable caching and CORS
 * - Proper error handling and logging
 *
 * @param event - H3 event object
 * @param pathname - Requested file path (e.g., 'plugin.zip')
 * @param options - Configuration options
 *
 * @example
 * // Download endpoint
 * serveBlobFile(event, pathname, {
 *   allowlist: ['plugin.zip', 'theme.zip'],
 *   fileTypes: { 'zip': 'application/zip' },
 *   cacheControl: 'public, max-age=3600',
 *   cors: true,
 *   contentDisposition: 'attachment'
 * })
 *
 * @example
 * // Embed endpoint
 * serveBlobFile(event, pathname, {
 *   allowlist: ['main.js', 'entry.css'],
 *   fileTypes: { 'js': 'application/javascript', 'css': 'text/css' },
 *   cacheControl: 'public, max-age=3600',
 *   cors: true,
 *   contentDisposition: 'inline'
 * })
 */
export async function serveBlobFile(
  event: H3Event,
  pathname: string,
  options: ServeBlobFileOptions
): Promise<ReadableStream<Uint8Array>> {
  const { debug } = useRuntimeConfig()
  const logger = useLogger('ServeBlobFile', debug)

  // Set defaults
  const {
    allowlist,
    fileTypes = {},
    prefix = '',
    cacheControl = 'public, max-age=3600', // Cache for 1 hour
    cors = true,
    contentDisposition = 'inline'
  } = options

  logger.debug(`Serving blob file: ${pathname}`)

  // Security: Prevent directory traversal
  if (pathname.includes('..') || pathname.includes('/') || pathname.includes('\\')) {
    logger.error(`Directory traversal attempt detected: ${pathname}`)
    throw createError({
      statusCode: 400,
      statusMessage: 'Invalid file path'
    })
  }

  // Security: Validate against allowlist
  if (!allowlist.includes(pathname)) {
    logger.error(`File not in allowlist: ${pathname}`)
    throw createError({
      statusCode: 404,
      statusMessage: 'File not found'
    })
  }

  // Security: Validate file type if fileTypes map provided
  if (Object.keys(fileTypes).length > 0) {
    const ext = pathname.split('.').pop()?.toLowerCase()
    if (!ext || !fileTypes[ext]) {
      logger.error(`File type not allowed: ${pathname} (ext: ${ext})`)
      throw createError({
        statusCode: 404,
        statusMessage: 'File type not allowed'
      })
    }
  }

  // Build full path with prefix if provided
  const fullPath = prefix ? `${prefix}/${pathname}` : pathname

  try {
    logger.debug(`Fetching from blob storage: ${fullPath}`)

    // Fetch file from NuxtHub blob storage
    const blob = await hubBlob().get(fullPath)
    if (!blob) {
      logger.error(`File not found in blob storage: ${fullPath}`)
      throw createError({
        statusCode: 404,
        statusMessage: 'File not found in storage'
      })
    }

    // Determine content type
    const ext = pathname.split('.').pop()?.toLowerCase() || ''
    const contentType = fileTypes[ext] || 'application/octet-stream'

    // Build headers
    const headers: Record<string, string> = {
      'Content-Type': contentType,
      'Cache-Control': cacheControl
    }

    // Add Content-Disposition header for downloads
    if (contentDisposition === 'attachment') {
      headers['Content-Disposition'] = `attachment; filename="${pathname}"`
    }

    // Add CORS headers if enabled
    if (cors) {
      headers['Access-Control-Allow-Origin'] = '*'
      headers['Access-Control-Allow-Methods'] = 'GET'
      headers['Access-Control-Allow-Headers'] = 'Content-Type'
    }

    // Set all response headers
    setResponseHeaders(event, headers)

    logger.debug(`Successfully serving: ${pathname} (${contentType})`)

    // Return the blob stream
    return blob.stream()
  } catch (error) {
    // Don't re-throw if it's already a 404/400 error
    if (error instanceof H3Error && (error.statusCode === 404 || error.statusCode === 400)) {
      throw error
    }

    logger.error(`Error serving blob file ${fullPath}:`, error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to serve file'
    })
  }
}
