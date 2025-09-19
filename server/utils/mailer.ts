import { ServerClient } from 'postmark'

/**
 * Email service for sending validation emails and other notifications
 */

export interface EmailEnvelope {
  to: string
  from?: string
  subject: string
  htmlBody?: string
  textBody?: string
  templateId?: number
  templateModel?: any
}

const config = useRuntimeConfig()
const logger = useLogger('CS:Mailer', config.debug);

/**
 * Send email using Postmark
 */
export async function sendMail(envelope: EmailEnvelope): Promise<void> {
  

  if (!config.postmarkKey) {
    logger.error('Postmark API key not configured')
    throw new Error('Postmark API key not configured')
  }
  const client = new ServerClient(config.postmarkKey)

  try {
    const fromEmail = envelope.from || config.sendingAddress || 'noreply@mischiefmarmot.com'

    if (envelope.templateId && envelope.templateModel) {
      logger.info('Sending email with template', { envelope });
      // Send with template
      await client.sendEmailWithTemplate({
        From: fromEmail,
        To: envelope.to,
        TemplateId: envelope.templateId,
        TemplateModel: envelope.templateModel
      })
    } else {
      logger.info('Sending regular email', { envelope });
      // Send regular email
      await client.sendEmail({
        From: fromEmail,
        To: envelope.to,
        Subject: envelope.subject,
        HtmlBody: envelope.htmlBody || '',
        TextBody: envelope.textBody || ''
      })
    }
    logger.success(`Email sent successfully to ${envelope.to}`)
  } catch (error) {
    logger.error('Failed to send email:', error)
    throw new Error('Failed to send email')
  }
}

/**
 * Send email validation email
 */
export async function sendValidationEmail(
  email: string,
  validationToken: string,
  userData: { firstname?: string; lastname?: string }
): Promise<void> {
  const config = useRuntimeConfig()
  const baseUrl = config.rootUrl || 'http://localhost:3001'
  const validationUrl = `${baseUrl}/users/validate-email/${validationToken}`

  const templateId = 41539864

  const templateModel = {
    action_url: validationUrl,
    name: userData.firstname || 'Friend',
    product_name: 'Create Studio',
    company_name: 'Mischief Marmot LLC',
    company_address: config.public.supportEmail || 'support@mischiefmarmot.com'
  }
  if (config.postmarkKey && templateId) {
    await sendMail({
      to: email,
      subject: 'Please validate your email address',
      templateId,
      templateModel
    })
    return
  }
  await sendMail({
    to: email,
    textBody: `Please validate your email by clicking the following link: ${validationUrl}`,
    subject: 'Please validate your email address',
  })
}