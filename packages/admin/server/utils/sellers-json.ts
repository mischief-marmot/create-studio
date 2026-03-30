/**
 * sellers.json parser
 *
 * Fetches and parses IAB sellers.json files from ad networks,
 * extracting publisher domains and names.
 */

export interface SellerEntry {
  seller_id: string
  name: string
  domain: string
  seller_type: string
}

export interface SellersJsonResponse {
  sellers: SellerEntry[]
  [key: string]: any
}

export interface ParsedPublisher {
  domain: string
  siteName: string
  adNetworks: string[]
}

/**
 * Fetch and parse a single sellers.json URL.
 * Returns an array of { domain, name } for publisher-type sellers.
 */
export async function fetchSellersJson(url: string): Promise<{ domain: string; name: string }[]> {
  const response = await $fetch<SellersJsonResponse>(url, {
    timeout: 30000,
    headers: {
      'Accept': 'application/json',
      'User-Agent': 'CreateStudio/1.0 (Publisher Intelligence)',
    },
  })

  if (!response?.sellers || !Array.isArray(response.sellers)) {
    throw new Error(`Invalid sellers.json response from ${url}`)
  }

  return response.sellers
    .filter((s) => s.domain && s.seller_type === 'PUBLISHER')
    .map((s) => ({
      domain: normalizeDomain(s.domain),
      name: s.name || '',
    }))
    .filter((s) => s.domain.length > 0)
}

/**
 * Normalize a domain: lowercase, strip protocol/path/www, trim whitespace.
 */
function normalizeDomain(raw: string): string {
  let domain = raw.trim().toLowerCase()

  // Strip protocol
  domain = domain.replace(/^https?:\/\//, '')

  // Strip path and query
  domain = domain.split('/')[0]!.split('?')[0]!

  // Strip www.
  domain = domain.replace(/^www\./, '')

  // Strip trailing dot
  domain = domain.replace(/\.$/, '')

  return domain
}

/**
 * Fetch all sellers.json files and merge into a deduplicated publisher list.
 * Publishers appearing in multiple networks get all network slugs in their adNetworks array.
 */
export async function fetchAllSellersJson(
  networks: Array<{ slug: string; sellersJsonUrl: string }>
): Promise<{
  publishers: ParsedPublisher[]
  results: Array<{ slug: string; count: number; error?: string }>
}> {
  const publisherMap = new Map<string, ParsedPublisher>()
  const results: Array<{ slug: string; count: number; error?: string }> = []

  for (const network of networks) {
    try {
      const sellers = await fetchSellersJson(network.sellersJsonUrl)

      for (const seller of sellers) {
        const existing = publisherMap.get(seller.domain)
        if (existing) {
          if (!existing.adNetworks.includes(network.slug)) {
            existing.adNetworks.push(network.slug)
          }
          // Keep the longer/better name
          if (seller.name.length > existing.siteName.length) {
            existing.siteName = seller.name
          }
        } else {
          publisherMap.set(seller.domain, {
            domain: seller.domain,
            siteName: seller.name,
            adNetworks: [network.slug],
          })
        }
      }

      results.push({ slug: network.slug, count: sellers.length })
    } catch (err: any) {
      results.push({ slug: network.slug, count: 0, error: err.message || String(err) })
    }
  }

  return {
    publishers: Array.from(publisherMap.values()),
    results,
  }
}
