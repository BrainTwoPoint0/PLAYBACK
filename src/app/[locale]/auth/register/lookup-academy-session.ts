'use server';

import { lookupAcademySessionProxy } from '@/lib/academy/session-lookup-proxy';

/**
 * Server action invoked from the register page when it sees
 * `?intent=academy&session_id=cs_...` in the URL. Fetches the session via
 * PLAYHUB (which holds the Stripe key) and returns ONLY the safe subset
 * needed to pre-fill the form + render academy-branded copy.
 *
 * SECURITY CONTRACT (carry-over from D1):
 *   - The returned email is DISPLAY ONLY. The auth identity is derived from
 *     Supabase signup + email confirmation, never from this lookup.
 *   - PLAYHUB returns 404 for any session that isn't a paid
 *     academy_subscription, so anyone passing a random Stripe session id
 *     gets the same null result as a non-existent id (no enumeration).
 */
export type AcademySessionLookup =
  | {
      ok: true;
      data: {
        customerEmail: string;
        customerName: string | null;
        clubSlug: string;
        clubName: string;
        teamSlug: string;
      };
    }
  | { ok: false; reason: 'not_found' | 'transient' | 'config_error' };

export async function lookupAcademySession(
  sessionId: string
): Promise<AcademySessionLookup> {
  const outcome = await lookupAcademySessionProxy({ sessionId });

  if (outcome.kind === 'found') {
    return {
      ok: true,
      data: {
        customerEmail: outcome.data.customer_email,
        customerName: outcome.data.customer_name,
        clubSlug: outcome.data.club_slug,
        clubName: outcome.data.club_name,
        teamSlug: outcome.data.team_slug,
      },
    };
  }

  // Structured log so we can correlate with PLAYHUB's
  // academy_session_lookup_resolved / _threw events.
  console.error(
    JSON.stringify({
      event: 'playback_academy_session_lookup_failed',
      // Cap session id length in logs.
      session_id: String(sessionId).slice(0, 64),
      reason: outcome.reason,
      status: outcome.status,
    })
  );

  if (
    outcome.reason === 'not_found' ||
    outcome.reason === 'invalid_session_id'
  ) {
    return { ok: false, reason: 'not_found' };
  }
  if (
    outcome.reason === 'transient' ||
    outcome.reason === 'upstream_unreachable'
  ) {
    return { ok: false, reason: 'transient' };
  }
  return { ok: false, reason: 'config_error' };
}
