import { sql, inArray } from 'drizzle-orm'
import type { DrizzleD1Database } from 'drizzle-orm/d1'
import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core'

/**
 * Lightweight reference to the Sites table in the MAIN database.
 * Only includes columns needed for domain → site_id resolution.
 * This avoids importing the full app schema into the analytics package.
 */
const sitesRef = sqliteTable('Sites', {
  id: integer('id').primaryKey(),
  url: text('url'),
  canonical_site_id: integer('canonical_site_id'),
})

/**
 * Resolve a list of domain strings to site IDs by querying the main database's Sites table.
 *
 * If a site has a `canonical_site_id` set (i.e. it's an alias), the canonical ID is used instead.
 * Unknown domains (not found in the Sites table) are simply omitted from the returned map.
 *
 * NOTE: The Sites table lives in the MAIN database, not the analytics database.
 * The caller must provide the main DB drizzle instance.
 *
 * @param mainDb - Drizzle instance for the MAIN database (not analytics)
 * @param domains - List of domain strings to resolve
 * @returns Map of domain → siteId
 */
export async function resolveDomainToSiteId(
  mainDb: DrizzleD1Database,
  domains: string[],
): Promise<Map<string, number>> {
  const result = new Map<string, number>()

  if (domains.length === 0) {
    return result
  }

  const rows = await mainDb
    .select({
      id: sitesRef.id,
      url: sitesRef.url,
      canonical_site_id: sitesRef.canonical_site_id,
    })
    .from(sitesRef)
    .where(inArray(sitesRef.url, domains))

  for (const row of rows) {
    if (!row.url) continue
    // If the site has a canonical_site_id, use that instead of its own id
    const siteId = row.canonical_site_id ?? row.id
    result.set(row.url, siteId)
  }

  return result
}
