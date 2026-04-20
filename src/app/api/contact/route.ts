import 'server-only';

import { NextRequest, NextResponse } from 'next/server';
import { createHmac } from 'node:crypto';
import { sendContactEmail } from '@/lib/email/contact';
import { checkRateLimitAsync } from '@/lib/newsletter/rate-limit';
import { verifyTurnstile } from '@/lib/newsletter/turnstile';

export const runtime = 'nodejs';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_EMAIL_LEN = 254;
const MAX_NAME_LEN = 120;
const MAX_COMPANY_LEN = 200;
const MAX_MESSAGE_LEN = 5000;

const ALLOWED_PERSONAS = new Set([
  'player',
  'venue',
  'equipment_provider',
  'league_organiser',
  'ambassador',
]);

type ErrorCode =
  | 'invalid_payload'
  | 'invalid_email'
  | 'invalid_name'
  | 'message_too_long'
  | 'rate_limited'
  | 'challenge_failed'
  | 'send_failed'
  | 'internal_error';

function ok(body: Record<string, unknown> = {}) {
  return NextResponse.json(
    { ok: true, ...body },
    { status: 200, headers: { 'Cache-Control': 'no-store' } }
  );
}

function fail(
  code: ErrorCode,
  status: number,
  extra: Record<string, unknown> = {}
) {
  return NextResponse.json(
    { ok: false, error: { code, ...extra } },
    { status, headers: { 'Cache-Control': 'no-store' } }
  );
}

function hashIp(ip: string) {
  const pepper =
    process.env.IP_HASH_PEPPER ?? 'playback-newsletter-fallback-pepper';
  return createHmac('sha256', pepper).update(ip).digest('hex').slice(0, 32);
}

function clientIp(req: NextRequest): string {
  const h = req.headers;
  const candidates = [
    h.get('x-vercel-forwarded-for'),
    h.get('x-nf-client-connection-ip'),
    h.get('fly-client-ip'),
    h.get('cf-connecting-ip'),
    h.get('x-real-ip'),
  ];
  for (const v of candidates) if (v && v.trim()) return v.trim();
  const xff = h.get('x-forwarded-for');
  if (xff) return xff.split(',')[0]!.trim();
  return 'unknown';
}

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return fail('invalid_payload', 400);
  }
  if (!body || typeof body !== 'object') return fail('invalid_payload', 400);

  const payload = body as Record<string, unknown>;

  // Honeypot (matches Contact form's hidden "bot-field" field name).
  if (
    typeof payload['bot-field'] === 'string' &&
    payload['bot-field'].trim() !== ''
  ) {
    return ok();
  }

  const name = typeof payload.name === 'string' ? payload.name.trim() : '';
  if (!name || name.length > MAX_NAME_LEN) return fail('invalid_name', 400);

  const rawEmail = typeof payload.email === 'string' ? payload.email : '';
  const email = rawEmail.trim().toLowerCase();
  if (!email || email.length > MAX_EMAIL_LEN || !EMAIL_RE.test(email)) {
    return fail('invalid_email', 400);
  }

  const rawCompany =
    typeof payload.company === 'string' ? payload.company.trim() : '';
  const company = rawCompany.slice(0, MAX_COMPANY_LEN) || null;

  const rawWho = typeof payload.who === 'string' ? payload.who.trim() : '';
  const who = ALLOWED_PERSONAS.has(rawWho) ? rawWho : null;

  const rawMessage = typeof payload.message === 'string' ? payload.message : '';
  if (rawMessage.length > MAX_MESSAGE_LEN) return fail('message_too_long', 400);
  const message = rawMessage.trim() || null;

  const ip = clientIp(req);
  const ipHash = hashIp(ip);

  // Two-tier limit matches newsletter: per-IP stops broad spray,
  // per-email stops a single target being flooded via rotating IPs.
  const ipLimit = await checkRateLimitAsync(`contact:ip:${ipHash}`);
  if (!ipLimit.ok) {
    return NextResponse.json(
      { ok: false, error: { code: 'rate_limited' as const } },
      { status: 429, headers: { 'Retry-After': String(ipLimit.retryAfter) } }
    );
  }
  const emailLimit = await checkRateLimitAsync(`contact:email:${email}`);
  if (!emailLimit.ok) {
    return NextResponse.json(
      { ok: false, error: { code: 'rate_limited' as const } },
      { status: 429, headers: { 'Retry-After': String(emailLimit.retryAfter) } }
    );
  }

  // Turnstile - no-op if TURNSTILE_SECRET_KEY isn't set.
  const turnstileToken =
    typeof payload['cf-turnstile-response'] === 'string'
      ? payload['cf-turnstile-response']
      : null;
  const challenge = await verifyTurnstile(turnstileToken, ip);
  if (!challenge.ok) {
    // 403 not 400: Turnstile refusal is anti-abuse, not a malformed payload.
    return fail('challenge_failed', 403);
  }

  const result = await sendContactEmail({ name, email, company, who, message });
  if (!result.success) {
    // eslint-disable-next-line no-console
    console.error('[contact] send failed', result.error);
    // 502 (bad gateway) - upstream (Resend) rejected. Clients can retry.
    return NextResponse.json(
      { ok: false, error: { code: 'send_failed' as const } },
      { status: 502, headers: { 'Retry-After': '30' } }
    );
  }

  return ok();
}
