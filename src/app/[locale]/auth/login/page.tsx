'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useRouter } from '@/i18n/navigation';
import { useAuth } from '@braintwopoint0/playback-commons/auth';
import { LumaSpin, SignInForm } from '@braintwopoint0/playback-commons/ui';
import { sanitizeRedirect } from '@braintwopoint0/playback-commons/utils';
import { useAuthErrorMessages } from '@/lib/auth/use-auth-error-messages';
import posthog from 'posthog-js';

// ?error= carries a fixed code set by our own auth route handlers
// (auth/confirm, auth/callback). Unknown values render the generic message
// instead of being reflected — the param is attacker-writable in links.
const URL_ERROR_KEYS: Record<string, string> = {
  reset_link_invalid: 'login.urlErrors.resetLinkInvalid',
  verification_failed: 'login.urlErrors.verificationFailed',
};

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
      // Object.hasOwn: the param is attacker-writable — a value like
      // 'constructor' must not resolve through the prototype chain.
      setInitialError(
        t(
          Object.hasOwn(URL_ERROR_KEYS, urlError)
            ? URL_ERROR_KEYS[urlError]
            : 'login.urlErrors.generic'
        )
      );
    }
  }, [searchParams, t]);

  // The middleware bounces protected paths here with ?redirectTo=<bare
  // path> (locale-less — the i18n router below re-applies the active
  // locale). sanitizeRedirect enforces relative-only and returns '/' for
  // anything suspicious; absent param falls back to the dashboard.
  const redirectTo = searchParams.get('redirectTo');
  const postLoginTarget = redirectTo
    ? sanitizeRedirect(redirectTo)
    : '/dashboard';

  useEffect(() => {
    if (user) {
      router.push(postLoginTarget);
    }
  }, [user, router, postLoginTarget]);

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
            router.push(postLoginTarget);
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
