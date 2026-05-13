import { describe, it, expect, vi } from 'vitest';
import {
  provisionPendingProxy,
  type ProxyDeps,
  type PendingOutcome,
} from '../provision-pending-proxy';

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
      body: { total: 2, successes: 2, failures: 0, security_failures: 0 },
    })),
    ...overrides,
  };
}

const VALID_UUID = '11111111-2222-3333-4444-555555555555';

function expectOk(o: PendingOutcome) {
  expect(o.kind).toBe('ok');
  return o as Extract<PendingOutcome, { kind: 'ok' }>;
}
function expectFailure(o: PendingOutcome) {
  expect(o.kind).toBe('failure');
  return o as Extract<PendingOutcome, { kind: 'failure' }>;
}

describe('provisionPendingProxy', () => {
  it('fails closed (misconfigured, no fetch) when SYNC_API_KEY empty', async () => {
    const fetchImpl = vi.fn();
    const o = await provisionPendingProxy(
      { userId: VALID_UUID },
      { playhubUrl: 'https://playhub.example.test', apiKey: '', fetchImpl }
    );
    const fail = expectFailure(o);
    expect(fail.reason).toBe('misconfigured');
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it('rejects malformed user ids without hitting PLAYHUB', async () => {
    const fetchImpl = vi.fn();
    for (const bad of [
      '',
      'not-a-uuid',
      '123',
      '11111111-2222-3333-4444-55555555555', // one short
      '<script>',
    ]) {
      const o = await provisionPendingProxy(
        { userId: bad },
        { playhubUrl: 'https://playhub.example.test', apiKey: 'k', fetchImpl }
      );
      const fail = expectFailure(o);
      expect(fail.reason).toBe('invalid_input');
    }
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it('happy path returns the summary counts (incl. security_failures)', async () => {
    const o = await provisionPendingProxy({ userId: VALID_UUID }, makeDeps());
    const ok = expectOk(o);
    expect(ok.summary).toEqual({
      total: 2,
      successes: 2,
      failures: 0,
      security_failures: 0,
    });
  });

  it('defaults security_failures to 0 if PLAYHUB omits it (compat with pre-rename builds)', async () => {
    const deps = makeDeps({
      fetchImpl: makeFetchImpl(() => ({
        status: 200,
        body: { total: 1, successes: 1, failures: 0 },
      })),
    });
    const o = await provisionPendingProxy({ userId: VALID_UUID }, deps);
    const ok = expectOk(o);
    expect(ok.summary.security_failures).toBe(0);
  });

  it('sends POST to /api/users/[userId]/provision-pending with x-api-key', async () => {
    const calls: { url: string; init: RequestInit }[] = [];
    const deps = makeDeps({
      fetchImpl: ((url: string, init: RequestInit) => {
        calls.push({ url, init });
        return Promise.resolve(
          new Response(
            JSON.stringify({
              total: 0,
              successes: 0,
              failures: 0,
              security_failures: 0,
            }),
            { status: 200, headers: { 'content-type': 'application/json' } }
          )
        );
      }) as unknown as ProxyDeps['fetchImpl'],
    });
    await provisionPendingProxy({ userId: VALID_UUID }, deps);
    expect(calls).toHaveLength(1);
    // userId in path, not body — `/users/[userId]/...` resource shape
    // (not `/me/...` — the user is supplied by the caller).
    expect(calls[0].url).toBe(
      `https://playhub.example.test/api/users/${VALID_UUID}/provision-pending`
    );
    expect(calls[0].init.method).toBe('POST');
    expect((calls[0].init.headers as Record<string, string>)['x-api-key']).toBe(
      'sync-key-abc'
    );
    // Body is empty object — no user_id duplication.
    expect(calls[0].init.body).toBe('{}');
  });

  it('maps 401 → misconfigured, 400 → invalid_input, 503 → transient, 5xx → upstream_error', async () => {
    const cases: Array<{
      status: number;
      reason: Extract<PendingOutcome, { kind: 'failure' }>['reason'];
    }> = [
      { status: 401, reason: 'misconfigured' },
      { status: 400, reason: 'invalid_input' },
      { status: 503, reason: 'transient' },
      { status: 500, reason: 'upstream_error' },
    ];
    for (const c of cases) {
      const deps = makeDeps({
        fetchImpl: makeFetchImpl(() => ({
          status: c.status,
          body: { error: { code: 'x', message: 'y' } },
        })),
      });
      const o = await provisionPendingProxy({ userId: VALID_UUID }, deps);
      const fail = expectFailure(o);
      expect(fail.reason).toBe(c.reason);
      expect(fail.status).toBe(c.status);
    }
  });

  it('maps fetch throwing → upstream_unreachable', async () => {
    const deps = makeDeps({
      fetchImpl: (() => {
        throw new Error('ECONNRESET');
      }) as unknown as ProxyDeps['fetchImpl'],
    });
    const o = await provisionPendingProxy({ userId: VALID_UUID }, deps);
    const fail = expectFailure(o);
    expect(fail.reason).toBe('upstream_unreachable');
  });

  it('maps malformed success body → upstream_error', async () => {
    const deps = makeDeps({
      fetchImpl: makeFetchImpl(() => ({
        status: 200,
        body: { total: 'three' }, // wrong types
      })),
    });
    const o = await provisionPendingProxy({ userId: VALID_UUID }, deps);
    const fail = expectFailure(o);
    expect(fail.reason).toBe('upstream_error');
  });
});
