import { serveBlobFile } from '~~/server/utils/serveBlobFile'
import { useLogger } from '@create-studio/shared/utils/logger'

/**
 * Download endpoint: GET /download/{filename}
 *
 * Serves downloadable files from blob storage with security validation
 * Examples:
 * - GET /download/plugin.zip → serves plugin.zip
 * - GET /download/theme.zip → serves theme.zip
 *
 * Security:
 * - Only whitelisted files can be downloaded
 * - Path traversal attacks are blocked
 * - File type validation ensures only allowed formats
 */

// Hardcoded allowlist of downloadable files
const DOWNLOAD_ALLOWLIST = [
  'create-plugin.zip',
  'recipe-importer.zip',
  // Add more files as needed
]

// File type to content type mapping
const FILE_TYPES = {
  'zip': 'application/zip',
  'pdf': 'application/pdf',
  'json': 'application/json',
  'csv': 'text/csv',
  'txt': 'text/plain'
}

export default defineEventHandler(async (event) => {
  const { debug } = useRuntimeConfig()
  const logger = useLogger('DownloadRoute', debug)
  const { pathname } = getRouterParams(event)

  logger.debug(`Download request for: ${pathname}`)

  try {
    // Use shared blob serving utility
    return await serveBlobFile(event, pathname, {
      allowlist: DOWNLOAD_ALLOWLIST,
      fileTypes: FILE_TYPES,
      cacheControl: 'public, max-age=3600', // Cache for 1 hour
      cors: true, // Public CORS access
      contentDisposition: 'attachment' // Trigger browser download
    })
  } catch (error) {
    logger.error(`Error serving download ${pathname}:`, error)
    throw error
  }
})
