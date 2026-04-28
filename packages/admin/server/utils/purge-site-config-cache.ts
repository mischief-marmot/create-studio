import type { H3Event } from 'h3'
import { getAdminEnvironment } from './admin-env'

/**
 * Best-effort purge of the main app's site-config edge cache.
 *
 * Admin write handlers bypass SubscriptionRepository (which has its own
 * purge hook), so they must explicitly invalidate cached entries when
 * tier/status/url change. This is the single place that knows how to
 * reach the main app's internal purge endpoint — keep new admin handlers
 * pointing here so a future change to the protocol (timeout, headers,
 * batching) doesn't require a 6-file sweep.
 *
 * Never throws: on misconfiguration, network failure, or a non-2xx
 * response, logs a warning and returns. The main operation must not be
 * blocked by a cache-purge problem.
 */
export async function purgeSiteConfigCache(
  event: H3Event,
  siteUrls: (string | null | undefined)[],
  context?: { siteId?: number },
): Promise<void> {
  try {
    const validUrls = siteUrls.filter((u): u is string => typeof u === 'string' && u.length > 0)
    if (validUrls.length === 0) {
      const ctx = context?.siteId !== undefined ? ` (site_id ${context.siteId})` : ''
      console.warn(`No site URLs to purge${ctx} — skipping site-config cache purge`)
      return
    }

    const config = useRuntimeConfig()
    if (!config.mainAppApiKey) {
      console.warn('mainAppApiKey not configured — skipping site-config cache purge')
      return
    }

    const adminEnv = getAdminEnvironment(event)
    const rawMainAppUrl = adminEnv === 'preview' ? config.mainAppPreviewUrl : config.mainAppUrl
    const mainAppUrl = rawMainAppUrl?.replace(/\/+$/, '')
    if (!mainAppUrl) {
      console.warn('mainAppUrl/mainAppPreviewUrl not configured — skipping site-config cache purge')
      return
    }

    const response = await fetch(`${mainAppUrl}/api/v2/internal/purge-site-config-cache`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Admin-Api-Key': config.mainAppApiKey,
      },
      body: JSON.stringify({ siteUrls: validUrls }),
      signal: AbortSignal.timeout(5000),
    })
    if (!response.ok) {
      console.warn(`Site-config cache purge failed: ${response.status} ${response.statusText}`)
    }
  } catch (purgeError) {
    console.warn('Failed to purge site-config cache:', purgeError)
  }
}
