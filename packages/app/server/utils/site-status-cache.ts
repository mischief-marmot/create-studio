import type { H3Event } from 'h3'
import { useLogger } from '@create-studio/shared/utils/logger'

// 24-hour TTL — invalidated explicitly via purgeSiteStatusCache when
// subscription/trial/site state changes. Without explicit purges, plugin
// users would see stale data for up to 24h after upgrades, trial transitions,
// or connect/disconnect.
const STATUS_CACHE_MAX_AGE = 24 * 60 * 60

/** Synthetic URL used as both the in-Worker `caches.default` key and the
 *  target for Cloudflare's `purge_cache` API. Does not correspond to any real
 *  route — the path prefix is never registered. */
function buildStatusCacheUrl(rootUrl: string, siteId: number): string {
  return `${rootUrl}/_cache/site-status/${siteId}`
}

function buildStatusCacheKey(rootUrl: string, siteId: number): Request {
  return new Request(buildStatusCacheUrl(rootUrl, siteId), { method: 'GET' })
}

/** Return the cached status response for a site, or null on miss. */
export async function getCachedSiteStatus(
  siteId: number,
  rootUrl: string,
): Promise<unknown | null> {
  try {
    const cache = (caches as any).default as Cache | undefined
    if (!cache) return null
    const cached = await cache.match(buildStatusCacheKey(rootUrl, siteId))
    if (!cached) return null
    return await cached.json()
  } catch {
    return null
  }
}

/** Store the status response in the edge cache. Fire-and-forget via
 *  `waitUntil` so we don't block the request. */
export function cacheSiteStatus(
  event: H3Event,
  siteId: number,
  rootUrl: string,
  payload: unknown,
): void {
  try {
    const cache = (caches as any).default as Cache | undefined
    if (!cache) return
    const key = buildStatusCacheKey(rootUrl, siteId)
    const response = new Response(JSON.stringify(payload), {
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': `public, max-age=${STATUS_CACHE_MAX_AGE}`,
        'CDN-Cache-Control': `public, max-age=${STATUS_CACHE_MAX_AGE}`,
      },
    })
    const ctx = (event.context.cloudflare as any)?.context
    if (ctx?.waitUntil) {
      ctx.waitUntil(cache.put(key, response))
    } else {
      cache.put(key, response).catch(() => {})
    }
  } catch {
    // Cache API not available — not critical, response was still served.
  }
}

/** Purge a site's status from both the in-DC `caches.default` and (globally)
 *  Cloudflare's edge cache via the zone-level `purge_cache` API. The first
 *  call invalidates locally instantly; the API call propagates to all DCs
 *  within ~30s. Both are needed because `caches.default.delete` is per-DC. */
export async function purgeSiteStatusCache(
  event: H3Event | undefined,
  siteId: number,
): Promise<void> {
  const runtimeConfig = useRuntimeConfig()
  const logger = useLogger('SiteStatusCache', runtimeConfig.debug)
  const rootUrl = runtimeConfig.public.rootUrl
  const url = buildStatusCacheUrl(rootUrl, siteId)

  // 1. Same-DC instant invalidate
  try {
    const cache = (caches as any).default as Cache | undefined
    if (cache) {
      await cache.delete(buildStatusCacheKey(rootUrl, siteId))
    }
  } catch {
    // Cache API unavailable — fall through to global purge
  }

  // 2. Global purge via the CF zone API. Same flow as upload-widget.post.ts.
  const { cloudflareApiToken, cloudflareZoneId } = runtimeConfig
  if (!cloudflareApiToken || !cloudflareZoneId) return

  const purge = async () => {
    try {
      await $fetch(
        `https://api.cloudflare.com/client/v4/zones/${cloudflareZoneId}/purge_cache`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${cloudflareApiToken}`,
            'Content-Type': 'application/json',
          },
          body: { files: [url] },
        },
      )
    } catch (err) {
      logger.warn('Failed to purge site status cache', { siteId, err })
    }
  }

  const ctx = event ? (event.context.cloudflare as any)?.context : undefined
  if (ctx?.waitUntil) {
    ctx.waitUntil(purge())
  } else {
    purge().catch(() => {})
  }
}
