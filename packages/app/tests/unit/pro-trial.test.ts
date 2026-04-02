import { describe, it, expect } from 'vitest'

/**
 * Pro Trial Feature — Unit Tests
 *
 * Tests the core trial logic extracted from SubscriptionRepository:
 * - getActiveTier() returns 'trial' for trialing subscriptions
 * - hasTrialed() checks has_trialed flag
 * - Trial eligibility logic
 * - Trial extension logic (step validation, duplicate prevention, day calculation)
 * - Metadata column for flexible cohort tracking
 */

// ── Types mirroring the DB schema ──────────────────────────────────────────

interface SubscriptionRecord {
  status: string
  tier: string
  has_trialed: boolean
  trial_end: string | null
  metadata: Record<string, any> | null
  trial_extensions: Record<string, string> | null
}

// ── Pure functions extracted for testability ────────────────────────────────

/** Mirrors SubscriptionRepository.isTrialExpired */
function isTrialExpired(trialEnd: string | null): boolean {
  return !!trialEnd && new Date(trialEnd) <= new Date()
}

/** Determines the effective tier for a subscription (mirrors getActiveTierFromRecord logic) */
function getEffectiveTier(subscription: SubscriptionRecord | null): string {
  if (!subscription) return 'free'
  if (subscription.status === 'active') return subscription.tier
  if (subscription.status === 'trialing') {
    return isTrialExpired(subscription.trial_end) ? 'free' : 'trial'
  }
  return 'free'
}

/** Checks if a site is eligible for a trial */
function isTrialEligible(subscription: SubscriptionRecord | null): { eligible: boolean; reason?: string } {
  if (!subscription) {
    return { eligible: true }
  }

  if (subscription.has_trialed) {
    return { eligible: false, reason: 'Site has already used a trial' }
  }

  if (subscription.status === 'active' || subscription.status === 'trialing') {
    return { eligible: false, reason: 'Site already has an active subscription' }
  }

  return { eligible: true }
}

const ALLOWED_TRIAL_STEPS = [
  'servings_adjustment',
  'unit_conversion',
  'checklists',
  'toolbar_layout',
  'bulk_import',
  'review_management',
  'premium_theme',
] as const

type TrialStep = typeof ALLOWED_TRIAL_STEPS[number]

const MAX_TRIAL_EXTENSIONS = 7

/** Validates and calculates a trial extension */
function calculateTrialExtension(params: {
  step: string
  currentTrialEnd: string
  extensions: Record<string, string> | null
  status: string
}): { success: boolean; error?: string; newTrialEnd?: string } {
  const { step, currentTrialEnd, extensions, status } = params

  if (status !== 'trialing') {
    return { success: false, error: 'No active trial' }
  }

  if (!ALLOWED_TRIAL_STEPS.includes(step as TrialStep)) {
    return { success: false, error: 'Invalid step' }
  }

  const currentExtensions = extensions || {}

  if (currentExtensions[step]) {
    return { success: false, error: 'Step already redeemed' }
  }

  const extensionCount = Object.keys(currentExtensions).length
  if (extensionCount >= MAX_TRIAL_EXTENSIONS) {
    return { success: false, error: 'Maximum extensions reached' }
  }

  // Add 1 day to current trial end
  const trialEndDate = new Date(currentTrialEnd)
  trialEndDate.setDate(trialEndDate.getDate() + 1)
  const newTrialEnd = trialEndDate.toISOString()

  return { success: true, newTrialEnd }
}

/** Computes trial info from a subscription */
function getTrialInfo(subscription: SubscriptionRecord | null) {
  if (!subscription || !subscription.trial_end) {
    return { isTrialing: false, daysRemaining: 0, trialEnd: null, extensionsUsed: 0 }
  }

  const now = new Date()
  const trialEnd = new Date(subscription.trial_end)
  const daysRemaining = Math.max(0, Math.ceil((trialEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)))

  // If status is trialing but trial_end has passed, treat as not trialing
  const isTrialing = subscription.status === 'trialing' && daysRemaining > 0

  return {
    isTrialing,
    daysRemaining,
    trialEnd: subscription.trial_end,
    extensionsUsed: Object.keys(subscription.trial_extensions || {}).length,
  }
}

// ── Tests ──────────────────────────────────────────────────────────────────

