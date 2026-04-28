import { describe, it, expect } from 'vitest'
import {
  computeBackoffMs,
  normalizeInteractiveSettingsForWebhook,
} from '~~/server/utils/message-queue'

describe('computeBackoffMs', () => {
  it('returns 1 minute after the first failure', () => {
    expect(computeBackoffMs(1)).toBe(60_000)
  })

  it('grows exponentially across scheduled failure counts', () => {
    expect(computeBackoffMs(2)).toBe(5 * 60_000)
    expect(computeBackoffMs(3)).toBe(30 * 60_000)
    expect(computeBackoffMs(4)).toBe(2 * 3600_000)
    expect(computeBackoffMs(5)).toBe(6 * 3600_000)
    expect(computeBackoffMs(6)).toBe(12 * 3600_000)
    expect(computeBackoffMs(7)).toBe(24 * 3600_000)
  })

  it('caps at the last schedule entry for attempts beyond the end', () => {
    expect(computeBackoffMs(8)).toBe(24 * 3600_000)
    expect(computeBackoffMs(20)).toBe(24 * 3600_000)
  })
})

/** Shared coercion used by admin PATCH (via the dispatch internal endpoint)
 *  and customer PATCH. Drift between the two would silently send different
 *  shapes to the plugin — these tests pin the exact contract. */
describe('normalizeInteractiveSettingsForWebhook', () => {
  it('coerces interactive_mode_enabled to a boolean', () => {
    expect(normalizeInteractiveSettingsForWebhook({ interactive_mode_enabled: 1 }))
      .toEqual({ interactive_mode_enabled: true })
    expect(normalizeInteractiveSettingsForWebhook({ interactive_mode_enabled: 0 }))
      .toEqual({ interactive_mode_enabled: false })
    expect(normalizeInteractiveSettingsForWebhook({ interactive_mode_enabled: true }))
      .toEqual({ interactive_mode_enabled: true })
  })

  it('trims string fields and replaces null/non-string with empty string', () => {
    expect(normalizeInteractiveSettingsForWebhook({
      interactive_mode_button_text: '  Try It  ',
      interactive_mode_cta_title: 'Hello',
      interactive_mode_cta_subtitle: null,
    })).toEqual({
      interactive_mode_button_text: 'Try It',
      interactive_mode_cta_title: 'Hello',
      interactive_mode_cta_subtitle: '',
    })
  })

  it('passes interactive_mode_cta_variant through verbatim (validated upstream)', () => {
    expect(normalizeInteractiveSettingsForWebhook({
      interactive_mode_cta_variant: 'sticky-bar',
    })).toEqual({
      interactive_mode_cta_variant: 'sticky-bar',
    })
  })

  it('skips fields whose value is undefined (so callers can spread the destructured body)', () => {
    // Customer PATCH calls this with body fields that may be undefined when
    // not present. They must not appear in the output, otherwise the plugin
    // would receive '' and clear unrelated options.
    expect(normalizeInteractiveSettingsForWebhook({
      interactive_mode_enabled: undefined,
      interactive_mode_button_text: undefined,
      interactive_mode_cta_variant: undefined,
      interactive_mode_cta_title: undefined,
      interactive_mode_cta_subtitle: undefined,
    })).toEqual({})
  })

  it('returns an empty object for an empty input', () => {
    expect(normalizeInteractiveSettingsForWebhook({})).toEqual({})
  })

  it('only includes fields the caller actually provided (partial updates)', () => {
    // Admin form may only edit interactive_mode_enabled — output must not
    // include other fields with empty/false defaults.
    expect(normalizeInteractiveSettingsForWebhook({
      interactive_mode_enabled: true,
    })).toEqual({
      interactive_mode_enabled: true,
    })
  })
})
