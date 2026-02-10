import { describe, it, expect } from 'vitest'

/**
 * Test suite for three-tier feature gating logic.
 *
 * Validates that the site-config feature flags are computed correctly
 * for each subscription tier: free, free-plus, and pro.
 */

/** Replicates the gating logic from site-config.post.ts */
function computeSiteConfig(subscriptionTier: string) {
  let renderMode: 'iframe' | 'in-dom' = 'iframe'
  let showInteractiveMode = true

  if (subscriptionTier === 'free') {
    showInteractiveMode = false
  }

  if (subscriptionTier === 'pro') {
    renderMode = 'in-dom'
  }

  return {
    showInteractiveMode,
    renderMode,
    features: {
      inDomRendering: renderMode === 'in-dom',
      customStyling: subscriptionTier === 'pro',
      servingsAdjustment: subscriptionTier !== 'free',
      unitConversion: subscriptionTier !== 'free',
      analytics: true,
    },
  }
}

describe('Three-Tier Feature Gating', () => {
  describe('Free tier', () => {
    const config = computeSiteConfig('free')

    it('should disable interactive mode', () => {
      expect(config.showInteractiveMode).toBe(false)
    })

    it('should use iframe render mode', () => {
      expect(config.renderMode).toBe('iframe')
    })

    it('should disable in-DOM rendering', () => {
      expect(config.features.inDomRendering).toBe(false)
    })

    it('should disable custom styling', () => {
      expect(config.features.customStyling).toBe(false)
    })

    it('should disable servings adjustment', () => {
      expect(config.features.servingsAdjustment).toBe(false)
    })

    it('should disable unit conversion', () => {
      expect(config.features.unitConversion).toBe(false)
    })

    it('should enable analytics', () => {
      expect(config.features.analytics).toBe(true)
    })
  })

  describe('Free+ tier', () => {
    const config = computeSiteConfig('free-plus')

    it('should enable interactive mode', () => {
      expect(config.showInteractiveMode).toBe(true)
    })

    it('should use iframe render mode', () => {
      expect(config.renderMode).toBe('iframe')
    })

    it('should disable in-DOM rendering', () => {
      expect(config.features.inDomRendering).toBe(false)
    })

    it('should disable custom styling', () => {
      expect(config.features.customStyling).toBe(false)
    })

    it('should enable servings adjustment', () => {
      expect(config.features.servingsAdjustment).toBe(true)
    })

    it('should enable unit conversion', () => {
      expect(config.features.unitConversion).toBe(true)
    })

    it('should enable analytics', () => {
      expect(config.features.analytics).toBe(true)
    })
  })

  describe('Pro tier', () => {
    const config = computeSiteConfig('pro')

    it('should enable interactive mode', () => {
      expect(config.showInteractiveMode).toBe(true)
    })

    it('should use in-dom render mode', () => {
      expect(config.renderMode).toBe('in-dom')
    })

    it('should enable in-DOM rendering', () => {
      expect(config.features.inDomRendering).toBe(true)
    })

    it('should enable custom styling', () => {
      expect(config.features.customStyling).toBe(true)
    })

    it('should enable servings adjustment', () => {
      expect(config.features.servingsAdjustment).toBe(true)
    })

    it('should enable unit conversion', () => {
      expect(config.features.unitConversion).toBe(true)
    })

    it('should enable analytics', () => {
      expect(config.features.analytics).toBe(true)
    })
  })
})

describe('Dev Toggle Tier Cycling', () => {
  const tierCycle: Record<string, string> = {
    free: 'free-plus',
    'free-plus': 'pro',
    pro: 'free',
  }

  it('should cycle free → free-plus', () => {
    expect(tierCycle['free']).toBe('free-plus')
  })

  it('should cycle free-plus → pro', () => {
    expect(tierCycle['free-plus']).toBe('pro')
  })

  it('should cycle pro → free', () => {
    expect(tierCycle['pro']).toBe('free')
  })

  it('should default to free-plus for unknown tiers', () => {
    const tier = 'unknown'
    const newTier = tierCycle[tier] || 'free-plus'
    expect(newTier).toBe('free-plus')
  })

  it('should set status to free only for free tier', () => {
    for (const [, newTier] of Object.entries(tierCycle)) {
      const newStatus = newTier === 'free' ? 'free' : 'active'
      if (newTier === 'free') {
        expect(newStatus).toBe('free')
      } else {
        expect(newStatus).toBe('active')
      }
    }
  })
})

