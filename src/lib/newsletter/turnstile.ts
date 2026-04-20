import 'server-only';

// Cloudflare Turnstile server-side verification.
//
// Usage:
//   1. Provision a Turnstile site at https://dash.cloudflare.com/?to=/:account/turnstile
//   2. Set env vars in production:
//        NEXT_PUBLIC_TURNSTILE_SITE_KEY     (embedded in the client widget)
//        TURNSTILE_SECRET_KEY               (server-side verification)
//   3. Render the widget client-side; include the token in the form POST as
//      `cf-turnstile-response` (standard Turnstile field name).
//
// When no secret is configured, `verifyTurnstile` returns `ok: true` so the
// forms continue to work in dev without the integration being wired up.
// Honeypot + rate-limiting still apply as the first line of defence.

const VERIFY_URL = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';

type VerifyResult = { ok: boolean; reason?: string };

/**
 * Verify a Turnstile token server-side. Returns `{ok: true}` when Turnstile
 * is not configured (env-flag off) so forms still work without the integration.
 *
 * @param token The `cf-turnstile-response` token from the client form.
 * @param remoteIp Optional client IP for Turnstile's risk scoring.
 */
export async function verifyTurnstile(
  token: string | null | undefined,
  remoteIp?: string
): Promise<VerifyResult> {
  const secret = process.env.TURNSTILE_SECRET_KEY;
  if (!secret) return { ok: true }; // not configured, soft-pass

  if (!token) return { ok: false, reason: 'missing_token' };

  try {
    const body = new URLSearchParams();
    body.set('secret', secret);
    body.set('response', token);
    if (remoteIp && remoteIp !== 'unknown') body.set('remoteip', remoteIp);

    const res = await fetch(VERIFY_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body,
      // Hard 4s cap - a hung CF connection shouldn't stall the whole request.
      signal: AbortSignal.timeout(4000),
    });
    if (!res.ok) {
      return { ok: false, reason: 'verify_http_' + res.status };
    }
    const data = (await res.json()) as {
      success?: boolean;
      'error-codes'?: string[];
    };
    if (data.success) return { ok: true };
    return {
      ok: false,
      reason: (data['error-codes'] ?? []).join(',') || 'turnstile_failed',
    };
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('[turnstile] verify failed', err);
    // Fail open on network errors so a Turnstile outage doesn't block real users.
    // Honeypot + rate limit still in front of the write.
    return { ok: true };
  }
}

export function turnstileEnabled(): boolean {
  return Boolean(process.env.TURNSTILE_SECRET_KEY);
}
