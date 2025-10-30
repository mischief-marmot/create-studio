import { useLogger } from '@create-studio/shared/utils/logger'
import { SignJWT, jwtVerify } from 'jose'
import bcrypt from 'bcryptjs'

export interface JWTPayload {
  id: number
  email: string
  validEmail: boolean
  site_id?: number
}

export interface TokenGenerationData {
  id: number
  email: string
  validEmail: boolean
  site_id?: number
}

/**
 * Get the secret as Uint8Array for jose
 */
function getSecret(): Uint8Array {
  const config = useRuntimeConfig()
  // In test environment, use process.env directly
  const secret = (typeof useRuntimeConfig !== 'undefined' ? useRuntimeConfig().servicesApiJWTSecret : '') || process.env.NUXT_SERVICES_API_JWT_SECRET
                  

  if (!secret) {
    throw new Error('JWT secret is not configured')
  }

  return new TextEncoder().encode(secret)
}

/**
 * Generate a new JWT token
 */
export async function generateToken(data: TokenGenerationData): Promise<string> {
  const secret = getSecret()

  const payload: JWTPayload = {
    id: data.id,
    email: data.email,
    validEmail: data.validEmail,
    site_id: data.site_id
  }

  return await new SignJWT(payload as any)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .sign(secret)
}

/**
 * Verify and decode a JWT token
 */
export async function verifyToken(token: string): Promise<JWTPayload> {
  const secret = getSecret()

  try {
    const { payload } = await jwtVerify(token, secret)
    return payload as unknown as JWTPayload
  } catch (error) {
    if (typeof useLogger !== 'undefined') {
      const config = useRuntimeConfig()
      const logger = useLogger('Auth', config.debug)
      logger.error('Token verification failed', { error })
    }
    throw new Error('Invalid token')
  }
}

/**
 * Extract token from Authorization header
 */
export function extractTokenFromHeader(authHeader: string | undefined): string {
  if (!authHeader) {
    if (typeof useLogger !== 'undefined') {
      const config = useRuntimeConfig()
      const logger = useLogger('Auth', config.debug)
      logger.error('Authorization header')
    }
    throw new Error('Authorization header missing')
  }

  if (!authHeader.startsWith('Bearer ') && !authHeader.startsWith('bearer ')) {
    if (typeof useLogger !== 'undefined') {
      const config = useRuntimeConfig()
      const logger = useLogger('Auth', config.debug)
      logger.error('Invalid authorization format')
    }
    throw new Error('Invalid authorization format')
  }

  return authHeader.substring(7)
}

/**
 * Middleware to verify JWT token in request
 */
export async function verifyJWT(event: any): Promise<JWTPayload> {
  const authHeader = getHeader(event, 'authorization')
  const token = extractTokenFromHeader(authHeader)

  try {
    return await verifyToken(token)
  } catch (error) {
    if (typeof useLogger !== 'undefined') {
      const config = useRuntimeConfig()
      const logger = useLogger('Auth', config.debug)
      logger.error('JWT verification failed', { error })
    }
    throw createError({
      statusCode: 401,
      statusMessage: 'Unauthorized'
    })
  }
}

/**
 * Check if email is verified in token
 */
export function isEmailVerifiedInToken(user: JWTPayload): boolean {
  return Boolean(user.validEmail)
}

/**
 * Generate validation token for email verification
 */
export async function generateValidationToken(userData: { id: number; email: string }): Promise<string> {
  const secret = getSecret()

  return await new SignJWT({ id: userData.id, email: userData.email, type: 'validation' } as any)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('24h')
    .sign(secret)
}

/**
 * Verify validation token for email verification
 */
export async function verifyValidationToken(token: string): Promise<{ id: number; email: string }> {
  const secret = getSecret()

  try {
    const { payload } = await jwtVerify(token, secret)
    const decoded = payload as any

    if (decoded.type !== 'validation') {
      throw new Error('Invalid token type')
    }

    return { id: decoded.id, email: decoded.email }
  } catch (error: any) {
    if (error.message === 'Invalid token type') {
      throw error
    }
    throw new Error('Invalid validation token')
  }
}

/**
 * Hash a password using bcrypt
 */
export async function hashUserPassword(password: string): Promise<string> {
  const saltRounds = 10
  return await bcrypt.hash(password, saltRounds)
}

/**
 * Verify a password against a hash
 */
export async function verifyUserPassword(password: string, hash: string): Promise<boolean> {
  return await bcrypt.compare(password, hash)
}

/**
 * Generate password reset token
 */
export async function generatePasswordResetToken(userData: { id: number; email: string }): Promise<string> {
  const secret = getSecret()

  return await new SignJWT({ id: userData.id, email: userData.email, type: 'password_reset' } as any)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('1h') // Password reset tokens expire in 1 hour
    .sign(secret)
}

/**
 * Verify password reset token
 */
export async function verifyPasswordResetToken(token: string): Promise<{ id: number; email: string }> {
  const secret = getSecret()

  try {
    const { payload } = await jwtVerify(token, secret)
    const decoded = payload as any

    if (decoded.type !== 'password_reset') {
      throw new Error('Invalid token type')
    }

    return { id: decoded.id, email: decoded.email }
  } catch (error: any) {
    if (error.message === 'Invalid token type') {
      throw error
    }
    throw new Error('Invalid password reset token')
  }
}