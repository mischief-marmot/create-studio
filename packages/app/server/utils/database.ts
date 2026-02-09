/**
 * Database utility functions using Drizzle ORM
 * Provides methods for user management and site management
 *
 * NuxtHub v0.10+ exports `db` and `schema` from 'hub:db'
 * Migrations are handled automatically by NuxtHub from server/db/migrations/
 */

import { eq, and, or, isNull, isNotNull, sql, like } from 'drizzle-orm'
import type { SiteUser } from '../db/schema'

// Re-export types from schema for convenience
export type { User, NewUser, Site, NewSite, SiteUser, NewSiteUser, Subscription, NewSubscription } from '../db/schema'

// Legacy interface types for backwards compatibility
export interface CreateUserData {
  email: string
  firstname?: string
  lastname?: string
  avatar?: string
  mediavine_publisher?: boolean
  marketing_opt_in?: boolean
  metadata?: Record<string, any>
  consent_tos_accepted_at?: string
  consent_privacy_accepted_at?: string
  consent_cookies_accepted_at?: string
}

export interface CreateSiteData {
  name?: string
  url: string
  user_id: number
  create_version?: string
  wp_version?: string
  php_version?: string
}

export interface CreateSubscriptionData {
  site_id: number
  stripe_customer_id?: string
  stripe_subscription_id?: string
  status: string
  tier: string
  current_period_start?: string
  current_period_end?: string
  cancel_at_period_end?: boolean
}

/**
 * User database operations
 */
export class UserRepository {
  async findByEmail(email: string) {
    return await db.select().from(schema.users).where(eq(schema.users.email, email)).get()
  }

  async findById(id: number) {
    return await db.select().from(schema.users).where(eq(schema.users.id, id)).get()
  }

  async create(userData: CreateUserData) {
    const now = new Date().toISOString()

    const result = await db.insert(schema.users).values({
      email: userData.email,
      firstname: userData.firstname || null,
      lastname: userData.lastname || null,
      mediavine_publisher: userData.mediavine_publisher || false,
      marketing_opt_in: userData.marketing_opt_in || false,
      metadata: userData.metadata || null,
      createdAt: now,
      updatedAt: now,
    }).returning().get()

    if (!result) {
      throw new Error('Failed to create user')
    }

    return result
  }

  async updateEmailValidation(id: number, validEmail: boolean) {
    const now = new Date().toISOString()

    await db.update(schema.users)
      .set({ validEmail, updatedAt: now })
      .where(eq(schema.users.id, id))

    return this.findById(id)
  }

  async findByIdWithSites(id: number) {
    const user = await this.findById(id)
    if (!user) return null

    const sites = await db.select().from(schema.sites).where(eq(schema.sites.user_id, id)).all()

    return {
      ...user,
      Sites: sites
    }
  }

  async setPassword(id: number, passwordHash: string) {
    const now = new Date().toISOString()

    await db.update(schema.users)
      .set({ password: passwordHash, updatedAt: now })
      .where(eq(schema.users.id, id))

    return this.findById(id)
  }

  async setPasswordResetToken(id: number, token: string, expiresAt: string) {
    const now = new Date().toISOString()

    await db.update(schema.users)
      .set({
        password_reset_token: token,
        password_reset_expires: expiresAt,
        updatedAt: now
      })
      .where(eq(schema.users.id, id))
  }

  async findByPasswordResetToken(token: string) {
    const now = new Date().toISOString()

    return await db.select().from(schema.users)
      .where(and(
        eq(schema.users.password_reset_token, token),
        sql`${schema.users.password_reset_expires} > ${now}`
      ))
      .get()
  }

  async clearPasswordResetToken(id: number) {
    const now = new Date().toISOString()

    await db.update(schema.users)
      .set({
        password_reset_token: null,
        password_reset_expires: null,
        updatedAt: now
      })
      .where(eq(schema.users.id, id))
  }

