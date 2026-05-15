// PLAYBACK → PLAYHUB checkout-session proxy.
//
// The PLAYBACK academy landing page (D1) needs to create a Stripe Checkout
// Session, but the Stripe key lives in PLAYHUB (Checkpoint C). This module
// makes the server-to-server call to PLAYHUB's
// /api/academy/[clubSlug]/checkout-session endpoint and returns the URL the
// parent's browser should be redirected to.
//
// The caller (server action in the academy page) is responsible for actually
// issuing the redirect via Next's `redirect()` — this module is pure I/O and
// returns a discriminated outcome.
//
// Idempotency: caller supplies a per-submission UUID. We pass it through as
// the `Idempotency-Key` header so a proxy-internal retry (future scope) would
// resolve to the same Stripe session. Today we don't retry, so a fresh UUID
// per call is correct.
//
// Dependency injection: the `fetch` impl is injected so unit tests can mock
// the PLAYHUB call without touching the network.

export interface ProxyInput {
  clubSlug: string;
  teamSlug: string;
  /** Hierarchical-academy middle layer (LYL). Optional — flat configs
   *  (CFA, SEFA) omit it. PLAYHUB validates the slug shape and verifies
   *  the (club, subclub) pair before creating the Stripe session. */
  subclubSlug?: string | null;
  /** Per-submission UUID, surfaced as `Idempotency-Key`. */
  idempotencyKey: string;
}

export type ProxyOutcome =
  | { kind: 'success'; url: string; sessionId: string }
  | {
      kind: 'failure';
      // Categorical reason — distinguishes "we sent bad input" from "PLAYHUB
      // is down" from "Stripe is rate-limited". Server action maps these to
      // user-visible copy.
      reason:
        | 'misconfigured'
        | 'invalid_input'
        | 'club_or_team_not_found'
        | 'rate_limited'
        | 'upstream_unreachable'
        | 'upstream_error'
        | 'unknown';
      status: number;
      message: string;
    };

export interface ProxyDeps {
  /** Base URL of the PLAYHUB API (no trailing slash). */
  playhubUrl: string;
  /** Shared secret for x-api-key. Required — module fails closed if missing. */
  apiKey: string;
  /** Injected for tests. Real impl is global fetch. */
  fetchImpl: typeof fetch;
}

export function buildDefaultDeps(): ProxyDeps {
  const playhubUrl = (
    process.env.NEXT_PUBLIC_PLAYHUB_URL || 'https://playhub.playbacksports.ai'
  ).replace(/\/+$/, '');
  const apiKey = process.env.SYNC_API_KEY || '';
  return { playhubUrl, apiKey, fetchImpl: fetch };
}

export async function startAcademyCheckoutProxy(
  input: ProxyInput,
  deps: ProxyDeps = buildDefaultDeps()
): Promise<ProxyOutcome> {
  if (!deps.apiKey) {
    return {
      kind: 'failure',
      reason: 'misconfigured',
      status: 0,
      message:
        'SYNC_API_KEY is not set on PLAYBACK — cannot reach PLAYHUB checkout-session API',
    };
  }

  const url = `${deps.playhubUrl}/api/academy/${encodeURIComponent(input.clubSlug)}/checkout-session`;

  let resp: Response;
  try {
    resp = await deps.fetchImpl(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': deps.apiKey,
        'Idempotency-Key': input.idempotencyKey,
      },
      // Only emit subclub_slug when set — keeps the body shape backwards-
      // compatible with legacy CFA/SEFA flows on the PLAYHUB side.
      body: JSON.stringify(
        input.subclubSlug
          ? { team_slug: input.teamSlug, subclub_slug: input.subclubSlug }
          : { team_slug: input.teamSlug }
      ),
      // Server actions can sit on warm-pool connections; no client-side cache.
      cache: 'no-store',
    });
  } catch (err) {
    return {
      kind: 'failure',
      reason: 'upstream_unreachable',
      status: 0,
      message: err instanceof Error ? err.message : String(err),
    };
  }

  // Parse the body once. PLAYHUB returns JSON for every status code — even
  // 4xx/5xx carry { error: { code, message } } per Checkpoint C's contract.
  let body: unknown;
  try {
    body = await resp.json();
  } catch {
    return {
      kind: 'failure',
      reason: 'upstream_error',
      status: resp.status,
      message: `PLAYHUB returned non-JSON (status ${resp.status})`,
    };
  }

  if (resp.ok) {
    const b = body as { url?: unknown; session_id?: unknown };
    if (typeof b.url !== 'string' || typeof b.session_id !== 'string') {
      return {
        kind: 'failure',
        reason: 'upstream_error',
        status: resp.status,
        message: 'PLAYHUB returned 200 without url/session_id',
      };
    }
    // Defense in depth: even though PLAYHUB controls this URL today, the
    // server action passes it straight to redirect(). If a future PLAYHUB
    // bug or compromise returned an attacker URL, we'd be redirecting parents
    // to it. Hard-pin to Stripe's checkout host.
    if (!b.url.startsWith('https://checkout.stripe.com/')) {
      return {
        kind: 'failure',
        reason: 'upstream_error',
        status: resp.status,
        message: `PLAYHUB returned a non-Stripe URL: ${b.url.slice(0, 64)}`,
      };
    }
    return { kind: 'success', url: b.url, sessionId: b.session_id };
  }

  // Failure — extract the PLAYHUB error and re-categorise for the caller.
  const b = body as { error?: { code?: unknown; message?: unknown } };
  const code = typeof b.error?.code === 'string' ? b.error.code : 'unknown';
  const message =
    typeof b.error?.message === 'string'
      ? b.error.message
      : `PLAYHUB returned status ${resp.status}`;

  let reason: Extract<ProxyOutcome, { kind: 'failure' }>['reason'];
  if (resp.status === 401)
    reason = 'misconfigured'; // SYNC_API_KEY mismatch
  else if (resp.status === 400) reason = 'invalid_input';
  else if (resp.status === 404) reason = 'club_or_team_not_found';
  else if (resp.status === 429) reason = 'rate_limited';
  else if (resp.status === 503) reason = 'upstream_unreachable';
  else if (resp.status >= 500) reason = 'upstream_error';
  else reason = 'unknown';

  return {
    kind: 'failure',
    reason,
    status: resp.status,
    message: `${code}: ${message}`,
  };
}
