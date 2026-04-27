import type { H3Event } from 'h3'
import { useLogger } from '@create-studio/shared/utils/logger'

/** Single source of truth for the site-config edge cache key. The GET handler,
 *  POST handler, and this purge utility must agree byte-for-byte; encoding
 *  drift here silently breaks invalidation and visitors keep seeing stale
 *  config until the 10-min TTL expires. */
export function buildSiteConfigCacheUrl(rootUrl: string, siteUrl: string): string {
  return `${rootUrl}/api/v2/site-config/${btoa(siteUrl)}`
}

export function buildSiteConfigCacheKey(rootUrl: string, siteUrl: string): Request {
  return new Request(buildSiteConfigCacheUrl(rootUrl, siteUrl), { method: 'GET' })
}

/** Purge a site's config response from both `caches.default` and (globally)
 *  Cloudflare's edge cache. Mirrors `purgeSiteStatusCache` exactly. The PATCH
 *  handler calls this when interactive mode toggles or other config-shaping
 *  fields change — without it, edge entries serve the pre-toggle config for
 *  up to 10 minutes. */
export async function purgeSiteConfigCache(
  event: H3Event,
  siteUrl: string,
): Promise<void> {
  const runtimeConfig = useRuntimeConfig()
  const logger = useLogger('SiteConfigCache', runtimeConfig.debug)
  const rootUrl = runtimeConfig.public.rootUrl
  const url = buildSiteConfigCacheUrl(rootUrl, siteUrl)

  // 1. Same-DC instant invalidate
  try {
    const cache = (caches as any).default as Cache | undefined
    if (cache) {
      await cache.delete(buildSiteConfigCacheKey(rootUrl, siteUrl))
    }
  } catch {
    // Cache API unavailable — fall through to global purge
  }

  // 2. Global purge via the CF zone API
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
      logger.warn('Failed to purge site config cache', { siteUrl, err })
    }
  }

  const ctx = (event.context.cloudflare as any)?.context
  if (ctx?.waitUntil) {
    ctx.waitUntil(purge())
  } else {
    purge().catch(() => {})
  }
}