  async verifyUserPassword(email: string, password: string) {
    const user = await this.findByEmail(email)
    if (!user || !user.password) {
      return null
    }

    const { verifyUserPassword } = await import('./auth')
    const isValid = await verifyUserPassword(password, user.password)

    return isValid ? user : null
  }

  async update(id: number, updates: Partial<{
    email: string
    firstname: string | null
    lastname: string | null
    avatar: string | null
    mediavine_publisher: boolean
    validEmail: boolean
    marketing_opt_in: boolean
    metadata: Record<string, any> | null
    consent_tos_accepted_at: string | null
    consent_privacy_accepted_at: string | null
    consent_cookies_accepted_at: string | null
  }>) {
    const now = new Date().toISOString()

    await db.update(schema.users)
      .set({ ...updates, updatedAt: now })
      .where(eq(schema.users.id, id))

    const updatedUser = await this.findById(id)
    if (!updatedUser) throw new Error('Failed to update user')

    return updatedUser
  }
}

/**
 * Site database operations
 */
export class SiteRepository {
  async findById(id: number) {
    return await db.select().from(schema.sites).where(eq(schema.sites.id, id)).get()
  }

  async findOrCreateByUserAndUrl(userId: number, url: string) {
    // Try to find existing site
    const existing = await db.select().from(schema.sites)
      .where(and(eq(schema.sites.user_id, userId), eq(schema.sites.url, url)))
      .get()

    if (existing) {
      return existing
    }

    // Create new site
    const now = new Date().toISOString()
    const result = await db.insert(schema.sites).values({
      url,
      user_id: userId,
      createdAt: now,
      updatedAt: now,
    }).returning().get()

    if (!result) {
      throw new Error('Failed to create site')
    }

    return result
  }

  async update(id: number, updates: Partial<{
    name: string | null
    url: string
    wp_version: string | null
    php_version: string | null
    create_version: string | null
    interactive_mode_enabled: boolean
    interactive_mode_button_text: string | null
  }>) {
    const now = new Date().toISOString()

    await db.update(schema.sites)
      .set({ ...updates, updatedAt: now })
      .where(eq(schema.sites.id, id))

    return this.findById(id)
  }

  /**
   * V2 API: Find canonical site by URL
   * Canonical sites have canonical_site_id = NULL
   * Matches by host (hostname + port), ignoring protocol differences
   */
  async findCanonicalSite(url: string) {
    // Extract host from URL for flexible matching
    let host: string
    try {
      const parsed = new URL(url)
      host = parsed.host // includes port if non-default
    } catch {
      // If URL parsing fails, try exact match
      return await db.select().from(schema.sites)
        .where(and(eq(schema.sites.url, url), isNull(schema.sites.canonical_site_id)))
        .get()
    }

    // Try to find by host pattern (matches http:// or https://)
    return await db.select().from(schema.sites)
      .where(and(
        or(
          eq(schema.sites.url, url),
          eq(schema.sites.url, `https://${host}`),
          eq(schema.sites.url, `http://${host}`),
          like(schema.sites.url, `%://${host}%`)
        ),
        isNull(schema.sites.canonical_site_id)
      ))
      .orderBy(schema.sites.id)
      .limit(1)
      .get()
  }

  /**
   * V2 API: Find or create canonical site by URL
   * Creates a new canonical site if one doesn't exist for this URL
   */
  async findOrCreateCanonicalSite(url: string, userId: number) {
    // Try to find existing canonical site
    const existing = await this.findCanonicalSite(url)
    if (existing) {
      return existing
    }

    // Create new canonical site
    const now = new Date().toISOString()
    const result = await db.insert(schema.sites).values({
      url,
      user_id: userId,
      canonical_site_id: null,
      createdAt: now,
      updatedAt: now,
    }).returning().get()

    if (!result) {
      throw new Error('Failed to create canonical site')
    }

    return result
  }

