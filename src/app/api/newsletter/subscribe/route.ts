import 'server-only';

import { NextRequest, NextResponse } from 'next/server';
import { createHmac } from 'node:crypto';
import {
  corsHeaders,
  corsPreflight,
} from '@braintwopoint0/playback-commons/api';
import { createAdminClient } from '@/lib/supabase/admin';
import { syncToResendAudience, sendNewsletterWelcomeEmail } from '@/lib/email';
import { checkRateLimitAsync } from '@/lib/newsletter/rate-limit';
import { verifyTurnstile } from '@/lib/newsletter/turnstile';

// Pin the route to the Node.js runtime - the service-role key MUST NOT
// reach the Edge runtime and `node:crypto` needs Node.
export const runtime = 'nodejs';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_EMAIL_LEN = 254; // RFC 5321 upper bound
const ALLOWED_SOURCES = new Set([
  'footer',
  'hero',
  'clubs-form',
  'players-form',
  'press',
  'playhub-footer',
]);
const ALLOWED_ROLES = new Set(['parent', 'player', 'club', 'coach', 'press']);

// Cross-origin signups are allowed from PLAYHUB (separate apex, same product) and
// from localhost during development. Exact match — no wildcards, so a typo'd
// subdomain or rogue preview URL can't post to the production list. Localhost is
// stripped out of the production allowlist so a malicious local page can't post
// to prod from a developer machine.
const ALLOWED_ORIGINS = new Set(
  process.env.NODE_ENV === 'production'
    ? ['https://playhub.playbacksports.ai', 'https://playbacksports.ai']
    : [
        'https://playhub.playbacksports.ai',
        'https://playbacksports.ai',
        'http://localhost:3000',
        'http://localhost:3001',
      ]
);

type ErrorCode =
  | 'invalid_payload'
  | 'invalid_email'
  | 'invalid_role'
  | 'rate_limited'
  | 'challenge_failed'
  | 'internal_error';

function ok(
  body: Record<string, unknown> = {},
  status = 200,
  origin: string | null = null
) {
  return NextResponse.json(
    { ok: true, ...body },
    {
      status,
      headers: {
        'Cache-Control': 'no-store',
        ...corsHeaders(origin, ALLOWED_ORIGINS),
      },
    }
  );
}

function fail(
  code: ErrorCode,
  status: number,
  extra: Record<string, unknown> = {},
  origin: string | null = null
) {
  return NextResponse.json(
    { ok: false, error: { code, ...extra } },
    {
      status,
      headers: {
        'Cache-Control': 'no-store',
        ...corsHeaders(origin, ALLOWED_ORIGINS),
      },
    }
  );
}

function hashIp(ip: string) {
  // HMAC(sha256, pepper) so the hash cannot be rainbow-tabled by anyone with
  // DB access (IPv4 space is only 2^32). Falls back to a static pepper with a
  // warning if the env var is missing - same threat model as before, no worse.
  const pepper = process.env.IP_HASH_PEPPER;
  if (!pepper && process.env.NODE_ENV === 'production') {
    // One-time warning per process; still hash so the column isn't empty.
    // eslint-disable-next-line no-console
    console.warn(
      '[newsletter] IP_HASH_PEPPER missing in production; ip_hash provides weak anti-correlation only.'
    );
  }
  return createHmac('sha256', pepper ?? 'playback-newsletter-fallback-pepper')
    .update(ip)
    .digest('hex')
    .slice(0, 32);
}

/**
 * Extract the client IP using the platform's trusted header first. Client-supplied
 * `x-forwarded-for` is only used as the last resort, because it's spoofable from
 * the browser on any platform.
 */
function clientIp(req: NextRequest): string {
  const headers = req.headers;
  const candidates = [
    headers.get('x-vercel-forwarded-for'),
    headers.get('x-nf-client-connection-ip'),
    headers.get('fly-client-ip'),
    headers.get('cf-connecting-ip'),
    headers.get('x-real-ip'),
  ];
  for (const v of candidates) {
    if (v && v.trim()) return v.trim();
  }
  // Final fallback: untrusted x-forwarded-for (take the leftmost hop but flag it).
  const xff = headers.get('x-forwarded-for');
  if (xff) return xff.split(',')[0]!.trim();
  return 'unknown';
}

// Preflight for cross-origin POSTs from PLAYHUB. The browser sends OPTIONS
// before the JSON POST because Content-Type: application/json triggers a
// preflight. Returning 204 with CORS headers (only when the Origin is in the
// allowlist) is what unblocks the actual POST.
export const OPTIONS = (req: NextRequest) =>
  corsPreflight(req, ALLOWED_ORIGINS);

