/**
 * CORS middleware for API compatibility routes
 * Applies CORS headers to all /api/services/compat/v1/* routes
 */

export default defineEventHandler((event) => {
  // Only apply CORS to /api/services/compat/v1/* routes
  if (!event.node.req.url?.startsWith('/api/services/compat/v1/')) {
    return
  }

  // Configure CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*', // Allow all origins
    'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
    'Access-Control-Max-Age': '86400', // 24 hours
    'Access-Control-Allow-Credentials': 'true'
  }

  // Apply headers
  Object.entries(headers).forEach(([key, value]) => {
    setHeader(event, key, value)
  })

  // Handle preflight OPTIONS requests
  if (event.node.req.method === 'OPTIONS') {
    setResponseStatus(event, 204) // No Content
    return ''
  }
})