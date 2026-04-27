import { SubscriptionRepository, SiteMetaRepository } from '~~/server/utils/database'
import { getApexDomain, buildApexHostMatchPatterns } from '~~/server/utils/url'
import { useLogger } from '@create-studio/shared/utils/logger'
import { and, eq, isNull, like, or } from 'drizzle-orm'

export interface SiteConfigResult {
  success: true
  config: {
    showInteractiveMode: boolean
    buttonText: string
    ctaVariant: 'button' | 'inline-banner' | 'sticky-bar' | 'tooltip'
    ctaTitle: string
    ctaSubtitle: string
    baseUrl: string
    subscriptionTier: string
    renderMode: 'iframe' | 'in-dom'
    features: {
      inDomRendering: boolean
      customStyling: boolean
      servingsAdjustment: boolean
      unitConversion: boolean
      analytics: boolean
    }
  }
  siteUrl: string
}

export async function buildSiteConfig(siteUrl: string, rootUrl: string): Promise<SiteConfigResult> {
  const logger = useLogger('SiteConfig')

  let subscriptionTier = 'free'
  let renderMode: 'iframe' | 'in-dom' = 'iframe'
  let showInteractiveMode = true
  let buttonText = 'Try Interactive Mode!'
  let ctaVariant: 'button' | 'inline-banner' | 'sticky-bar' | 'tooltip' = 'inline-banner'
  let ctaTitle = ''
  let ctaSubtitle = ''

  try {
    let siteResult = await db.select().from(schema.sites).where(eq(schema.sites.url, siteUrl)).get()

    // Fallback for the iframe interactive flow: creationKey only carries the
    // apex domain (no protocol, no path), but the row was likely stored with
    // www and/or a /blog-style subdir. Match by host variants so the gating
    // still resolves to the right row instead of falling through to defaults.
    // Read-only path; OK if it occasionally matches a sibling row at the same
    // apex (worst case is a slightly wrong gate, not data corruption).
    if (!siteResult) {
      const apex = getApexDomain(siteUrl)
      if (apex) {
        const patterns = buildApexHostMatchPatterns(apex)
        // TODO: when multiple sites share an apex (e.g. example.com/blog and
        // example.com/shop as separate canonical rows), orderBy(id).limit(1)
        // arbitrarily picks the oldest. Becomes load-bearing as more
        // customers run subdir installs side-by-side. Revisit with a
        // path-aware match if it bites.
        siteResult = await db.select().from(schema.sites)
          .where(and(
            or(
              // Exact equality — handles apex/www with no path.
              ...patterns.exact.map(u => eq(schema.sites.url, u)),
              // /-anchored prefix — required to prevent example.com from
              // matching example.com.evil.com. See buildApexHostMatchPatterns.
              ...patterns.prefix.map(p => like(schema.sites.url, `${p}%`)),
            ),
            isNull(schema.sites.canonical_site_id),
          ))
          .orderBy(schema.sites.id)
          .limit(1)
          .get()
      }
    }

    if (siteResult) {
      const subscriptionRepo = new SubscriptionRepository()
      subscriptionTier = await subscriptionRepo.getActiveTier(siteResult.id as number)

      const siteMetaRepo = new SiteMetaRepository()
      const settings = await siteMetaRepo.getSettings(siteResult.id as number)

      if (subscriptionTier === 'free') {
        showInteractiveMode = false
      }

      if (settings.interactive_mode_enabled === false) {
        showInteractiveMode = false
      }

      if (subscriptionTier === 'pro') {
        if (settings.interactive_mode_button_text) {
          buttonText = settings.interactive_mode_button_text
        }
        ctaVariant = settings.interactive_mode_cta_variant || 'button'
        if (settings.interactive_mode_cta_title) {
          ctaTitle = settings.interactive_mode_cta_title
        }
        if (settings.interactive_mode_cta_subtitle) {
          ctaSubtitle = settings.interactive_mode_cta_subtitle
        }
      }
    }
  } catch (error) {
    // Log loudly — a transient DB failure here produces a free-tier response
    // that gets cached at the edge for 10 minutes, so silent swallowing would
    // mask the regression across many visitors.
    logger.error(`Error looking up site subscription for ${siteUrl}:`, error)
  }

  // Trial users preview the Pro experience, so they get in-DOM rendering
  // too. Other Pro-only features (CTA customization, custom styling) stay
  // gated on tier === 'pro' since trial users can't save those settings.
  if (subscriptionTier === 'pro' || subscriptionTier === 'trial') {
    renderMode = 'in-dom'
  }

  const effectiveTier = subscriptionTier === 'trial' ? 'free-plus' : subscriptionTier

  return {
    success: true,
    config: {
      showInteractiveMode,
      buttonText,
      ctaVariant,
      ctaTitle,
      ctaSubtitle,
      baseUrl: rootUrl,
      subscriptionTier,
      renderMode,
      features: {
        inDomRendering: renderMode === 'in-dom',
        customStyling: effectiveTier === 'pro',
        servingsAdjustment: effectiveTier !== 'free',
        unitConversion: effectiveTier !== 'free',
        analytics: true,
      },
    },
    siteUrl,
  }
}