export async function POST(req: NextRequest) {
  const origin = req.headers.get('origin');

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return fail('invalid_payload', 400, {}, origin);
  }

  if (!body || typeof body !== 'object') {
    return fail('invalid_payload', 400, {}, origin);
  }

  const payload = body as Record<string, unknown>;

  // Honeypot - real users never fill this field. Fake success for bots.
  if (typeof payload.website === 'string' && payload.website.trim() !== '') {
    return ok({ status: 'subscribed' }, 200, origin);
  }

  const rawEmail = typeof payload.email === 'string' ? payload.email : '';
  const email = rawEmail.trim().toLowerCase();
  if (!email || email.length > MAX_EMAIL_LEN || !EMAIL_RE.test(email)) {
    return fail('invalid_email', 400, {}, origin);
  }

  const rawSource =
    typeof payload.source === 'string' ? payload.source : 'footer';
  const source = ALLOWED_SOURCES.has(rawSource) ? rawSource : 'footer';

  const rawRole =
    typeof payload.role === 'string' && payload.role.trim() !== ''
      ? payload.role
      : null;
  if (rawRole && !ALLOWED_ROLES.has(rawRole)) {
    return fail('invalid_role', 400, { field: 'role' }, origin);
  }
  const role = rawRole;

  const ip = clientIp(req);
  const ipHash = hashIp(ip);

  // Two-tier limit: per-IP and per-email, both cheap. Per-email stops a single
  // address being flooded even if an attacker rotates IPs.
  const ipLimit = await checkRateLimitAsync(`newsletter:ip:${ipHash}`);
  if (!ipLimit.ok) {
    return NextResponse.json(
      { ok: false, error: { code: 'rate_limited' as const } },
      {
        status: 429,
        headers: {
          'Retry-After': String(ipLimit.retryAfter),
          ...corsHeaders(origin, ALLOWED_ORIGINS),
        },
      }
    );
  }
  const emailLimit = await checkRateLimitAsync(`newsletter:email:${email}`);
  if (!emailLimit.ok) {
    return NextResponse.json(
      { ok: false, error: { code: 'rate_limited' as const } },
      {
        status: 429,
        headers: {
          'Retry-After': String(emailLimit.retryAfter),
          ...corsHeaders(origin, ALLOWED_ORIGINS),
        },
      }
    );
  }

  // Turnstile - no-op if TURNSTILE_SECRET_KEY isn't set (dev / pre-integration).
  const turnstileToken =
    typeof payload['cf-turnstile-response'] === 'string'
      ? payload['cf-turnstile-response']
      : null;
  const challenge = await verifyTurnstile(turnstileToken, ip);
  if (!challenge.ok) {
    // 403 not 400: Turnstile refusal is anti-abuse, not a malformed payload.
    return fail('challenge_failed', 403, {}, origin);
  }

  const userAgent = (req.headers.get('user-agent') ?? '').slice(0, 255);
  const admin = createAdminClient();

  // Single upsert eliminates the select-then-insert race and unique-violation 500s.
  // `ignoreDuplicates: false` = treat as UPSERT, returning the row whether new or existing.
  const { data: row, error: upsertErr } = await admin
    .from('newsletter_subscribers')
    .upsert(
      {
        email,
        status: 'subscribed',
        source,
        role,
        ip_hash: ipHash,
        user_agent: userAgent,
        unsubscribed_at: null, // reactivate previously-unsubscribed rows
      },
      { onConflict: 'email', ignoreDuplicates: false }
    )
    .select('id, resend_contact_id, resend_synced_at')
    .single();

  if (upsertErr || !row) {
    // eslint-disable-next-line no-console
    console.error('[newsletter] upsert failed', upsertErr);
    return fail('internal_error', 500, {}, origin);
  }

  // Sync to Resend if either (a) no contact exists yet, OR (b) we've got a contact
  // but never successfully synced - covers the reactivation path.
  const needsSync = !row.resend_contact_id || !row.resend_synced_at;

  const isNewRow = !row.resend_contact_id && !row.resend_synced_at;

  if (needsSync) {
    const contactId = await syncToResendAudience(email, { role, source });
    if (contactId) {
      const { error: syncErr } = await admin
        .from('newsletter_subscribers')
        .update({
          resend_contact_id: contactId,
          resend_synced_at: new Date().toISOString(),
        })
        .eq('id', row.id);
      if (syncErr) {
        // eslint-disable-next-line no-console
        console.error('[newsletter] resend sync persist failed', syncErr);
        // Don't fail the request - row is persisted, reconciler will retry later.
      }
    }
    // If sync failed (contactId null), leave resend_contact_id NULL so the
    // partial index idx_newsletter_subscribers_unsynced picks it up.
  }

  // Send welcome email for genuinely new rows only (not reactivations).
  // Awaited so serverless doesn't freeze the container mid-send. Adds ~300-800ms
  // to the response - acceptable for a non-critical signup endpoint, and prevents
  // silent drops of welcome emails on Vercel/Netlify.
  if (isNewRow) {
    try {
      await sendNewsletterWelcomeEmail({ toEmail: email, role });
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('[newsletter] welcome email failed', err);
      // Don't fail the request - the subscriber is already saved.
    }
  }

  return ok({ status: 'subscribed' }, 200, origin);
}
