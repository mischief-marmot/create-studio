import { eq } from 'drizzle-orm'
import bcrypt from 'bcrypt'
import { admins, auditLogs } from "~~/server/utils/db"

export default defineEventHandler(async (event) => {
  const db = hubDatabase()
  const config = useRuntimeConfig()

  // Parse request body
  const body = await readBody(event)
  const { email, password } = body

  // Validate input
  if (!email || !password) {
    throw createError({
      statusCode: 400,
      message: 'Email and password are required',
    })
  }

  // Find admin by email
  const [admin] = await db
    .select()
    .from(admins)
    .where(eq(admins.email, email))
    .limit(1)

  // Check if admin exists
  if (!admin) {
    throw createError({
      statusCode: 401,
      message: 'Invalid email or password',
    })
  }

  // Compare password with hashed password
  const isValidPassword = await bcrypt.compare(password, admin.password)

  if (!isValidPassword) {
    throw createError({
      statusCode: 401,
      message: 'Invalid email or password',
    })
  }

  // Update last_login timestamp
  await db
    .update(admins)
    .set({
      last_login: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    })
    .where(eq(admins.id, admin.id))

  // Get request metadata for audit logging
  const headers = getHeaders(event)
  const ipAddress = headers['x-forwarded-for'] || headers['x-real-ip'] || 'unknown'
  const userAgent = headers['user-agent'] || 'unknown'

  // Create audit log entry
  await db.insert(auditLogs).values({
    admin_id: admin.id,
    action: 'login',
    entity_type: 'admin',
    entity_id: admin.id,
    ip_address: Array.isArray(ipAddress) ? ipAddress[0] : ipAddress,
    user_agent: Array.isArray(userAgent) ? userAgent[0] : userAgent,
    createdAt: new Date().toISOString(),
  })

  // Create session
  await setUserSession(event, {
    user: {
      id: admin.id,
      email: admin.email,
      role: admin.role,
      firstname: admin.firstname,
      lastname: admin.lastname,
    },
  }, {
    password: config.adminSessionPassword,
  })

  // Return admin info (without password)
  return {
    id: admin.id,
    email: admin.email,
    role: admin.role,
    firstname: admin.firstname,
    lastname: admin.lastname,
  }
})
