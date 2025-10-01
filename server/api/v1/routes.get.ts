/**
 * GET /api/v1/routes
 * List all available API endpoints
 *
 * Maintains compatibility with original Express API
 */

export default defineEventHandler(async (event) => {
  // Static list of available endpoints to match original API behavior
  const endpoints = [
    '/api/v1/routes',
    '/api/v1/status',
    '/api/v1/users',
    '/api/v1/users/:id',
    '/user/validation/:token',
    '/api/v1/sites/:id',
    '/api/v1/nutrition/recipe',
    '/api/v1/scraper/scrape',
    '/'
  ]

  setResponseStatus(event, 200)
  return {
    endpoints
  }
})