describe('Pro Trial: getEffectiveTier', () => {
  it('returns "free" when no subscription exists', () => {
    expect(getEffectiveTier(null)).toBe('free')
  })

  it('returns "trial" when status is trialing (regardless of stored tier)', () => {
    const futureDate = new Date()
    futureDate.setDate(futureDate.getDate() + 7)
    const sub: SubscriptionRecord = {
      status: 'trialing',
      tier: 'pro',
      has_trialed: true,
      trial_end: futureDate.toISOString(),
      metadata: null,
      trial_extensions: null,
    }
    expect(getEffectiveTier(sub)).toBe('trial')
  })

  it('returns stored tier when status is active', () => {
    const sub: SubscriptionRecord = {
      status: 'active',
      tier: 'pro',
      has_trialed: true,
      trial_end: null,
      metadata: null,
      trial_extensions: null,
    }
    expect(getEffectiveTier(sub)).toBe('pro')
  })

  it('returns "free" for canceled subscriptions', () => {
    const sub: SubscriptionRecord = {
      status: 'canceled',
      tier: 'pro',
      has_trialed: true,
      trial_end: null,
      metadata: null,
      trial_extensions: null,
    }
    expect(getEffectiveTier(sub)).toBe('free')
  })

  it('returns "free" for past_due subscriptions', () => {
    const sub: SubscriptionRecord = {
      status: 'past_due',
      tier: 'pro',
      has_trialed: false,
      trial_end: null,
      metadata: null,
      trial_extensions: null,
    }
    expect(getEffectiveTier(sub)).toBe('free')
  })

  it('returns "free" when status is trialing but trial_end has passed', () => {
    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)
    const sub: SubscriptionRecord = {
      status: 'trialing',
      tier: 'pro',
      has_trialed: true,
      trial_end: yesterday.toISOString(),
      metadata: null,
      trial_extensions: null,
    }
    expect(getEffectiveTier(sub)).toBe('free')
  })

  it('returns "trial" when status is trialing and trial_end is in the future', () => {
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 7)
    const sub: SubscriptionRecord = {
      status: 'trialing',
      tier: 'pro',
      has_trialed: true,
      trial_end: tomorrow.toISOString(),
      metadata: null,
      trial_extensions: null,
    }
    expect(getEffectiveTier(sub)).toBe('trial')
  })

  it('returns "free" when status is trialing and trial_end is exactly now', () => {
    const sub: SubscriptionRecord = {
      status: 'trialing',
      tier: 'pro',
      has_trialed: true,
      trial_end: new Date().toISOString(),
      metadata: null,
      trial_extensions: null,
    }
    expect(getEffectiveTier(sub)).toBe('free')
  })
})

describe('Pro Trial: isTrialEligible', () => {
  it('returns eligible when no subscription exists', () => {
    expect(isTrialEligible(null)).toEqual({ eligible: true })
  })

  it('returns ineligible when has_trialed is true', () => {
    const sub: SubscriptionRecord = {
      status: 'free',
      tier: 'free',
      has_trialed: true,
      trial_end: null,
      metadata: null,
      trial_extensions: null,
    }
    const result = isTrialEligible(sub)
    expect(result.eligible).toBe(false)
    expect(result.reason).toContain('already used a trial')
  })

  it('returns ineligible when subscription is active', () => {
    const sub: SubscriptionRecord = {
      status: 'active',
      tier: 'pro',
      has_trialed: false,
      trial_end: null,
      metadata: null,
      trial_extensions: null,
    }
    const result = isTrialEligible(sub)
    expect(result.eligible).toBe(false)
    expect(result.reason).toContain('active subscription')
  })

  it('returns ineligible when already trialing', () => {
    const sub: SubscriptionRecord = {
      status: 'trialing',
      tier: 'pro',
      has_trialed: false,
      trial_end: null,
      metadata: null,
      trial_extensions: null,
    }
    const result = isTrialEligible(sub)
    expect(result.eligible).toBe(false)
  })

  it('returns eligible for free subscription that has never trialed', () => {
    const sub: SubscriptionRecord = {
      status: 'free',
      tier: 'free',
      has_trialed: false,
      trial_end: null,
      metadata: null,
      trial_extensions: null,
    }
    expect(isTrialEligible(sub)).toEqual({ eligible: true })
  })

  it('returns eligible for canceled subscription that has never trialed', () => {
    const sub: SubscriptionRecord = {
      status: 'canceled',
      tier: 'free',
      has_trialed: false,
      trial_end: null,
      metadata: null,
      trial_extensions: null,
    }
    expect(isTrialEligible(sub)).toEqual({ eligible: true })
  })
})

