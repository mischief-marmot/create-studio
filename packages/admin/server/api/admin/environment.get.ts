import { useAdminEnv } from '../../utils/admin-env'
import type { AdminEnvironment } from '../../utils/admin-env'

/**
 * Response structure for environment endpoints
 */
interface EnvironmentResponse {
  environment: AdminEnvironment
  availableEnvironments: AdminEnvironment[]
  isLocal: boolean
}

/**
 * GET /api/admin/environment
 * Returns the current admin environment information
 */
export default defineEventHandler(async (event): Promise<EnvironmentResponse> => {
  // Check admin session
  const session = await getUserSession(event)
  if (!session?.user) {
    throw createError({
      statusCode: 401,
      message: 'Unauthorized',
    })
  }

  // Get current environment info
  const adminEnv = useAdminEnv(event)

  // In local/dev mode, only production is available
  // Both environments only available when deployed to Cloudflare
  const availableEnvironments: AdminEnvironment[] = adminEnv.isLocal
    ? ['production']
    : ['production', 'preview']

  return {
    environment: adminEnv.environment,
    availableEnvironments,
    isLocal: adminEnv.isLocal,
  }
})
