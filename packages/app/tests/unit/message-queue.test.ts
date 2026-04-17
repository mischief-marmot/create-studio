import { describe, it, expect } from 'vitest'
import { computeBackoffMs } from '~~/server/utils/message-queue'

describe('computeBackoffMs', () => {
  it('returns 1 minute for the first attempt', () => {
    expect(computeBackoffMs(0)).toBe(60_000)
  })

  it('grows exponentially across scheduled steps', () => {
    expect(computeBackoffMs(1)).toBe(5 * 60_000)
    expect(computeBackoffMs(2)).toBe(30 * 60_000)
    expect(computeBackoffMs(3)).toBe(2 * 3600_000)
    expect(computeBackoffMs(4)).toBe(6 * 3600_000)
    expect(computeBackoffMs(5)).toBe(12 * 3600_000)
    expect(computeBackoffMs(6)).toBe(24 * 3600_000)
  })

  it('caps at the last schedule entry for attempts beyond the end', () => {
    expect(computeBackoffMs(7)).toBe(24 * 3600_000)
    expect(computeBackoffMs(20)).toBe(24 * 3600_000)
  })
})
