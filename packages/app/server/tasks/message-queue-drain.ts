import { useLogger } from '@create-studio/shared/utils/logger'
import { processQueue, reclaimStaleProcessing, pruneCompletedOlderThan } from '~~/server/utils/message-queue'

export default defineTask({
  meta: {
    name: 'message-queue-drain',
    description: 'Process pending messages in the MessageQueue (webhooks, notifications, etc.)',
  },
  async run() {
    const logger = useLogger('message-queue-drain', useRuntimeConfig().debug)

    try {
      const reclaimed = await reclaimStaleProcessing()
      const result = await processQueue(50)
      const pruned = await pruneCompletedOlderThan(30)

      if (reclaimed > 0) {
        logger.info(`reclaimed ${reclaimed} stale processing rows`)
      }

      if (result.processed > 0) {
        logger.info(
          `processed=${result.processed} succeeded=${result.succeeded} ` +
          `failed=${result.failed} deadLettered=${result.deadLettered} skipped=${result.skipped}`,
        )
      }

      if (pruned > 0) {
        logger.info(`pruned ${pruned} completed rows older than 30 days`)
      }

      return { result: 'success', reclaimed, pruned, ...result }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      logger.error(`fatal error: ${message}`)
      return { result: 'error', error: message }
    }
  },
})
