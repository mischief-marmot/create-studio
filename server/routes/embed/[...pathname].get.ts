import { useLogger } from '#shared/utils/logger'

export default defineEventHandler(async (event) => {
  const { debug } = useRuntimeConfig()
  const logger = useLogger('EmbedRoute', debug)
  const { pathname } = getRouterParams(event)
  logger.debug(`Request for ${pathname}`)

  // Only serve specific widget files from blob storage
  const allowedFiles = ['main.js', 'main.css', 'create-studio.iife.js', 'create-studio.css']
  
  if (!allowedFiles.includes(pathname)) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Widget file not found'
    })
  }
  const ext = pathname.endsWith('.js') ? 'js' : 'css'
  const fileName = ext === 'js' ? 'main.js' : 'main.css'
  
  try {
    logger.debug(`Serving ${pathname} from blob storage...`)
    
    // Get the file from blob storage
    const blob = await hubBlob().get(fileName)
    if (!blob) {
      throw new Error(`File ${fileName} not found in blob storage`)
    }
    
    // Set appropriate headers
    const contentType = ext === 'js' ? 'application/javascript' : 'text/css'
    setResponseHeaders(event, {
      'Content-Type': contentType,
      'Cache-Control': 'public, max-age=3600', // Cache for 1 hour
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