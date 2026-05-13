'use server';

import { redirect } from 'next/navigation';
import { randomUUID } from 'crypto';
import { startAcademyCheckoutProxy } from '@/lib/academy/checkout-proxy';

// Slug shape mirrors the validation in PLAYHUB's checkout-session route +
// the webhook handler — bounded so attacker-controlled URL/body values can't
// poison logs or smuggle anything into Supabase queries.
const CLUB_SLUG_RE = /^[a-z0-9_][a-z0-9_-]{0,63}$/;
const TEAM_SLUG_RE = /^[a-z0-9][a-z0-9-]{0,63}$/;
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
  idempotencyKey: string
): Promise<{ ok: false; message: string }> {
  if (!CLUB_SLUG_RE.test(clubSlug) || !TEAM_SLUG_RE.test(teamSlug)) {
    return {
      ok: false,
      message:
        'Something looked wrong with that team selection — please refresh and try again.',
    };
  }

  const safeKey = IDEMPOTENCY_KEY_RE.test(idempotencyKey)
    ? idempotencyKey
    : randomUUID();

  const outcome = await startAcademyCheckoutProxy({
    clubSlug,
    teamSlug,
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
      ? "We couldn't find that team — please refresh the page and try again."
      : outcome.reason === 'rate_limited' ||
          outcome.reason === 'upstream_unreachable'
        ? 'Checkout is busy right now — please try again in a moment.'
        : outcome.reason === 'invalid_input'
          ? 'Something looked wrong with that team selection — please refresh and try again.'
          : 'Checkout is unavailable right now — please try again in a few minutes.';

  return { ok: false, message: userMessage };
}
