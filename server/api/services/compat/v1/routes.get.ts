/**
 * GET /api/services/compat/v1/routes
 * List all available API endpoints
 *
 * Maintains compatibility with original Express API
 */

export default defineEventHandler(async (event) => {
  // Static list of available endpoints to match original API behavior
  const endpoints = [
    '/api/services/compat/v1/routes',
    '/api/services/compat/v1/status',
    '/api/services/compat/v1/users',
    '/api/services/compat/v1/users/:id',
    '/user/validation/:token',
    '/api/services/compat/v1/sites/:id',
    '/api/services/compat/v1/nutrition/recipe',
    '/api/services/compat/v1/scraper/scrape',
    '/'
  ]

  setResponseStatus(event, 200)
  return {
    endpoints
  }
})