/**
 * WordPress REST API prober
 *
 * Hits /wp-json/ on a domain to detect WordPress and discover plugins
 * by extracting REST API namespaces.
 */

export interface WpProbeResult {
  domain: string
  isWordpress: boolean
  restApiAvailable: boolean
  namespaces: string[]
  siteName?: string
  error?: string
}

interface WpJsonResponse {
  name?: string
  namespaces?: string[]
  [key: string]: any
}

/**
 * Probe a single domain's /wp-json/ endpoint.
 * Returns plugin namespaces and WordPress detection result.
 */
export async function probeDomain(domain: string): Promise<WpProbeResult> {
  const url = `https://${domain}/wp-json/`

  try {
    const response = await $fetch<WpJsonResponse>(url, {
      timeout: 10000,
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'CreateStudio/1.0 (Publisher Intelligence)',
      },
      // Don't throw on non-2xx — we handle it ourselves
      ignoreResponseError: true,
      onResponse({ response: res }) {
        // If not JSON content type, mark as not WordPress
        const contentType = res.headers.get('content-type') || ''
        if (!contentType.includes('json')) {
          throw new Error('not-json')
        }
      },
    })

    if (!response || typeof response !== 'object') {
      return { domain, isWordpress: false, restApiAvailable: false, namespaces: [] }
    }

    const namespaces = Array.isArray(response.namespaces) ? response.namespaces : []

    // Filter out core WP namespaces — we only care about plugin namespaces
    const coreNamespaces = new Set(['wp/v2', 'wp-site-health/v1', 'wp-block-editor/v1', 'oembed/1.0'])
    const pluginNamespaces = namespaces.filter((ns: string) => !coreNamespaces.has(ns) && ns !== '')

    return {
      domain,
      isWordpress: true,
      restApiAvailable: true,
      namespaces: pluginNamespaces,
      siteName: response.name || undefined,
    }
  } catch (err: any) {
    if (err.message === 'not-json') {
      return { domain, isWordpress: false, restApiAvailable: false, namespaces: [] }
    }

    // Timeout or network error — site may still be WordPress, we just can't reach it
    return {
      domain,
      isWordpress: false,
      restApiAvailable: false,
      namespaces: [],
      error: err.message || String(err),
    }
  }
}

/**
 * Probe a batch of domains with concurrency control.
 * Runs `concurrency` probes at a time.
 */
export async function probeBatch(
  domains: string[],
  concurrency: number = 15,
  onProgress?: (completed: number, total: number) => void,
): Promise<WpProbeResult[]> {
  const results: WpProbeResult[] = []
  let completed = 0

  for (let i = 0; i < domains.length; i += concurrency) {
    const batch = domains.slice(i, i + concurrency)
    const batchResults = await Promise.all(batch.map(probeDomain))
    results.push(...batchResults)
    completed += batchResults.length
    onProgress?.(completed, domains.length)
  }

  return results
}
