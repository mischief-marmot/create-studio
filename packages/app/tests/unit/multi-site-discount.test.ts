import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mockNuxtImport } from '@nuxt/test-utils/runtime'

// Mock useRuntimeConfig before importing stripe utils
mockNuxtImport('useRuntimeConfig', () => () => ({
  stripeSecretKey: 'sk_test_fake',
  stripeMultiSiteCouponId: 'multi_site_50',
  public: { rootUrl: 'http://localhost:3001' },
}))

// Mock Stripe SDK
const mockCreate = vi.fn().mockResolvedValue({ url: 'https://checkout.stripe.com/test' })
vi.mock('stripe', () => {
  const StripeMock = vi.fn().mockImplementation(() => ({
    checkout: { sessions: { create: mockCreate } },
  }))
  StripeMock.createFetchHttpClient = vi.fn()
  return { default: StripeMock }
})

import { createCheckoutSession, getMultiSiteCouponId } from '../../server/utils/stripe'

const baseParams = {
  siteId: 1,
  userId: 1,
  userEmail: 'test@example.com',
  priceId: 'price_test',
  successUrl: 'https://example.com/success',
  cancelUrl: 'https://example.com/cancel',
}

describe('Multi-Site Discount: createCheckoutSession', () => {
  beforeEach(() => {
    mockCreate.mockClear()
  })

  it('should use discounts with coupon when couponId is provided', async () => {
    await createCheckoutSession({ ...baseParams, couponId: 'multi_site_50' })

    const callArgs = mockCreate.mock.calls[0][0]
    expect(callArgs.discounts).toEqual([{ coupon: 'multi_site_50' }])
    expect(callArgs.allow_promotion_codes).toBeUndefined()
  })

  it('should use allow_promotion_codes when no couponId is provided', async () => {
    await createCheckoutSession(baseParams)

    const callArgs = mockCreate.mock.calls[0][0]
    expect(callArgs.allow_promotion_codes).toBe(true)
    expect(callArgs.discounts).toBeUndefined()
  })
})

describe('Multi-Site Discount: getMultiSiteCouponId', () => {
  it('should return coupon ID when user has 1+ active paid subscriptions', () => {
    const couponId = getMultiSiteCouponId(1, 'multi_site_50')
    expect(couponId).toBe('multi_site_50')
  })

  it('should return undefined when user has 0 active paid subscriptions', () => {
    const couponId = getMultiSiteCouponId(0, 'multi_site_50')
    expect(couponId).toBeUndefined()
  })

  it('should return undefined when coupon ID is not configured', () => {
    const couponId = getMultiSiteCouponId(1, '')
    expect(couponId).toBeUndefined()
  })
})
