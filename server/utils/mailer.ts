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

/**
 * Send email using Postmark
 */
export async function sendMail(envelope: EmailEnvelope): Promise<void> {
  const config = useRuntimeConfig()

  if (!config.postmarkKey) {
    throw new Error('Postmark API key not configured')
  }

  const client = new ServerClient(config.postmarkKey)

  try {
    const fromEmail = envelope.from || config.sendingAddress || 'noreply@example.com'

    if (envelope.templateId && envelope.templateModel) {
      // Send with template
      await client.sendEmailWithTemplate({
        From: fromEmail,
        To: envelope.to,
        TemplateId: envelope.templateId,
        TemplateModel: envelope.templateModel
      })
    } else {
      // Send regular email
      await client.sendEmail({
        From: fromEmail,
        To: envelope.to,
        Subject: envelope.subject,
        HtmlBody: envelope.htmlBody || '',
        TextBody: envelope.textBody || ''
      })
    }

    console.log(`✅ Email sent successfully to ${envelope.to}`)
  } catch (error) {
    console.error('❌ Failed to send email:', error)
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
  const validationUrl = `${baseUrl}/user/validation/${validationToken}`

  // Template ID from the original API (8746393)
  const templateId = 8746393

  const templateModel = {
    validation_url: validationUrl,
    first_name: userData.firstname || 'User',
    last_name: userData.lastname || ''
  }

  await sendMail({
    to: email,
    textBody: `Please validate your email by clicking the following link: ${validationUrl}`,
    subject: 'Please validate your email address',
  })
}