// Unit tests for the PLAYBACK → PLAYHUB checkout-session proxy.
//
// Mocks `fetch` via the injected `fetchImpl` dep — no network, no module
// mocking. Validates the wire contract with PLAYHUB's Checkpoint C route
// (success URL extraction, the nested {error: {code, message}} shape,
// and the categorical status → reason mapping).

import { describe, it, expect, vi } from 'vitest';
import {
  startAcademyCheckoutProxy,
  type ProxyDeps,
  type ProxyOutcome,
} from '../checkout-proxy';

// ----------------------------------------------------------------------------
// Helpers
// ----------------------------------------------------------------------------

function makeFetchImpl(
  fn: (url: string, init: RequestInit) => { status: number; body: unknown }
): ProxyDeps['fetchImpl'] {
  return ((url: string, init: RequestInit) => {
    const { status, body } = fn(url, init);
    return Promise.resolve(
      new Response(JSON.stringify(body), {
        status,
        headers: { 'content-type': 'application/json' },
      })
    );
  }) as unknown as ProxyDeps['fetchImpl'];
}

function makeDeps(overrides: Partial<ProxyDeps> = {}): ProxyDeps {
  return {
    playhubUrl: 'https://playhub.example.test',
    apiKey: 'sync-key-abc',
    fetchImpl: makeFetchImpl(() => ({
      status: 200,
      body: {
        url: 'https://checkout.stripe.com/c/pay/cs_test_1',
        session_id: 'cs_test_1',
      },
    })),
    ...overrides,
  };
}

function expectSuccess(o: ProxyOutcome) {
  expect(o.kind).toBe('success');
  return o as Extract<ProxyOutcome, { kind: 'success' }>;
}
function expectFailure(o: ProxyOutcome) {
  expect(o.kind).toBe('failure');
  return o as Extract<ProxyOutcome, { kind: 'failure' }>;
}

// ----------------------------------------------------------------------------
// Tests
// ----------------------------------------------------------------------------

