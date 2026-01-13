import { render } from '@vue-email/render'
import ConfirmEmail from '../../../components/emails/ConfirmEmail.vue'
import ResetPassword from '../../../components/emails/ResetPassword.vue'

const templates: Record<string, any> = {
  ConfirmEmail,
  ResetPassword,
}

const mockProps: Record<string, any> = {
  ConfirmEmail: {
    name: 'Test User',
    actionUrl: 'https://create.studio/validate-email/test-token',
    productName: 'Create Studio',
    productUrl: 'https://create.studio',
    companyName: 'Mischief Marmot LLC',
    supportEmail: 'support@create.studio',
  },
  ResetPassword: {
    name: 'Test User',
    actionUrl: 'https://create.studio/auth/reset-password/test-token',
    productName: 'Create Studio',
    productUrl: 'https://create.studio',
    companyName: 'Mischief Marmot LLC',
    supportEmail: 'support@create.studio',
  },
}

export default defineEventHandler(async (event) => {
  // Only allow in development
  if (process.env.NODE_ENV === 'production') {
    throw createError({ statusCode: 404, message: 'Not found' })
  }

  const template = getRouterParam(event, 'template')

  if (!template || !templates[template]) {
    throw createError({
      statusCode: 404,
      message: `Template not found. Available: ${Object.keys(templates).join(', ')}`
    })
  }

  const Component = templates[template]
  const props = mockProps[template] || {}

  const html = await render(Component, props, { pretty: true })

  setHeader(event, 'Content-Type', 'text/html')
  return html
})
