import { getAdminEnvironment, setAdminEnvironment, useAdminEnv } from '../../utils/admin-env'
import type { AdminEnvironment } from '../../utils/admin-env'
import { useAdminOpsDb, auditLogs } from '~~/server/utils/admin-ops-db'

/**
 * Response structure for environment endpoints
 */
interface EnvironmentResponse {
  environment: AdminEnvironment
  availableEnvironments: AdminEnvironment[]
  isLocal: boolean
}

/**
 * Valid environment values
 */
const VALID_ENVIRONMENTS: AdminEnvironment[] = ['production', 'preview']

/**
 * POST /api/admin/environment
 * Sets the admin environment and logs the switch
 *
 * Request body:
 * - environment: 'production' | 'preview'
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

  // Parse and validate request body
  const body = await readBody(event)
  const { environment } = body || {}

  if (!environment) {
    throw createError({
      statusCode: 400,
      message: 'Environment is required',
    })
  }

  if (!VALID_ENVIRONMENTS.includes(environment)) {
    throw createError({
      statusCode: 400,
      message: `Invalid environment. Must be one of: ${VALID_ENVIRONMENTS.join(', ')}`,
    })
  }

  // Get previous environment for audit log
  const previousEnvironment = getAdminEnvironment(event)

  // Set the new environment
  setAdminEnvironment(event, environment as AdminEnvironment)

  // Get updated admin env info
  const adminEnv = useAdminEnv(event)

  // Log the environment switch to audit logs
  try {
    const adminOpsDb = useAdminOpsDb(event)
    await adminOpsDb.insert(auditLogs).values({
      admin_id: session.user.id,
      action: 'environment_switched',
      entity_type: 'environment',
      entity_id: null,
      changes: JSON.stringify({
        before: { environment: previousEnvironment },
        after: { environment },
      }),
      ip_address: getRequestIP(event) || null,
      user_agent: getHeader(event, 'user-agent') || null,
      createdAt: new Date().toISOString(),
    })
  } catch (error) {
    // Log the error but don't fail the request
    console.error('Failed to create audit log for environment switch:', error)
  }

  return {
    environment: environment as AdminEnvironment,
    availableEnvironments: VALID_ENVIRONMENTS,
    isLocal: adminEnv.isLocal,
  }
})
