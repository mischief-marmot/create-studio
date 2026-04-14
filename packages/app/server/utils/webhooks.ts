/**
 * Webhook signing and dispatch utility.
 *
 * Signs payloads with RS256 using the Web Crypto API (Cloudflare Workers compatible)
 * and sends them to WordPress plugin endpoints.
 */

import { useLogger } from '@create-studio/shared/utils/logger'

interface WebhookPayload {
  type: string
  data: Record<string, unknown>
}

/**
 * Convert a PEM-encoded private key to an ArrayBuffer for Web Crypto API.
 */
function pemToArrayBuffer(pem: string): ArrayBuffer {
  const base64 = pem
    .replace(/-----BEGIN PRIVATE KEY-----/, '')
    .replace(/-----END PRIVATE KEY-----/, '')
    .replace(/\s/g, '')

  const binary = atob(base64)
  const buffer = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) {
    buffer[i] = binary.charCodeAt(i)
  }
  return buffer.buffer
}

/**
 * Sign a payload string with RS256 using the Web Crypto API.
 */
export async function signPayload(body: string, privateKeyPem: string): Promise<string> {
  const keyData = pemToArrayBuffer(privateKeyPem)

  const key = await crypto.subtle.importKey(
    'pkcs8',
    keyData,
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false,
    ['sign'],
  )

  const encoded = new TextEncoder().encode(body)
  const signature = await crypto.subtle.sign('RSASSA-PKCS1-v1_5', key, encoded)

  // Convert ArrayBuffer to base64
  const bytes = new Uint8Array(signature)
  let binary = ''
  for (const byte of bytes) {
    binary += String.fromCharCode(byte)
  }
  return btoa(binary)
}

/**
 * Send a signed webhook to a WordPress site.
 *
 * The request includes:
 * - X-Studio-Signature: base64-encoded RS256 signature of the JSON body
 * - X-Studio-Timestamp: unix timestamp in seconds (for replay protection)
 */
export async function sendWebhook(siteUrl: string, payload: WebhookPayload): Promise<void> {
  const config = useRuntimeConfig()
  const { debug } = config
  const logger = useLogger('Webhooks', debug)

  const privateKey = config.webhookPrivateKey
  if (!privateKey) {
    logger.warn('Webhook private key not configured, skipping webhook dispatch')
    return
  }

  const body = JSON.stringify(payload)
  const timestamp = Math.floor(Date.now() / 1000).toString()
  const signature = await signPayload(body, privateKey)

  // Normalize site URL — strip trailing slash
  const baseUrl = siteUrl.replace(/\/+$/, '')
  const url = `${baseUrl}/wp-json/mv-create/v1/webhooks/studio`

  logger.debug(`Sending webhook type="${payload.type}" to ${url}`)

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Studio-Signature': signature,
      'X-Studio-Timestamp': timestamp,
    },
    body,
  })

  if (!response.ok) {
    logger.warn(`Webhook delivery failed: ${response.status} ${response.statusText} for ${url}`)
    throw new Error(`Webhook delivery failed: ${response.status} ${response.statusText}`)
  } else {
    logger.debug(`Webhook delivered successfully to ${url}`)
  }
}

/**
 * Generic retry with exponential backoff.
 *
 * Extracted as a pure utility so it can be tested directly without
 * Nuxt runtime dependencies.
 */
export async function retryWithBackoff(
  fn: () => Promise<void>,
  options: {
    maxRetries?: number
    baseDelayMs?: number
    onRetry?: (attempt: number, delay: number, error: Error) => void
    onGiveUp?: (attempts: number, error: Error) => void
  } = {},
): Promise<void> {
  const { maxRetries = 3, baseDelayMs = 2000, onRetry, onGiveUp } = options

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      await fn()
      return
    } catch (err: any) {
      if (attempt === maxRetries) {
        onGiveUp?.(attempt + 1, err)
        return
      }
      const delay = baseDelayMs * Math.pow(2, attempt)
      onRetry?.(attempt + 1, delay, err)
      await new Promise((resolve) => setTimeout(resolve, delay))
    }
  }
}

/**
 * Send a webhook with retry logic and exponential backoff.
 *
 * Retries up to 3 times with delays of 2s, 4s, 8s.
 * Designed to be used with waitUntil() for background execution.
 */
export async function sendWebhookWithRetry(
  siteUrl: string,
  payload: WebhookPayload,
  maxRetries = 3,
): Promise<void> {
  const logger = useLogger('Webhooks', useRuntimeConfig().debug)

  await retryWithBackoff(
    () => sendWebhook(siteUrl, payload),
    {
      maxRetries,
      onRetry: (attempt, delay) => {
        logger.warn(`Webhook attempt ${attempt} failed, retrying in ${delay}ms...`)
      },
      onGiveUp: (attempts, err) => {
        logger.error(`Webhook delivery to ${siteUrl} failed after ${attempts} attempts: ${err.message}`)
      },
    },
  )
}

/**
 * Send a signed webhook and return the parsed JSON response.
 *
 * Same signing logic as sendWebhook but returns the response body
 * instead of discarding it. Used for request-response patterns like debug.
 */
export async function sendWebhookWithResponse<T = Record<string, unknown>>(
  siteUrl: string,
  payload: WebhookPayload,
): Promise<T> {
  const config = useRuntimeConfig()
  const { debug } = config
  const logger = useLogger('Webhooks', debug)

  const privateKey = config.webhookPrivateKey
  if (!privateKey) {
    throw new Error('Webhook private key not configured')
  }

  const body = JSON.stringify(payload)
  const timestamp = Math.floor(Date.now() / 1000).toString()
  const signature = await signPayload(body, privateKey)

  const baseUrl = siteUrl.replace(/\/+$/, '')
  const url = `${baseUrl}/wp-json/mv-create/v1/webhooks/studio`

  logger.debug(`Sending webhook (with response) type="${payload.type}" to ${url}`)

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Studio-Signature': signature,
      'X-Studio-Timestamp': timestamp,
    },
    body,
  })

  if (!response.ok) {
    const errorText = await response.text().catch(() => '')
    throw new Error(`Webhook failed: ${response.status} ${response.statusText} - ${errorText}`)
  }

  return response.json() as Promise<T>
}
