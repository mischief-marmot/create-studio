/**
 * Database utility functions using Drizzle ORM
 * Provides methods for user management and site management
 *
 * NuxtHub v0.10+ exports `db` and `schema` from 'hub:db'
 * Migrations are handled automatically by NuxtHub from server/db/migrations/
 */

import { eq, and, or, isNull, isNotNull, sql } from 'drizzle-orm'
import type { H3Event } from 'h3'
import type { SiteUser, SiteSettings, VersionLogEntry } from '../db/schema'
import { purgeSiteConfigCache, shouldPurgeOnSubscriptionUpdate } from './site-config-cache'

// Re-export types from schema for convenience
export type { User, NewUser, Site, NewSite, SiteUser, NewSiteUser, Subscription, NewSubscription, LinkSession, NewLinkSession, SiteMeta, NewSiteMeta, SiteSettings, VersionLogEntry, Survey, NewSurvey, SurveyResponse, NewSurveyResponse } from '../db/schema'

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
  has_trialed?: boolean
  trial_end?: string
  metadata?: Record<string, any>
  trial_extensions?: Record<string, string>
}

export const ALLOWED_TRIAL_STEPS = [
  'servings_adjustment',
  'unit_conversion',
  'checklists',
  'toolbar_layout',
  'bulk_import',
  'review_management',
  'premium_theme',
] as const