  /**
   * V2 API: Get all canonical sites a user has access to
   * Uses SiteUsers pivot table
   */
  async getUserCanonicalSites(userId: number) {
    const results = await db.select({
      id: schema.sites.id,
      name: schema.sites.name,
      url: schema.sites.url,
      user_id: schema.sites.user_id,
      canonical_site_id: schema.sites.canonical_site_id,
      create_version: schema.sites.create_version,
      wp_version: schema.sites.wp_version,
      php_version: schema.sites.php_version,
      interactive_mode_enabled: schema.sites.interactive_mode_enabled,
      interactive_mode_button_text: schema.sites.interactive_mode_button_text,
      createdAt: schema.sites.createdAt,
      updatedAt: schema.sites.updatedAt,
    })
      .from(schema.sites)
      .innerJoin(schema.siteUsers, eq(schema.sites.id, schema.siteUsers.site_id))
      .where(and(
        eq(schema.siteUsers.user_id, userId),
        isNull(schema.sites.canonical_site_id)
      ))
      .orderBy(schema.sites.id)
      .all()

    return results
  }

  /**
   * V2 API: Check if user has access to a canonical site
   */
  async userHasAccessToSite(userId: number, canonicalSiteId: number) {
    const result = await db.select().from(schema.siteUsers)
      .where(and(
        eq(schema.siteUsers.site_id, canonicalSiteId),
        eq(schema.siteUsers.user_id, userId)
      ))
      .get()

    return !!result
  }

  /**
   * V2 API: Get user's role for a canonical site
   */
  async getUserRole(userId: number, canonicalSiteId: number) {
    const result = await db.select({ role: schema.siteUsers.role }).from(schema.siteUsers)
      .where(and(
        eq(schema.siteUsers.site_id, canonicalSiteId),
        eq(schema.siteUsers.user_id, userId)
      ))
      .get()

    return result?.role || null
  }

  /**
   * V2 API: Add user to canonical site
   */
  async addUserToSite(canonicalSiteId: number, userId: number, role: string = 'admin') {
    const now = new Date().toISOString()

    await db.insert(schema.siteUsers).values({
      site_id: canonicalSiteId,
      user_id: userId,
      role,
      joined_at: now,
    }).onConflictDoUpdate({
      target: [schema.siteUsers.site_id, schema.siteUsers.user_id],
      set: { role }
    })
  }

  /**
   * V2 API: Remove user from canonical site
   */
  async removeUserFromSite(canonicalSiteId: number, userId: number) {
    await db.delete(schema.siteUsers)
      .where(and(
        eq(schema.siteUsers.site_id, canonicalSiteId),
        eq(schema.siteUsers.user_id, userId)
      ))
  }

  /**
   * V2 API: Get all users for a canonical site
   */
  async getSiteUsers(canonicalSiteId: number) {
    const results = await db.select({
      userId: schema.siteUsers.user_id,
      role: schema.siteUsers.role,
      joinedAt: schema.siteUsers.joined_at,
    }).from(schema.siteUsers)
      .where(eq(schema.siteUsers.site_id, canonicalSiteId))
      .orderBy(schema.siteUsers.joined_at)
      .all()

    return results
  }
}

/**
 * Subscription database operations
 */
export class SubscriptionRepository {
  async getBySiteId(siteId: number) {
    return await db.select().from(schema.subscriptions)
      .where(eq(schema.subscriptions.site_id, siteId))
      .get()
  }

  async getByStripeSubscriptionId(stripeSubId: string) {
    return await db.select().from(schema.subscriptions)
      .where(eq(schema.subscriptions.stripe_subscription_id, stripeSubId))
      .get()
  }

