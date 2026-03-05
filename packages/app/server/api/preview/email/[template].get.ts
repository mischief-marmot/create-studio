import { render } from '@vue-email/render'
import ConfirmEmail from '../../../components/emails/ConfirmEmail.vue'
import ResetPassword from '../../../components/emails/ResetPassword.vue'
import ReleaseNotesEmail from '../../../components/emails/ReleaseNotesEmail.vue'

const templates: Record<string, any> = {
  ConfirmEmail,
  ResetPassword,
  ReleaseNotesEmail,
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
  ReleaseNotesEmail: {
    title: 'New Recipe Card Designer & Performance Boost',
    version: '2.1.0',
    product: 'Create Plugin',
    description: 'This release brings a redesigned recipe card editor, faster load times, and several quality-of-life improvements.',
    highlights: [
      { title: 'Recipe Card Designer', description: 'Completely redesigned visual editor', type: 'feature' },
      { title: 'Performance', description: '40% faster page load times', type: 'enhancement' },
      { title: 'Schema validation', description: 'Fixed edge case with nested FAQ items', type: 'fix' },
    ],
    releaseUrl: 'https://create.studio/releases/create-plugin-2-1-0',
    unsubscribeUrl: '#',
    productName: 'Create Studio',
    productUrl: 'https://create.studio',
    companyName: 'Mischief Marmot LLC',
  },
}

export default defineEventHandler(async (event) => {
  // TODO: Add authentication check before going to production

  const template = getRouterParam(event, 'template')

  if (!template || !templates[template]) {
    throw createError({
      statusCode: 404,
      message: `Template not found. Available: ${Object.keys(templates).join(', ')}`
    })
  }

  const Component = templates[template]
  const query = getQuery(event)

  // Allow overriding props via query params (used by admin preview)
  let props = { ...mockProps[template] }
  if (query.props) {
    try {
      const overrides = JSON.parse(query.props as string)
      props = { ...props, ...overrides }
    }
    catch {
      // ignore malformed JSON, fall back to defaults
    }
  }

  const html = await render(Component, props, { pretty: true })

  setHeader(event, 'Content-Type', 'text/html; charset=utf-8')
  return html
})