describe('Pro Trial: calculateTrialExtension', () => {
  const baseTrialEnd = '2026-03-23T00:00:00.000Z'

  it('adds 1 day for valid step', () => {
    const result = calculateTrialExtension({
      step: 'servings_adjustment',
      currentTrialEnd: baseTrialEnd,
      extensions: null,
      status: 'trialing',
    })
    expect(result.success).toBe(true)
    expect(result.newTrialEnd).toBe('2026-03-24T00:00:00.000Z')
  })

  it('rejects invalid step names', () => {
    const result = calculateTrialExtension({
      step: 'invalid_step',
      currentTrialEnd: baseTrialEnd,
      extensions: null,
      status: 'trialing',
    })
    expect(result.success).toBe(false)
    expect(result.error).toBe('Invalid step')
  })

  it('rejects duplicate step redemption', () => {
    const result = calculateTrialExtension({
      step: 'servings_adjustment',
      currentTrialEnd: baseTrialEnd,
      extensions: { servings_adjustment: '2026-03-10T00:00:00.000Z' },
      status: 'trialing',
    })
    expect(result.success).toBe(false)
    expect(result.error).toBe('Step already redeemed')
  })

  it('rejects when not trialing', () => {
    const result = calculateTrialExtension({
      step: 'servings_adjustment',
      currentTrialEnd: baseTrialEnd,
      extensions: null,
      status: 'active',
    })
    expect(result.success).toBe(false)
    expect(result.error).toBe('No active trial')
  })

  it('rejects when max extensions reached', () => {
    const allExtensions: Record<string, string> = {}
    ALLOWED_TRIAL_STEPS.forEach(step => {
      allExtensions[step] = '2026-03-10T00:00:00.000Z'
    })

    const result = calculateTrialExtension({
      step: 'servings_adjustment', // already in there
      currentTrialEnd: baseTrialEnd,
      extensions: allExtensions,
      status: 'trialing',
    })
    expect(result.success).toBe(false)
  })

  it('allows all 7 steps to be redeemed sequentially', () => {
    const extensions: Record<string, string> = {}
    let trialEnd = baseTrialEnd

    for (const step of ALLOWED_TRIAL_STEPS) {
      const result = calculateTrialExtension({
        step,
        currentTrialEnd: trialEnd,
        extensions: { ...extensions },
        status: 'trialing',
      })
      expect(result.success).toBe(true)
      trialEnd = result.newTrialEnd!
      extensions[step] = new Date().toISOString()
    }

    // Trial should be extended by 7 days total
    const originalEnd = new Date(baseTrialEnd)
    const finalEnd = new Date(trialEnd)
    const daysDiff = (finalEnd.getTime() - originalEnd.getTime()) / (1000 * 60 * 60 * 24)
    expect(daysDiff).toBe(7)
  })
})

describe('Pro Trial: getTrialInfo', () => {
  it('returns default values when no subscription', () => {
    const info = getTrialInfo(null)
    expect(info.isTrialing).toBe(false)
    expect(info.daysRemaining).toBe(0)
    expect(info.trialEnd).toBeNull()
    expect(info.extensionsUsed).toBe(0)
  })

  it('computes days remaining correctly', () => {
    const futureDate = new Date()
    futureDate.setDate(futureDate.getDate() + 10)

    const sub: SubscriptionRecord = {
      status: 'trialing',
      tier: 'pro',
      has_trialed: true,
      trial_end: futureDate.toISOString(),
      metadata: null,
      trial_extensions: { servings_adjustment: '2026-03-10T00:00:00.000Z' },
    }

    const info = getTrialInfo(sub)
    expect(info.isTrialing).toBe(true)
    expect(info.daysRemaining).toBe(10)
    expect(info.extensionsUsed).toBe(1)
  })

  it('returns 0 days remaining when trial has expired', () => {
    const pastDate = new Date()
    pastDate.setDate(pastDate.getDate() - 2)

    const sub: SubscriptionRecord = {
      status: 'trialing',
      tier: 'pro',
      has_trialed: true,
      trial_end: pastDate.toISOString(),
      metadata: null,
      trial_extensions: null,
    }

    const info = getTrialInfo(sub)
    expect(info.daysRemaining).toBe(0)
  })

  it('returns isTrialing=false when trial_end has passed even if status is trialing', () => {
    const pastDate = new Date()
    pastDate.setDate(pastDate.getDate() - 2)

    const sub: SubscriptionRecord = {
      status: 'trialing',
      tier: 'pro',
      has_trialed: true,
      trial_end: pastDate.toISOString(),
      metadata: null,
      trial_extensions: null,
    }

    const info = getTrialInfo(sub)
    expect(info.isTrialing).toBe(false)
    expect(info.daysRemaining).toBe(0)
  })
})

