import { useLogger } from '@create-studio/shared/utils/logger'
import { ServerClient } from "postmark";
import { render } from "@vue-email/render";
import ConfirmEmail from "~/components/emails/ConfirmEmail.vue";
import ResetPassword from "~/components/emails/ResetPassword.vue";

/**
 * Email service for sending validation emails and other notifications
 */

export interface EmailEnvelope {
  to: string;
  from?: string;
  subject: string;
  htmlBody?: string;
  textBody?: string;
  templateId?: number;
  templateModel?: any;
}

/**
 * Send email using Postmark
 */
export async function sendMail(envelope: EmailEnvelope): Promise<void> {
  const config = useRuntimeConfig();
  const logger = useLogger("Mailer", config.debug);

  if (!config.postmarkKey) {
    logger.error("Postmark API key not configured");
    throw new Error("Postmark API key not configured");
  }
  const client = new ServerClient(config.postmarkKey);

  try {
    const fromEmail =
      envelope.from || config.sendingAddress || "noreply@mischiefmarmot.com";

    if (envelope.templateId && envelope.templateModel) {
      logger.info("Sending email with template", { envelope });
      // Send with template
      await client.sendEmailWithTemplate({
        From: fromEmail,
        To: envelope.to,
        TemplateId: envelope.templateId,
        TemplateModel: envelope.templateModel,
      });
    } else {
      let { to, from, subject, ...rest } = envelope
      logger.info("Sending regular email", { to, from, subject});
      // Send regular email
      await client.sendEmail({
        From: fromEmail,
        To: envelope.to,
        Subject: envelope.subject,
        HtmlBody: envelope.htmlBody || "",
        TextBody: envelope.textBody || "",
      });
    }
    logger.success(`Email sent successfully to ${envelope.to}`);
  } catch (error) {
    logger.error("Failed to send email:", error);
    throw new Error("Failed to send email");
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
  const config = useRuntimeConfig();
  const baseUrl = config.public.rootUrl || "https://create.studio";
  const validationUrl = `${baseUrl}/users/validate-email/${validationToken}`;
  const fromEmail = config.sendingAddress

  const templateModel = {
    actionUrl: validationUrl,
    name: userData.firstname || "Friend",
    productName: config.public.productName || "Create Studio",
    companyName: config.public.companyName || "Mischief Marmot LLC",
    supportEmail: config.public.supportEmail || "support@mischiefmarmot.com",
  };
  await sendMail({
    to: email,
    from: fromEmail,
    subject: "Please validate your email address",
    htmlBody: await render(ConfirmEmail, templateModel, { pretty: true }),
    textBody: await render(ConfirmEmail, templateModel, { plainText: true }),
  });
  return;
}

/**
 * Send password reset email
 */
export async function sendPasswordResetEmail(
  email: string,
  resetToken: string,
  userData: { firstname?: string; lastname?: string }
): Promise<void> {
  const config = useRuntimeConfig();
  const baseUrl = config.public.rootUrl || "http://localhost:3001";
  const resetUrl = `${baseUrl}/auth/reset-password/${resetToken}`;
  const fromEmail = config.sendingAddress

  const templateModel = {
    actionUrl: resetUrl,
    name: userData.firstname || "Friend",
    productName: config.public.productName || "Create Studio",
    productUrl: baseUrl,
    companyName: config.public.companyName || "Mischief Marmot LLC",
    supportEmail: config.public.supportEmail || "support@mischiefmarmot.com",
  };

  await sendMail({
    to: email,
    from: fromEmail,
    subject: "Reset your password",
    htmlBody: await render(ResetPassword, templateModel, { pretty: true }),
    textBody: await render(ResetPassword, templateModel, { plainText: true }),
  });
  return;
}
