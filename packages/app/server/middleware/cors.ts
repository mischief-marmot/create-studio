/**
 * CORS middleware for API compatibility routes
 * Applies CORS headers to all /api/v1/* routes
 */

export default defineEventHandler((event) => {
  const routePatterns = [
    /^\/api\/v1\/.*/,
    /^\/api\/v2\/fetch-creation/,
    /^\/api\/v2\/auth\/request-password-reset/,
    /^\/api\/v2\/timers/,
  ]
  const path = event.node.req.url || '';

  const isMatch = routePatterns.some(pattern => {
    return pattern.test(path);
  });
  if (!isMatch) return;

  // Only apply CORS to /api/v1/* routes

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