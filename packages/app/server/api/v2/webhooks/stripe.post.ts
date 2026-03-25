/**
 * POST /api/v2/webhooks/stripe
 * Handle Stripe webhook events
 *
 * This endpoint receives events from Stripe and processes them
 * No authorization required (Stripe signature verification instead)
 */

import { useLogger } from '@create-studio/shared/utils/logger'
import { verifyWebhookSignature, handleWebhookEvent } from '~~/server/utils/stripe'


export default defineEventHandler(async (event) => {
  const { debug } = useRuntimeConfig()
  const logger = useLogger('API:StripeWebhook', debug)

  try {
    // Read raw body to preserve exact bytes for signature verification
    const body = await readRawBody(event, 'utf-8')
    const signature = getHeader(event, 'stripe-signature')

    if (!body || !signature) {
      setResponseStatus(event, 400)
      return {
        error: 'Missing body or signature'
      }
    }

    // Verify webhook signature
    let stripeEvent
    try {
      stripeEvent = await verifyWebhookSignature(body, signature)
    } catch (err: any) {
      // In local dev, stripe listen reformats the payload (pretty-prints JSON)
      // which breaks signature verification. Fall back to parsing the body directly.
      if (process.dev) {
        logger.warn('Signature verification failed in dev mode, parsing body directly')
        stripeEvent = JSON.parse(typeof body === 'string' ? body : body.toString('utf-8'))
      } else {
        logger.error('Webhook signature verification failed:', err.message)
        setResponseStatus(event, 400)
        return {
          error: `Webhook Error: ${err.message}`
        }
      }
    }

    logger.debug('Webhook event received:', stripeEvent.type)

    // Handle the event
    await handleWebhookEvent(stripeEvent)

    // Return success response
    return { received: true }

  } catch (error: any) {
    logger.error('Webhook processing error:', error)
    setResponseStatus(event, 500)
    return {
      error: 'Webhook processing failed'
    }
  }
})
