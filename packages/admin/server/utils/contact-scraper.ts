/**
 * Contact scraper for publisher intelligence pipeline
 *
 * Scrapes contact emails and social links from WordPress publisher sites
 * by checking common pages (contact, about, work-with-me), RSS feeds,
 * and JSON-LD structured data.
 */

import type { SocialLinks } from '../db/admin-schema'

export interface ContactScrapeResult {
  domain: string
  email: string | null
  contactName: string | null
  source: string | null // contact_page, about_page, work_with_me, feed, json_ld
  socialLinks: SocialLinks | null
  error?: string
}

// Email regex — matches most valid emails, avoids image filenames
const EMAIL_RE = /[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/g

// Generic emails to deprioritize (but not exclude entirely)
const GENERIC_PREFIXES = ['info', 'admin', 'noreply', 'no-reply', 'webmaster', 'support', 'contact', 'hello', 'help', 'sales']

// Emails to always exclude
const EXCLUDED_DOMAINS = [
  'example.com', 'example.org', 'sentry.io', 'gravatar.com',
  'wordpress.org', 'wordpress.com', 'w3.org', 'schema.org',
  'wixpress.com', 'squarespace.com', 'yourdomain.com',
]

// Social link patterns
const SOCIAL_PATTERNS: Record<keyof SocialLinks, RegExp> = {
  instagram: /https?:\/\/(?:www\.)?instagram\.com\/[a-zA-Z0-9_.]+\/?/g,
  pinterest: /https?:\/\/(?:www\.)?pinterest\.com\/[a-zA-Z0-9_.]+\/?/g,
  youtube: /https?:\/\/(?:www\.)?youtube\.com\/(?:c\/|channel\/|@)[a-zA-Z0-9_.\-]+\/?/g,
  facebook: /https?:\/\/(?:www\.)?facebook\.com\/[a-zA-Z0-9_.]+\/?/g,
  twitter: /https?:\/\/(?:www\.)?(?:twitter|x)\.com\/[a-zA-Z0-9_]+\/?/g,
  tiktok: /https?:\/\/(?:www\.)?tiktok\.com\/@[a-zA-Z0-9_.]+\/?/g,
}

/**
 * Fetch a page's HTML with timeout and error handling.
 */
async function fetchPage(url: string): Promise<string | null> {
  try {
    const html = await $fetch<string>(url, {
      timeout: 10000,
      headers: {
        'User-Agent': 'CreateStudio/1.0 (Publisher Intelligence)',
        'Accept': 'text/html,application/xhtml+xml',
      },
      responseType: 'text',
    })
    return html
  } catch {
    return null
  }
}

/**
 * Extract emails from HTML content, filtering out junk.
 */
function extractEmails(html: string, siteDomain: string): Array<{ email: string; isGeneric: boolean }> {
  const matches = html.match(EMAIL_RE) || []
  const seen = new Set<string>()
  const results: Array<{ email: string; isGeneric: boolean }> = []

  for (const raw of matches) {
    const email = raw.toLowerCase()

    // Skip duplicates
    if (seen.has(email)) continue
    seen.add(email)

    // Skip excluded domains
    const emailDomain = email.split('@')[1]
    if (!emailDomain) continue
    if (EXCLUDED_DOMAINS.some((d) => emailDomain.endsWith(d))) continue

    // Skip image-like filenames that look like emails
    if (/\.(png|jpg|jpeg|gif|svg|webp|css|js)$/i.test(email)) continue

    const prefix = email.split('@')[0]!
    const isGeneric = GENERIC_PREFIXES.includes(prefix)

    results.push({ email, isGeneric })
  }

  // Sort: non-generic first, then generic
  return results.sort((a, b) => Number(a.isGeneric) - Number(b.isGeneric))
}

/**
 * Extract a contact name from HTML near mailto links or common patterns.
 */
function extractName(html: string): string | null {
  // Look for JSON-LD Person name
  const ldMatch = html.match(/"@type"\s*:\s*"Person"[^}]*?"name"\s*:\s*"([^"]+)"/i)
  if (ldMatch?.[1]) return ldMatch[1]

  // Look for og:site_name as fallback author attribution
  const ogMatch = html.match(/<meta\s+(?:property|name)="og:site_name"\s+content="([^"]+)"/i)
    || html.match(/<meta\s+content="([^"]+)"\s+(?:property|name)="og:site_name"/i)
  if (ogMatch?.[1]) return ogMatch[1]

  return null
}

/**
 * Extract social links from HTML content.
 */
function extractSocialLinks(html: string): SocialLinks | null {
  const links: SocialLinks = {}
  let found = false

  for (const [platform, regex] of Object.entries(SOCIAL_PATTERNS) as Array<[keyof SocialLinks, RegExp]>) {
    const matches = html.match(regex)
    if (matches?.[0]) {
      // Clean trailing slash and take first match
      links[platform] = matches[0].replace(/\/$/, '')
      found = true
    }
  }

  return found ? links : null
}

/**
 * Extract email from RSS feed's managingEditor element.
 */
