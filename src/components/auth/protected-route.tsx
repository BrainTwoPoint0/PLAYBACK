'use client';

import { useEffect } from 'react';
import { useRouter } from '@/i18n/navigation';
import { useTranslations } from 'next-intl';
import { useAuth } from '@braintwopoint0/playback-commons/auth';
import { LumaSpin } from '@braintwopoint0/playback-commons/ui';

// NOTE: `requiredRole` was previously implemented by reading
// `user.user_metadata.role`. That field is **client-writable** via the
// Supabase `updateUser()` API — any signed-in user could mint themselves
// the required role. Removed entirely to prevent accidental reuse for an
// admin-gated route. Real role gating must come from a server-validated
// claim (Supabase JWT custom claim, RLS check, or a server-side
// `is_admin`/`is_platform_admin` lookup).
interface ProtectedRouteProps {
  children: React.ReactNode;
  redirectTo?: string;
}

export function ProtectedRoute({
  children,
  redirectTo = '/auth/login',
}: ProtectedRouteProps) {
  const t = useTranslations('media');
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push(redirectTo);
    }
  }, [user, loading, router, redirectTo]);

  // Show loading while checking auth. `text-center` alone doesn't center the
  // LumaSpin (it's a block element); use a flex column with items-center so
  // both the spinner and the text sit on the same vertical axis.
  if (loading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: 'var(--night)' }}
      >
        <div className="flex flex-col items-center gap-3">
          <LumaSpin />
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
            {t('checkingAuth')}
          </p>
        </div>
      </div>
    );
  }

  // Don't render anything if not authenticated (redirect will happen)
  if (!user) {
    return null;
  }

  return <>{children}</>;
}

// Higher-order component version
export function withAuth<P extends object>(Component: React.ComponentType<P>) {
  return function AuthenticatedComponent(props: P) {
    return (
      <ProtectedRoute>
        <Component {...props} />
      </ProtectedRoute>
    );
  };
}
