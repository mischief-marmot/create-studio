/**
 * Database utility functions for D1 integration
 * Provides methods for user management and site management
 *
 * Note: Migrations are handled automatically by NuxtHub from server/database/migrations/
 */

// Types matching the original Sequelize models
export interface User {
  id?: number
  email: string
  password?: string
  password_reset_token?: string
  password_reset_expires?: string
  firstname?: string
  lastname?: string
  avatar?: string
  mediavine_publisher?: boolean
  validEmail?: boolean
  marketing_opt_in?: boolean
  createdAt?: string
  updatedAt?: string
}

export interface Site {
  id?: number
  name?: string
  url?: string
  user_id: number
  create_version?: string
  wp_version?: string
  php_version?: string
  createdAt?: string
  updatedAt?: string
}

export interface CreateUserData {
  email: string
  firstname?: string
  lastname?: string
  avatar?: string
  mediavine_publisher?: boolean
  marketing_opt_in?: boolean
}

export interface CreateSiteData {
  name?: string
  url: string
  user_id: number
  create_version?: string
  wp_version?: string
  php_version?: string
}

export interface Subscription {
  id?: number
  site_id: number
  stripe_customer_id?: string
  stripe_subscription_id?: string
  status: string
  tier: string
  current_period_start?: string
  current_period_end?: string
  cancel_at_period_end?: boolean
  createdAt?: string
  updatedAt?: string
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
  private db = hubDatabase()

  async findByEmail(email: string): Promise<User | null> {
    const result = await this.db.prepare('SELECT * FROM Users WHERE email = ?').bind(email).first()
    return result ? this.normalizeUser(result) : null
  }

  async findById(id: number): Promise<User | null> {
    const result = await this.db.prepare('SELECT * FROM Users WHERE id = ?').bind(id).first()
    return result ? this.normalizeUser(result) : null
  }

  async create(userData: CreateUserData): Promise<User> {
    const now = new Date().toISOString()

    const result = await this.db.prepare(`
      INSERT INTO Users (email, firstname, lastname, mediavine_publisher, marketing_opt_in, createdAt, updatedAt)
      VALUES (?, ?, ?, ?, ?, ?, ?)
      RETURNING *
    `).bind(
      userData.email,
      userData.firstname || null,
      userData.lastname || null,
      userData.mediavine_publisher ? 1 : 0,
      userData.marketing_opt_in ? 1 : 0,
      now,
      now
    ).first()

    if (!result) {
      throw new Error('Failed to create user')
    }

    return this.normalizeUser(result)
  }

  async updateEmailValidation(id: number, validEmail: boolean): Promise<User | null> {
    const now = new Date().toISOString()

    await this.db.prepare(`
      UPDATE Users
      SET validEmail = ?, updatedAt = ?
      WHERE id = ?
    `).bind(validEmail ? 1 : 0, now, id).run()

    return this.findById(id)
  }

  async findByIdWithSites(id: number): Promise<(User & { Sites?: Site[] }) | null> {
    const user = await this.findById(id)
    if (!user) return null

    const sites = await this.db.prepare('SELECT * FROM Sites WHERE user_id = ?').bind(id).all()

    return {
      ...user,
      Sites: sites.results.map(site => this.normalizeSite(site))
    }
  }

  async setPassword(id: number, passwordHash: string): Promise<User | null> {
    const now = new Date().toISOString()

    await this.db.prepare(`
      UPDATE Users
      SET password = ?, updatedAt = ?
      WHERE id = ?
    `).bind(passwordHash, now, id).run()

    return this.findById(id)
  }

  async setPasswordResetToken(id: number, token: string, expiresAt: string): Promise<void> {
    const now = new Date().toISOString()

    await this.db.prepare(`
      UPDATE Users
      SET password_reset_token = ?, password_reset_expires = ?, updatedAt = ?
      WHERE id = ?
    `).bind(token, expiresAt, now, id).run()
  }

  async findByPasswordResetToken(token: string): Promise<User | null> {
    const result = await this.db.prepare(`
      SELECT * FROM Users
      WHERE password_reset_token = ?
      AND password_reset_expires > datetime('now')
    `).bind(token).first()

    return result ? this.normalizeUser(result) : null
  }

  async clearPasswordResetToken(id: number): Promise<void> {
    const now = new Date().toISOString()

    await this.db.prepare(`
      UPDATE Users
      SET password_reset_token = NULL, password_reset_expires = NULL, updatedAt = ?
      WHERE id = ?
    `).bind(now, id).run()
  }

  async verifyUserPassword(email: string, password: string): Promise<User | null> {
    const user = await this.findByEmail(email)
    if (!user || !user.password) {
      return null
    }

    const { verifyUserPassword } = await import('./auth')
    const isValid = await verifyUserPassword(password, user.password)

    return isValid ? user : null
  }

