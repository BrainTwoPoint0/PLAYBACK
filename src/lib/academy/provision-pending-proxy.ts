// PLAYBACK → PLAYHUB provision-pending proxy.
//
// Used by the dashboard provisioning hook (E). Forwards the current user's
// auth.users.id to PLAYHUB, which calls B1's provisionPendingForUser to
// fire Veo invites for any unprovisioned academy subscriptions.
//
// Mirrors the shape of the other PLAYBACK academy proxies: DI'd, fail-
// closed when SYNC_API_KEY is missing, single network call, categorical
// outcome.

export interface ProxyInput {
  userId: string;
}

export interface PendingSummary {
  total: number;
  successes: number;
  failures: number;
  /** Subset of `failures` flagged by B1's isSecurityFailure (authorization,
   *  email_not_confirmed, stripe_email_mismatch). Useful for alerting hooks
   *  that page on salted-account bypass attempts. */
  security_failures: number;
}

export type PendingOutcome =
  | { kind: 'ok'; summary: PendingSummary }
  | {
      kind: 'failure';
      reason:
        | 'misconfigured'
        | 'invalid_input'
        | 'transient'
        | 'upstream_unreachable'
        | 'upstream_error';
      status: number;
      message: string;
    };

export interface ProxyDeps {
  playhubUrl: string;
  apiKey: string;
  fetchImpl: typeof fetch;
}

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function buildDefaultDeps(): ProxyDeps {
  const playhubUrl = (
    process.env.NEXT_PUBLIC_PLAYHUB_URL || 'https://playhub.playbacksports.ai'
  ).replace(/\/+$/, '');
  return {
    playhubUrl,
    apiKey: process.env.SYNC_API_KEY || '',
    fetchImpl: fetch,
  };
}

export async function provisionPendingProxy(
  input: ProxyInput,
  deps: ProxyDeps = buildDefaultDeps()
): Promise<PendingOutcome> {
  if (!deps.apiKey) {
    return {
      kind: 'failure',
      reason: 'misconfigured',
      status: 0,
      message: 'SYNC_API_KEY is not set on PLAYBACK',
    };
  }
  if (!UUID_RE.test(input.userId)) {
    return {
      kind: 'failure',
      reason: 'invalid_input',
      status: 0,
      message: 'userId must be a UUID',
    };
  }

  // Path-supplied userId (matches PLAYHUB's /api/users/[userId]/...
  // resource shape — `/me/` would mislead since the user is supplied by
  // the caller, not session-derived on PLAYHUB). encodeURIComponent on
  // a UUID is a no-op but documents the intent.
  let resp: Response;
  try {
    resp = await deps.fetchImpl(
      `${deps.playhubUrl}/api/users/${encodeURIComponent(input.userId)}/provision-pending`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': deps.apiKey,
        },
        body: '{}',
        cache: 'no-store',
      }
    );
  } catch (err) {
    return {
      kind: 'failure',
      reason: 'upstream_unreachable',
      status: 0,
      message: err instanceof Error ? err.message : String(err),
    };
  }

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
    const b = body as Partial<PendingSummary>;
    if (
      typeof b.total !== 'number' ||
      typeof b.successes !== 'number' ||
      typeof b.failures !== 'number'
    ) {
      return {
        kind: 'failure',
        reason: 'upstream_error',
        status: resp.status,
        message: 'PLAYHUB returned 200 with malformed body',
      };
    }
    return {
      kind: 'ok',
      summary: {
        total: b.total,
        successes: b.successes,
        failures: b.failures,
        // PLAYHUB started returning this after the rename; default to 0
        // for compatibility with any in-flight pre-rename builds.
        security_failures:
          typeof b.security_failures === 'number' ? b.security_failures : 0,
      },
    };
  }

  const errBody = body as { error?: { code?: unknown; message?: unknown } };
  const code =
    typeof errBody.error?.code === 'string' ? errBody.error.code : 'unknown';
  const message =
    typeof errBody.error?.message === 'string'
      ? errBody.error.message
      : `PLAYHUB returned status ${resp.status}`;

  let reason: Extract<PendingOutcome, { kind: 'failure' }>['reason'];
  if (resp.status === 401) reason = 'misconfigured';
  else if (resp.status === 400) reason = 'invalid_input';
  else if (resp.status === 503) reason = 'transient';
  else reason = 'upstream_error';

  return {
    kind: 'failure',
    reason,
    status: resp.status,
    message: `${code}: ${message}`,
  };
}