  async create(data: CreateSubscriptionData) {
    const now = new Date().toISOString()

    const result = await db.insert(schema.subscriptions).values({
      site_id: data.site_id,
      stripe_customer_id: data.stripe_customer_id || null,
      stripe_subscription_id: data.stripe_subscription_id || null,
      status: data.status,
      tier: data.tier,
      current_period_start: data.current_period_start || null,
      current_period_end: data.current_period_end || null,
      cancel_at_period_end: data.cancel_at_period_end || false,
      createdAt: now,
      updatedAt: now,
    }).returning().get()

    if (!result) {
      throw new Error('Failed to create subscription')
    }

    return result
  }

  async update(siteId: number, updates: Partial<{
    stripe_customer_id: string | null
    stripe_subscription_id: string | null
    status: string
    tier: string
    current_period_start: string | null
    current_period_end: string | null
    cancel_at_period_end: boolean
  }>) {
    const now = new Date().toISOString()

    await db.update(schema.subscriptions)
      .set({ ...updates, updatedAt: now })
      .where(eq(schema.subscriptions.site_id, siteId))

    return this.getBySiteId(siteId)
  }

  async getActiveTier(siteId: number): Promise<string> {
    const subscription = await this.getBySiteId(siteId)

    if (!subscription) {
      return 'free'
    }

    // Check if subscription is active
    if (subscription.status === 'active' || subscription.status === 'trialing') {
      return subscription.tier
    }

    return 'free'
  }
}

/**
 * Generate a secure random token for user authentication
 */
function generateSecureToken(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  let token = ''
  const randomValues = new Uint8Array(64)
  crypto.getRandomValues(randomValues)
  for (let i = 0; i < 64; i++) {
    token += chars[randomValues[i] % chars.length]
  }
  return token
}

/**
 * SiteUser database operations
 * Manages the many-to-many relationship between users and canonical sites
 */
export class SiteUserRepository {
  /**
   * Find a SiteUser record by user and site
   */
  async findByUserAndSite(userId: number, siteId: number) {
    return await db.select().from(schema.siteUsers)
      .where(and(
        eq(schema.siteUsers.user_id, userId),
        eq(schema.siteUsers.site_id, siteId)
      ))
      .get()
  }

  /**
   * Find a SiteUser record by user_token
   */
  async findByUserToken(userToken: string) {
    return await db.select().from(schema.siteUsers)
      .where(eq(schema.siteUsers.user_token, userToken))
      .get()
  }

  /**
   * Find a SiteUser record by verification_code
   * Used for frontend user verification flow
   */
  async findByVerificationCode(verificationCode: string) {
    return await db.select().from(schema.siteUsers)
      .where(eq(schema.siteUsers.verification_code, verificationCode))
      .get()
  }

  /**
   * Find a SiteUser record by site and email (via user lookup)
   */
  async findBySiteAndEmail(siteId: number, email: string) {
    const userRepo = new UserRepository()
    const user = await userRepo.findByEmail(email)
    if (!user) return null

    return await this.findByUserAndSite(user.id, siteId)
  }

  /**
   * Set verification code for a SiteUser
   */
  async setVerificationCode(userId: number, siteId: number, code: string) {
    await db.update(schema.siteUsers)
      .set({ verification_code: code })
      .where(and(
        eq(schema.siteUsers.user_id, userId),
        eq(schema.siteUsers.site_id, siteId)
      ))

    return this.findByUserAndSite(userId, siteId)
  }

  /**
   * Generate and set a user token for authenticated API calls
   */
  async generateUserToken(userId: number, siteId: number): Promise<string> {
    const token = generateSecureToken()

    await db.update(schema.siteUsers)
      .set({ user_token: token })
      .where(and(
        eq(schema.siteUsers.user_id, userId),
        eq(schema.siteUsers.site_id, siteId)
      ))

    return token
  }

  /**
   * Clear verification code and token (for disconnect)
   */
  async clearVerification(userId: number, siteId: number) {
    await db.update(schema.siteUsers)
      .set({
        verification_code: null,
        user_token: null,
        verified_at: null
      })
      .where(and(
        eq(schema.siteUsers.user_id, userId),
        eq(schema.siteUsers.site_id, siteId)
      ))

    return this.findByUserAndSite(userId, siteId)
  }