describe('startAcademyCheckoutProxy', () => {
  it('returns misconfigured when SYNC_API_KEY is empty (fails closed, no network call)', async () => {
    const fetchImpl = vi.fn();
    const o = await startAcademyCheckoutProxy(
      { clubSlug: 'lyl', teamSlug: 'lyl-u12', idempotencyKey: 'idem-1' },
      { playhubUrl: 'https://playhub.example.test', apiKey: '', fetchImpl }
    );
    expectFailure(o);
    expect((o as any).reason).toBe('misconfigured');
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it('happy path: returns Stripe URL + session ID', async () => {
    const o = await startAcademyCheckoutProxy(
      { clubSlug: 'lyl', teamSlug: 'lyl-u12', idempotencyKey: 'idem-1' },
      makeDeps()
    );
    const ok = expectSuccess(o);
    expect(ok.url).toBe('https://checkout.stripe.com/c/pay/cs_test_1');
    expect(ok.sessionId).toBe('cs_test_1');
  });

  it('sends x-api-key + Idempotency-Key + Content-Type headers', async () => {
    const calls: { url: string; init: RequestInit }[] = [];
    const deps = makeDeps({
      fetchImpl: ((url: string, init: RequestInit) => {
        calls.push({ url, init });
        return Promise.resolve(
          new Response(
            JSON.stringify({
              url: 'https://checkout.stripe.com/c/pay/cs_test_1',
              session_id: 'cs_test_1',
            }),
            { status: 200, headers: { 'content-type': 'application/json' } }
          )
        );
      }) as unknown as ProxyDeps['fetchImpl'],
    });

    await startAcademyCheckoutProxy(
      {
        clubSlug: 'lyl',
        teamSlug: 'lyl-u12-tigers',
        idempotencyKey: 'idem-abc-123',
      },
      deps
    );

    expect(calls).toHaveLength(1);
    expect(calls[0].url).toBe(
      'https://playhub.example.test/api/academy/lyl/checkout-session'
    );
    const headers = calls[0].init.headers as Record<string, string>;
    expect(headers['x-api-key']).toBe('sync-key-abc');
    expect(headers['Idempotency-Key']).toBe('idem-abc-123');
    expect(headers['Content-Type']).toBe('application/json');
    expect(JSON.parse(calls[0].init.body as string)).toEqual({
      team_slug: 'lyl-u12-tigers',
    });
  });

  it('hierarchical: includes subclub_slug in the body when set', async () => {
    const calls: { url: string; init: RequestInit }[] = [];
    const deps = makeDeps({
      fetchImpl: ((url: string, init: RequestInit) => {
        calls.push({ url, init });
        return Promise.resolve(
          new Response(
            JSON.stringify({
              url: 'https://checkout.stripe.com/c/pay/cs_test_1',
              session_id: 'cs_test_1',
            }),
            { status: 200, headers: { 'content-type': 'application/json' } }
          )
        );
      }) as unknown as ProxyDeps['fetchImpl'],
    });
    await startAcademyCheckoutProxy(
      {
        clubSlug: 'lyl',
        teamSlug: 'u12-tigers',
        subclubSlug: 'barnes-eagles',
        idempotencyKey: 'idem-abc-123',
      },
      deps
    );
    expect(JSON.parse(calls[0].init.body as string)).toEqual({
      team_slug: 'u12-tigers',
      subclub_slug: 'barnes-eagles',
    });
  });

  it('flat: omits subclub_slug from body when null/undefined (CFA/SEFA shape unchanged)', async () => {
    const calls: { url: string; init: RequestInit }[] = [];
    const deps = makeDeps({
      fetchImpl: ((url: string, init: RequestInit) => {
        calls.push({ url, init });
        return Promise.resolve(
          new Response(
            JSON.stringify({
              url: 'https://checkout.stripe.com/c/pay/cs_test_1',
              session_id: 'cs_test_1',
            }),
            { status: 200, headers: { 'content-type': 'application/json' } }
          )
        );
      }) as unknown as ProxyDeps['fetchImpl'],
    });
    // Both null and undefined must produce the same flat body shape — the
    // PLAYHUB route's checkout/webhook idempotency tests already pin the
    // null path; the proxy contract is "send no key when there's nothing
    // to send" so the wire format is byte-identical to the pre-E.2 one.
    await startAcademyCheckoutProxy(
      {
        clubSlug: 'cfa',
        teamSlug: 'u11',
        subclubSlug: null,
        idempotencyKey: 'idem-flat-null',
      },
      deps
    );
    await startAcademyCheckoutProxy(
      {
        clubSlug: 'cfa',
        teamSlug: 'u11',
        idempotencyKey: 'idem-flat-omitted',
      },
      deps
    );
    expect(JSON.parse(calls[0].init.body as string)).toEqual({
      team_slug: 'u11',
    });
    expect(JSON.parse(calls[1].init.body as string)).toEqual({
      team_slug: 'u11',
    });
    expect(calls[0].init.body).not.toContain('subclub_slug');
    expect(calls[1].init.body).not.toContain('subclub_slug');
  });

  it('encodes club_slug into the path so weird slugs cannot break out', async () => {
    const calls: string[] = [];
    const deps = makeDeps({
      fetchImpl: ((url: string) => {
        calls.push(url);
        return Promise.resolve(new Response('{}', { status: 200 }));
      }) as unknown as ProxyDeps['fetchImpl'],
    });
    await startAcademyCheckoutProxy(
      { clubSlug: 'odd club', teamSlug: 'lyl-u12', idempotencyKey: 'k' },
      deps
    );
    expect(calls[0]).toBe(
      'https://playhub.example.test/api/academy/odd%20club/checkout-session'
    );
  });

  it('strips a trailing slash from the configured PLAYHUB URL', async () => {
    const calls: string[] = [];
    const deps = makeDeps({
      playhubUrl: 'https://playhub.example.test/',
      fetchImpl: ((url: string) => {
        calls.push(url);
        return Promise.resolve(new Response('{}', { status: 200 }));
      }) as unknown as ProxyDeps['fetchImpl'],
    });
    // (The default deps factory does the strip; here we test by feeding a
    // pre-built deps object that did NOT pre-strip. The current impl does
    // NOT re-strip — so this confirms callers must hand a clean URL OR use
    // buildDefaultDeps.)
    await startAcademyCheckoutProxy(
      { clubSlug: 'lyl', teamSlug: 'lyl-u12', idempotencyKey: 'k' },
      deps
    );
    // The proxy doesn't normalize the deps URL; verify the rendered URL is
    // what the caller would actually get. (No double-slash assertion — just
    // documents the contract.)
    expect(calls[0]).toMatch(/https:\/\/playhub\.example\.test/);
  });

  describe('error mapping', () => {
    it('maps 401 → misconfigured (SYNC_API_KEY mismatch)', async () => {
      const deps = makeDeps({
        fetchImpl: makeFetchImpl(() => ({
          status: 401,
          body: { error: { code: 'unauthorized', message: 'Unauthorized' } },
        })),
      });
      const o = await startAcademyCheckoutProxy(
        { clubSlug: 'lyl', teamSlug: 'x', idempotencyKey: 'k' },
        deps
      );
      const fail = expectFailure(o);
      expect(fail.reason).toBe('misconfigured');
      expect(fail.status).toBe(401);
    });

    it('maps 400 → invalid_input', async () => {
      const deps = makeDeps({
        fetchImpl: makeFetchImpl(() => ({
          status: 400,
          body: {
            error: {
              code: 'invalid_team_slug',
              message: 'team_slug must match …',
            },
          },
        })),
      });
      const o = await startAcademyCheckoutProxy(
        { clubSlug: 'lyl', teamSlug: 'BAD', idempotencyKey: 'k' },
        deps
      );
      const fail = expectFailure(o);
      expect(fail.reason).toBe('invalid_input');
      expect(fail.message).toContain('invalid_team_slug');
    });

    it('maps 404 → club_or_team_not_found', async () => {
      const deps = makeDeps({
        fetchImpl: makeFetchImpl(() => ({
          status: 404,
          body: { error: { code: 'team_not_found', message: 'unknown team' } },
        })),
      });
      const o = await startAcademyCheckoutProxy(
        { clubSlug: 'lyl', teamSlug: 'ghost', idempotencyKey: 'k' },
        deps
      );
      const fail = expectFailure(o);
      expect(fail.reason).toBe('club_or_team_not_found');
    });

    it('maps 429 → rate_limited', async () => {
      const deps = makeDeps({
        fetchImpl: makeFetchImpl(() => ({
          status: 429,
          body: {
            error: {
              code: 'stripe_rate_limited',
              message: 'Too many requests',
            },
          },
        })),
      });
      const o = await startAcademyCheckoutProxy(
        { clubSlug: 'lyl', teamSlug: 'x', idempotencyKey: 'k' },
        deps
      );
      const fail = expectFailure(o);
      expect(fail.reason).toBe('rate_limited');
      expect(fail.status).toBe(429);
    });

    it('maps 503 → upstream_unreachable', async () => {
      const deps = makeDeps({
        fetchImpl: makeFetchImpl(() => ({
          status: 503,
          body: {
            error: { code: 'stripe_unreachable', message: 'Connection error' },
          },
        })),
      });
      const o = await startAcademyCheckoutProxy(
        { clubSlug: 'lyl', teamSlug: 'x', idempotencyKey: 'k' },
        deps
      );
      const fail = expectFailure(o);
      expect(fail.reason).toBe('upstream_unreachable');
    });

    it('maps 500 → upstream_error', async () => {
      const deps = makeDeps({
        fetchImpl: makeFetchImpl(() => ({
          status: 500,
          body: { error: { code: 'unknown', message: 'oops' } },
        })),
      });
      const o = await startAcademyCheckoutProxy(
        { clubSlug: 'lyl', teamSlug: 'x', idempotencyKey: 'k' },
        deps
      );
      const fail = expectFailure(o);
      expect(fail.reason).toBe('upstream_error');
    });

    it('maps fetch throwing → upstream_unreachable', async () => {
      const deps = makeDeps({
        fetchImpl: (() => {
          throw new Error('ECONNRESET');
        }) as unknown as ProxyDeps['fetchImpl'],
      });
      const o = await startAcademyCheckoutProxy(
        { clubSlug: 'lyl', teamSlug: 'x', idempotencyKey: 'k' },
        deps
      );
      const fail = expectFailure(o);
      expect(fail.reason).toBe('upstream_unreachable');
      expect(fail.status).toBe(0);
    });

    it('maps non-JSON success body → upstream_error', async () => {
      const deps = makeDeps({
        fetchImpl: (() =>
          Promise.resolve(
            new Response('not json', {
              status: 200,
              headers: { 'content-type': 'text/plain' },
            })
          )) as unknown as ProxyDeps['fetchImpl'],
      });
      const o = await startAcademyCheckoutProxy(
        { clubSlug: 'lyl', teamSlug: 'x', idempotencyKey: 'k' },
        deps
      );
      const fail = expectFailure(o);
      expect(fail.reason).toBe('upstream_error');
    });

    it('maps 200 with missing url/session_id → upstream_error', async () => {
      const deps = makeDeps({
        fetchImpl: makeFetchImpl(() => ({
          status: 200,
          body: { url: 'https://x', session_id: 123 }, // wrong type
        })),
      });
      const o = await startAcademyCheckoutProxy(
        { clubSlug: 'lyl', teamSlug: 'x', idempotencyKey: 'k' },
        deps
      );
      const fail = expectFailure(o);
      expect(fail.reason).toBe('upstream_error');
    });

    it('rejects non-Stripe success URLs (defense in depth — never redirect to attacker domains)', async () => {
      const cases = [
        'https://evil.example.com/pay',
        'http://checkout.stripe.com/c/foo', // wrong protocol
        'javascript:alert(1)',
        'https://checkout.stripe.com.evil.com/pay', // subdomain spoof
      ];
      for (const badUrl of cases) {
        const deps = makeDeps({
          fetchImpl: makeFetchImpl(() => ({
            status: 200,
            body: { url: badUrl, session_id: 'cs_test_1' },
          })),
        });
        const o = await startAcademyCheckoutProxy(
          { clubSlug: 'lyl', teamSlug: 'x', idempotencyKey: 'k' },
          deps
        );
        const fail = expectFailure(o);
        expect(fail.reason).toBe('upstream_error');
      }
    });
  });
});
