import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

const mocks = vi.hoisted(() => ({
  createServerClient: vi.fn(),
}));

vi.mock('@supabase/ssr', () => ({
  createServerClient: mocks.createServerClient,
}));

import { middleware } from '../middleware';

type CookieToSet = {
  name: string;
  value: string;
  options?: Record<string, unknown>;
};

// Configures the Supabase mock. `refreshedCookies` simulates a token refresh
// (the SSR client writing new sb-* cookies via setAll); `error` simulates a
// failed refresh; `session` controls whether route protection sees a user.
function mockSupabase({
  refreshedCookies = [] as CookieToSet[],
  error = null as { status?: number } | null,
  session = false,
} = {}) {
  mocks.createServerClient.mockImplementation(
    (
      _url: string,
      _key: string,
      config: { cookies: { setAll: (c: CookieToSet[]) => void } }
    ) => ({
      auth: {
        getSession: vi.fn(async () => {
          if (refreshedCookies.length > 0) {
            config.cookies.setAll(refreshedCookies);
          }
          return {
            data: { session: session ? { user: { id: 'u1' } } : null },
            error,
          };
        }),
      },
    })
  );
}

function makeRequest(path: string, cookies: Record<string, string> = {}) {
  const cookieHeader = Object.entries(cookies)
    .map(([k, v]) => `${k}=${v}`)
    .join('; ');
  return new NextRequest(`http://localhost:3000${path}`, {
    headers: {
      ...(cookieHeader && { cookie: cookieHeader }),
      'accept-language': 'en',
    },
  });
}

beforeEach(() => {
  mocks.createServerClient.mockReset();
});

describe('middleware composition (Supabase + next-intl)', () => {
  it('rewrites unprefixed pages to the default locale', async () => {
    mockSupabase();
    const res = await middleware(makeRequest('/playscanner'));
    const rewrite = res.headers.get('x-middleware-rewrite');
    expect(rewrite).toContain('/en/playscanner');
  });

  it('keeps the /ar prefix on Arabic routes', async () => {
    mockSupabase();
    const res = await middleware(makeRequest('/ar/playscanner'));
    expect(res.status).toBeLessThan(300); // no redirect loop
    const rewrite = res.headers.get('x-middleware-rewrite');
    if (rewrite) expect(rewrite).toContain('/ar/playscanner');
  });

  it('forwards refreshed Supabase cookies onto the rewritten response', async () => {
    mockSupabase({
      refreshedCookies: [
        { name: 'sb-test-auth-token', value: 'refreshed', options: {} },
      ],
      session: true,
    });
    const res = await middleware(
      makeRequest('/playscanner', { 'sb-test-auth-token': 'stale' })
    );
    expect(res.headers.get('x-middleware-rewrite')).toContain(
      '/en/playscanner'
    );
    expect(res.cookies.get('sb-test-auth-token')?.value).toBe('refreshed');
  });

  it('clears stale sb-* cookies on auth error but preserves the PKCE code-verifier', async () => {
    mockSupabase({ error: { status: 400 } });
    const res = await middleware(
      makeRequest('/playscanner', {
        'sb-test-auth-token': 'stale',
        'sb-test-auth-token-code-verifier': 'keep-me',
      })
    );
    const cleared = res.cookies.get('sb-test-auth-token');
    expect(cleared?.value).toBe('');
    expect(cleared?.maxAge).toBe(0);
    expect(res.cookies.get('sb-test-auth-token-code-verifier')).toBeUndefined();
  });

  it('clears stale cookies on a locale-normalization 307', async () => {
    // /en/playscanner 307s to /playscanner under localePrefix 'as-needed' —
    // the maxAge:0 deletions must ride the redirect response.
    mockSupabase({ error: { status: 400 } });
    const res = await middleware(
      makeRequest('/en/playscanner', { 'sb-test-auth-token': 'stale' })
    );
    expect(res.status).toBe(307);
    expect(res.cookies.get('sb-test-auth-token')?.maxAge).toBe(0);
  });

  it('does not clear cookies on rate limit (429)', async () => {
    mockSupabase({ error: { status: 429 } });
    const res = await middleware(
      makeRequest('/playscanner', { 'sb-test-auth-token': 'value' })
    );
    expect(res.cookies.get('sb-test-auth-token')).toBeUndefined();
  });

  it('bypasses locale routing for /api routes but still refreshes the session', async () => {
    mockSupabase();
    const res = await middleware(makeRequest('/api/sports'));
    expect(res.headers.get('x-middleware-rewrite')).toBeNull();
    expect(mocks.createServerClient).toHaveBeenCalledTimes(1);
  });

  it('bypasses locale routing for the Supabase auth callback', async () => {
    mockSupabase();
    const res = await middleware(makeRequest('/auth/callback?code=abc'));
    expect(res.headers.get('x-middleware-rewrite')).toBeNull();
  });

  it('bypasses locale routing for Sanity Studio', async () => {
    mockSupabase();
    const res = await middleware(makeRequest('/studio/structure'));
    expect(res.headers.get('x-middleware-rewrite')).toBeNull();
    expect(res.status).toBe(200);
  });

  it('redirects anonymous users off protected paths, preserving path in redirectTo', async () => {
    mockSupabase();
    const res = await middleware(makeRequest('/dashboard/settings'));
    expect(res.status).toBeGreaterThanOrEqual(307);
    const location = new URL(res.headers.get('location')!);
    expect(location.pathname).toBe('/auth/login');
    expect(location.searchParams.get('redirectTo')).toBe('/dashboard/settings');
  });

  it('keeps the locale prefix on protected-path redirects', async () => {
    mockSupabase();
    const res = await middleware(makeRequest('/ar/dashboard'));
    const location = new URL(res.headers.get('location')!);
    expect(location.pathname).toBe('/ar/auth/login');
    // Bare path: the login page's i18n router re-applies the /ar prefix.
    expect(location.searchParams.get('redirectTo')).toBe('/dashboard');
  });

  it('redirects authenticated users off auth pages within their locale', async () => {
    mockSupabase({ session: true });
    const res = await middleware(makeRequest('/es/auth/login'));
    const location = new URL(res.headers.get('location')!);
    expect(location.pathname).toBe('/es/dashboard');
  });

  it('does not treat /ar/auth/callback as an auth page redirect target', async () => {
    // callback is a route handler — even with a session it must pass through
    // untouched so the PKCE exchange can complete.
    mockSupabase({ session: true });
    const res = await middleware(makeRequest('/auth/callback?code=abc'));
    expect(res.headers.get('location')).toBeNull();
  });

  it('sets security headers on every response', async () => {
    mockSupabase();
    for (const path of ['/playscanner', '/api/sports', '/auth/callback']) {
      const res = await middleware(makeRequest(path));
      expect(res.headers.get('X-Content-Type-Options')).toBe('nosniff');
      expect(res.headers.get('X-Frame-Options')).toBe('DENY');
      expect(res.headers.get('Referrer-Policy')).toBe(
        'strict-origin-when-cross-origin'
      );
    }
  });
});