  /**
   * Mark verified and generate user token
   * Returns the generated token
   */
  async markVerifiedWithToken(userId: number, siteId: number): Promise<{ siteUser: SiteUser | undefined; token: string }> {
    const now = new Date().toISOString()
    const token = generateSecureToken()

    await db.update(schema.siteUsers)
      .set({
        verified_at: now,
        verification_code: null,
        user_token: token
      })
      .where(and(
        eq(schema.siteUsers.user_id, userId),
        eq(schema.siteUsers.site_id, siteId)
      ))

    const siteUser = await this.findByUserAndSite(userId, siteId)
    return { siteUser, token }
  }

  /**
   * Create a pending (unverified) site-user connection
   */
  async createPending(userId: number, siteId: number, role: 'owner' | 'admin' | 'editor' = 'owner') {
    const now = new Date().toISOString()

    // Check if already exists
    const existing = await this.findByUserAndSite(userId, siteId)
    if (existing) {
      return existing
    }

    await db.insert(schema.siteUsers).values({
      site_id: siteId,
      user_id: userId,
      role,
      verified_at: null,
      joined_at: now,
    })

    const created = await this.findByUserAndSite(userId, siteId)
    if (!created) {
      throw new Error('Failed to create SiteUser record')
    }

    return created
  }

  /**
   * Mark a site-user connection as verified
   */
  async markVerified(userId: number, siteId: number) {
    const now = new Date().toISOString()

    await db.update(schema.siteUsers)
      .set({ verified_at: now })
      .where(and(
        eq(schema.siteUsers.user_id, userId),
        eq(schema.siteUsers.site_id, siteId)
      ))

    return this.findByUserAndSite(userId, siteId)
  }

  /**
   * Mark a site-user connection as unverified (clear verified_at)
   * This allows the user to reconnect later without losing the site association
   */
  async unverify(userId: number, siteId: number) {
    await db.update(schema.siteUsers)
      .set({ verified_at: null })
      .where(and(
        eq(schema.siteUsers.user_id, userId),
        eq(schema.siteUsers.site_id, siteId)
      ))

    return this.findByUserAndSite(userId, siteId)
  }

  /**
   * Get all pending (unverified) connections for a user
   */
  async getUserPendingConnections(userId: number) {
    return await db.select().from(schema.siteUsers)
      .where(and(
        eq(schema.siteUsers.user_id, userId),
        isNull(schema.siteUsers.verified_at)
      ))
      .all()
  }

  /**
   * Get all verified connections for a user
   */
  async getUserVerifiedConnections(userId: number) {
    return await db.select().from(schema.siteUsers)
      .where(and(
        eq(schema.siteUsers.user_id, userId),
        isNotNull(schema.siteUsers.verified_at)
      ))
      .all()
  }

  /**
   * Get all connections for a user (both verified and pending)
   */
  async getUserConnections(userId: number) {
    return await db.select().from(schema.siteUsers)
      .where(eq(schema.siteUsers.user_id, userId))
      .orderBy(sql`${schema.siteUsers.joined_at} DESC`)
      .all()
  }

  /**
   * Check if a user has verified access to a site
   */
  async isUserVerified(userId: number, siteId: number) {
    const result = await db.select().from(schema.siteUsers)
      .where(and(
        eq(schema.siteUsers.user_id, userId),
        eq(schema.siteUsers.site_id, siteId),
        isNotNull(schema.siteUsers.verified_at)
      ))
      .get()

    return !!result
  }

  /**
   * Delete a site-user connection
   */
  async delete(userId: number, siteId: number) {
    await db.delete(schema.siteUsers)
      .where(and(
        eq(schema.siteUsers.user_id, userId),
        eq(schema.siteUsers.site_id, siteId)
      ))
  }
}
