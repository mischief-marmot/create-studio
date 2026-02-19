/**
 * GET /api/v2/webhooks/public-key
 * Returns the RS256 public key used to verify webhook signatures.
 * No auth required — this is a public endpoint.
 */
export default defineEventHandler(() => {
  const { public: publicConfig } = useRuntimeConfig()

  return {
    key: publicConfig.webhookPublicKey,
  }
})
