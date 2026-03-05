/**
 * Trust local dev certificates (e.g., cs.test via Caddy) in development.
 * Without this, fetch() calls from the admin server to the main app
 * fail with "unable to get local issuer certificate" on self-signed certs.
 */
export default defineNitroPlugin(() => {
  if (import.meta.dev) {
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'
  }
})
