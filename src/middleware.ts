import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import { checkOnboardingStatusServer } from '@/lib/onboarding/server-utils';

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // This will refresh session if expired - required for Server Components
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;

  // Define paths that require authentication
  const protectedPaths = ['/dashboard', '/onboarding'];

  // Define paths that should redirect authenticated users
  const authPaths = ['/auth/login', '/auth/register', '/auth/forgot-password'];

  // Define paths that require onboarding completion (subset of protected paths)
  const onboardingRequiredPaths = ['/dashboard', '/profile'];

  const isProtectedPath = protectedPaths.some((path) =>
    pathname.startsWith(path)
  );
  const isAuthPath = authPaths.some((path) => pathname.startsWith(path));
  const requiresOnboarding = onboardingRequiredPaths.some((path) =>
    pathname.startsWith(path)
  );

  // If user is not authenticated and trying to access protected route
  if (!user && isProtectedPath) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = '/auth/login';
    redirectUrl.searchParams.set('redirectTo', pathname);
    return NextResponse.redirect(redirectUrl);
  }

  // If user is authenticated and trying to access auth pages, redirect to dashboard
  if (user && isAuthPath) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = '/dashboard';
    return NextResponse.redirect(redirectUrl);
  }

  // Check onboarding status only for routes that require onboarding completion
  if (user && requiresOnboarding) {
    try {
      const onboardingResult = await checkOnboardingStatusServer(
        user.id,
        request
      );

      // If onboarding is not complete, redirect to onboarding
      if (!onboardingResult.isComplete) {
        const redirectUrl = request.nextUrl.clone();
        redirectUrl.pathname = '/onboarding';
        return NextResponse.redirect(redirectUrl);
      }
    } catch (error) {
      // If there's an error checking onboarding status, let the request proceed
      // The client-side will handle the error appropriately
      console.error('Middleware onboarding check error:', error);
    }
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * Feel free to modify this pattern to include more paths.
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
