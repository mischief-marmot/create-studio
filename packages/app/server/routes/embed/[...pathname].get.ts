import { serveBlobFile } from '~~/server/utils/serveBlobFile'
import { useLogger } from '@create-studio/shared/utils/logger'

/**
 * Embed endpoint: GET /embed/{filename}
 *
 * Serves widget embed files from blob storage with security validation
 * Examples:
 * - GET /embed/main.js → serves main.js
 * - GET /embed/interactive-mode.js → serves interactive-mode.js
 * - GET /embed/entry.css → serves entry.css
 *
 * Security:
 * - Only whitelisted files can be embedded
 * - Path traversal attacks are blocked
 * - File type validation ensures only JS/CSS files
 */

// Hardcoded allowlist of embeddable widget files
const EMBED_ALLOWLIST = [
  'main.js',
  'entry.css',
  'interactive-mode.js',
  'interactive-mode.css',
  'servings-adjuster.js',
  'servings-adjuster.css'
  // Add more widget files as needed
]

// File type to content type mapping
const FILE_TYPES = {
  'js': 'application/javascript',
  'map.js': 'application/javascript',
  'css': 'text/css'
}

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const logger = useLogger('EmbedRoute', config.debug)
  const { pathname } = getRouterParams(event)

  logger.debug(`Embed request for: ${pathname}`)

  try {
    // Use shared blob serving utility
    return await serveBlobFile(event, pathname, {
      allowlist: EMBED_ALLOWLIST,
      fileTypes: FILE_TYPES,
      cacheControl: config.debug ? 'public, max-age=0' : 'public, max-age=86400', // Cache for 1 day in prod
      cors: true, // Public CORS for widget embedding
      contentDisposition: 'inline' // Display inline (don't download)
    })
  } catch (error) {
    logger.error(`Error serving embed ${pathname}:`, error)
    throw error
  }
})