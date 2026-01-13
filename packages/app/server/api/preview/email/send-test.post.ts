import { sendValidationEmail } from '../../../utils/mailer'

export default defineEventHandler(async (event) => {
  // Only allow in development
  if (process.env.NODE_ENV === 'production') {
    throw createError({ statusCode: 404, message: 'Not found' })
  }

  const body = await readBody(event)
  const { email, name } = body

  if (!email) {
    throw createError({ statusCode: 400, message: 'Email required' })
  }

  await sendValidationEmail(email, 'test-token-' + Date.now(), {
    firstname: name || 'Test User',
  })

  return { success: true, message: `Confirmation email sent to ${email}` }
})
