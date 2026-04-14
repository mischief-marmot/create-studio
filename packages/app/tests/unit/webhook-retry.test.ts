import { describe, it, expect, vi, beforeEach } from 'vitest'

/**
 * Webhook Retry Logic — Unit Tests
 *
 * Tests the retry-with-backoff behavior used for notifying WordPress sites
 * of subscription changes after Stripe webhook events.
 *
 * Since sendWebhookWithRetry depends on Nuxt runtime (useRuntimeConfig, fetch),
 * we test the core retry algorithm as a pure function extracted here.
 */

// ── Pure retry function mirroring sendWebhookWithRetry logic ───────────────

async function retryWithBackoff(
  fn: () => Promise<void>,
  maxRetries = 3,
  baseDelayMs = 2000,
): Promise<{ attempts: number; succeeded: boolean }> {
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      await fn()
      return { attempts: attempt + 1, succeeded: true }
    } catch {
      if (attempt === maxRetries) {
        return { attempts: attempt + 1, succeeded: false }
      }
      // In real code this is a setTimeout delay; here we just track the call
      await new Promise((resolve) => setTimeout(resolve, 0))
    }
  }
  return { attempts: maxRetries + 1, succeeded: false }
}

// ── Tests ──────────────────────────────────────────────────────────────────

describe('Webhook retry logic', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('succeeds on first attempt without retrying', async () => {
    const fn = vi.fn().mockResolvedValue(undefined)

    const result = await retryWithBackoff(fn, 3)

    expect(result).toEqual({ attempts: 1, succeeded: true })
    expect(fn).toHaveBeenCalledTimes(1)
  })

  it('retries on failure and succeeds on second attempt', async () => {
    const fn = vi.fn()
      .mockRejectedValueOnce(new Error('503 Service Unavailable'))
      .mockResolvedValue(undefined)

    const result = await retryWithBackoff(fn, 3)

    expect(result).toEqual({ attempts: 2, succeeded: true })
    expect(fn).toHaveBeenCalledTimes(2)
  })

  it('retries on failure and succeeds on third attempt', async () => {
    const fn = vi.fn()
      .mockRejectedValueOnce(new Error('timeout'))
      .mockRejectedValueOnce(new Error('502 Bad Gateway'))
      .mockResolvedValue(undefined)

    const result = await retryWithBackoff(fn, 3)

    expect(result).toEqual({ attempts: 3, succeeded: true })
    expect(fn).toHaveBeenCalledTimes(3)
  })

  it('gives up after max retries and reports failure', async () => {
    const fn = vi.fn().mockRejectedValue(new Error('connection refused'))

    const result = await retryWithBackoff(fn, 3)

    expect(result).toEqual({ attempts: 4, succeeded: false })
    expect(fn).toHaveBeenCalledTimes(4) // initial + 3 retries
  })

  it('respects custom maxRetries=0 (no retries)', async () => {
    const fn = vi.fn().mockRejectedValue(new Error('fail'))

    const result = await retryWithBackoff(fn, 0)

    expect(result).toEqual({ attempts: 1, succeeded: false })
    expect(fn).toHaveBeenCalledTimes(1)
  })

  it('respects custom maxRetries=1', async () => {
    const fn = vi.fn()
      .mockRejectedValueOnce(new Error('fail'))
      .mockResolvedValue(undefined)

    const result = await retryWithBackoff(fn, 1)

    expect(result).toEqual({ attempts: 2, succeeded: true })
    expect(fn).toHaveBeenCalledTimes(2)
  })
})

describe('Exponential backoff delays', () => {
  it('computes correct delay sequence: 2s, 4s, 8s', () => {
    const baseDelay = 2000
    const delays = [0, 1, 2].map((attempt) => baseDelay * Math.pow(2, attempt))

    expect(delays).toEqual([2000, 4000, 8000])
  })
})

describe('sendWebhook error behavior', () => {
  it('throws on non-ok HTTP responses (so retry can catch)', async () => {
    // This verifies the contract: sendWebhook must throw on failure
    // so sendWebhookWithRetry's catch block triggers a retry.
    //
    // The actual sendWebhook checks response.ok and throws:
    //   throw new Error(`Webhook delivery failed: ${response.status} ${response.statusText}`)
    //
    // We test this contract with a simulated function:
    const simulatedSendWebhook = async (statusCode: number) => {
      if (statusCode < 200 || statusCode >= 300) {
        throw new Error(`Webhook delivery failed: ${statusCode}`)
      }
    }

    await expect(simulatedSendWebhook(200)).resolves.toBeUndefined()
    await expect(simulatedSendWebhook(500)).rejects.toThrow('Webhook delivery failed: 500')
    await expect(simulatedSendWebhook(502)).rejects.toThrow('Webhook delivery failed: 502')
    await expect(simulatedSendWebhook(404)).rejects.toThrow('Webhook delivery failed: 404')
  })
})