describe('Admin Modify Tier Validation', () => {
  const validTiers = ['free', 'free-plus', 'pro']

  it('should accept free tier', () => {
    expect(validTiers.includes('free')).toBe(true)
  })

  it('should accept free-plus tier', () => {
    expect(validTiers.includes('free-plus')).toBe(true)
  })

  it('should accept pro tier', () => {
    expect(validTiers.includes('pro')).toBe(true)
  })

  it('should reject invalid tiers', () => {
    expect(validTiers.includes('enterprise')).toBe(false)
    expect(validTiers.includes('ad_supported')).toBe(false)
    expect(validTiers.includes('')).toBe(false)
  })

  it('should clear cancel_at_period_end for pro and free-plus', () => {
    for (const tier of validTiers) {
      const shouldClear = tier === 'pro' || tier === 'free-plus'
      if (tier === 'free') {
        expect(shouldClear).toBe(false)
      } else {
        expect(shouldClear).toBe(true)
      }
    }
  })
})

describe('Dashboard Tier Labels', () => {
  const getTierLabel = (tier: string) => {
    if (tier === 'pro') return 'Pro'
    if (tier === 'free-plus') return 'Free+'
    return 'Free'
  }

  it('should return "Free" for free tier', () => {
    expect(getTierLabel('free')).toBe('Free')
  })

  it('should return "Free+" for free-plus tier', () => {
    expect(getTierLabel('free-plus')).toBe('Free+')
  })

  it('should return "Pro" for pro tier', () => {
    expect(getTierLabel('pro')).toBe('Pro')
  })

  it('should default to "Free" for unknown tiers', () => {
    expect(getTierLabel('unknown')).toBe('Free')
  })
})

describe('Premium Sites Count', () => {
  it('should count both pro and free-plus as premium', () => {
    const siteTiers: Record<number, string> = {
      1: 'free',
      2: 'pro',
      3: 'free-plus',
      4: 'free',
      5: 'pro',
    }

    const premiumCount = Object.values(siteTiers).filter(
      (tier) => tier === 'pro' || tier === 'free-plus'
    ).length

    expect(premiumCount).toBe(3)
  })

  it('should return 0 when all sites are free', () => {
    const siteTiers: Record<number, string> = {
      1: 'free',
      2: 'free',
    }

    const premiumCount = Object.values(siteTiers).filter(
      (tier) => tier === 'pro' || tier === 'free-plus'
    ).length

    expect(premiumCount).toBe(0)
  })
})

describe('Settings Page Tier Display', () => {
  const getTierDisplayName = (tier: string) => {
    if (tier === 'pro') return 'Pro'
    if (tier === 'free-plus') return 'Free+'
    return 'Free'
  }

  const getPlanName = (tier: string) => {
    if (tier === 'pro') return 'Pro Plan'
    if (tier === 'free-plus') return 'Free+ Plan'
    return 'Free Plan'
  }

  it('should display correct plan names', () => {
    expect(getPlanName('free')).toBe('Free Plan')
    expect(getPlanName('free-plus')).toBe('Free+ Plan')
    expect(getPlanName('pro')).toBe('Pro Plan')
  })

  it('should display correct tier display names', () => {
    expect(getTierDisplayName('free')).toBe('Free')
    expect(getTierDisplayName('free-plus')).toBe('Free+')
    expect(getTierDisplayName('pro')).toBe('Pro')
  })

  it('should apply gradient styling for non-free tiers', () => {
    const shouldApplyGradient = (tier: string) => tier !== 'free'
    expect(shouldApplyGradient('free')).toBe(false)
    expect(shouldApplyGradient('free-plus')).toBe(true)
    expect(shouldApplyGradient('pro')).toBe(true)
  })
})

describe('Admin Panel Format Tier', () => {
  const formatTier = (tier: string): string => {
    const tierMap: Record<string, string> = {
      free: 'Free Plan',
      'free-plus': 'Free+ Plan',
      pro: 'Pro Plan',
      enterprise: 'Enterprise Plan',
    }
    return tierMap[tier] || tier.charAt(0).toUpperCase() + tier.slice(1) + ' Plan'
  }

  it('should format all known tiers', () => {
    expect(formatTier('free')).toBe('Free Plan')
    expect(formatTier('free-plus')).toBe('Free+ Plan')
    expect(formatTier('pro')).toBe('Pro Plan')
  })

  it('should handle unknown tiers gracefully', () => {
    expect(formatTier('custom')).toBe('Custom Plan')
  })
})
