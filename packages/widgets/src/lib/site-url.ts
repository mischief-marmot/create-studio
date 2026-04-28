/** Resolve the WP-REST base URL the widget should call.
 *
 *  Prefers an explicit canonical URL (from the site-config response,
 *  which has already resolved subdir installs like /blog). Falls back to
 *  reconstructing from the apex `domain` for legacy callers and dev
 *  environments — localhost hits the WP plugin docker stack on :8074,
 *  `.test` domains use http (no SSL), everything else mirrors the parent
 *  page's protocol. */
export function resolveSiteUrl(
  explicit: string | undefined,
  domain: string,
  protocol?: string,
): string {
  if (explicit) return explicit
  if (domain === 'localhost') return 'http://localhost:8074'
  if (domain.endsWith('.test')) return `http://${domain}`
  return `${protocol ?? 'https:'}//${domain}`
}
