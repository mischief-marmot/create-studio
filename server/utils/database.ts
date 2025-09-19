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
  firstname?: string
  lastname?: string
  mediavine_publisher?: boolean
  validEmail?: boolean
  marketing_opt_in?: boolean
  createdAt?: string
  updatedAt?: string
}

export interface Site {
  id?: number
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
  mediavine_publisher?: boolean
  marketing_opt_in?: boolean
}

export interface CreateSiteData {
  url: string
  user_id: number
  create_version?: string
  wp_version?: string
  php_version?: string
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
    const result = await this.db.prepare('SELECT * FROM Sites WHERE id = ?').bind(id).first()
    return result || null
  }

  async findOrCreateByUserAndUrl(userId: number, url: string): Promise<Site> {
    // Try to find existing site
    const existing = await this.db.prepare('SELECT * FROM Sites WHERE user_id = ? AND url = ?').bind(userId, url).first()

    if (existing) {
      return existing
    }

    // Create new site
    const now = new Date().toISOString()
    const result = await this.db.prepare(`
      INSERT INTO Sites (url, user_id, createdAt, updatedAt)
      VALUES (?, ?, ?, ?)
      RETURNING *
    `).bind(url, userId, now, now).first()

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

    if (updates.wp_version !== undefined) {
      updateFields.push('wp_version = ?')
      values.push(updates.wp_version)
    }

    if (updates.php_version !== undefined) {
      updateFields.push('php_version = ?')
      values.push(updates.php_version)
    }

    if (updates.create_version !== undefined) {
      updateFields.push('create_version = ?')
      values.push(updates.create_version)
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
}

