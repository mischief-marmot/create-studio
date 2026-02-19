import Stripe from 'stripe'

// Pinned Stripe API version for admin operations.
// Update this when upgrading the stripe package to match the SDK's expected version.
export const ADMIN_STRIPE_API_VERSION = '2024-11-20.acacia'

/**
 * Get a Stripe client instance for admin operations
 */
export function getAdminStripeClient(): Stripe {
  const config = useRuntimeConfig()

  return new Stripe(config.stripeSecretKey, {
    apiVersion: ADMIN_STRIPE_API_VERSION as Stripe.LatestApiVersion,
  })
}
