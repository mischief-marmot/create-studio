import { and, eq, isNull, like, or } from 'drizzle-orm'
import { getApexDomain, buildApexHostMatchPatterns } from './url'

type UrlRow = { url: string | null } | null | undefined

/** Pure orchestration: exact-match → apex-fallback → null. Extracted so tests
 *  can drive the branches with stub queries instead of mocking Drizzle. */
export async function resolveCanonicalSiteUrl(
  siteUrl: string,
  queryExact: (url: string) => Promise<UrlRow>,
  queryByApex: (apex: string) => Promise<UrlRow>,
): Promise<string | null> {
  const exact = await queryExact(siteUrl)
  if (exact?.url) return exact.url
  const apex = getApexDomain(siteUrl)
  if (!apex) return null
  const fallback = await queryByApex(apex)
  return fallback?.url ?? null
}

/** Resolve an aliased siteUrl to the canonical Sites.url for subdir-installed
 *  WP sites where the widget sends the apex but the row stores /blog. */
export async function findCanonicalSiteUrl(siteUrl: string): Promise<string | null> {
  return resolveCanonicalSiteUrl(
    siteUrl,
    (url) => db.select({ url: schema.sites.url })
      .from(schema.sites)
      .where(eq(schema.sites.url, url))
      .get(),
    (apex) => {
      const patterns = buildApexHostMatchPatterns(apex)
      return db.select({ url: schema.sites.url })
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
    },
  )
}
