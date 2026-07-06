'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useRouter } from '@/i18n/navigation';
import { useAuth } from '@braintwopoint0/playback-commons/auth';
import { LumaSpin, SignInForm } from '@braintwopoint0/playback-commons/ui';
import { useAuthErrorMessages } from '@/lib/auth/use-auth-error-messages';
import posthog from 'posthog-js';

function LoginScreen() {
  const t = useTranslations('auth');
  const authErrorMessages = useAuthErrorMessages();
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
          authErrorMessages={authErrorMessages}
          title={t('login.title')}
          subtitle={t('login.subtitle')}
          emailPlaceholder={t('common.emailPlaceholder')}
          emailLabel={t('login.form.emailLabel')}
          passwordLabel={t('login.form.passwordLabel')}
          passwordPlaceholder={t('login.form.passwordPlaceholder')}
          submitLabel={t('login.form.submit')}
          submittingLabel={t('login.form.submitting')}
          forgotPasswordLabel={t('login.form.forgotPassword')}
          noAccountPrompt={t('login.form.noAccount')}
          signUpLabel={t('login.form.signUp')}
          showPasswordAriaLabel={t('login.form.showPassword')}
          hidePasswordAriaLabel={t('login.form.hidePassword')}
          errorFillAllFields={t('login.form.errors.fillAllFields')}
          errorInvalidEmail={t('login.form.errors.invalidEmail')}
          // t.raw: the commons form substitutes {seconds} itself, so the raw
          // ICU template must pass through unformatted.
          errorTooManyAttempts={t.raw('login.form.errors.tooManyAttempts')}
          errorUnexpected={t('login.form.errors.unexpected')}
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
