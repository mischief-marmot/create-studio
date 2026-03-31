/**
 * Plugin enrichment via WordPress.org Plugin Directory API
 *
 * Searches wordpress.org for plugin info by namespace,
 * returns name, description, install count, rating, URLs.
 * Plugins NOT on wordpress.org are likely paid-only.
 */

export interface PluginEnrichmentResult {
  namespace: string
  wpSlug: string | null
  name: string | null
  description: string | null
  homepageUrl: string | null
  wpUrl: string | null
  activeInstalls: number | null
  rating: number | null
  found: boolean
}

interface WpOrgPluginResponse {
  slug?: string
  name?: string
  short_description?: string
  homepage?: string
  active_installs?: number
  rating?: number
  error?: string
  [key: string]: any
}

interface WpOrgSearchResponse {
  plugins?: WpOrgPluginResponse[]
  [key: string]: any
}

/**
 * Search wordpress.org for a plugin by namespace.
 * First tries direct slug lookup, then falls back to search.
 */
export async function enrichPlugin(namespace: string): Promise<PluginEnrichmentResult> {
  const empty: PluginEnrichmentResult = {
    namespace,
    wpSlug: null,
    name: null,
    description: null,
    homepageUrl: null,
    wpUrl: null,
    activeInstalls: null,
    rating: null,
    found: false,
  }

  try {
    // Try direct slug lookup first (fastest, works when namespace = slug)
    const direct = await tryDirectLookup(namespace)
    if (direct) return direct

    // Try search API (handles namespace ≠ slug cases like rankmath → seo-by-rank-math)
    const searched = await trySearch(namespace)
    if (searched) return searched

    // Not found on wordpress.org — likely a paid-only or custom plugin
    return empty
  } catch {
    return empty
  }
}

async function tryDirectLookup(namespace: string): Promise<PluginEnrichmentResult | null> {
  try {
    const data = await $fetch<WpOrgPluginResponse>(
      `https://api.wordpress.org/plugins/info/1.2/?action=plugin_information&request[slug]=${encodeURIComponent(namespace)}`,
      { timeout: 10000 }
    )

    if (!data?.slug || data.error) return null

    return formatResult(namespace, data)
  } catch {
    return null
  }
}

async function trySearch(namespace: string): Promise<PluginEnrichmentResult | null> {
  try {
    const data = await $fetch<WpOrgSearchResponse>(
      `https://api.wordpress.org/plugins/info/1.2/?action=query_plugins&request[search]=${encodeURIComponent(namespace)}&request[per_page]=3`,
      { timeout: 10000 }
    )

    if (!data?.plugins?.length) return null

    // Strict matching — only accept results where the slug clearly relates to our namespace
    const nsLower = namespace.toLowerCase()
    const nsClean = nsLower.replace(/-/g, '')

    const match = data.plugins.find((p) => {
      if (!p.slug) return false
      const slugClean = p.slug.replace(/-/g, '')
      // Exact match
      if (p.slug === nsLower) return true
      // Slug contains our namespace (e.g., "seo-by-rank-math" contains "rankmath")
      if (slugClean.includes(nsClean)) return true
      // Our namespace contains the slug (e.g., "contactform7" contains "contact-form-7")
      if (nsClean.includes(slugClean) && slugClean.length >= 4) return true
      return false
    })

    if (!match?.slug) return null

    return formatResult(namespace, match)
  } catch {
    return null
  }
}

function formatResult(namespace: string, data: WpOrgPluginResponse): PluginEnrichmentResult {
  // Decode HTML entities in name/description
  const name = decodeEntities(data.name || '')
  const description = decodeEntities(data.short_description || '')

  return {
    namespace,
    wpSlug: data.slug || null,
    name: name || null,
    description: description || null,
    homepageUrl: data.homepage || null,
    wpUrl: data.slug ? `https://wordpress.org/plugins/${data.slug}/` : null,
    activeInstalls: data.active_installs || null,
    rating: data.rating || null,
    found: true,
  }
}

function decodeEntities(str: string): string {
  return str
    .replace(/&#8211;/g, '–')
    .replace(/&#8212;/g, '—')
    .replace(/&#8217;/g, "'")
    .replace(/&#8220;/g, '"')
    .replace(/&#8221;/g, '"')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
}

/**
 * Enrich a batch of plugins with wordpress.org data.
 * Rate-limited to avoid hammering the API.
 */
export async function enrichPluginBatch(
  namespaces: string[],
  onProgress?: (completed: number, total: number) => void,
): Promise<PluginEnrichmentResult[]> {
  const results: PluginEnrichmentResult[] = []

  for (let i = 0; i < namespaces.length; i++) {
    const result = await enrichPlugin(namespaces[i]!)
    results.push(result)

    if ((i + 1) % 5 === 0 || i === namespaces.length - 1) {
      onProgress?.(i + 1, namespaces.length)
    }

    // Small delay to be nice to the API (1 req/200ms = 5/sec)
    if (i < namespaces.length - 1) {
      await new Promise((r) => setTimeout(r, 200))
    }
  }

  return results
}
