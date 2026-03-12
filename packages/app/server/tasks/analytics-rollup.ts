import { drizzle } from 'drizzle-orm/d1'
import { runDailyRollup } from '@create-studio/analytics/rollup'

export default defineTask({
  meta: {
    name: 'analytics:rollup',
    description: 'Daily analytics rollup - aggregate raw events into daily summaries and purge old data',
  },
  async run({ payload }) {
    // In Cloudflare Workers, the D1 binding is available via the cloudflare context.
    // Nitro tasks receive the cloudflare env through the payload context.
    const env = (payload as any)?.context?.cloudflare?.env

    // Fallback: try process-level bindings (dev mode via `npx nuxt dev`)
    const d1Analytics = env?.DB_ANALYTICS ?? (globalThis as any).__env__?.DB_ANALYTICS
    const d1Main = env?.DB ?? (globalThis as any).__env__?.DB

    if (!d1Analytics) {
      console.error('[analytics:rollup] DB_ANALYTICS binding not available — skipping rollup')
      return { result: 'skipped', reason: 'DB_ANALYTICS binding not available' }
    }

    if (!d1Main) {
      console.error('[analytics:rollup] DB binding not available — skipping rollup')
      return { result: 'skipped', reason: 'DB binding not available' }
    }

    const analyticsDb = drizzle(d1Analytics)
    const mainDb = drizzle(d1Main)

    try {
      const result = await runDailyRollup(analyticsDb, mainDb)

      if (result.errors.length > 0) {
        console.warn(`[analytics:rollup] Completed with ${result.errors.length} errors`)
      }

      return { result: 'success', ...result }
    }
    catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      console.error(`[analytics:rollup] Fatal error: ${message}`)
      return { result: 'error', error: message }
    }
  },
})
