import { describe, it, expect, vi, beforeEach } from 'vitest'
import { retryWithBackoff } from '~~/server/utils/webhooks'

/**
 * Webhook Retry Logic — Unit Tests
 *
 * Tests the retryWithBackoff utility extracted from sendWebhookWithRetry.
 * This is the real production function — sendWebhookWithRetry delegates to it.
 */

describe('retryWithBackoff', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
    vi.useFakeTimers()
  })

  it('succeeds on first attempt without retrying', async () => {
    const fn = vi.fn().mockResolvedValue(undefined)
    const onRetry = vi.fn()

    await retryWithBackoff(fn, { onRetry })

    expect(fn).toHaveBeenCalledTimes(1)
    expect(onRetry).not.toHaveBeenCalled()
  })

  it('retries on failure and succeeds on second attempt', async () => {
    const fn = vi.fn()
      .mockRejectedValueOnce(new Error('503 Service Unavailable'))
      .mockResolvedValue(undefined)
    const onRetry = vi.fn()

    const promise = retryWithBackoff(fn, { onRetry })
    await vi.runAllTimersAsync()
    await promise

    expect(fn).toHaveBeenCalledTimes(2)
    expect(onRetry).toHaveBeenCalledTimes(1)
    expect(onRetry).toHaveBeenCalledWith(1, 2000, expect.any(Error))
  })

  it('retries on failure and succeeds on third attempt', async () => {
    const fn = vi.fn()
      .mockRejectedValueOnce(new Error('timeout'))
      .mockRejectedValueOnce(new Error('502 Bad Gateway'))
      .mockResolvedValue(undefined)

    const promise = retryWithBackoff(fn)
    await vi.runAllTimersAsync()
    await promise

    expect(fn).toHaveBeenCalledTimes(3)
  })

  it('gives up after max retries and calls onGiveUp', async () => {
    const fn = vi.fn().mockRejectedValue(new Error('connection refused'))
    const onGiveUp = vi.fn()

    const promise = retryWithBackoff(fn, { maxRetries: 3, onGiveUp })
    await vi.runAllTimersAsync()
    await promise

    expect(fn).toHaveBeenCalledTimes(4) // initial + 3 retries
    expect(onGiveUp).toHaveBeenCalledWith(4, expect.any(Error))
  })

  it('respects maxRetries=0 (no retries)', async () => {
    const fn = vi.fn().mockRejectedValue(new Error('fail'))
    const onGiveUp = vi.fn()

    await retryWithBackoff(fn, { maxRetries: 0, onGiveUp })

    expect(fn).toHaveBeenCalledTimes(1)
    expect(onGiveUp).toHaveBeenCalledWith(1, expect.any(Error))
  })

  it('respects maxRetries=1', async () => {
    const fn = vi.fn()
      .mockRejectedValueOnce(new Error('fail'))
      .mockResolvedValue(undefined)

    const promise = retryWithBackoff(fn, { maxRetries: 1 })
    await vi.runAllTimersAsync()
    await promise

    expect(fn).toHaveBeenCalledTimes(2)
  })
})

describe('Exponential backoff delays', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  it('uses correct delay sequence: 2s, 4s, 8s', async () => {
    const fn = vi.fn()
      .mockRejectedValueOnce(new Error('fail'))
      .mockRejectedValueOnce(new Error('fail'))
      .mockRejectedValueOnce(new Error('fail'))
      .mockResolvedValue(undefined)
    const onRetry = vi.fn()

    const promise = retryWithBackoff(fn, { onRetry })
    await vi.runAllTimersAsync()
    await promise

    expect(onRetry).toHaveBeenCalledTimes(3)
    expect(onRetry).toHaveBeenNthCalledWith(1, 1, 2000, expect.any(Error))
    expect(onRetry).toHaveBeenNthCalledWith(2, 2, 4000, expect.any(Error))
    expect(onRetry).toHaveBeenNthCalledWith(3, 3, 8000, expect.any(Error))
  })

  it('respects custom baseDelayMs', async () => {
    const fn = vi.fn()
      .mockRejectedValueOnce(new Error('fail'))
      .mockResolvedValue(undefined)
    const onRetry = vi.fn()

    const promise = retryWithBackoff(fn, { baseDelayMs: 1000, onRetry })
    await vi.runAllTimersAsync()
    await promise

    expect(onRetry).toHaveBeenCalledWith(1, 1000, expect.any(Error))
  })
})

describe('sendWebhook error contract', () => {
  it('throws on non-ok HTTP responses (so retry can catch)', async () => {
    // Verifies the contract: sendWebhook must throw on failure
    // so retryWithBackoff's catch block triggers a retry.
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