  async update(id: number, updates: Partial<User>): Promise<User> {
    const now = new Date().toISOString()

    // Build dynamic update query
    const updateFields = []
    const values = []

    if (updates.email !== undefined) {
      updateFields.push('email = ?')
      values.push(updates.email)
    }

    if (updates.firstname !== undefined) {
      updateFields.push('firstname = ?')
      values.push(updates.firstname || null)
    }

    if (updates.lastname !== undefined) {
      updateFields.push('lastname = ?')
      values.push(updates.lastname || null)
    }

    if (updates.avatar !== undefined) {
      updateFields.push('avatar = ?')
      values.push(updates.avatar || null)
    }

    if (updates.mediavine_publisher !== undefined) {
      updateFields.push('mediavine_publisher = ?')
      values.push(updates.mediavine_publisher ? 1 : 0)
    }

    if (updates.validEmail !== undefined) {
      updateFields.push('validEmail = ?')
      values.push(updates.validEmail ? 1 : 0)
    }

    if (updates.marketing_opt_in !== undefined) {
      updateFields.push('marketing_opt_in = ?')
      values.push(updates.marketing_opt_in ? 1 : 0)
    }

    if (updateFields.length === 0) {
      const user = await this.findById(id)
      if (!user) throw new Error('User not found')
      return user
    }

    updateFields.push('updatedAt = ?')
    values.push(now, id)

    await this.db.prepare(`
      UPDATE Users
      SET ${updateFields.join(', ')}
      WHERE id = ?
    `).bind(...values).run()

    const updatedUser = await this.findById(id)
    if (!updatedUser) throw new Error('Failed to update user')

    return updatedUser
  }

  private normalizeUser(row: any): User {
    return {
      ...row,
      mediavine_publisher: Boolean(row.mediavine_publisher),
      validEmail: Boolean(row.validEmail),
      marketing_opt_in: Boolean(row.marketing_opt_in)
    }
  }

  private normalizeSite(row: any): Site {
    return {
      ...row
    }
  }
}

/**
 * Site database operations
 */
export class SiteRepository {
  private db = hubDatabase()

  async findById(id: number): Promise<Site | null> {
    const result = await this.db.prepare('SELECT * FROM Sites WHERE id = ?').bind(id).first() as Site
    return result || null
  }

  async findOrCreateByUserAndUrl(userId: number, url: string): Promise<Site> {
    // Try to find existing site
    const existing = await this.db.prepare('SELECT * FROM Sites WHERE user_id = ? AND url = ?').bind(userId, url).first() as ite

    if (existing) {
      return existing
    }

    // Create new site
    const now = new Date().toISOString()
    const result = await this.db.prepare(`
      INSERT INTO Sites (url, user_id, createdAt, updatedAt)
      VALUES (?, ?, ?, ?)
      RETURNING *
    `).bind(url, userId, now, now).first() as Site

    if (!result) {
      throw new Error('Failed to create site')
    }

    return result
  }

  async update(id: number, updates: Partial<Site>): Promise<Site | null> {
    const now = new Date().toISOString()

    // Build dynamic update query
    const updateFields = []
    const values = []

    if (updates.name !== undefined) {
      updateFields.push('name = ?')
      values.push(updates.name || null)
    }

    if (updates.url !== undefined) {
      updateFields.push('url = ?')
      values.push(updates.url)
    }

    if (updates.wp_version !== undefined) {
      updateFields.push('wp_version = ?')
      values.push(updates.wp_version || null)
    }

    if (updates.php_version !== undefined) {
      updateFields.push('php_version = ?')
      values.push(updates.php_version || null)
    }

    if (updates.create_version !== undefined) {
      updateFields.push('create_version = ?')
      values.push(updates.create_version || null)
    }

    if (updateFields.length === 0) {
      return this.findById(id)
    }

    updateFields.push('updatedAt = ?')
    values.push(now, id)

    await this.db.prepare(`
      UPDATE Sites
      SET ${updateFields.join(', ')}
      WHERE id = ?
    `).bind(...values).run()

    return this.findById(id)
  }

  /**
   * V2 API: Find canonical site by URL
   * Canonical sites have canonical_site_id = NULL
   */
  async findCanonicalSite(url: string): Promise<Site | null> {
    const result = await this.db.prepare(`
      SELECT * FROM Sites
      WHERE url = ? AND canonical_site_id IS NULL
    `).bind(url).first() as Site
    return result || null
  }

  /**
   * V2 API: Get all canonical sites a user has access to
   * Uses SiteUsers pivot table
   */
  async getUserCanonicalSites(userId: number): Promise<Site[]> {
    const results = await this.db.prepare(`
      SELECT s.*
      FROM Sites s
      INNER JOIN SiteUsers su ON s.id = su.site_id
      WHERE su.user_id = ? AND s.canonical_site_id IS NULL
      ORDER BY s.id ASC
    `).bind(userId).all()

    return results.results as Site[]
  }

  /**
   * V2 API: Check if user has access to a canonical site
   */
  async userHasAccessToSite(userId: number, canonicalSiteId: number): Promise<boolean> {
    const result = await this.db.prepare(`
      SELECT 1 FROM SiteUsers
      WHERE site_id = ? AND user_id = ?
    `).bind(canonicalSiteId, userId).first()

    return !!result
  }

