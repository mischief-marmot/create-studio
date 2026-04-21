/**
 * Shared auth guard for internal endpoints called by the admin app.
 *
 * The admin app passes a shared secret via the X-Admin-Api-Key header; the
 * value must match `runtimeConfig.adminApiKey`. Throws a 401 H3 error on
 * mismatch or missing config.
 */

import type { H3Event } from 'h3'

export function requireAdminApiKey(event: H3Event): void {
  const config = useRuntimeConfig()
  const provided = getHeader(event, 'X-Admin-Api-Key')
  if (!provided || !config.adminApiKey || provided !== config.adminApiKey) {
    throw createError({ statusCode: 401, message: 'Unauthorized' })
  }
}
