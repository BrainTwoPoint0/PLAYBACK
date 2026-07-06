'use client';

import { useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from '@/i18n/navigation';
import { useAuth } from '@braintwopoint0/playback-commons/auth';
import { Button } from '@braintwopoint0/playback-commons/ui';

export default function VerifyEmailPage() {
  const t = useTranslations('auth.verifyEmail');
  const { user, signOut } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (user && user.email_confirmed_at) {
      // If already verified, send to dashboard
      router.push('/dashboard');
    }
  }, [user, router]);

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4"
      style={{ backgroundColor: 'var(--night)' }}
    >
      <div className="bg-neutral-800/70 backdrop-blur-xl border border-neutral-700/60 rounded-2xl shadow-2xl p-8 space-y-6 max-w-md text-center">
        <h1
          className="text-2xl font-bold"
          style={{ color: 'var(--timberwolf)' }}
        >
          {t('title')}
        </h1>
        <p style={{ color: 'var(--ash-grey)' }}>
          {t.rich('sentTo', {
            email: user?.email ?? '',
            highlight: (chunks) => (
              <span
                dir="ltr"
                className="font-semibold"
                style={{ color: 'var(--timberwolf)' }}
              >
                {chunks}
              </span>
            ),
          })}
          <br />
          {t('instructions')}
        </p>
        <p className="text-sm" style={{ color: 'var(--ash-grey)' }}>
          {t('closeHint')}
        </p>
        <Button
          onClick={async () => {
            await signOut();
            router.push('/auth/login');
          }}
          className="w-full font-semibold rounded-xl"
          style={{ backgroundColor: 'var(--ash-grey)', color: 'var(--night)' }}
        >
          {t('backToLogin')}
        </Button>
      </div>
    </div>
  );
}
