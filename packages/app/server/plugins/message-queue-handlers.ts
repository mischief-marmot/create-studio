/**
 * Register message queue handlers at startup.
 *
 * Handlers map a message `type` to the code that processes its payload.
 * They run inside the scheduled worker (see server/tasks/message-queue-drain.ts).
 */

import { registerHandler } from '~~/server/utils/message-queue'
import { sendWebhook } from '~~/server/utils/webhooks'

export default defineNitroPlugin(() => {
  registerHandler('wordpress_webhook', async (payload) => {
    const siteUrl = payload.siteUrl as string | undefined
    const webhookPayload = payload.payload as { type: string; data: Record<string, unknown> } | undefined

    if (!siteUrl || !webhookPayload) {
      throw new Error('wordpress_webhook payload missing siteUrl or payload')
    }

    // sendWebhook throws on non-2xx, which triggers the queue's retry logic.
    await sendWebhook(siteUrl, webhookPayload)
  })
})