async function scrapeRssFeed(domain: string): Promise<{ email: string; name: string | null } | null> {
  const feedHtml = await fetchPage(`https://${domain}/feed/`)
  if (!feedHtml) return null

  // <managingEditor>email (Name)</managingEditor> or just <managingEditor>email</managingEditor>
  const match = feedHtml.match(/<managingEditor>\s*([^<]+)\s*<\/managingEditor>/i)
  if (!match?.[1]) return null

  const content = match[1].trim()

  // Format: "email (Name)" or just "email"
  const parts = content.match(/^([^\s(]+)\s*(?:\(([^)]+)\))?$/)
  if (!parts?.[1]) return null

  const email = parts[1].toLowerCase()
  if (!EMAIL_RE.test(email)) return null

  // Reset regex lastIndex since we used global flag
  EMAIL_RE.lastIndex = 0

  const emailDomain = email.split('@')[1]
  if (emailDomain && EXCLUDED_DOMAINS.some((d) => emailDomain.endsWith(d))) return null

  return { email, name: parts[2] || null }
}

/**
 * Extract email from JSON-LD structured data on the homepage.
 */
function extractFromJsonLd(html: string): { email: string; name: string | null } | null {
  const scriptRegex = /<script\s+type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi
  let match: RegExpExecArray | null

  while ((match = scriptRegex.exec(html)) !== null) {
    try {
      const data = JSON.parse(match[1]!)
      const items = Array.isArray(data) ? data : [data]

      for (const item of items) {
        if (
          (item['@type'] === 'Person' || item['@type'] === 'Organization')
          && item.email
        ) {
          const email = String(item.email).toLowerCase().replace(/^mailto:/i, '')
          if (EMAIL_RE.test(email)) {
            EMAIL_RE.lastIndex = 0
            return { email, name: item.name || null }
          }
        }

        // Check nested author
        if (item.author?.email) {
          const email = String(item.author.email).toLowerCase().replace(/^mailto:/i, '')
          if (EMAIL_RE.test(email)) {
            EMAIL_RE.lastIndex = 0
            return { email, name: item.author.name || null }
          }
        }
      }
    } catch {
      // Invalid JSON-LD, skip
    }
  }

  return null
}

/**
 * Scrape contact information from a single publisher domain.
 */
export async function scrapeDomain(domain: string): Promise<ContactScrapeResult> {
  try {
    const baseUrl = `https://${domain}`
    let bestEmail: string | null = null
    let contactName: string | null = null
    let source: string | null = null
    let socialLinks: SocialLinks | null = null

    // Pages to scrape for emails, in order of reliability
    const pages: Array<{ path: string; source: string }> = [
      { path: '/contact/', source: 'contact_page' },
      { path: '/about/', source: 'about_page' },
      { path: '/work-with-me/', source: 'work_with_me' },
    ]

    // Fetch homepage for social links and JSON-LD (always needed)
    const homepagePromise = fetchPage(baseUrl)

    // Try each page in order until we find an email
    for (const page of pages) {
      const html = await fetchPage(`${baseUrl}${page.path}`)
      if (!html) continue

      const emails = extractEmails(html, domain)
      if (emails.length > 0) {
        bestEmail = emails[0]!.email
        source = page.source
        contactName = extractName(html)
        // Also grab social links from this page
        socialLinks = extractSocialLinks(html)
        break
      }
    }

    // If no email yet, try RSS feed
    if (!bestEmail) {
      const feedResult = await scrapeRssFeed(domain)
      if (feedResult) {
        bestEmail = feedResult.email
        contactName = feedResult.name
        source = 'feed'
      }
    }

    // Process homepage (already fetched in parallel for social links)
    const homepage = await homepagePromise

    // If no email yet, try JSON-LD on homepage
    if (!bestEmail && homepage) {
      const ldResult = extractFromJsonLd(homepage)
      if (ldResult) {
        bestEmail = ldResult.email
        contactName = ldResult.name
        source = 'json_ld'
      }
    }

    // Extract social links from homepage if we don't have them yet
    if (!socialLinks && homepage) {
      socialLinks = extractSocialLinks(homepage)
    }

    // If we still don't have a name, try homepage
    if (!contactName && homepage) {
      contactName = extractName(homepage)
    }

    return {
      domain,
      email: bestEmail,
      contactName,
      source,
      socialLinks,
    }
  } catch (err: any) {
    return {
      domain,
      email: null,
      contactName: null,
      source: null,
      socialLinks: null,
      error: err.message || String(err),
    }
  }
}

/**
 * Scrape a batch of domains with concurrency control.
 */
export async function scrapeBatch(
  domains: string[],
  concurrency: number = 3,
  onProgress?: (completed: number, total: number) => void | Promise<void>,
): Promise<ContactScrapeResult[]> {
  const results: ContactScrapeResult[] = []
  let completed = 0

  for (let i = 0; i < domains.length; i += concurrency) {
    const batch = domains.slice(i, i + concurrency)
    const batchResults = await Promise.all(batch.map(scrapeDomain))
    results.push(...batchResults)
    completed += batchResults.length
    await onProgress?.(completed, domains.length)
  }

  return results
}
