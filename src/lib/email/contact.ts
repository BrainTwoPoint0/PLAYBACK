import 'server-only';

import { createResendClient } from '@braintwopoint0/playback-commons/email';
import { escapeHtml } from '@braintwopoint0/playback-commons/security';
import { FROM_EMAIL, APP_URL } from './index';

const CONTACT_INBOX = process.env.CONTACT_INBOX || 'admin@playbacksports.ai';

export interface ContactSendParams {
  name: string;
  email: string;
  company?: string | null;
  who?: string | null;
  message?: string | null;
}

export interface ContactSendResult {
  success: boolean;
  error?: string;
}

export async function sendContactEmail(
  params: ContactSendParams
): Promise<ContactSendResult> {
  const client = createResendClient(process.env.RESEND_API_KEY);
  if (!client) {
    return { success: false, error: 'resend_not_configured' };
  }

  const name = escapeHtml(params.name);
  const fromEmail = escapeHtml(params.email);
  const company = params.company ? escapeHtml(params.company) : null;
  const who = params.who ? escapeHtml(params.who) : null;
  const message = params.message ? escapeHtml(params.message) : null;

  const subject = `New contact: ${name}${who ? ` (${who})` : ''}`;

  try {
    const { error } = await client.emails.send({
      from: FROM_EMAIL,
      to: CONTACT_INBOX,
      replyTo: params.email,
      subject,
      html: `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #0a100d; color: #d6d5c9; padding: 32px 20px; margin: 0;">
  <div style="max-width: 560px; margin: 0 auto;">
    <h1 style="color: #d6d5c9; font-size: 18px; letter-spacing: -0.01em; margin: 0 0 20px 0;">New contact form submission</h1>

    <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
      <tr>
        <td style="padding: 8px 0; color: #b9baa3; width: 120px; vertical-align: top;">Name</td>
        <td style="padding: 8px 0; color: #d6d5c9;">${name}</td>
      </tr>
      <tr>
        <td style="padding: 8px 0; color: #b9baa3; vertical-align: top;">Email</td>
        <td style="padding: 8px 0; color: #d6d5c9;"><a href="mailto:${fromEmail}" style="color: #d6d5c9;">${fromEmail}</a></td>
      </tr>
      ${company ? `<tr><td style="padding: 8px 0; color: #b9baa3; vertical-align: top;">Company</td><td style="padding: 8px 0; color: #d6d5c9;">${company}</td></tr>` : ''}
      ${who ? `<tr><td style="padding: 8px 0; color: #b9baa3; vertical-align: top;">Persona</td><td style="padding: 8px 0; color: #d6d5c9;">${who}</td></tr>` : ''}
    </table>

    ${
      message
        ? `<div style="margin-top: 24px; padding-top: 20px; border-top: 1px solid rgba(214,213,201,0.12);">
            <p style="color: #b9baa3; font-size: 12px; text-transform: uppercase; letter-spacing: 0.14em; margin: 0 0 8px 0;">Message</p>
            <p style="color: #d6d5c9; font-size: 14px; line-height: 1.55; white-space: pre-wrap; margin: 0;">${message}</p>
          </div>`
        : ''
    }

    <p style="font-size: 11px; color: #8d8e7b; margin-top: 32px;">
      Sent from the contact form at ${APP_URL}/#contact.
    </p>
  </div>
</body>
</html>`,
    });

    if (error) {
      console.error('[email] contact send failed', error);
      return { success: false, error: error.message };
    }
    return { success: true };
  } catch (err) {
    console.error('[email] contact threw', err);
    return { success: false, error: 'send_failed' };
  }
}
