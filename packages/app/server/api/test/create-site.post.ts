/**
 * TEST ENDPOINT: Create test site
 *
 * Only available in development/test environment
 * Used for creating test sites for e2e tests
 */

import { SiteRepository } from '~~/server/utils/database'

export default defineEventHandler(async (event) => {
  // Only allow in development/test
  if (!['development', 'test'].includes(process.env.NODE_ENV || '')) {
    setResponseStatus(event, 403)
    return { error: 'Test endpoints not available in this environment' }
  }

  try {
    const body = await readBody(event)
    const { userId, url } = body

    if (!userId) {
      setResponseStatus(event, 400)
      return { error: 'userId is required' }
    }

    if (!url) {
      setResponseStatus(event, 400)
      return { error: 'url is required' }
    }

    const siteRepo = new SiteRepository()

    // Create or find existing site
    const site = await siteRepo.findOrCreateByUserAndUrl(userId, url)

    // Ensure user is added to site with admin role
    await siteRepo.addUserToSite(site.id!, userId, 'admin')

    setResponseStatus(event, 201)
    return {
      success: true,
      site: {
        id: site.id,
        name: site.name,
        url: site.url,
        userId: site.user_id,
      },
    }
  } catch (error) {
    console.error('Error creating test site:', error)
    setResponseStatus(event, 500)
    return { error: 'Failed to create test site', details: String(error) }
  }
})
