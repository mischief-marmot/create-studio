/**
 * GET /api/v1/status
 * API health check endpoint
 *
 * Maintains compatibility with original Express API
 */

export default defineEventHandler(async (event) => {
  setResponseStatus(event, 200)
  return {
    apiStatus: 'ok'
  }
})