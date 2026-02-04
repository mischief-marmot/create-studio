import { getAdminEnvironment, useAdminEnv } from '../../utils/admin-env'
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
  const environment = getAdminEnvironment(event)
  const adminEnv = useAdminEnv(event)

  return {
    environment,
    availableEnvironments: ['production', 'preview'],
    isLocal: adminEnv.isLocal,
  }
})
