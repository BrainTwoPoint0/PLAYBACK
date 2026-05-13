// PLAYBACK → PLAYHUB session lookup proxy.
//
// Used by the register-page server action (D2) to fetch the safe subset of
// a Stripe Checkout Session — so PLAYBACK can pre-fill the email + show
// academy-branded copy without ever holding the Stripe key itself.
//
// Mirrors the shape of checkout-proxy.ts (DI, categorical outcome, no
// network in tests).

export interface ProxyInput {
  sessionId: string;
}

export interface SessionData {
  customer_email: string;
  customer_name: string | null;
  club_slug: string;
  club_name: string;
  team_slug: string;
}

export type LookupOutcome =
  | { kind: 'found'; data: SessionData }
  | {
      kind: 'failure';
      reason:
        | 'misconfigured'
        | 'invalid_session_id'
        | 'not_found'
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

// Same session-id shape PLAYHUB enforces — bound the input here too so we
// don't waste a network roundtrip on garbage input.
const SESSION_ID_RE = /^cs_(test|live)_[A-Za-z0-9]{10,200}$/;

export function buildDefaultDeps(): ProxyDeps {
  const playhubUrl = (
    process.env.NEXT_PUBLIC_PLAYHUB_URL || 'https://playhub.playbacksports.ai'
  ).replace(/\/+$/, '');
  const apiKey = process.env.SYNC_API_KEY || '';
  return { playhubUrl, apiKey, fetchImpl: fetch };
}

export async function lookupAcademySessionProxy(
  input: ProxyInput,
  deps: ProxyDeps = buildDefaultDeps()
): Promise<LookupOutcome> {
  if (!deps.apiKey) {
    return {
      kind: 'failure',
      reason: 'misconfigured',
      status: 0,
      message: 'SYNC_API_KEY is not set on PLAYBACK',
    };
  }

  if (!SESSION_ID_RE.test(input.sessionId)) {
    return {
      kind: 'failure',
      reason: 'invalid_session_id',
      status: 0,
      message: 'session_id has invalid shape',
    };
  }

  const url = `${deps.playhubUrl}/api/academy/sessions/${encodeURIComponent(input.sessionId)}`;

  let resp: Response;
  try {
    resp = await deps.fetchImpl(url, {
      method: 'GET',
      headers: { 'x-api-key': deps.apiKey },
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
    const b = body as Partial<SessionData>;
    if (
      typeof b.customer_email !== 'string' ||
      typeof b.club_slug !== 'string' ||
      typeof b.club_name !== 'string' ||
      typeof b.team_slug !== 'string'
    ) {
      return {
        kind: 'failure',
        reason: 'upstream_error',
        status: resp.status,
        message: 'PLAYHUB returned 200 with missing fields',
      };
    }
    return {
      kind: 'found',
      data: {
        customer_email: b.customer_email,
        customer_name:
          typeof b.customer_name === 'string' ? b.customer_name : null,
        club_slug: b.club_slug,
        club_name: b.club_name,
        team_slug: b.team_slug,
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

  let reason: Extract<LookupOutcome, { kind: 'failure' }>['reason'];
  if (resp.status === 401) reason = 'misconfigured';
  else if (resp.status === 404) reason = 'not_found';
  else if (resp.status === 503) reason = 'transient';
  else if (resp.status >= 500) reason = 'upstream_error';
  else reason = 'upstream_error';

  return {
    kind: 'failure',
    reason,
    status: resp.status,
    message: `${code}: ${message}`,
  };
}
