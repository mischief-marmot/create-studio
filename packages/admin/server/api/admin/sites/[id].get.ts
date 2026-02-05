import { eq, desc } from 'drizzle-orm'
import { users, sites, subscriptions, siteUsers } from "~~/server/utils/admin-db"

/**
 * GET /api/admin/sites/[id]
 * Returns detailed information about a specific site
 *
 * Includes:
 * - Site basic info (name, URL, versions, settings)
 * - Owner information
 * - Associated users with roles and verification status
 * - Subscription information
 * - Canonical site reference
 */
export default defineEventHandler(async (event) => {
  // Check admin session
  const session = await getUserSession(event)
  if (!session?.user) {
    throw createError({
      statusCode: 401,
      message: 'Unauthorized',
    })
  }

  const db = useAdminDb(event)
  const siteId = parseInt(event.context.params?.id || '0')

  if (!siteId || isNaN(siteId)) {
    throw createError({
      statusCode: 400,
      message: 'Invalid site ID',
    })
  }

  try {
    // Get site details with owner info
    const siteResult = await db
      .select({
        id: sites.id,
        name: sites.name,
        url: sites.url,
        user_id: sites.user_id,
        canonical_site_id: sites.canonical_site_id,
        create_version: sites.create_version,
        wp_version: sites.wp_version,
        php_version: sites.php_version,
        interactive_mode_enabled: sites.interactive_mode_enabled,
        interactive_mode_button_text: sites.interactive_mode_button_text,
        createdAt: sites.createdAt,
        updatedAt: sites.updatedAt,
        ownerEmail: users.email,
        ownerFirstname: users.firstname,
        ownerLastname: users.lastname,
      })
      .from(sites)
      .innerJoin(users, eq(sites.user_id, users.id))
      .where(eq(sites.id, siteId))
      .limit(1)

    if (siteResult.length === 0) {
      throw createError({
        statusCode: 404,
        message: 'Site not found',
      })
    }

    const site = siteResult[0]

    // Get canonical site info if exists
    let canonicalSite = null
    if (site.canonical_site_id) {
      const canonicalResult = await db
        .select({
          id: sites.id,
          name: sites.name,
          url: sites.url,
        })
        .from(sites)
        .where(eq(sites.id, site.canonical_site_id))
        .limit(1)

      if (canonicalResult.length > 0) {
        canonicalSite = canonicalResult[0]
      }
    }

    // Get all associated users from SiteUsers table
    const associatedUsers = await db
      .select({
        userId: siteUsers.user_id,
        role: siteUsers.role,
        verified_at: siteUsers.verified_at,
        joined_at: siteUsers.joined_at,
        email: users.email,
        firstname: users.firstname,
        lastname: users.lastname,
      })
      .from(siteUsers)
      .innerJoin(users, eq(siteUsers.user_id, users.id))
      .where(eq(siteUsers.site_id, siteId))
      .orderBy(desc(siteUsers.joined_at))

    // Get subscription info for this site
    const subscriptionResult = await db
      .select({
        id: subscriptions.id,
        status: subscriptions.status,
        tier: subscriptions.tier,
        current_period_start: subscriptions.current_period_start,
        current_period_end: subscriptions.current_period_end,
        cancel_at_period_end: subscriptions.cancel_at_period_end,
        stripe_customer_id: subscriptions.stripe_customer_id,
        stripe_subscription_id: subscriptions.stripe_subscription_id,
      })
      .from(subscriptions)
      .where(eq(subscriptions.site_id, siteId))
      .limit(1)

    const subscription = subscriptionResult[0] || null

    return {
      id: site.id,
      name: site.name,
      url: site.url,
      owner: {
        id: site.user_id,
        email: site.ownerEmail,
        firstname: site.ownerFirstname,
        lastname: site.ownerLastname,
      },
      versions: {
        create: site.create_version,
        wordpress: site.wp_version,
        php: site.php_version,
      },
      settings: {
        interactive_mode_enabled: site.interactive_mode_enabled,
        interactive_mode_button_text: site.interactive_mode_button_text,
      },
      canonical_site: canonicalSite,
      associated_users: associatedUsers.map(user => ({
        id: user.userId,
        email: user.email,
        firstname: user.firstname,
        lastname: user.lastname,
        role: user.role,
        verified: !!user.verified_at,
        verified_at: user.verified_at,
        joined_at: user.joined_at,
      })),
      subscription,
      createdAt: site.createdAt,
      updatedAt: site.updatedAt,
    }
  } catch (error) {
    // If it's already a createError, re-throw it
    if (error && typeof error === 'object' && 'statusCode' in error) {
      throw error
    }

    console.error('Error fetching site details:', error)
    throw createError({
      statusCode: 500,
      message: 'Failed to fetch site details',
    })
  }
})
