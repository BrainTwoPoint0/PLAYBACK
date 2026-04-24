'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@braintwopoint0/playback-commons/auth';
import { LumaSpin, SignInForm } from '@braintwopoint0/playback-commons/ui';
import posthog from 'posthog-js';

function LoginScreen() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const [initialError, setInitialError] = useState<string | undefined>(
    undefined
  );

  useEffect(() => {
    const urlError = searchParams.get('error');
    if (urlError) {
      setInitialError(decodeURIComponent(urlError));
    }
  }, [searchParams]);

  useEffect(() => {
    if (user) {
      router.push('/dashboard');
    }
  }, [user, router]);

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4"
      style={{ backgroundColor: 'var(--night)' }}
    >
      <div className="w-full max-w-md">
        <SignInForm
          subtitle="Sign in to your PLAYBACK account to continue your journey"
          forgotPasswordHref="/auth/forgot-password"
          signUpHref="/auth/register"
          initialError={initialError}
          onSuccess={(email) => {
            posthog.identify(email);
            posthog.capture('user_logged_in', { email });
            router.push('/dashboard');
          }}
        />
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div
          className="min-h-screen flex items-center justify-center"
          style={{ backgroundColor: 'var(--night)' }}
        >
          <LumaSpin />
        </div>
      }
    >
      <LoginScreen />
    </Suspense>
  );
}
