import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mockNuxtImport } from '@nuxt/test-utils/runtime'
import { generateKeyPairSync } from 'node:crypto'

// Generate a real RSA key so signPayload runs against Web Crypto end-to-end,
// rather than mocking the signing call. This keeps the UA assertion hitting
// the same fetch path production uses.
const { privateKey } = generateKeyPairSync('rsa', {
  modulusLength: 2048,
  publicKeyEncoding: { type: 'spki', format: 'pem' },
  privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
})

mockNuxtImport('useRuntimeConfig', () => () => ({
  debug: false,
  webhookPrivateKey: privateKey,
}))

import {
  STUDIO_WEBHOOK_USER_AGENT,
  sendWebhook,
  sendWebhookWithResponse,
} from '../../server/utils/webhooks'

describe('STUDIO_WEBHOOK_USER_AGENT', () => {
  it('identifies the Studio webhook client and links to the docs page', () => {
    expect(STUDIO_WEBHOOK_USER_AGENT).toBe(
      'Create-Studio-Webhook/1.0 (+https://create.studio/docs/webhooks)',
    )
  })
})

describe('sendWebhook outbound headers', () => {
  let fetchSpy: ReturnType<typeof vi.fn>

  beforeEach(() => {
    fetchSpy = vi.fn().mockResolvedValue(new Response('{}', { status: 200 }))
    vi.stubGlobal('fetch', fetchSpy)
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('sets the User-Agent header on sendWebhook so WAFs can allowlist us', async () => {
    await sendWebhook('https://example.com', { type: 'debug', data: {} })

    expect(fetchSpy).toHaveBeenCalledOnce()
    const init = fetchSpy.mock.calls[0]![1] as RequestInit
    const headers = init.headers as Record<string, string>
    expect(headers['User-Agent']).toBe(STUDIO_WEBHOOK_USER_AGENT)
  })

  it('sets the User-Agent header on sendWebhookWithResponse too', async () => {
    fetchSpy.mockResolvedValueOnce(new Response('{"ok":true}', { status: 200 }))

    await sendWebhookWithResponse('https://example.com', { type: 'debug', data: {} })

    expect(fetchSpy).toHaveBeenCalledOnce()
    const init = fetchSpy.mock.calls[0]![1] as RequestInit
    const headers = init.headers as Record<string, string>
    expect(headers['User-Agent']).toBe(STUDIO_WEBHOOK_USER_AGENT)
  })
})
