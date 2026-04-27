import { and, eq, isNull, like, or } from 'drizzle-orm'
import { getApexDomain, buildApexHostMatchPatterns } from './url'

/**
 * Resolves a possibly-aliased site URL to the canonical URL stored on the
 * Sites row. Tries an exact-URL match first, then falls back to an apex
 * lookup over `apex` and `www.${apex}` × `http(s)` variants — the same
 * /-anchored LIKE patterns buildSiteConfig uses, with the same anti-spoof
 * guarantee.
 *
 * Returns null if no canonical site row matches. Caller should fall back
 * to the input URL in that case (preserves existing behavior for unknown
 * or just-connected sites).
 *
 * Used to recover the canonical URL when the widget only knows the apex
 * domain (e.g. iframe interactive mode, fetch-creation calls): the row
 * may store `https://www.slimmingeats.com/blog` but the request comes in
 * with `https://slimmingeats.com`. Without this resolution, server-side
 * calls to `${siteUrl}/wp-json/...` 404 on subdir-installed WP sites.
 */
export async function findCanonicalSiteUrl(siteUrl: string): Promise<string | null> {
  const exact = await db.select({ url: schema.sites.url })
    .from(schema.sites)
    .where(eq(schema.sites.url, siteUrl))
    .get()
  if (exact?.url) return exact.url

  const apex = getApexDomain(siteUrl)
  if (!apex) return null

  const patterns = buildApexHostMatchPatterns(apex)
  const fallback = await db.select({ url: schema.sites.url })
    .from(schema.sites)
    .where(and(
      or(
        ...patterns.exact.map(u => eq(schema.sites.url, u)),
        ...patterns.prefix.map(p => like(schema.sites.url, `${p}%`)),
      ),
      isNull(schema.sites.canonical_site_id),
    ))
    .orderBy(schema.sites.id)
    .limit(1)
    .get()
  return fallback?.url ?? null
}
