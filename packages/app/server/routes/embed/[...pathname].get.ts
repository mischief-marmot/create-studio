import { serveBlobFile } from '~~/server/utils/serveBlobFile'
import { useLogger } from '@create-studio/shared/utils/logger'

/**
 * Embed endpoint: GET /embed/{filename}
 *
 * Serves widget embed files from blob storage with security validation.
 * Uses Cloudflare Cache API to cache responses at the edge so most
 * requests never hit the Worker at all.
 *
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
  'servings-adjuster.css',
  'unit-conversion.js',
  'unit-conversion.css'
]

// File type to content type mapping
const FILE_TYPES = {
  'js': 'application/javascript',
  'map.js': 'application/javascript',
  'css': 'text/css'
}

const CACHE_MAX_AGE = 86400 // 1 day

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const logger = useLogger('EmbedRoute', config.debug)
  const { pathname } = getRouterParams(event)

  const isProduction = !config.debug

  // In production, check Cloudflare edge cache first
  if (isProduction) {
    try {
      const cache = (caches as any).default as Cache | undefined
      if (cache) {
        const cacheKey = new Request(getRequestURL(event).toString(), { method: 'GET' })
        const cachedResponse = await cache.match(cacheKey)
        if (cachedResponse) {
          // Serve directly from edge cache — Worker does almost no work
          setResponseHeaders(event, Object.fromEntries(cachedResponse.headers.entries()))
          return cachedResponse.body
        }
      }
    } catch {
      // Cache API not available (local dev, etc.) — fall through
    }
  }

  try {
    // Fetch from blob storage via shared utility
    const stream = await serveBlobFile(event, pathname, {
      allowlist: EMBED_ALLOWLIST,
      fileTypes: FILE_TYPES,
      cacheControl: isProduction
        ? `public, max-age=${CACHE_MAX_AGE}`
        : 'no-store',
      cors: true,
      contentDisposition: 'inline'
    })

    // In production, store the response in Cloudflare edge cache
    if (isProduction && stream) {
      try {
        const cache = (caches as any).default as Cache | undefined
        if (cache) {
          const cacheKey = new Request(getRequestURL(event).toString(), { method: 'GET' })
          // Read stream into buffer so we can tee it for the cache
          const body = await new Response(stream).arrayBuffer()
          const ext = pathname.split('.').pop()?.toLowerCase() || ''
          const contentType = FILE_TYPES[ext as keyof typeof FILE_TYPES] || 'application/octet-stream'

          const responseToCache = new Response(body, {
            headers: {
              'Content-Type': contentType,
              'Cache-Control': `public, max-age=${CACHE_MAX_AGE}`,
              'CDN-Cache-Control': `public, max-age=${CACHE_MAX_AGE}`,
              'Access-Control-Allow-Origin': '*',
              'Access-Control-Allow-Methods': 'GET, OPTIONS',
              'Access-Control-Allow-Headers': 'Content-Type',
            }
          })

          // Don't await — fire and forget so we don't block the response
          const ctx = (event.context.cloudflare as any)?.context
          if (ctx?.waitUntil) {
            ctx.waitUntil(cache.put(cacheKey, responseToCache))
          } else {
            cache.put(cacheKey, responseToCache).catch(() => {})
          }

          // Return the buffer to the client
          return send(event, Buffer.from(body), contentType)
        }
      } catch {
        // Cache write failed — response was already sent via serveBlobFile
      }
    }

    return stream
  } catch (error) {
    logger.error(`Error serving embed ${pathname}:`, error)
    throw error
  }
})