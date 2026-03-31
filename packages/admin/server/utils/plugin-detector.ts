/**
 * Multi-layered plugin detection
 *
 * Combines multiple sources to build the most complete picture of
 * a publisher's plugin stack:
 *   Layer 1: REST API namespaces (already collected during probe)
 *   Layer 2: Homepage HTML — /wp-content/plugins/{name}/ paths
 *   Layer 3: Post HTML — same scan on an actual post page (catches recipe plugins etc.)
 *   Layer 4: Premium detection — known premium directory patterns
 *   Layer 5: Yoast Premium HTML comment detection
 *
 * Each layer adds to the set — no layer is authoritative alone.
 */

export interface DetectedPlugin {
  slug: string
  source: 'namespace' | 'homepage' | 'post' | 'premium_pattern'
  isPremium: boolean
}

export interface PluginDetectionResult {
  domain: string
  plugins: DetectedPlugin[]
  error?: string
}

// Known premium plugin directories — detection = paying customer
const PREMIUM_DIRECTORIES = new Set([
  // Recipe
  'wp-recipe-maker-premium', 'tasty-recipes', 'tasty-pins', 'tasty-links',
  'feast-plugin',
  // SEO
  'wordpress-seo-premium', 'seo-by-rank-math-pro',
  // Page builders
  'elementor-pro', 'beaver-builder', 'divi-builder',
  // Forms
  // Note: wpforms (without -lite) IS the pro version
  // Misc premium
  'shiftnav-pro', 'link-whisper', 'link-whisper-premium',
  'wp-rocket', 'perfmatters', 'imagify',
  'mediavine-create', // our own — has pro tier
])

// Known paid-only plugins (no free version exists)
const PAID_ONLY_PLUGINS = new Set([
  'tasty-recipes', 'tasty-pins', 'tasty-links',
  'feast-plugin', 'wp-rocket', 'perfmatters',
  'link-whisper', 'link-whisper-premium',
  'elementor-pro', 'beaver-builder',
  'wordpress-seo-premium', 'seo-by-rank-math-pro',
  'wp-recipe-maker-premium',
  'shiftnav-pro',
])

// Plugins where the -lite suffix means free, without suffix means paid
const LITE_VS_PRO: Record<string, string> = {
  'wpforms-lite': 'wpforms',     // wpforms-lite = free, wpforms = pro
  'mailchimp-for-wp': 'mailchimp-for-wp-pro',
}

/**
 * Extract plugin directory names from HTML source.
 */
function extractPluginDirs(html: string): string[] {
  const matches = html.matchAll(/wp-content\/plugins\/([a-zA-Z0-9_-]+)\//g)
  const dirs = new Set<string>()
  for (const match of matches) {
    if (match[1]) dirs.add(match[1].toLowerCase())
  }
  return Array.from(dirs)
}

/**
 * Check for Yoast Premium from HTML comment.
 */
function detectYoastPremium(html: string): boolean {
  return /Yoast SEO Premium plugin/i.test(html)
}

/**
 * Fetch a page's HTML with browser-like headers.
 */
async function fetchPageHtml(url: string): Promise<string | null> {
  try {
    return await $fetch<string>(url, {
      timeout: 12000,
      responseType: 'text',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
      },
    })
  } catch {
    return null
  }
}

/**
 * Get a recent post URL from the WP REST API.
 */
async function getPostUrl(domain: string): Promise<string | null> {
  try {
    const posts = await $fetch<Array<{ link?: string }>>(
      `https://${domain}/wp-json/wp/v2/posts?per_page=1&_fields=link`,
      { timeout: 8000, headers: { 'User-Agent': 'CreateStudio/1.0' } }
    )
    return posts?.[0]?.link || null
  } catch {
    return null
  }
}

/**
 * Detect all plugins on a domain using multiple layers.
 */
export async function detectPlugins(
  domain: string,
  existingNamespaces?: string[],
): Promise<PluginDetectionResult> {
  const pluginMap = new Map<string, DetectedPlugin>()

  const addPlugin = (slug: string, source: DetectedPlugin['source'], isPremium: boolean) => {
    const key = slug.toLowerCase()
    const existing = pluginMap.get(key)
    if (existing) {
      // Upgrade to premium if any source says so
      if (isPremium) existing.isPremium = true
    } else {
      pluginMap.set(key, { slug: key, source, isPremium })
    }
  }

  try {
    // === Layer 1: REST API namespaces ===
    if (existingNamespaces?.length) {
      for (const ns of existingNamespaces) {
        const base = ns.split('/')[0]?.toLowerCase()
        if (base) addPlugin(base, 'namespace', false)
      }
    }

    // === Layer 2: Homepage HTML ===
    const homepageHtml = await fetchPageHtml(`https://${domain}`)
    if (homepageHtml) {
      const dirs = extractPluginDirs(homepageHtml)
      for (const dir of dirs) {
        const isPremium = PREMIUM_DIRECTORIES.has(dir) || PAID_ONLY_PLUGINS.has(dir) || dir.endsWith('-premium') || dir.endsWith('-pro')
        addPlugin(dir, 'homepage', isPremium)
      }

      // Yoast Premium detection
      if (detectYoastPremium(homepageHtml)) {
        addPlugin('wordpress-seo-premium', 'homepage', true)
      }
    }

    // === Layer 3: Post HTML ===
    const postUrl = await getPostUrl(domain)
    if (postUrl) {
      const postHtml = await fetchPageHtml(postUrl)
      if (postHtml) {
        const dirs = extractPluginDirs(postHtml)
        for (const dir of dirs) {
          const isPremium = PREMIUM_DIRECTORIES.has(dir) || PAID_ONLY_PLUGINS.has(dir) || dir.endsWith('-premium') || dir.endsWith('-pro')
          addPlugin(dir, 'post', isPremium)
        }

        // Yoast Premium (if not caught on homepage)
        if (detectYoastPremium(postHtml)) {
          addPlugin('wordpress-seo-premium', 'post', true)
        }
      }
    }

    // === Layer 4: Premium pattern inference ===
    // If we see wpforms (not wpforms-lite), mark as paid
    if (pluginMap.has('wpforms') && !pluginMap.has('wpforms-lite')) {
      const p = pluginMap.get('wpforms')
      if (p) p.isPremium = true
    }

    // If we see both free + premium versions, mark the premium one
    for (const [lite, pro] of Object.entries(LITE_VS_PRO)) {
      if (pluginMap.has(pro)) {
        const p = pluginMap.get(pro)
        if (p) p.isPremium = true
      }
    }

    return {
      domain,
      plugins: Array.from(pluginMap.values()),
    }
  } catch (err: any) {
    return {
      domain,
      plugins: Array.from(pluginMap.values()),
      error: err.message || String(err),
    }
  }
}

/**
 * Detect plugins for a batch of domains.
 */
export async function detectPluginsBatch(
  domains: Array<{ domain: string; namespaces?: string[] }>,
  concurrency: number = 5,
  onProgress?: (completed: number, total: number) => void | Promise<void>,
): Promise<PluginDetectionResult[]> {
  const results: PluginDetectionResult[] = []
  let completed = 0

  for (let i = 0; i < domains.length; i += concurrency) {
    const batch = domains.slice(i, i + concurrency)
    const batchResults = await Promise.all(
      batch.map((d) => detectPlugins(d.domain, d.namespaces))
    )
    results.push(...batchResults)
    completed += batchResults.length
    await onProgress?.(completed, domains.length)
  }

  return results
}