export type TrialStep = typeof ALLOWED_TRIAL_STEPS[number]

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
    last_active_at: string | null
  }>) {
    const now = new Date().toISOString()

    await db.update(schema.sites)
      .set({ ...updates, updatedAt: now })
      .where(eq(schema.sites.id, id))

    return this.findById(id)
  }

  /**
   * Update last_active_at timestamp only — does not modify updatedAt.
   * Caller is responsible for the once-per-day debounce check.
   */
  async touch(id: number) {
    const now = new Date().toISOString()
    await db.update(schema.sites)
      .set({ last_active_at: now })
      .where(eq(schema.sites.id, id))
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
   * Find a site by its pending verification code
   */
  async findByPendingVerificationCode(code: string) {
    return await db.select().from(schema.sites)
      .where(eq(schema.sites.pending_verification_code, code))
      .get()
  }

  /**
   * Set a pending verification code on a site
   */
  async setPendingVerificationCode(siteId: number, code: string) {
    const now = new Date().toISOString()

    await db.update(schema.sites)
      .set({ pending_verification_code: code, updatedAt: now })
      .where(eq(schema.sites.id, siteId))

    return this.findById(siteId)
  }

  /**
   * Clear the pending verification code from a site
   */
  async clearPendingVerificationCode(siteId: number) {
    const now = new Date().toISOString()

    await db.update(schema.sites)
      .set({ pending_verification_code: null, updatedAt: now })
      .where(eq(schema.sites.id, siteId))
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

  async create(data: CreateSubscriptionData, event?: H3Event) {
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
      has_trialed: data.has_trialed || false,
      trial_end: data.trial_end || null,
      metadata: data.metadata || null,
      trial_extensions: data.trial_extensions || null,
      createdAt: now,
      updatedAt: now,
    }).returning().get()

    if (!result) {
      throw new Error('Failed to create subscription')
    }

    // New subscription = state change for buildSiteConfig (no row → tier).
    await this.purgeConfigCacheForSite(data.site_id, event)

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
    has_trialed: boolean
    trial_end: string | null
    metadata: Record<string, any> | null
    trial_extensions: Record<string, string> | null
  }>, event?: H3Event) {
    const now = new Date().toISOString()

    await db.update(schema.subscriptions)
      .set({ ...updates, updatedAt: now })
      .where(eq(schema.subscriptions.site_id, siteId))

    // tier and status are the inputs to getActiveTier(), which feeds
    // buildSiteConfig. Other columns (period dates, metadata, etc.) don't
    // affect the cached response. Purge only when a relevant field shifted.
    if (shouldPurgeOnSubscriptionUpdate(updates)) {
      await this.purgeConfigCacheForSite(siteId, event)
    }

    return this.getBySiteId(siteId)
  }

  /** Look up the canonical site URL and purge the site-config edge cache.
   *  Best-effort: any failure is logged but doesn't abort the subscription
   *  write — cache invalidation is correctness-improving but not load-bearing
   *  for the DB transaction. Three sequential queries (UPDATE → SELECT
   *  sites.url → purge → SELECT subscription on return) which is fine at
   *  subscription-write frequency. */
  private async purgeConfigCacheForSite(siteId: number, event?: H3Event) {
    try {
      const site = await db.select({ url: schema.sites.url })
        .from(schema.sites)
        .where(eq(schema.sites.id, siteId))
        .get()
      if (site?.url) {
        await purgeSiteConfigCache(event, site.url)
      }
    } catch (purgeError) {
      // Don't let cache invalidation failures break a subscription write,
      // but make incidents diagnosable. String() coerces both Error and
      // opaque thrown values to a scannable payload field in CF logs.
      console.warn('site-config cache purge failed after subscription write', {
        siteId,
        error: purgeError instanceof Error ? purgeError.message : String(purgeError),
      })
    }
  }

  /**
   * Find an existing Stripe customer id previously linked to any of this
   * user's sites. Used to avoid rediscovering via Stripe's email lookup,
   * which is vulnerable to collisions with legacy/unrelated customers.
   */
  async getAnyStripeCustomerIdForUser(userId: number): Promise<string | null> {
    const row = await db.select({ id: schema.subscriptions.stripe_customer_id })
      .from(schema.subscriptions)
      .innerJoin(schema.siteUsers, eq(schema.subscriptions.site_id, schema.siteUsers.site_id))
      .where(and(
        eq(schema.siteUsers.user_id, userId),
        isNotNull(schema.subscriptions.stripe_customer_id),
      ))
      .limit(1)
      .get()
    return row?.id ?? null
  }

  async getActivePaidCountByUser(userId: number): Promise<number> {
    const result = await db.select({ count: sql<number>`count(*)` })
      .from(schema.subscriptions)
      .innerJoin(schema.siteUsers, eq(schema.subscriptions.site_id, schema.siteUsers.site_id))
      .where(and(
        eq(schema.siteUsers.user_id, userId),
        sql`${schema.subscriptions.status} = 'active'`,
        sql`${schema.subscriptions.tier} != 'free'`
      ))
      .get()
    return result?.count ?? 0
  }

  static isTrialExpired(trialEnd: string | null | undefined): boolean {
    return !!trialEnd && new Date(trialEnd) <= new Date()
  }

  getActiveTierFromRecord(subscription: Subscription | null | undefined): string {
    if (!subscription) return 'free'
    if (subscription.status === 'active') return subscription.tier
    if (subscription.status === 'trialing') {
      return SubscriptionRepository.isTrialExpired(subscription.trial_end) ? 'free' : 'trial'
    }
    return 'free'
  }

  async getActiveTier(siteId: number, siteUrl?: string): Promise<string> {
    const subscription = await this.getBySiteId(siteId)
    if (
      subscription?.status === 'trialing' &&
      SubscriptionRepository.isTrialExpired(subscription.trial_end)
    ) {
      await this._expireTrial(siteId, siteUrl)
      return 'free'
    }
    return this.getActiveTierFromRecord(subscription)
  }

  /**
   * Detect and fix expired trials: if the subscription is still marked as
   * 'trialing' but trial_end has passed, update the DB to 'expired'/'free'
   * and push a webhook to the WordPress site so the plugin downgrades.
   *
   * Returns true if a reconciliation was performed.
   */
  async reconcileExpiredTrial(siteId: number, siteUrl?: string): Promise<boolean> {
    const subscription = await this.getBySiteId(siteId)

    if (
      !subscription ||
      subscription.status !== 'trialing' ||
      !SubscriptionRepository.isTrialExpired(subscription.trial_end)
    ) {
      return false
    }

    await this._expireTrial(siteId, siteUrl)
    return true
  }

  /** Write the trial-expired state to DB and enqueue a webhook to the WP site. */
  private async _expireTrial(siteId: number, siteUrl?: string): Promise<void> {
    await this.update(siteId, {
      status: 'expired',
      tier: 'free',
      has_trialed: true,
    })

    const url = siteUrl ?? (await new SiteRepository().findById(siteId))?.url
    if (url) {
      const { enqueueSubscriptionChange } = await import('./message-queue')
      await enqueueSubscriptionChange(siteId, url, {
        tier: 'free',
        is_trialing: false,
        trial_days_remaining: 0,
      })
    }
  }

  async hasTrialed(siteId: number): Promise<boolean> {
    const subscription = await this.getBySiteId(siteId)
    return subscription?.has_trialed === true
  }

  getTrialInfoFromRecord(subscription: Subscription | null | undefined) {
    if (!subscription || !subscription.trial_end) {
      return { isTrialing: false, daysRemaining: 0, trialEnd: null, extensionsUsed: 0, extensions: null }
    }

    const now = new Date()
    const trialEnd = new Date(subscription.trial_end)
    const daysRemaining = Math.max(0, Math.ceil((trialEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)))

    return {
      isTrialing: subscription.status === 'trialing' && daysRemaining > 0,
      daysRemaining,
      trialEnd: subscription.trial_end,
      extensionsUsed: Object.keys(subscription.trial_extensions || {}).length,
      extensions: subscription.trial_extensions,
    }
  }

  async getTrialInfo(siteId: number) {
    const subscription = await this.getBySiteId(siteId)
    return this.getTrialInfoFromRecord(subscription)
  }

  async recordTrialExtension(siteId: number, step: TrialStep, newTrialEnd: string) {
    const subscription = await this.getBySiteId(siteId)
    if (!subscription) throw new Error('No subscription found')

    const extensions = subscription.trial_extensions || {}
    if (extensions[step]) throw new Error('Step already redeemed')

    extensions[step] = new Date().toISOString()

    await this.update(siteId, {
      trial_end: newTrialEnd,
      trial_extensions: extensions,
    })

    return { extensions, trialEnd: newTrialEnd }
  }

  isTrialEligibleFromRecord(subscription: Subscription | null | undefined): { eligible: boolean; reason?: string } {
    if (!subscription) return { eligible: true }
    if (subscription.has_trialed) return { eligible: false, reason: 'Site has already used a trial' }
    if (subscription.status === 'active' || subscription.status === 'trialing') {
      return { eligible: false, reason: 'Site already has an active subscription' }
    }
    if (subscription.status === 'expired') {
      return { eligible: false, reason: 'Site has an expired subscription' }
    }
    return { eligible: true }
  }

  async isTrialEligible(siteId: number): Promise<{ eligible: boolean; reason?: string }> {
    const subscription = await this.getBySiteId(siteId)
    return this.isTrialEligibleFromRecord(subscription)
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
   * Mark verified and generate user token (or preserve existing token)
   * Returns the token
   */
  async markVerifiedWithToken(userId: number, siteId: number): Promise<{ siteUser: SiteUser | undefined; token: string }> {
    const now = new Date().toISOString()

    // Preserve existing token if already verified — prevents token rotation
    // when multiple flows (link, site-connect, verify) call this method
    const existing = await this.findByUserAndSite(userId, siteId)
    const token = existing?.user_token || generateSecureToken()

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
   * Unverify all site-user connections for a site
   * Used when disconnecting via a site-only token (no specific user)
   */
  async unverifyAllForSite(siteId: number) {
    await db.update(schema.siteUsers)
      .set({ verified_at: null })
      .where(eq(schema.siteUsers.site_id, siteId))
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

/**
 * SiteMeta database operations
 * Manages flexible site settings and version update logs
 */
export class SiteMetaRepository {
  /**
   * Find SiteMeta row by site ID, or return null
   */
  async findBySiteId(siteId: number) {
    return await db.select().from(schema.siteMeta)
      .where(eq(schema.siteMeta.site_id, siteId))
      .get()
  }

  /**
   * Get settings for a site from SiteMeta.
   * Returns defaults if no SiteMeta row exists yet.
   */
  async getSettings(siteId: number): Promise<SiteSettings> {
    const meta = await this.findBySiteId(siteId)
    if (meta?.settings && Object.keys(meta.settings).length > 0) {
      return meta.settings as SiteSettings
    }
    return {}
  }

  /**
   * Upsert settings JSON — merges partial settings into existing
   */
  async updateSettings(siteId: number, settings: Partial<SiteSettings>) {
    const now = new Date().toISOString()
    const existing = await this.findBySiteId(siteId)

    const merged = existing
      ? { ...(existing.settings as SiteSettings || {}), ...settings }
      : settings as SiteSettings

    await db.insert(schema.siteMeta).values({
      site_id: siteId,
      settings: merged,
      version_logs: [],
      createdAt: now,
      updatedAt: now,
    }).onConflictDoUpdate({
      target: schema.siteMeta.site_id,
      set: { settings: merged, updatedAt: now },
    })

    return this.findBySiteId(siteId)
  }

  /**
   * Append a version log entry
   */
  async addVersionLog(siteId: number, from: string, to: string) {
    const now = new Date().toISOString()
    const entry: VersionLogEntry = { from, to, at: now }
    const existing = await this.findBySiteId(siteId)

    if (existing) {
      const existingLogs = (existing.version_logs as VersionLogEntry[]) || []
      // Deduplicate: if the most recent entry is the same transition, skip (race condition guard)
      const last = existingLogs[existingLogs.length - 1]
      if (last && last.from === from && last.to === to) {
        return existing
      }
      const logs = [...existingLogs, entry]
      await db.update(schema.siteMeta)
        .set({ version_logs: logs, updatedAt: now })
        .where(eq(schema.siteMeta.site_id, siteId))
    } else {
      try {
        await db.insert(schema.siteMeta).values({
          site_id: siteId,
          settings: {},
          version_logs: [entry],
          createdAt: now,
          updatedAt: now,
        })
      } catch (e: unknown) {
        // UNIQUE constraint race: another request inserted first — fall through to update path
        if (e instanceof Error && e.message.includes('UNIQUE')) {
          const fresh = await this.findBySiteId(siteId)
          if (fresh) {
            const freshLogs = (fresh.version_logs as VersionLogEntry[]) || []
            const lastFresh = freshLogs[freshLogs.length - 1]
            if (lastFresh && lastFresh.from === from && lastFresh.to === to) {
              return fresh
            }
            const logs = [...freshLogs, entry]
            await db.update(schema.siteMeta)
              .set({ version_logs: logs, updatedAt: now })
              .where(eq(schema.siteMeta.site_id, siteId))
          }
        } else {
          throw e
        }
      }
    }

    return this.findBySiteId(siteId)
  }

  /**
   * Get version logs for a site
   */
  async getVersionLogs(siteId: number): Promise<VersionLogEntry[]> {
    const meta = await this.findBySiteId(siteId)
    return (meta?.version_logs as VersionLogEntry[]) || []
  }
}

/**
 * LinkSession database operations
 * Manages temporary sessions for the user verification redirect flow
 */
export class LinkSessionRepository {
  async create(siteId: number, returnUrl: string) {
    const now = new Date().toISOString()
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString() // 10 minutes
    const id = crypto.randomUUID()

    await db.insert(schema.linkSessions).values({
      id,
      site_id: siteId,
      return_url: returnUrl,
      created_at: now,
      expires_at: expiresAt,
    })

    return this.findById(id)
  }

  async findById(id: string) {
    return await db.select().from(schema.linkSessions)
      .where(eq(schema.linkSessions.id, id))
      .get()
  }

  async findValidById(id: string) {
    const now = new Date().toISOString()
    return await db.select().from(schema.linkSessions)
      .where(and(
        eq(schema.linkSessions.id, id),
        sql`${schema.linkSessions.expires_at} > ${now}`
      ))
      .get()
  }

  async complete(id: string, userId: number, userToken: string) {
    await db.update(schema.linkSessions)
      .set({ user_id: userId, user_token: userToken })
      .where(eq(schema.linkSessions.id, id))

    return this.findById(id)
  }

  async delete(id: string) {
    await db.delete(schema.linkSessions)
      .where(eq(schema.linkSessions.id, id))
  }

  async deleteExpired() {
    const now = new Date().toISOString()
    await db.delete(schema.linkSessions)
      .where(sql`${schema.linkSessions.expires_at} <= ${now}`)
  }
}

/**
 * Survey database operations
 * Manages survey definitions and response collection
 */
export class SurveyRepository {
  async findBySlug(slug: string) {
    return await db.select().from(schema.surveys)
      .where(eq(schema.surveys.slug, slug))
      .get()
  }

  async findById(id: number) {
    return await db.select().from(schema.surveys)
      .where(eq(schema.surveys.id, id))
      .get()
  }

  async create(data: {
    slug: string
    title: string
    description?: string
    definition: Record<string, any>
    status?: string
    promotion?: Record<string, any>
    requires_auth?: boolean
    max_completions?: number | null
  }) {
    const now = new Date().toISOString()

    const result = await db.insert(schema.surveys).values({
      slug: data.slug,
      title: data.title,
      description: data.description || null,
      definition: data.definition,
      status: data.status || 'draft',
      promotion: data.promotion || null,
      requires_auth: data.requires_auth ?? false,
      max_completions: data.max_completions ?? null,
      createdAt: now,
      updatedAt: now,
    }).returning().get()

    if (!result) {
      throw new Error('Failed to create survey')
    }

    return result
  }

  async addResponse(data: {
    survey_id: number
    user_id?: number
    site_id?: number
    respondent_email?: string
    response_data: Record<string, any>
    completed?: boolean
  }) {
    const now = new Date().toISOString()
    // 128-bit opaque token (hex) so the response id alone can't be used as a
    // bearer — callers must echo the token back on PATCH for public surveys.
    const draftToken = crypto.randomUUID().replace(/-/g, '') + crypto.randomUUID().replace(/-/g, '')

    const result = await db.insert(schema.surveyResponses).values({
      survey_id: data.survey_id,
      user_id: data.user_id || null,
      site_id: data.site_id || null,
      respondent_email: data.respondent_email || null,
      response_data: data.response_data,
      completed: data.completed ?? true,
      draft_token: draftToken,
      createdAt: now,
    }).returning().get()

    if (!result) {
      throw new Error('Failed to save survey response')
    }

    return result
  }

  async findResponseById(id: number) {
    return await db.select().from(schema.surveyResponses)
      .where(eq(schema.surveyResponses.id, id))
      .get()
  }

  /**
   * Find an incomplete draft response for a given user + survey (+ optional site).
   * Used to resume partial submissions.
   */
  async findDraftForUser(surveyId: number, userId: number, siteId?: number) {
    const conditions = [
      eq(schema.surveyResponses.survey_id, surveyId),
      eq(schema.surveyResponses.user_id, userId),
      eq(schema.surveyResponses.completed, false),
    ]
    if (siteId != null) {
      conditions.push(eq(schema.surveyResponses.site_id, siteId))
    }
    return await db.select().from(schema.surveyResponses)
      .where(and(...conditions))
      .orderBy(sql`${schema.surveyResponses.createdAt} DESC`)
      .get()
  }

  /**
   * Find the most recent COMPLETED response for this user + survey (+ optional site).
   * Used to lock the survey page into "already completed" state on return visits.
   */
  async findCompletedForUser(surveyId: number, userId: number, siteId?: number) {
    const conditions = [
      eq(schema.surveyResponses.survey_id, surveyId),
      eq(schema.surveyResponses.user_id, userId),
      eq(schema.surveyResponses.completed, true),
    ]
    if (siteId != null) {
      conditions.push(eq(schema.surveyResponses.site_id, siteId))
    }
    return await db.select().from(schema.surveyResponses)
      .where(and(...conditions))
      .orderBy(sql`${schema.surveyResponses.createdAt} DESC`)
      .get()
  }

  /**
   * Update an existing response's data + optional completion flag.
   */
  async updateResponse(id: number, data: {
    response_data?: Record<string, any>
    completed?: boolean
    respondent_email?: string
  }) {
    const updates: Record<string, any> = {}
    if (data.response_data !== undefined) updates.response_data = data.response_data
    if (data.completed !== undefined) updates.completed = data.completed
    if (data.respondent_email !== undefined) updates.respondent_email = data.respondent_email
    await db.update(schema.surveyResponses)
      .set(updates)
      .where(eq(schema.surveyResponses.id, id))
    return this.findResponseById(id)
  }

  async updateDefinition(id: number, definition: Record<string, any>) {
    const now = new Date().toISOString()
    await db.update(schema.surveys)
      .set({ definition, updatedAt: now })
      .where(eq(schema.surveys.id, id))
    return this.findById(id)
  }

  async update(id: number, data: {
    slug?: string
    title?: string
    description?: string | null
    definition?: Record<string, any>
    status?: string
    promotion?: Record<string, any> | null
    requires_auth?: boolean
    max_completions?: number | null
  }) {
    const now = new Date().toISOString()
    await db.update(schema.surveys)
      .set({ ...data, updatedAt: now })
      .where(eq(schema.surveys.id, id))
    return this.findById(id)
  }

  async delete(id: number) {
    await db.delete(schema.surveys).where(eq(schema.surveys.id, id))
  }

  async getResponses(surveyId: number) {
    return await db.select().from(schema.surveyResponses)
      .where(eq(schema.surveyResponses.survey_id, surveyId))
      .orderBy(sql`${schema.surveyResponses.createdAt} DESC`)
      .all()
  }

  async getResponseCount(surveyId: number) {
    const result = await db.select({ count: sql<number>`count(*)` })
      .from(schema.surveyResponses)
      .where(and(
        eq(schema.surveyResponses.survey_id, surveyId),
        eq(schema.surveyResponses.completed, true)
      ))
      .get()
    return result?.count ?? 0
  }

  async isCapReached(surveyId: number, maxCompletions: number | null | undefined) {
    if (maxCompletions == null) return false
    const completed = await this.getResponseCount(surveyId)
    return completed >= maxCompletions
  }
}

export const SURVEY_CAP_EXHAUSTED_CODE = 'spots_exhausted'
export const SURVEY_CAP_EXHAUSTED_ERROR = {
  error: 'This survey has reached its completion limit',
  code: SURVEY_CAP_EXHAUSTED_CODE,
} as const
