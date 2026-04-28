import { describe, it, expect } from 'vitest'
import {
  computeBackoffMs,
  normalizeInteractiveSettingsForWebhook,
  buildSettingsUpdateEnqueueArgs,
  INTERACTIVE_SETTINGS_KEYS,
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

  it('coerces explicit null interactive_mode_enabled to false (not skipped)', () => {
    // Intentional: null is a "value" the caller chose to send, not the
    // absence of one. Coerce defensively rather than silently no-op'ing
    // — a buggy caller gets explicit `false` (visible to the plugin)
    // instead of "no change" (silent ignore that's hard to debug).
    expect(normalizeInteractiveSettingsForWebhook({ interactive_mode_enabled: null }))
      .toEqual({ interactive_mode_enabled: false })
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

  it('passes a valid interactive_mode_cta_variant through verbatim', () => {
    expect(normalizeInteractiveSettingsForWebhook({
      interactive_mode_cta_variant: 'sticky-bar',
    })).toEqual({
      interactive_mode_cta_variant: 'sticky-bar',
    })
  })

  it('coerces null/non-string interactive_mode_cta_variant to empty string', () => {
    // Same coercion as other string fields — plugin gets '' (clear/use
    // default) instead of a JSON null it might mishandle.
    expect(normalizeInteractiveSettingsForWebhook({
      interactive_mode_cta_variant: null,
    })).toEqual({ interactive_mode_cta_variant: '' })

    expect(normalizeInteractiveSettingsForWebhook({
      interactive_mode_cta_variant: 42 as any,
    })).toEqual({ interactive_mode_cta_variant: '' })
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

/** Pure builder for the enqueue arguments — tests pin the persisted MessageQueue
 *  payload shape that the drain worker eventually delivers to WP. */
describe('buildSettingsUpdateEnqueueArgs', () => {
  it('produces a wordpress_webhook envelope with normalized settings', () => {
    const args = buildSettingsUpdateEnqueueArgs(571, 'https://example.com', {
      interactive_mode_enabled: true,
      interactive_mode_cta_variant: 'sticky-bar',
    })
    expect(args).toEqual({
      type: 'wordpress_webhook',
      payload: {
        siteUrl: 'https://example.com',
        payload: {
          type: 'settings_update',
          data: {
            settings: {
              interactive_mode_enabled: true,
              interactive_mode_cta_variant: 'sticky-bar',
            },
          },
        },
      },
      options: { siteId: 571 },
    })
  })

  it('attaches site_id via options so supersedePendingWebhooksForSite can find this row', () => {
    const args = buildSettingsUpdateEnqueueArgs(42, 'https://example.com', {})
    expect(args.options).toEqual({ siteId: 42 })
  })

  it('strips undefined settings before persisting (avoids spurious `clear` ops on plugin)', () => {
    const args = buildSettingsUpdateEnqueueArgs(1, 'https://example.com', {
      interactive_mode_enabled: undefined,
      interactive_mode_button_text: undefined,
    })
    expect(args.payload).toEqual({
      siteUrl: 'https://example.com',
      payload: {
        type: 'settings_update',
        data: { settings: {} },
      },
    })
  })
})

describe('INTERACTIVE_SETTINGS_KEYS', () => {
  it('lists every field the webhook normalizer handles', () => {
    expect(INTERACTIVE_SETTINGS_KEYS).toEqual([
      'interactive_mode_enabled',
      'interactive_mode_button_text',
      'interactive_mode_cta_variant',
      'interactive_mode_cta_title',
      'interactive_mode_cta_subtitle',
    ])
  })

  it('every key listed is actually processed by normalizeInteractiveSettingsForWebhook', () => {
    // Catches drift: if a key gets added to the constant but the normalizer
    // doesn't handle it, this test fails. Before the round-5 refactor the
    // normalizer had its own hardcoded list and would silently drop new keys.
    const input = Object.fromEntries(
      INTERACTIVE_SETTINGS_KEYS.map(k => [k, k === 'interactive_mode_enabled' ? true : 'value']),
    )
    const out = normalizeInteractiveSettingsForWebhook(input)
    for (const key of INTERACTIVE_SETTINGS_KEYS) {
      expect(key in out, `${key} must be in normalize output`).toBe(true)
    }
  })
})
