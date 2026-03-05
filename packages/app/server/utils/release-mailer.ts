/**
 * Batch send release notes emails to subscribers via Postmark.
 *
 * Uses the Postmark broadcast message stream (not transactional).
 */

import { useLogger } from '@create-studio/shared/utils/logger'
import { render } from '@vue-email/render'
import { ServerClient } from 'postmark'
import { sql } from 'drizzle-orm'
import ReleaseNotesEmail from '../components/emails/ReleaseNotesEmail.vue'

interface ReleaseEmailData {
  title: string
  version: string
  product: string
  description: string
  highlights: Array<{
    title: string
    description: string
    type: 'feature' | 'enhancement' | 'fix' | 'breaking'
  }>
  releaseUrl: string
}

interface SendResult {
  sent: number
  failed: number
  errors: string[]
}

/**
 * Generate an unsubscribe URL with HMAC token
 */
async function generateUnsubscribeUrl(email: string, baseUrl: string, secret: string): Promise<string> {
  const encodedEmail = btoa(email)

  const encoder = new TextEncoder()
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  )
  const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(email))
  const sig = btoa(String.fromCharCode(...new Uint8Array(signature)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '')

  return `${baseUrl}/api/v2/releases/unsubscribe?token=${encodedEmail}.${sig}`
}

/**
 * Query all users subscribed to release notes, optionally filtered by product.
 */
async function getSubscribers(product?: string): Promise<Array<{ id: number, email: string, metadata: any }>> {
  const { db, schema } = await import('hub:db')

  // Query users whose metadata contains subscribed_releases
  const results = await db
    .select({
      id: schema.users.id,
      email: schema.users.email,
      metadata: schema.users.metadata,
    })
    .from(schema.users)
    .where(sql`json_extract(${schema.users.metadata}, '$.subscribed_releases') IS NOT NULL`)
    .all()

  if (!product) return results

  // Filter by product preference
  return results.filter((user) => {
    const meta = user.metadata as Record<string, any>
    const products = meta?.subscribed_releases_products
    // If no specific products set, they get everything
    if (!products || !Array.isArray(products)) return true
    return products.includes(product)
  })
}

/**
 * Send release notes email to all subscribers.
 */
export async function sendReleaseNotesEmail(data: ReleaseEmailData): Promise<SendResult> {
  const config = useRuntimeConfig()
  const logger = useLogger('ReleaseMailer', config.debug)
  const baseUrl = config.public.rootUrl || 'https://create.studio'
  const secret = config.sessionPassword || config.authSecret || 'release-unsubscribe-secret'
  const fromEmail = config.sendingAddress || 'noreply@mischiefmarmot.com'

  const subscribers = await getSubscribers(data.product)
  logger.info(`Found ${subscribers.length} subscribers for ${data.product} releases`)

  if (subscribers.length === 0) {
    return { sent: 0, failed: 0, errors: [] }
  }

  // Mock in test mode
  if (process.env.NODE_ENV === 'test') {
    logger.info(`[MOCK] Would send release email to ${subscribers.length} subscribers`)
    return { sent: subscribers.length, failed: 0, errors: [] }
  }

  if (!config.postmarkKey) {
    throw new Error('Postmark API key not configured')
  }

  const client = new ServerClient(config.postmarkKey)
  const result: SendResult = { sent: 0, failed: 0, errors: [] }

  // Process in batches of 500 (Postmark limit)
  const BATCH_SIZE = 500

  for (let i = 0; i < subscribers.length; i += BATCH_SIZE) {
    const batch = subscribers.slice(i, i + BATCH_SIZE)

    const messages = await Promise.all(
      batch.map(async (subscriber) => {
        const unsubscribeUrl = await generateUnsubscribeUrl(subscriber.email, baseUrl, secret)

        const templateModel = {
          title: data.title,
          version: data.version,
          product: data.product,
          description: data.description,
          highlights: data.highlights,
          releaseUrl: data.releaseUrl,
          unsubscribeUrl,
          productName: config.public.productName || 'Create Studio',
          productUrl: baseUrl,
          companyName: config.public.companyName || 'Mischief Marmot LLC',
        }

        const htmlBody = await render(ReleaseNotesEmail, templateModel, { pretty: true })
        const textBody = await render(ReleaseNotesEmail, templateModel, { plainText: true })

        return {
          From: fromEmail,
          To: subscriber.email,
          Subject: `${data.product} v${data.version} — ${data.title}`,
          HtmlBody: htmlBody,
          TextBody: textBody,
          MessageStream: 'broadcast',
        }
      }),
    )

    try {
      const responses = await client.sendEmailBatch(messages)
      for (const response of responses) {
        if (response.ErrorCode === 0) {
          result.sent++
        }
        else {
          result.failed++
          result.errors.push(`${response.To}: ${response.Message}`)
        }
      }
    }
    catch (error: any) {
      logger.error(`Batch send failed:`, error)
      result.failed += batch.length
      result.errors.push(`Batch failed: ${error.message}`)
    }
  }

  logger.info(`Release email sent: ${result.sent} success, ${result.failed} failed`)
  return result
}
