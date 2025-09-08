export default defineEventHandler(async (event) => {
  const { pathname } = getRouterParams(event)
  console.log(`Request for ${pathname}`)

  // Only serve specific widget files from blob storage
  const allowedFiles = ['create-studio.iife.js', 'create-studio.css']
  
  if (!allowedFiles.includes(pathname)) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Widget file not found'
    })
  }
  
  try {
    console.log(`Serving ${pathname} from blob storage...`)
    
    // Get the file from blob storage
    const blob = await hubBlob().get(pathname)
    if (!blob) {
      throw new Error(`File ${pathname} not found in blob storage`)
    }
    
    // Set appropriate headers
    const contentType = pathname.endsWith('.js') ? 'application/javascript' : 'text/css'
    setResponseHeaders(event, {
      'Content-Type': contentType,
      'Cache-Control': 'public, max-age=3600', // Cache for 1 hour
    })
    
    // Return the file content directly
    return blob.stream()
  } catch (error) {
    console.error(`Error serving ${pathname} from blob:`, error)
    throw createError({
      statusCode: 404,
      statusMessage: 'Widget file not found in storage'
    })
  }
})