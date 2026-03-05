/**
 * GET /api/v2/releases/unsubscribe?token=...
 * Token-based unsubscribe from release notes.
 *
 * Token format: base64(email):hmac(email, secret)
 */

import { useLogger } from '@create-studio/shared/utils/logger'
import { UserRepository } from '~~/server/utils/database'
export default defineEventHandler(async (event) => {
  const { debug } = useRuntimeConfig()
  const logger = useLogger('API:ReleaseUnsubscribe', debug)

  try {
    const query = getQuery(event)
    const token = query.token as string

    if (!token || typeof token !== 'string') {
      setResponseStatus(event, 400)
      return { success: false, error: 'Token is required' }
    }

    // Parse token: base64email.signature
    const parts = token.split('.')
    if (parts.length !== 2) {
      setResponseStatus(event, 400)
      return { success: false, error: 'Invalid token format' }
    }

    const [encodedEmail, signature] = parts
    let email: string

    try {
      email = atob(encodedEmail)
    }
    catch {
      setResponseStatus(event, 400)
      return { success: false, error: 'Invalid token' }
    }

    // Verify signature
    const config = useRuntimeConfig()
    const secret = config.sessionPassword || config.authSecret || 'release-unsubscribe-secret'
    const expectedSignature = await generateHmac(email, secret)

    if (signature !== expectedSignature) {
      setResponseStatus(event, 403)
      return { success: false, error: 'Invalid token' }
    }

    // Find user and remove subscription
    const userRepo = new UserRepository()
    const user = await userRepo.findByEmail(email)

    if (!user) {
      // User not found — still return success (don't leak info)
      return { success: true }
    }

    const meta = (user.metadata as Record<string, any>) || {}
    delete meta.subscribed_releases
    delete meta.subscribed_releases_products

    await userRepo.update(user.id, { metadata: meta })

    logger.debug('User unsubscribed from releases', user.id)

    // Redirect to a friendly page
    await sendRedirect(event, '/releases?unsubscribed=true', 302)
  }
  catch (error: any) {
    logger.error('Release unsubscribe error:', error)
    setResponseStatus(event, 500)
    return { success: false, error: 'Internal error' }
  }
})

async function generateHmac(data: string, secret: string): Promise<string> {
  const encoder = new TextEncoder()
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  )
  const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(data))
  return btoa(String.fromCharCode(...new Uint8Array(signature)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '')
}
