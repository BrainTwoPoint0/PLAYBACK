'use server';

import { createClient } from '@/lib/supabase/server';
import { provisionPendingProxy } from '@/lib/academy/provision-pending-proxy';

/**
 * Server action invoked from the dashboard provisioning hook on first
 * authenticated load. Reads the current user from PLAYBACK's Supabase
 * session, then forwards user.id to PLAYHUB which fires Veo provisioning
 * for any unprovisioned active academy subscriptions.
 *
 * Idempotent at every layer (B1's three-tier idempotency + the dashboard
 * hook's per-session sessionStorage flag), so calling it from multiple
 * tabs / refreshes is safe.
 *
 * Returns a small summary so the client can decide whether to surface a
 * "your subscription is now active" toast (out of scope for E pilot —
 * the hook just logs to console).
 */
export type ProvisionPendingResult =
  | { ok: true; total: number; successes: number; failures: number }
  | { ok: false; reason: 'unauthenticated' | 'transient' | 'config_error' };

export async function provisionMyPendingAcademy(): Promise<ProvisionPendingResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    // Not signed in — nothing to provision. Don't error; the hook may fire
    // before the session is fully hydrated.
    return { ok: false, reason: 'unauthenticated' };
  }

  const outcome = await provisionPendingProxy({ userId: user.id });

  if (outcome.kind === 'ok') {
    return {
      ok: true,
      total: outcome.summary.total,
      successes: outcome.summary.successes,
      failures: outcome.summary.failures,
    };
  }

  // Structured log so we can correlate with PLAYHUB's
  // academy_provision_pending_completed / _threw events.
  console.error(
    JSON.stringify({
      event: 'playback_provision_pending_failed',
      user_id: user.id,
      reason: outcome.reason,
      status: outcome.status,
    })
  );

  if (
    outcome.reason === 'transient' ||
    outcome.reason === 'upstream_unreachable'
  ) {
    return { ok: false, reason: 'transient' };
  }
  return { ok: false, reason: 'config_error' };
}
