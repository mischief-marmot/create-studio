import { describe, it, expect } from 'vitest'

/**
 * Survey max_completions — Unit Tests
 *
 * Tests the pure logic that gates new responses once a survey hits its
 * completion cap, and the computed urgency badge rendered on the public
 * survey page.
 */

// ── Pure functions mirroring the server + UI logic ──────────────────────────

/** Mirrors the spots_remaining computation in GET /api/v2/surveys/:id */
function computeSpotsRemaining(maxCompletions: number | null, completed: number): number | null {
  if (maxCompletions == null) return null
  return Math.max(0, maxCompletions - completed)
}

/** Mirrors the cap enforcement guard on POST/PATCH completion paths */
function isCapReached(maxCompletions: number | null, completed: number): boolean {
  if (maxCompletions == null) return false
  return completed >= maxCompletions
}

/** Mirrors the `spotsRemainingBadge` computed in packages/app/app/pages/survey/[slug].vue */
function computeSpotsBadge(maxCompletions: number | null, spotsRemaining: number | null): { text: string; urgent: boolean; exhausted: boolean } | null {
  if (maxCompletions == null || spotsRemaining == null) return null
  if (spotsRemaining <= 0) return { text: 'All spots taken', urgent: false, exhausted: true }
  const urgentThreshold = Math.max(1, Math.min(10, Math.ceil(maxCompletions * 0.2)))
  const urgent = spotsRemaining <= urgentThreshold
  return {
    text: spotsRemaining === 1 ? 'Only 1 spot left' : `Only ${spotsRemaining} spots left`,
    urgent,
    exhausted: false,
  }
}

// ── spots_remaining computation ──────────────────────────────────────────────

describe('computeSpotsRemaining', () => {
  it('returns null when max_completions is null (unlimited survey)', () => {
    expect(computeSpotsRemaining(null, 0)).toBeNull()
    expect(computeSpotsRemaining(null, 9999)).toBeNull()
  })

  it('returns the full cap when no one has completed yet', () => {
    expect(computeSpotsRemaining(50, 0)).toBe(50)
  })

  it('subtracts completed responses from the cap', () => {
    expect(computeSpotsRemaining(50, 37)).toBe(13)
  })

  it('returns 0 at exactly the cap (no negative counts)', () => {
    expect(computeSpotsRemaining(50, 50)).toBe(0)
  })

  it('clamps to 0 if somehow completions exceeded the cap', () => {
    // Concurrent writes could push completions slightly past the cap; never
    // surface a negative "spots remaining" to the UI.
    expect(computeSpotsRemaining(50, 51)).toBe(0)
  })
})

// ── Cap enforcement ──────────────────────────────────────────────────────────

describe('isCapReached', () => {
  it('never blocks when max_completions is null', () => {
    expect(isCapReached(null, 0)).toBe(false)
    expect(isCapReached(null, 10_000)).toBe(false)
  })

  it('allows submissions below the cap', () => {
    expect(isCapReached(50, 0)).toBe(false)
    expect(isCapReached(50, 49)).toBe(false)
  })

  it('blocks at and above the cap', () => {
    expect(isCapReached(50, 50)).toBe(true)
    expect(isCapReached(50, 51)).toBe(true)
  })
})

// ── Urgency badge ────────────────────────────────────────────────────────────

describe('computeSpotsBadge', () => {
  it('returns null for unlimited surveys', () => {
    expect(computeSpotsBadge(null, null)).toBeNull()
  })

  it('marks exhausted when zero remain', () => {
    const badge = computeSpotsBadge(50, 0)
    expect(badge).toEqual({ text: 'All spots taken', urgent: false, exhausted: true })
  })

  it('uses singular wording for the last spot', () => {
    const badge = computeSpotsBadge(50, 1)
    expect(badge?.text).toBe('Only 1 spot left')
  })

  it('uses plural wording for multiple spots', () => {
    const badge = computeSpotsBadge(50, 13)
    expect(badge?.text).toBe('Only 13 spots left')
  })

  it('flags urgency under the 20% threshold (capped at 10 absolute)', () => {
    // 50-cap: 20% = 10, but threshold is min(10, ceil(50*0.2)) = 10
    expect(computeSpotsBadge(50, 10)?.urgent).toBe(true)
    expect(computeSpotsBadge(50, 11)?.urgent).toBe(false)
  })

  it('caps the urgency threshold at 10 for large surveys', () => {
    // 1000-cap: 20% = 200, but we cap at 10 so huge surveys don't scream "hurry!" with 200 spots open.
    expect(computeSpotsBadge(1000, 10)?.urgent).toBe(true)
    expect(computeSpotsBadge(1000, 11)?.urgent).toBe(false)
  })

  it('keeps the urgency threshold at least 1 for tiny surveys', () => {
    // 3-cap: 20% = 0.6 → ceil = 1 → threshold = 1
    expect(computeSpotsBadge(3, 1)?.urgent).toBe(true)
    expect(computeSpotsBadge(3, 2)?.urgent).toBe(false)
  })
})

// ── Scenario: user's "April-2026 with 50 max, 13 left" example ──────────────

describe('April-2026 scenario', () => {
  it('exposes 13 remaining after 37 completions and flags no urgency yet (threshold is 10)', () => {
    const remaining = computeSpotsRemaining(50, 37)
    expect(remaining).toBe(13)
    const badge = computeSpotsBadge(50, remaining)
    expect(badge).toEqual({ text: 'Only 13 spots left', urgent: false, exhausted: false })
    expect(isCapReached(50, 37)).toBe(false)
  })

  it('flips to urgent once the remaining count hits the 10-spot threshold', () => {
    expect(computeSpotsBadge(50, 10)?.urgent).toBe(true)
    expect(computeSpotsBadge(50, 5)?.urgent).toBe(true)
    expect(computeSpotsBadge(50, 1)?.urgent).toBe(true)
  })

  it('refuses new completions once the cap is hit', () => {
    expect(isCapReached(50, 50)).toBe(true)
    expect(computeSpotsBadge(50, 0)?.exhausted).toBe(true)
  })
})
