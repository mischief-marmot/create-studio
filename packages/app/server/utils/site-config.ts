import { SubscriptionRepository, SiteMetaRepository } from '~~/server/utils/database'
import { useLogger } from '@create-studio/shared/utils/logger'
import { eq } from 'drizzle-orm'

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
    const siteResult = await db.select().from(schema.sites).where(eq(schema.sites.url, siteUrl)).get()

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

  if (subscriptionTier === 'pro') {
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
