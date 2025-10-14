import { useLogger } from '@create-studio/shared/utils/logger'

export default defineEventHandler(async (event) => {
  const { debug } = useRuntimeConfig()
  const logger = useLogger('EmbedRoute', debug)
  const { pathname } = getRouterParams(event)
  logger.debug(`Request for ${pathname}`)

  // Allow widget files from blob storage - main files and chunks
  const isMainFile = ['main.js', 'entry.css'].includes(pathname)
  const isChunkFile = pathname.match(/^(interactive-mode|servings-adjuster)\.(js|css)$/)

  if (!isMainFile && !isChunkFile) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Widget file not found'
    })
  }
  const ext = pathname.endsWith('.js') ? 'js' : 'css'

  try {
    logger.debug(`Serving ${pathname} from blob storage...`)

    // Get the file from blob storage
    const blob = await hubBlob().get(pathname)
    if (!blob) {
      throw new Error(`File ${pathname} not found in blob storage`)
    }
    
    // Set appropriate headers
    const contentType = ext === 'js' ? 'application/javascript' : 'text/css'
    setResponseHeaders(event, {
      'Content-Type': contentType,
      'Cache-Control': 'public, max-age=3600', // Cache for 1 hour
      'Access-Control-Allow-Origin': '*', // Allow all origins for widget embed
      'Access-Control-Allow-Methods': 'GET',
      'Access-Control-Allow-Headers': 'Content-Type'
    })
    
    // Return the file content directly
    return blob.stream()
  } catch (error) {
    logger.error(`Error serving ${pathname} from blob:`, error)
    throw createError({
      statusCode: 404,
      statusMessage: 'Widget file not found in storage'
    })
  }
})