describe('Pro Trial: Metadata column for cohorts', () => {
  it('stores trial cohort in metadata', () => {
    const metadata: Record<string, any> = { trial_cohort: 'a' }
    expect(metadata.trial_cohort).toBe('a')
  })

  it('supports multiple cohorts without schema changes', () => {
    const metadata: Record<string, any> = {
      trial_cohort: 'b',
      messaging_cohort: 'a',
      onboarding_variant: 'v2',
    }
    expect(metadata.trial_cohort).toBe('b')
    expect(metadata.messaging_cohort).toBe('a')
    expect(metadata.onboarding_variant).toBe('v2')
  })

  it('defaults to null when no metadata set', () => {
    const sub: SubscriptionRecord = {
      status: 'free',
      tier: 'free',
      has_trialed: false,
      trial_end: null,
      metadata: null,
      trial_extensions: null,
    }
    expect(sub.metadata).toBeNull()
  })
})

describe('Pro Trial: A/B group assignment', () => {
  function assignTrialCohort(): 'a' | 'b' {
    return Math.random() < 0.5 ? 'a' : 'b'
  }

  it('returns either "a" or "b"', () => {
    const result = assignTrialCohort()
    expect(['a', 'b']).toContain(result)
  })

  it('determines payment method collection from cohort', () => {
    const getPaymentMethodCollection = (cohort: string) =>
      cohort === 'a' ? 'always' : 'if_required'

    expect(getPaymentMethodCollection('a')).toBe('always')
    expect(getPaymentMethodCollection('b')).toBe('if_required')
  })
})

describe('Pro Trial: Stripe checkout trial params', () => {
  function getTrialEndTimestamp(days: number): number {
    return Math.floor(Date.now() / 1000) + (days * 86400) + 3600
  }

  function buildTrialParams(options: { trial: boolean; cohort?: string }) {
    if (!options.trial) return {}

    const trialEnd = getTrialEndTimestamp(14)
    const cohort = options.cohort || (Math.random() < 0.5 ? 'a' : 'b')

    return {
      subscription_data: {
        trial_end: trialEnd,
        metadata: { trial_cohort: cohort },
      },
      payment_method_collection: cohort === 'a' ? 'always' as const : 'if_required' as const,
    }
  }

  it('returns empty object when trial is false', () => {
    expect(buildTrialParams({ trial: false })).toEqual({})
  })

  it('sets trial_end to 14 days + 1 hour from now', () => {
    const params = buildTrialParams({ trial: true, cohort: 'a' })
    const trialEnd = params.subscription_data!.trial_end
    const expected = Math.floor(Date.now() / 1000) + (14 * 86400) + 3600
    // Allow 5 seconds of clock drift
    expect(trialEnd).toBeGreaterThanOrEqual(expected - 5)
    expect(trialEnd).toBeLessThanOrEqual(expected + 5)
  })

  it('sets payment_method_collection based on cohort', () => {
    const paramsA = buildTrialParams({ trial: true, cohort: 'a' })
    expect(paramsA.payment_method_collection).toBe('always')

    const paramsB = buildTrialParams({ trial: true, cohort: 'b' })
    expect(paramsB.payment_method_collection).toBe('if_required')
  })
})