  /**
   * V2 API: Get user's role for a canonical site
   */
  async getUserRole(userId: number, canonicalSiteId: number): Promise<string | null> {
    const result = await this.db.prepare(`
      SELECT role FROM SiteUsers
      WHERE site_id = ? AND user_id = ?
    `).bind(canonicalSiteId, userId).first()

    return result?.role || null
  }

  /**
   * V2 API: Add user to canonical site
   */
  async addUserToSite(canonicalSiteId: number, userId: number, role: string = 'admin'): Promise<void> {
    const now = new Date().toISOString()

    await this.db.prepare(`
      INSERT INTO SiteUsers (site_id, user_id, role, joined_at)
      VALUES (?, ?, ?, ?)
      ON CONFLICT (site_id, user_id) DO UPDATE SET role = excluded.role
    `).bind(canonicalSiteId, userId, role, now).run()
  }

  /**
   * V2 API: Remove user from canonical site
   */
  async removeUserFromSite(canonicalSiteId: number, userId: number): Promise<void> {
    await this.db.prepare(`
      DELETE FROM SiteUsers
      WHERE site_id = ? AND user_id = ?
    `).bind(canonicalSiteId, userId).run()
  }

  /**
   * V2 API: Get all users for a canonical site
   */
  async getSiteUsers(canonicalSiteId: number): Promise<Array<{ userId: number, role: string, joinedAt: string }>> {
    const results = await this.db.prepare(`
      SELECT user_id as userId, role, joined_at as joinedAt
      FROM SiteUsers
      WHERE site_id = ?
      ORDER BY joined_at ASC
    `).bind(canonicalSiteId).all()

    return results.results as Array<{ userId: number, role: string, joinedAt: string }>
  }
}

/**
 * Subscription database operations
 */
export class SubscriptionRepository {
  private db = hubDatabase()

  async getBySiteId(siteId: number): Promise<Subscription | null> {
    const result = await this.db.prepare('SELECT * FROM Subscriptions WHERE site_id = ?').bind(siteId).first()
    return result ? this.normalizeSubscription(result) : null
  }

  async getByStripeSubscriptionId(stripeSubId: string): Promise<Subscription | null> {
    const result = await this.db.prepare('SELECT * FROM Subscriptions WHERE stripe_subscription_id = ?').bind(stripeSubId).first()
    return result ? this.normalizeSubscription(result) : null
  }

  async create(data: CreateSubscriptionData): Promise<Subscription> {
    const now = new Date().toISOString()

    const result = await this.db.prepare(`
      INSERT INTO Subscriptions (
        site_id, stripe_customer_id, stripe_subscription_id, status, tier,
        current_period_start, current_period_end, cancel_at_period_end, createdAt, updatedAt
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      RETURNING *
    `).bind(
      data.site_id,
      data.stripe_customer_id || null,
      data.stripe_subscription_id || null,
      data.status,
      data.tier,
      data.current_period_start || null,
      data.current_period_end || null,
      data.cancel_at_period_end ? 1 : 0,
      now,
      now
    ).first()

    if (!result) {
      throw new Error('Failed to create subscription')
    }

    return this.normalizeSubscription(result)
  }

  async update(siteId: number, updates: Partial<Subscription>): Promise<Subscription | null> {
    const now = new Date().toISOString()

    const updateFields = []
    const values = []

    if (updates.stripe_customer_id !== undefined) {
      updateFields.push('stripe_customer_id = ?')
      values.push(updates.stripe_customer_id)
    }

    if (updates.stripe_subscription_id !== undefined) {
      updateFields.push('stripe_subscription_id = ?')
      values.push(updates.stripe_subscription_id)
    }

    if (updates.status !== undefined) {
      updateFields.push('status = ?')
      values.push(updates.status)
    }

    if (updates.tier !== undefined) {
      updateFields.push('tier = ?')
      values.push(updates.tier)
    }

    if (updates.current_period_start !== undefined) {
      updateFields.push('current_period_start = ?')
      values.push(updates.current_period_start)
    }

    if (updates.current_period_end !== undefined) {
      updateFields.push('current_period_end = ?')
      values.push(updates.current_period_end)
    }

    if (updates.cancel_at_period_end !== undefined) {
      updateFields.push('cancel_at_period_end = ?')
      values.push(updates.cancel_at_period_end ? 1 : 0)
    }

    if (updateFields.length === 0) {
      return this.getBySiteId(siteId)
    }

    updateFields.push('updatedAt = ?')
    values.push(now, siteId)

    await this.db.prepare(`
      UPDATE Subscriptions
      SET ${updateFields.join(', ')}
      WHERE site_id = ?
    `).bind(...values).run()

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

  private normalizeSubscription(row: any): Subscription {
    return {
      ...row,
      cancel_at_period_end: Boolean(row.cancel_at_period_end)
    }
  }
}

