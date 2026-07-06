'use server';

import { redirect } from 'next/navigation';
import { randomUUID } from 'crypto';
import { getTranslations } from 'next-intl/server';
import { startAcademyCheckoutProxy } from '@/lib/academy/checkout-proxy';

// Slug shape mirrors the validation in PLAYHUB's checkout-session route +
// the webhook handler — bounded so attacker-controlled URL/body values can't
// poison logs or smuggle anything into Supabase queries.
const CLUB_SLUG_RE = /^[a-z0-9_][a-z0-9_-]{0,63}$/;
const TEAM_SLUG_RE = /^[a-z0-9][a-z0-9-]{0,63}$/;
// subclub_slug shares the team_slug shape — both are user-facing slugs
// surfaced in URLs and Stripe metadata.
const SUBCLUB_SLUG_RE = TEAM_SLUG_RE;
// Stripe Idempotency-Key is documented as ≤255 chars opaque ASCII. We
// re-validate browser-supplied keys to bound the surface; if the value is
// malformed (or the picker forgot to send one), regenerate server-side.
const IDEMPOTENCY_KEY_RE = /^[\x20-\x7E]{8,255}$/;

/**
 * Server action invoked when the parent clicks a team card on
 * /academy/[clubSlug]. Calls PLAYHUB's checkout-session API and redirects
 * the browser to Stripe Checkout.
 *
 * Trust contract: callers must hand in a stable per-submission idempotency
 * key (the picker generates one per browser click and reuses it for any
 * synchronous retry). If the supplied key is malformed or missing we
 * regenerate, accepting that a double-click could mint two Stripe sessions
 * — but the picker's synchronous `pendingTeamSlug` guard makes that
 * essentially unreachable in practice.
 *
 * IMPORTANT: on success this throws NEXT_REDIRECT internally. Do NOT wrap
 * callsites in try/catch unless you also re-throw via `isRedirectError`,
 * or the redirect will be silently swallowed.
 */
export async function startAcademyCheckout(
  clubSlug: string,
  teamSlug: string,
  idempotencyKey: string,
  /** Hierarchical-academy middle layer (LYL → 'barnes-eagles'). Optional:
   *  the flat-config picker (CFA/SEFA) calls without it. The hierarchical
   *  picker passes the subclub the parent navigated through. */
  subclubSlug: string | null = null
): Promise<{ ok: false; message: string }> {
  const t = await getTranslations('academy.checkout');

  if (!CLUB_SLUG_RE.test(clubSlug) || !TEAM_SLUG_RE.test(teamSlug)) {
    return { ok: false, message: t('invalidSelection') };
  }
  // Defence-in-depth: even though subclubSlug arrives from a server-rendered
  // page (not URL-supplied), revalidate to bound the value before forwarding.
  if (subclubSlug !== null && !SUBCLUB_SLUG_RE.test(subclubSlug)) {
    return { ok: false, message: t('invalidSelection') };
  }

  const safeKey = IDEMPOTENCY_KEY_RE.test(idempotencyKey)
    ? idempotencyKey
    : randomUUID();

  const outcome = await startAcademyCheckoutProxy({
    clubSlug,
    teamSlug,
    subclubSlug,
    idempotencyKey: safeKey,
  });

  if (outcome.kind === 'success') {
    // redirect() throws NEXT_REDIRECT — function never returns past this line
    // on success. The caller's `await` resolves only on the failure path.
    redirect(outcome.url);
  }

  // Structured log so we can correlate failures with the PLAYHUB-side
  // academy_checkout_failure events emitted by Checkpoint C's route.
  // Cap the slug values logged so attacker-supplied junk doesn't bloat logs.
  console.error(
    JSON.stringify({
      event: 'playback_academy_checkout_proxy_failed',
      club_slug: String(clubSlug).slice(0, 64),
      ...(subclubSlug
        ? { subclub_slug: String(subclubSlug).slice(0, 64) }
        : {}),
      team_slug: String(teamSlug).slice(0, 64),
      reason: outcome.reason,
      status: outcome.status,
      message: outcome.message,
    })
  );

  // Surface user-friendly copy per categorical reason. Don't leak the
  // underlying PLAYHUB / Stripe message — the structured log keeps ops covered.
  const userMessage =
    outcome.reason === 'club_or_team_not_found'
      ? t('teamNotFound')
      : outcome.reason === 'rate_limited' ||
          outcome.reason === 'upstream_unreachable'
        ? t('busy')
        : outcome.reason === 'invalid_input'
          ? t('invalidSelection')
          : t('unavailable');

  return { ok: false, message: userMessage };
}