describe('Pro Trial: Webhook payload enhancement', () => {
  function buildWebhookPayload(subscription: SubscriptionRecord) {
    const effectiveTier = getEffectiveTier(subscription)
    const trialInfo = getTrialInfo(subscription)

    return {
      type: 'subscription_change',
      data: {
        tier: effectiveTier,
        is_trialing: trialInfo.isTrialing,
        trial_days_remaining: trialInfo.daysRemaining,
        trial_end: trialInfo.trialEnd,
      },
    }
  }

  it('includes trial info for trialing subscriptions', () => {
    const futureDate = new Date()
    futureDate.setDate(futureDate.getDate() + 14)

    const sub: SubscriptionRecord = {
      status: 'trialing',
      tier: 'pro',
      has_trialed: true,
      trial_end: futureDate.toISOString(),
      metadata: { trial_cohort: 'a' },
      trial_extensions: null,
    }

    const payload = buildWebhookPayload(sub)
    expect(payload.data.tier).toBe('trial')
    expect(payload.data.is_trialing).toBe(true)
    expect(payload.data.trial_days_remaining).toBe(14)
    expect(payload.data.trial_end).toBe(futureDate.toISOString())
  })

  it('shows no trial info for active subscriptions', () => {
    const sub: SubscriptionRecord = {
      status: 'active',
      tier: 'pro',
      has_trialed: true,
      trial_end: null,
      metadata: null,
      trial_extensions: null,
    }

    const payload = buildWebhookPayload(sub)
    expect(payload.data.tier).toBe('pro')
    expect(payload.data.is_trialing).toBe(false)
    expect(payload.data.trial_days_remaining).toBe(0)
  })
})

// ── Reconciliation logic ─────────────────────────────────────────────────

/** Determines whether a subscription needs trial reconciliation (mirrors reconcileExpiredTrial logic) */
function shouldReconcileExpiredTrial(subscription: SubscriptionRecord | null): boolean {
  return !!subscription
    && subscription.status === 'trialing'
    && isTrialExpired(subscription.trial_end)
}

describe('Pro Trial: reconcileExpiredTrial', () => {
  it('returns false when no subscription', () => {
    expect(shouldReconcileExpiredTrial(null)).toBe(false)
  })

  it('returns false when subscription is active (not trialing)', () => {
    const sub: SubscriptionRecord = {
      status: 'active',
      tier: 'pro',
      has_trialed: true,
      trial_end: null,
      metadata: null,
      trial_extensions: null,
    }
    expect(shouldReconcileExpiredTrial(sub)).toBe(false)
  })

  it('returns false when trialing but trial_end is in the future', () => {
    const future = new Date()
    future.setDate(future.getDate() + 5)
    const sub: SubscriptionRecord = {
      status: 'trialing',
      tier: 'pro',
      has_trialed: true,
      trial_end: future.toISOString(),
      metadata: null,
      trial_extensions: null,
    }
    expect(shouldReconcileExpiredTrial(sub)).toBe(false)
  })

  it('returns true when trialing and trial_end has passed', () => {
    const past = new Date()
    past.setDate(past.getDate() - 1)
    const sub: SubscriptionRecord = {
      status: 'trialing',
      tier: 'pro',
      has_trialed: true,
      trial_end: past.toISOString(),
      metadata: null,
      trial_extensions: null,
    }
    expect(shouldReconcileExpiredTrial(sub)).toBe(true)
  })

  it('returns false when trialing with no trial_end set', () => {
    const sub: SubscriptionRecord = {
      status: 'trialing',
      tier: 'pro',
      has_trialed: true,
      trial_end: null,
      metadata: null,
      trial_extensions: null,
    }
    expect(shouldReconcileExpiredTrial(sub)).toBe(false)
  })

  it('after reconciliation, getEffectiveTier returns free', () => {
    const past = new Date()
    past.setDate(past.getDate() - 1)
    const sub: SubscriptionRecord = {
      status: 'trialing',
      tier: 'pro',
      has_trialed: true,
      trial_end: past.toISOString(),
      metadata: null,
      trial_extensions: null,
    }

    // Before reconciliation, getEffectiveTier already returns 'free' defensively
    expect(getEffectiveTier(sub)).toBe('free')

    // Simulate what reconcileExpiredTrial does to the DB record
    if (shouldReconcileExpiredTrial(sub)) {
      sub.status = 'expired'
      sub.tier = 'free'
    }

    // After reconciliation, the DB record itself now says expired
    expect(sub.status).toBe('expired')
    expect(sub.tier).toBe('free')
    expect(getEffectiveTier(sub)).toBe('free')
  })
})
