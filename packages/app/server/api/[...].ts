/**
 * Catch-all handler for undefined API routes
 * Returns a proper JSON 404 response instead of falling through to Nuxt pages
 */
export default defineEventHandler((event) => {
  const path = getRequestURL(event).pathname

  setResponseStatus(event, 404)
  return {
    success: false,
    error: 'Not Found',
    message: `API endpoint not found: ${path}`,
    statusCode: 404
  }
})
