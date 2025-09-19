import jwt from 'jsonwebtoken'
const DEFAULT_SECRET = 'default-secret-change-in-production'
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
 * Generate a new JWT token
 */
export function generateToken(data: TokenGenerationData): string {
  const config = useRuntimeConfig()
  const secret = config.jwtSecret || DEFAULT_SECRET

  const payload: JWTPayload = {
    id: data.id,
    email: data.email,
    validEmail: data.validEmail,
    site_id: data.site_id
  }

  return jwt.sign(payload, secret, { algorithm: 'HS256' })
}

/**
 * Verify and decode a JWT token
 */
export function verifyToken(token: string): JWTPayload {
  const config = useRuntimeConfig()
  const secret = config.jwtSecret || DEFAULT_SECRET

  try {
    return jwt.verify(token, secret) as JWTPayload
  } catch (error) {
    throw new Error('Invalid token')
  }
}

/**
 * Extract token from Authorization header
 */
export function extractTokenFromHeader(authHeader: string | undefined): string {
  if (!authHeader) {
    throw new Error('Authorization header missing')
  }

  if (!authHeader.startsWith('Bearer ')) {
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
    return verifyToken(token)
  } catch (error) {
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
export function generateValidationToken(userData: { id: number; email: string }): string {
  const config = useRuntimeConfig()
  const secret = config.jwtSecret || DEFAULT_SECRET

  return jwt.sign(
    { id: userData.id, email: userData.email, type: 'validation' },
    secret,
    { expiresIn: '24h' }
  )
}

/**
 * Verify validation token for email verification
 */
export function verifyValidationToken(token: string): { id: number; email: string } {
  const config = useRuntimeConfig()
  const secret = config.jwtSecret || DEFAULT_SECRET

  try {
    const decoded = jwt.verify(token, secret) as any

    if (decoded.type !== 'validation') {
      throw new Error('Invalid token type')
    }

    return { id: decoded.id, email: decoded.email }
  } catch (error) {
    throw new Error('Invalid validation token')
  }
}