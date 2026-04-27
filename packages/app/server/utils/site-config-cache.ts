import type { H3Event } from 'h3'
import { useLogger } from '@create-studio/shared/utils/logger'

/** Build the cache URL the GET + POST site-config handlers use as their key.
 *  Must match the key construction in
 *  `server/api/v2/site-config/[siteKey].get.ts` and `site-config.post.ts`. */
function buildConfigCacheUrl(rootUrl: string, siteUrl: string): string {
  return `${rootUrl}/api/v2/site-config/${btoa(siteUrl)}`
}

function buildConfigCacheKey(rootUrl: string, siteUrl: string): Request {
  return new Request(buildConfigCacheUrl(rootUrl, siteUrl), { method: 'GET' })
}

/** Purge a site's config response from both `caches.default` and (globally)
 *  Cloudflare's edge cache. Mirrors `purgeSiteStatusCache` exactly. The PATCH
 *  handler calls this when interactive mode toggles or other config-shaping
 *  fields change — without it, edge entries serve the pre-toggle config for
 *  up to 10 minutes. */
export async function purgeSiteConfigCache(
  event: H3Event | undefined,
  siteUrl: string,
): Promise<void> {
  const runtimeConfig = useRuntimeConfig()
  const logger = useLogger('SiteConfigCache', runtimeConfig.debug)
  const rootUrl = runtimeConfig.public.rootUrl
  const url = buildConfigCacheUrl(rootUrl, siteUrl)

  // 1. Same-DC instant invalidate
  try {
    const cache = (caches as any).default as Cache | undefined
    if (cache) {
      await cache.delete(buildConfigCacheKey(rootUrl, siteUrl))
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

  const ctx = event ? (event.context.cloudflare as any)?.context : undefined
  if (ctx?.waitUntil) {
    ctx.waitUntil(purge())
  } else {
    purge().catch(() => {})
  }
}
