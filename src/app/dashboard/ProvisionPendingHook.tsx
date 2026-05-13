'use client';

import { useEffect, useRef } from 'react';
import { provisionMyPendingAcademy } from './provision-pending-action';

// Per-tab guard: sessionStorage so multiple browser tabs each fire once
// (which is fine — provisioning is idempotent at every layer per B1) but
// a refresh inside the same tab doesn't re-hit the action.
const SESSION_FLAG = 'pb_provision_pending_attempted';

/**
 * Renders nothing. Fires once per tab session on dashboard mount,
 * triggering Veo provisioning for any unprovisioned academy subscriptions
 * the current user has. Quietly logs to console; doesn't surface any UI
 * (the parent already received the Veo invite email — the dashboard isn't
 * the place to celebrate it for v1).
 *
 * Failure modes are silent on purpose: if Veo / PLAYHUB is down at this
 * moment, the parent's experience is unchanged (their access goes live
 * on the next dashboard visit when the action runs again). The structured
 * log lets ops investigate without nagging the parent.
 */
export function ProvisionPendingHook() {
  const ranRef = useRef(false);

  useEffect(() => {
    // React 18 StrictMode double-invokes effects in dev. Guard against it.
    if (ranRef.current) return;
    ranRef.current = true;

    // Skip if we've already attempted in this tab session.
    try {
      if (sessionStorage.getItem(SESSION_FLAG)) return;
    } catch {
      // sessionStorage can throw in some private-browsing modes — proceed
      // without the guard, the server-side idempotency still saves us.
    }

    provisionMyPendingAcademy()
      .then((result) => {
        if (result.ok && result.total > 0) {
          console.log(
            JSON.stringify({
              event: 'playback_provision_pending_hook_completed',
              total: result.total,
              successes: result.successes,
              failures: result.failures,
            })
          );
        }
      })
      .catch((err) => {
        // Action threw outside its own error handling — last-resort log.
        console.error(
          JSON.stringify({
            event: 'playback_provision_pending_hook_threw',
            error: err instanceof Error ? err.message : String(err),
          })
        );
      })
      .finally(() => {
        // Set the per-tab flag REGARDLESS of outcome so a transient failure
        // doesn't stampede the endpoint on every subsequent dashboard
        // navigation in the same tab. Cross-tab + cross-session fallback
        // is the next-visit retry; server-side B1 idempotency makes that
        // safe.
        try {
          sessionStorage.setItem(SESSION_FLAG, '1');
        } catch {
          // ignore — sessionStorage may be unavailable in private browsing
        }
      });
  }, []);

  return null;
}
