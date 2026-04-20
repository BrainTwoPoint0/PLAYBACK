import 'server-only';

import {
  createResendClient,
  syncToResendAudience as commonsSyncToResendAudience,
  type SendEmailResult,
} from '@braintwopoint0/playback-commons/email';
import { escapeHtml } from '@braintwopoint0/playback-commons/security';

// Single source of the client across PLAYBACK's server-only code. Uses the
// memoised factory from commons so we don't create multiple Resend instances.
function getClient() {
  return createResendClient(process.env.RESEND_API_KEY);
}

export const FROM_EMAIL = 'PLAYBACK <admin@playbacksports.ai>';
export const FROM_ALERT_EMAIL = 'PLAYBACK Alerts <admin@playbacksports.ai>';
export const APP_URL =
  process.env.NEXT_PUBLIC_APP_URL || 'https://playbacksports.ai';

export type { SendEmailResult };

/**
 * Push a subscriber to the configured Resend audience (marketing list only).
 * Thin PLAYBACK-specific wrapper around the commons primitive so callers can
 * stay terse (just pass email + options).
 */
export async function syncToResendAudience(
  email: string,
  options: { role?: string | null; source?: string | null } = {}
): Promise<string | null> {
  return commonsSyncToResendAudience({
    client: getClient(),
    audienceId: process.env.RESEND_AUDIENCE_ID,
    email,
    options,
  });
}

/**
 * Newsletter welcome - PLAYBACK-specific template. Called from the subscribe
 * route after a successful insert (not reactivation).
 *
 * For double-opt-in later, swap the body to include a confirmation CTA pointing
 * at /api/newsletter/confirm?token=... - schema already has the fields.
 */
export async function sendNewsletterWelcomeEmail(params: {
  toEmail: string;
  role?: string | null;
}): Promise<SendEmailResult> {
  const client = getClient();
  if (!client) {
    return { success: false, error: 'resend_not_configured' };
  }

  const { toEmail, role } = params;
  const safeRole = role ? escapeHtml(role) : null;

  try {
    const { error } = await client.emails.send({
      from: FROM_EMAIL,
      to: toEmail,
      subject: 'Welcome to PLAYBACK updates',
      html: `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #0a100d; color: #d6d5c9; padding: 40px 20px; margin: 0;">
  <div style="max-width: 520px; margin: 0 auto;">
    <h1 style="color: #d6d5c9; font-size: 22px; letter-spacing: -0.01em; margin: 0 0 24px 0;">PLAYBACK</h1>

    <p style="font-size: 17px; line-height: 1.5; margin: 0 0 16px 0;">
      You're on the list.
    </p>

    <p style="font-size: 15px; line-height: 1.6; color: #b9baa3; margin: 0 0 24px 0;">
      Updates ${safeRole ? `for ${safeRole}s` : 'from the PLAYBACK Network'} when relevant. No spam.
    </p>

    <a href="${APP_URL}"
       style="display: inline-block; background-color: #d6d5c9; color: #0a100d; padding: 12px 24px; text-decoration: none; border-radius: 999px; font-weight: 500; font-size: 14px;">
      Visit PLAYBACK &rarr;
    </a>

    <hr style="border: none; border-top: 1px solid rgba(214,213,201,0.12); margin: 40px 0 20px 0;">

    <p style="font-size: 11px; color: #8d8e7b; line-height: 1.5; margin: 0;">
      You're receiving this because you signed up at playbacksports.ai.
      If this wasn't you, ignore this email and you'll be removed on the next sync.
    </p>
  </div>
</body>
</html>`,
    });

    if (error) {
      console.error('[email] newsletter welcome send failed', error);
      return { success: false, error: error.message };
    }
    return { success: true };
  } catch (err) {
    console.error('[email] newsletter welcome threw', err);
    return { success: false, error: 'send_failed' };
  }
}
