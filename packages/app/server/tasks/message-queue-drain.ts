import { processQueue, reclaimStaleProcessing } from '~~/server/utils/message-queue'

export default defineTask({
  meta: {
    name: 'message-queue:drain',
    description: 'Process pending messages in the MessageQueue (webhooks, notifications, etc.)',
  },
  async run() {
    try {
      const reclaimed = await reclaimStaleProcessing()
      const result = await processQueue(50)

      if (reclaimed > 0) {
        console.log(`[message-queue:drain] reclaimed ${reclaimed} stale processing rows`)
      }

      if (result.processed > 0) {
        console.log(
          `[message-queue:drain] processed=${result.processed} succeeded=${result.succeeded} ` +
          `failed=${result.failed} deadLettered=${result.deadLettered} skipped=${result.skipped}`,
        )
      }

      return { result: 'success', reclaimed, ...result }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      console.error(`[message-queue:drain] Fatal error: ${message}`)
      return { result: 'error', error: message }
    }
  },
})
