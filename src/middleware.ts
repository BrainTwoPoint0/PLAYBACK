import { createServerClient } from '@supabase/ssr';
import createIntlMiddleware from 'next-intl/middleware';
import { NextResponse, type NextRequest } from 'next/server';
import { routing } from '@/i18n/routing';

const handleI18nRouting = createIntlMiddleware(routing);

// Paths that must bypass locale routing entirely. /auth/callback and
// /auth/confirm are route handlers wired into Supabase dashboard redirect
// URLs — a locale rewrite/redirect there would break the PKCE exchange.
// /studio is Sanity Studio, whose sanity.config.ts hardcodes basePath:
// '/studio' and manages its own client-side routing.
function isIntlPath(pathname: string) {
  return (
    !pathname.startsWith('/api') &&
    !pathname.startsWith('/auth/callback') &&
    !pathname.startsWith('/auth/confirm') &&
    !pathname.startsWith('/studio') &&
    !pathname.includes('.') // files (images, manifests, …)
  );
}

// Splits '/ar/dashboard' into { prefix: '/ar', bare: '/dashboard' } so route
// protection matches the same paths regardless of the active locale, and
// redirects can stay inside it.
function splitLocalePrefix(pathname: string) {
  for (const locale of routing.locales) {
    if (locale === routing.defaultLocale) continue;
    if (pathname === `/${locale}`) return { prefix: `/${locale}`, bare: '/' };
    if (pathname.startsWith(`/${locale}/`)) {
      return { prefix: `/${locale}`, bare: pathname.slice(locale.length + 1) };
    }
  }
  return { prefix: '', bare: pathname };
}

// Paths that require authentication. This middleware match is ADVISORY
// (best-effort UX redirect) — real enforcement is server-side: /admin goes
// through requireAdmin() (getUser() + profiles.is_admin) in
// src/app/[locale]/admin/layout.tsx, and every /dashboard data path
// re-authenticates via getUser() + RLS. Do not add data access that trusts
// this check alone.
const protectedPaths = ['/dashboard', '/admin'];

// Paths that should redirect authenticated users
const authPaths = ['/auth/login', '/auth/register', '/auth/forgot-password'];

type PendingCookie = {
  name: string;
  value: string;
  options?: Record<string, unknown>;
};

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const cookieDomain = process.env.NEXT_PUBLIC_COOKIE_DOMAIN;

  // ── Phase A: Supabase session refresh ──────────────────────────────────
  // Cookie writes mutate request.cookies (so the locale rewrite below
  // forwards refreshed tokens to server code) and are buffered so Phase C
  // can replay them as Set-Cookie headers onto whatever response
  // next-intl produces.
  const pendingCookies: PendingCookie[] = [];

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      ...(cookieDomain && {
        cookieOptions: { domain: cookieDomain },
      }),
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(
          cookiesToSet: {
            name: string;
            value: string;
            options?: Record<string, unknown>;
          }[]
        ) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          pendingCookies.push(...cookiesToSet);
        },
      },
    }
  );

  // Use getSession() instead of getUser() to refresh the token.
  // getSession() only makes a network call when the JWT is expired and
  // needs refreshing (~once per hour). getUser() calls Supabase Auth on
  // EVERY request, which quickly burns through the ~30 req/min rate limit.
  // Route protection below only needs "is a session present" — pages behind
  // it re-verify server-side (requireAuth / requireAdmin / RLS).
  const isPageOrApi = pathname.startsWith('/api/') || !pathname.includes('.');
  let hasSession = false;

  if (isPageOrApi) {
    const { data, error } = await supabase.auth.getSession();
    hasSession = !!data.session;

    // If token refresh failed with an auth error (invalid/expired refresh
    // token), clear cookies. Do NOT clear on rate limit (429) or if
    // there's simply no session (user never logged in).
    if (error && error.status !== 429) {
      hasSession = false;
      // Clear stale session cookies but preserve in-flight auth flow state:
      // the `code-verifier` cookie is part of the PKCE password-reset /
      // magic-link flow and wiping it breaks exchangeCodeForSession.
      const staleCookies = request.cookies
        .getAll()
        .filter(
          (c) => c.name.startsWith('sb-') && !c.name.includes('code-verifier')
        );
      for (const cookie of staleCookies) {
        request.cookies.delete(cookie.name);
        pendingCookies.push({
          name: cookie.name,
          value: '',
          options: {
            maxAge: 0,
            path: '/',
            ...(cookieDomain && { domain: cookieDomain }),
          },
        });
      }
    }
  }

  // ── Phase B: route protection + locale routing ─────────────────────────
  // Protection matches on the locale-stripped path and redirects stay in
  // the visitor's locale.
  const { prefix, bare } = splitLocalePrefix(pathname);
  const isProtectedPath = protectedPaths.some((path) => bare.startsWith(path));
  const isAuthPath = authPaths.some((path) => bare.startsWith(path));

  let response: NextResponse;
  if (!hasSession && isProtectedPath) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = `${prefix}/auth/login`;
    redirectUrl.search = '';
    redirectUrl.searchParams.set('redirectTo', pathname);
    response = NextResponse.redirect(redirectUrl);
  } else if (hasSession && isAuthPath) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = `${prefix}/dashboard`;
    redirectUrl.search = '';
    response = NextResponse.redirect(redirectUrl);
  } else if (isIntlPath(pathname)) {
    // Rewrites /dashboard → /[locale]/dashboard internally (or 307-redirects
    // for locale prefix normalization). Sees the already-refreshed request
    // cookies.
    response = handleI18nRouting(request);
  } else {
    response = NextResponse.next({ request });
  }

  // ── Phase C: replay Supabase cookie mutations onto the final response ──
  // Set-Cookie is honored by browsers on 307 redirects too, so deletions
  // and refreshes survive next-intl's locale redirects.
  for (const { name, value, options } of pendingCookies) {
    response.cookies.set(name, value, options as never);
  }

  // Security headers
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
