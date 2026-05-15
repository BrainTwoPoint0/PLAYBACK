// Unit tests for the PLAYBACK → PLAYHUB session-lookup proxy.

import { describe, it, expect, vi } from 'vitest';
import {
  lookupAcademySessionProxy,
  type ProxyDeps,
  type LookupOutcome,
} from '../session-lookup-proxy';

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
        customer_email: 'parent@example.com',
        customer_name: 'Test Parent',
        club_slug: 'lyl',
        club_name: 'London Youth League',
        team_slug: 'lyl-u12-tigers',
      },
    })),
    ...overrides,
  };
}

function expectFound(o: LookupOutcome) {
  expect(o.kind).toBe('found');
  return o as Extract<LookupOutcome, { kind: 'found' }>;
}
function expectFailure(o: LookupOutcome) {
  expect(o.kind).toBe('failure');
  return o as Extract<LookupOutcome, { kind: 'failure' }>;
}

describe('lookupAcademySessionProxy', () => {
  it('fails closed (misconfigured, no fetch) when SYNC_API_KEY empty', async () => {
    const fetchImpl = vi.fn();
    const o = await lookupAcademySessionProxy(
      { sessionId: 'cs_live_aaaaaaaaaaaaaaaaaaaa' },
      { playhubUrl: 'https://playhub.example.test', apiKey: '', fetchImpl }
    );
    const fail = expectFailure(o);
    expect(fail.reason).toBe('misconfigured');
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it('rejects malformed session ids without hitting PLAYHUB', async () => {
    const calls: number = 0;
    const fetchImpl = vi.fn();
    for (const bad of [
      '',
      'not-a-stripe-id',
      'cs_live_short',
      'cs_test_<script>',
      'CS_LIVE_AAAAAAAAAA',
    ]) {
      const o = await lookupAcademySessionProxy(
        { sessionId: bad },
        { playhubUrl: 'https://playhub.example.test', apiKey: 'k', fetchImpl }
      );
      const fail = expectFailure(o);
      expect(fail.reason).toBe('invalid_session_id');
    }
    expect(fetchImpl).not.toHaveBeenCalled();
    expect(calls).toBe(0);
  });

  it('happy path: returns the safe subset', async () => {
    const o = await lookupAcademySessionProxy(
      { sessionId: 'cs_live_aaaaaaaaaaaaaaaaaaaa' },
      makeDeps()
    );
    const ok = expectFound(o);
    expect(ok.data).toEqual({
      customer_email: 'parent@example.com',
      customer_name: 'Test Parent',
      club_slug: 'lyl',
      club_name: 'London Youth League',
      team_slug: 'lyl-u12-tigers',
      // E.2: PLAYHUB pre-E.2 builds omit these — proxy coerces missing
      // values to null. Default fixture has no subclub_* in body so the
      // expected output is null.
      subclub_slug: null,
      subclub_name: null,
    });
  });

  it('hierarchical: surfaces subclub_slug + subclub_name when PLAYHUB returns them', async () => {
    const deps = makeDeps({
      fetchImpl: makeFetchImpl(() => ({
        status: 200,
        body: {
          customer_email: 'parent@example.com',
          customer_name: 'Test Parent',
          club_slug: 'lyl',
          club_name: 'London Youth League',
          team_slug: 'u12-tigers',
          subclub_slug: 'barnes-eagles',
          subclub_name: 'Barnes Eagles',
        },
      })),
    });
    const o = await lookupAcademySessionProxy(
      { sessionId: 'cs_live_aaaaaaaaaaaaaaaaaaaa' },
      deps
    );
    const ok = expectFound(o);
    expect(ok.data.subclub_slug).toBe('barnes-eagles');
    expect(ok.data.subclub_name).toBe('Barnes Eagles');
  });

  it('coerces non-string subclub_* fields from PLAYHUB to null (defence in depth)', async () => {
    const deps = makeDeps({
      fetchImpl: makeFetchImpl(() => ({
        status: 200,
        body: {
          customer_email: 'parent@example.com',
          customer_name: null,
          club_slug: 'lyl',
          club_name: 'London Youth League',
          team_slug: 'u12-tigers',
          // PLAYHUB shouldn't ever emit these shapes, but if it did we
          // must NOT crash the register page — coerce to null.
          subclub_slug: 42,
          subclub_name: { evil: 'object' },
        },
      })),
    });
    const o = await lookupAcademySessionProxy(
      { sessionId: 'cs_live_aaaaaaaaaaaaaaaaaaaa' },
      deps
    );
    const ok = expectFound(o);
    expect(ok.data.subclub_slug).toBeNull();
    expect(ok.data.subclub_name).toBeNull();
  });

  it('sends GET with x-api-key header', async () => {
    const calls: { url: string; init: RequestInit }[] = [];
    const deps = makeDeps({
      fetchImpl: ((url: string, init: RequestInit) => {
        calls.push({ url, init });
        return Promise.resolve(
          new Response(
            JSON.stringify({
              customer_email: 'parent@example.com',
              customer_name: null,
              club_slug: 'lyl',
              club_name: 'LYL',
              team_slug: 'lyl-u12',
            }),
            { status: 200, headers: { 'content-type': 'application/json' } }
          )
        );
      }) as unknown as ProxyDeps['fetchImpl'],
    });
    await lookupAcademySessionProxy(
      { sessionId: 'cs_live_aaaaaaaaaaaaaaaaaaaa' },
      deps
    );
    expect(calls).toHaveLength(1);
    expect(calls[0].url).toBe(
      'https://playhub.example.test/api/academy/sessions/cs_live_aaaaaaaaaaaaaaaaaaaa'
    );
    expect(calls[0].init.method).toBe('GET');
    const headers = calls[0].init.headers as Record<string, string>;
    expect(headers['x-api-key']).toBe('sync-key-abc');
  });

  it('maps 404 → not_found', async () => {
    const deps = makeDeps({
      fetchImpl: makeFetchImpl(() => ({
        status: 404,
        body: { error: { code: 'not_found', message: 'Session not found' } },
      })),
    });
    const o = await lookupAcademySessionProxy(
      { sessionId: 'cs_live_aaaaaaaaaaaaaaaaaaaa' },
      deps
    );
    const fail = expectFailure(o);
    expect(fail.reason).toBe('not_found');
  });

  it('maps 503 → transient', async () => {
    const deps = makeDeps({
      fetchImpl: makeFetchImpl(() => ({
        status: 503,
        body: { error: { code: 'transient', message: 'Stripe down' } },
      })),
    });
    const o = await lookupAcademySessionProxy(
      { sessionId: 'cs_live_aaaaaaaaaaaaaaaaaaaa' },
      deps
    );
    const fail = expectFailure(o);
    expect(fail.reason).toBe('transient');
  });

  it('maps 401 → misconfigured', async () => {
    const deps = makeDeps({
      fetchImpl: makeFetchImpl(() => ({
        status: 401,
        body: { error: { code: 'unauthorized', message: 'Unauthorized' } },
      })),
    });
    const o = await lookupAcademySessionProxy(
      { sessionId: 'cs_live_aaaaaaaaaaaaaaaaaaaa' },
      deps
    );
    const fail = expectFailure(o);
    expect(fail.reason).toBe('misconfigured');
  });

  it('maps fetch throwing → upstream_unreachable', async () => {
    const deps = makeDeps({
      fetchImpl: (() => {
        throw new Error('ECONNRESET');
      }) as unknown as ProxyDeps['fetchImpl'],
    });
    const o = await lookupAcademySessionProxy(
      { sessionId: 'cs_live_aaaaaaaaaaaaaaaaaaaa' },
      deps
    );
    const fail = expectFailure(o);
    expect(fail.reason).toBe('upstream_unreachable');
  });

  it('maps 200 with missing fields → upstream_error', async () => {
    const deps = makeDeps({
      fetchImpl: makeFetchImpl(() => ({
        status: 200,
        body: { customer_email: 'parent@example.com' }, // missing club/team
      })),
    });
    const o = await lookupAcademySessionProxy(
      { sessionId: 'cs_live_aaaaaaaaaaaaaaaaaaaa' },
      deps
    );
    const fail = expectFailure(o);
    expect(fail.reason).toBe('upstream_error');
  });
});
