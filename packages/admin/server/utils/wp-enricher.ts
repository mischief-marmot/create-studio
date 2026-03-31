/**
 * WordPress publisher enrichment
 *
 * Fetches publishing history, categories, and top content
 * from WordPress REST API endpoints.
 */

export interface EnrichmentResult {
  domain: string
  postCount: number | null
  oldestPostDate: string | null
  newestPostDate: string | null
  siteCategory: string | null
  topContent: Array<{ title: string; comments: number }> | null
  error?: string
}

interface WpPost {
  date?: string
  title?: { rendered?: string }
  comment_count?: number
  [key: string]: any
}

interface WpCategory {
  name?: string
  count?: number
  [key: string]: any
}

// Category keywords → site category mapping
const CATEGORY_MAP: Record<string, string[]> = {
  food: ['recipe', 'recipes', 'food', 'cooking', 'baking', 'dinner', 'breakfast', 'lunch', 'dessert', 'meal', 'kitchen', 'cuisine', 'appetizer', 'snack'],
  diy: ['diy', 'craft', 'crafts', 'handmade', 'woodworking', 'sewing', 'knitting', 'crochet', 'project'],
  lifestyle: ['lifestyle', 'life', 'family', 'parenting', 'home', 'wellness', 'self-care', 'organization'],
  travel: ['travel', 'destination', 'vacation', 'trip', 'adventure', 'explore'],
  beauty: ['beauty', 'skincare', 'makeup', 'hair', 'fashion', 'style'],
  fitness: ['fitness', 'workout', 'exercise', 'health', 'nutrition', 'weight', 'yoga'],
  tech: ['tech', 'technology', 'software', 'programming', 'gadget', 'review'],
  finance: ['finance', 'money', 'budget', 'investing', 'frugal', 'saving', 'income'],
  garden: ['garden', 'gardening', 'plants', 'homestead', 'farming', 'outdoor'],
}

/**
 * Derive a site category from the top WordPress categories.
 */
function deriveSiteCategory(categories: WpCategory[]): string | null {
  if (!categories.length) return null

  // Build a weighted keyword bag from category names
  const scores: Record<string, number> = {}

  for (const cat of categories) {
    const name = (cat.name || '').toLowerCase()
    const weight = cat.count || 1

    for (const [category, keywords] of Object.entries(CATEGORY_MAP)) {
      for (const keyword of keywords) {
        if (name.includes(keyword)) {
          scores[category] = (scores[category] || 0) + weight
        }
      }
    }
  }

  if (Object.keys(scores).length === 0) return null

  // Return the highest-scoring category
  return Object.entries(scores).sort((a, b) => b[1] - a[1])[0]![0]!
}

/**
 * Enrich a single publisher with WordPress REST API data.
 */
export async function enrichDomain(domain: string): Promise<EnrichmentResult> {
  const base = `https://${domain}/wp-json/wp/v2`

  try {
    // Capture post count from X-WP-Total header via raw fetch
    let postCount: number | null = null
    const postCountPromise = fetch(`${base}/posts?per_page=1&orderby=date&order=desc&_fields=date`, {
      headers: { 'User-Agent': 'CreateStudio/1.0' },
      signal: AbortSignal.timeout(10000),
    }).then((res) => {
      const wpTotal = res.headers.get('x-wp-total')
      if (wpTotal) postCount = parseInt(wpTotal, 10) || null
      return res.json() as Promise<WpPost[]>
    }).catch(() => [] as WpPost[])

    // Fetch in parallel: oldest post, newest+count, top categories, top content
    const [oldestRes, newestRes, categoriesRes, topPostsRes] = await Promise.allSettled([
      $fetch<WpPost[]>(`${base}/posts?per_page=1&orderby=date&order=asc&_fields=date`, {
        timeout: 10000,
        headers: { 'User-Agent': 'CreateStudio/1.0' },
      }),
      postCountPromise,
      $fetch<WpCategory[]>(`${base}/categories?per_page=10&orderby=count&order=desc&_fields=name,count`, {
        timeout: 10000,
        headers: { 'User-Agent': 'CreateStudio/1.0' },
      }),
      $fetch<WpPost[]>(`${base}/posts?per_page=5&orderby=comment_count&order=desc&_fields=title,comment_count`, {
        timeout: 10000,
        headers: { 'User-Agent': 'CreateStudio/1.0' },
      }),
    ])

    // Oldest post date
    const oldestPostDate = oldestRes.status === 'fulfilled' && oldestRes.value?.[0]?.date
      ? oldestRes.value[0].date
      : null

    // Newest post date
    const newestPostDate = newestRes.status === 'fulfilled' && newestRes.value?.[0]?.date
      ? newestRes.value[0].date
      : null

    // Categories → site category
    const categories = categoriesRes.status === 'fulfilled' ? categoriesRes.value : []
    const siteCategory = deriveSiteCategory(categories)

    // Top content
    let topContent: Array<{ title: string; comments: number }> | null = null
    if (topPostsRes.status === 'fulfilled' && topPostsRes.value?.length) {
      topContent = topPostsRes.value
        .filter((p) => p.title?.rendered)
        .map((p) => ({
          title: p.title!.rendered!.replace(/&#8217;/g, "'").replace(/&#8211;/g, '–').replace(/&amp;/g, '&'),
          comments: p.comment_count || 0,
        }))
    }

    return {
      domain,
      postCount,
      oldestPostDate,
      newestPostDate,
      siteCategory,
      topContent,
    }
  } catch (err: any) {
    return {
      domain,
      postCount: null,
      oldestPostDate: null,
      newestPostDate: null,
      siteCategory: null,
      topContent: null,
      error: err.message || String(err),
    }
  }
}

/**
 * Enrich a batch of domains with concurrency control.
 */
export async function enrichBatch(
  domains: string[],
  concurrency: number = 10,
  onProgress?: (completed: number, total: number) => void,
): Promise<EnrichmentResult[]> {
  const results: EnrichmentResult[] = []
  let completed = 0

  for (let i = 0; i < domains.length; i += concurrency) {
    const batch = domains.slice(i, i + concurrency)
    const batchResults = await Promise.all(batch.map(enrichDomain))
    results.push(...batchResults)
    completed += batchResults.length
    onProgress?.(completed, domains.length)
  }

  return results
}
