/**
 * One-time migration script to populate canonical site relationships
 *
 * This script:
 * 1. For each unique URL, finds the oldest site record (by id) as canonical
 * 2. Updates all other sites for that URL to point to the canonical site
 * 3. Creates SiteUsers entries for all users with access to each canonical site
 * 4. Moves subscriptions to canonical sites
 *
 * Run with: npm run dev (in one terminal), then run this script as an API endpoint
 * Or use: npx nuxi db:studio and run SQL manually
 */

/**
 * This is now an API endpoint that can be called to run the migration
 * POST /api/v2/admin/migrate-canonical-sites
 */

import { consola } from 'consola'

export default defineEventHandler(async (event) => {
  const logger = consola.withTag('migrate-canonical-sites')
  logger.start('Starting canonical sites migration...')

  try {
    const db = hubDatabase()

    // Get all unique URLs
    logger.info('Finding all unique URLs...')
    const urlsResult = await db.prepare('SELECT DISTINCT url FROM Sites WHERE url IS NOT NULL').all()
    const urls = urlsResult.results.map((row: any) => row.url)

    logger.info(`Found ${urls.length} unique URLs to process`)

    let canonicalCount = 0
    let legacyCount = 0
    let siteUserCount = 0
    let subscriptionCount = 0

    for (const url of urls) {
      logger.info(`Processing URL: ${url}`)

      // Find all sites for this URL, ordered by id (oldest first)
      const sitesResult = await db.prepare(`
        SELECT id, user_id, canonical_site_id
        FROM Sites
        WHERE url = ?
        ORDER BY id ASC
      `).bind(url).all()

      const sites = sitesResult.results

      if (sites.length === 0) continue

      // First site (oldest) is the canonical site
      const canonicalSite = sites[0] as any
      const canonicalSiteId = canonicalSite.id

      logger.info(`  Canonical site: ${canonicalSiteId}`)
      canonicalCount++

      // Ensure canonical site has canonical_site_id = NULL
      if (canonicalSite.canonical_site_id !== null) {
        await db.prepare(`
          UPDATE Sites
          SET canonical_site_id = NULL
          WHERE id = ?
        `).bind(canonicalSiteId).run()
        logger.info(`  Updated canonical site ${canonicalSiteId} to have NULL canonical_site_id`)
      }

      // Update all other sites to point to canonical
      if (sites.length > 1) {
        for (let i = 1; i < sites.length; i++) {
          const legacySite = sites[i] as any

          if (legacySite.canonical_site_id !== canonicalSiteId) {
            await db.prepare(`
              UPDATE Sites
              SET canonical_site_id = ?
              WHERE id = ?
            `).bind(canonicalSiteId, legacySite.id).run()

            logger.info(`  Updated legacy site ${legacySite.id} to point to ${canonicalSiteId}`)
            legacyCount++
          }
        }
      }

      // Create SiteUsers entries for all users
      for (const site of sites) {
        const siteData = site as any
        const userId = siteData.user_id

        // Determine role: first user (owner of canonical site) is 'owner', others are 'admin'
        const role = siteData.id === canonicalSiteId ? 'owner' : 'admin'

        try {
          // Insert into SiteUsers (ignore if already exists)
          await db.prepare(`
            INSERT INTO SiteUsers (site_id, user_id, role)
            VALUES (?, ?, ?)
            ON CONFLICT (site_id, user_id) DO NOTHING
          `).bind(canonicalSiteId, userId, role).run()

          logger.info(`  Added user ${userId} with role '${role}' to canonical site ${canonicalSiteId}`)
          siteUserCount++
        } catch (error) {
          logger.warn(`  Failed to add user ${userId} to site ${canonicalSiteId}:`, error)
        }
      }

      // Move any subscriptions to canonical site
      // Find subscriptions pointing to any site with this URL
      const allSiteIds = sites.map((s: any) => s.id)

      for (const siteId of allSiteIds) {
        if (siteId === canonicalSiteId) continue

        // Check if there's a subscription for this legacy site
        const subResult = await db.prepare(`
          SELECT id FROM Subscriptions WHERE site_id = ?
        `).bind(siteId).first()

        if (subResult) {
          // Move subscription to canonical site
          await db.prepare(`
            UPDATE Subscriptions
            SET site_id = ?
            WHERE site_id = ?
          `).bind(canonicalSiteId, siteId).run()

          logger.info(`  Moved subscription from site ${siteId} to canonical site ${canonicalSiteId}`)
          subscriptionCount++
        }
      }
    }

    logger.success('Migration completed successfully!')
    logger.info(`Summary:`)
    logger.info(`  - Canonical sites: ${canonicalCount}`)
    logger.info(`  - Legacy sites: ${legacyCount}`)
    logger.info(`  - SiteUsers entries created: ${siteUserCount}`)
    logger.info(`  - Subscriptions moved: ${subscriptionCount}`)

    return {
      success: true,
      message: 'Migration completed successfully!',
      summary: {
        canonicalSites: canonicalCount,
        legacySites: legacyCount,
        siteUsersCreated: siteUserCount,
        subscriptionsMoved: subscriptionCount
      }
    }

  } catch (error) {
    logger.error('Migration failed:', error)
    return {
      success: false,
      error: String(error)
    }
  }
})
