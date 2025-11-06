/**
 * Analytics Reporting API
 * Provides detailed reports on users, sites, and version information
 */

import { UserRepository, SiteRepository } from '~/server/utils/database'

export default defineEventHandler(async (event) => {
  // TODO: Add auth check - only admin should access this
  // For now, we'll assume auth middleware handles it

  try {
    const userRepo = new UserRepository()
    const siteRepo = new SiteRepository()

    // Get all the required data in parallel
    const [
      totalUsers,
      totalSites,
      usersPerSite,
      versionInfo,
      lastActiveUser,
      lastActiveSite
    ] = await Promise.all([
      userRepo.getTotalCount(),
      siteRepo.getTotalCount(),
      siteRepo.getUsersPerSite(),
      siteRepo.getVersionInfo(),
      userRepo.getLastActiveUser(),
      siteRepo.getLastActiveSite()
    ])

    // Format last active user data
    const lastActiveUserData = lastActiveUser ? {
      userId: lastActiveUser.id,
      email: lastActiveUser.email,
      firstname: lastActiveUser.firstname,
      lastname: lastActiveUser.lastname,
      lastActiveAt: lastActiveUser.last_active_at
    } : null

    // Format last active site data
    const lastActiveSiteData = lastActiveSite ? {
      siteId: lastActiveSite.id,
      siteName: lastActiveSite.name,
      url: lastActiveSite.url,
      lastActiveAt: lastActiveSite.last_active_at
    } : null

    return {
      totalUsers,
      totalSites,
      usersPerSite,
      versionInfo,
      lastActiveUser: lastActiveUserData,
      lastActiveSite: lastActiveSiteData
    }
  } catch (error) {
    console.error('Error fetching reporting data:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to fetch reporting data'
    })
  }
})
