'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  useAuth,
  validateEmail,
  validatePassword,
  validateUsername,
  getAuthErrorMessage,
} from '@braintwopoint0/playback-commons/auth';
import { createClient } from '@braintwopoint0/playback-commons/supabase';
import { Button, Input, Label } from '@braintwopoint0/playback-commons/ui';
import { LoadingSpinner } from '@/components/ui/loading';
import { AlertCircle, Mail, Lock, Check, X, Loader2 } from 'lucide-react';
import posthog from 'posthog-js';
import {
  lookupAcademySession,
  type AcademySessionLookup,
} from './lookup-academy-session';

// Discriminator for the academy-claim mode. When the parent arrives via
// Stripe success_url the form pre-fills email/name from the resolved
// session and shows club-aware copy. When the lookup hasn't resolved yet
// (or never will — e.g. they shared the link), we fall back to the
// generic register flow.
type AcademyClaim =
  | { state: 'idle' }
  | { state: 'loading' }
  | {
      state: 'ready';
      data: Extract<AcademySessionLookup, { ok: true }>['data'];
    }
  | { state: 'error'; message: string };

export default function RegisterPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [username, setUsername] = useState('');
  const [fullName, setFullName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [usernameStatus, setUsernameStatus] = useState<
    'idle' | 'checking' | 'available' | 'taken' | 'invalid'
  >('idle');
  const [academyClaim, setAcademyClaim] = useState<AcademyClaim>({
    state: 'idle',
  });

  const { signUp, user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const intent = searchParams?.get('intent') ?? null;
  const sessionId = searchParams?.get('session_id') ?? null;

  // Check username availability function
  const checkUsernameAvailability = async (
    username: string
  ): Promise<{ isAvailable: boolean; error?: any }> => {
    const supabase = createClient();

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('username')
        .eq('username', username.trim().toLowerCase())
        .single();

      if (error && error.code === 'PGRST116') {
        // No rows returned - username is available
        return { isAvailable: true };
      }

      if (error) {
        // Other database error
        return { isAvailable: false, error };
      }

      // Username found - not available
      return { isAvailable: false };
    } catch (err) {
      return { isAvailable: false, error: err };
    }
  };

  // If already authenticated, redirect
  useEffect(() => {
    if (user) {
      router.push('/dashboard');
    }
  }, [user, router]);

  // Academy claim flow: parent arrived from Stripe success_url. Resolve the
  // session via PLAYHUB and pre-fill the form. Lookup runs once per
  // sessionId; the email field becomes read-only once resolved (it's bound
  // to the Stripe customer, the parent shouldn't be free to retype it).
  useEffect(() => {
    if (intent !== 'academy' || !sessionId) return;
    let cancelled = false;
    setAcademyClaim({ state: 'loading' });
    lookupAcademySession(sessionId)
      .then((result) => {
        if (cancelled) return;
        if (result.ok) {
          setAcademyClaim({ state: 'ready', data: result.data });
          setEmail(result.data.customerEmail);
          if (result.data.customerName && !fullName) {
            setFullName(result.data.customerName);
          }
        } else if (result.reason === 'transient') {
          setAcademyClaim({
            state: 'error',
            message:
              "We're having trouble loading your subscription details — please refresh in a moment.",
          });
        } else {
          // not_found / config_error: fall back to the generic register
          // flow. The parent can still create an account; the trigger will
          // claim their pending sub when they confirm their email.
          setAcademyClaim({ state: 'idle' });
        }
      })
      .catch(() => {
        if (cancelled) return;
        setAcademyClaim({ state: 'idle' });
      });
    return () => {
      cancelled = true;
    };
    // Only re-run if the URL changes; fullName is intentionally omitted to
    // avoid clobbering edits the user has already made.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [intent, sessionId]);

  // Username availability checking with debounce
  useEffect(() => {
    const checkUsername = async () => {
      if (username.length < 3) {
        setUsernameStatus('idle');
        return;
      }

      const usernameValidation = validateUsername(username);
      if (!usernameValidation.isValid) {
        setUsernameStatus('invalid');
        return;
      }

      setUsernameStatus('checking');

      try {
        const { isAvailable } = await checkUsernameAvailability(username);
        setUsernameStatus(isAvailable ? 'available' : 'taken');
      } catch (error) {
        console.error('Username check error:', error);
        setUsernameStatus('idle');
      }
    };

    const timeoutId = setTimeout(checkUsername, 500);
    return () => clearTimeout(timeoutId);
  }, [username]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Basic validation
    if (!email || !password || !confirmPassword || !username || !fullName) {
      setError('Please fill in all fields');
      return;
    }

    if (!validateEmail(email)) {
      setError('Please enter a valid email address');
      return;
    }

    const usernameValidation = validateUsername(username);
    if (!usernameValidation.isValid) {
      setError(usernameValidation.errors[0]);
      return;
    }

    if (usernameStatus !== 'available') {
      setError('Please choose an available username');
      return;
    }

    if (fullName.trim().length < 2) {
      setError('Full name must be at least 2 characters');
      return;
    }

    const { isValid, errors } = validatePassword(password);
    if (!isValid) {
      setError(errors[0]);
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);
    try {
      const metadata = {
        username: username.trim(),
        full_name: fullName.trim(),
      };

      const { data, error } = await signUp(email, password, metadata);
      if (error) {
        setError(getAuthErrorMessage(error));
      } else if (data?.user) {
        // Check if email already exists using identities array
        // When email confirmation is enabled, existing emails return user with empty identities
        if (data.user.identities && data.user.identities.length === 0) {
          setError(
            'An account with this email already exists. Please sign in instead.'
          );
        } else {
          posthog.identify(data.user.id, { email, username: username.trim() });
          posthog.capture('user_signed_up', {
            email,
            username: username.trim(),
          });
          // Success -> show verify email instructions
          router.push('/auth/verify-email');
        }
      } else {
        setError('Failed to create account. Please try again.');
      }
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4"
      style={{ backgroundColor: 'var(--night)' }}
    >
      {/* Background decoration */}
      <div className="absolute inset-0 bg-gradient-to-br from-neutral-900/50 via-transparent to-neutral-800/30" />

      <div className="relative w-full max-w-md">
        <div className="bg-neutral-800/70 backdrop-blur-xl border border-neutral-700/60 rounded-2xl shadow-2xl p-8 space-y-8">
          {/* Header */}
          <div className="text-center">
            <div className="flex justify-center mb-6">
              <div
                className="w-20 h-20 rounded-xl flex items-center justify-center shadow-lg border border-neutral-700"
                style={{ backgroundColor: 'var(--ash-grey)' }}
              >
                <span
                  className="text-3xl font-bold"
                  style={{ color: 'var(--night)' }}
                >
                  PB
                </span>
              </div>
            </div>
            <h1
              className="text-3xl font-bold mb-2"
              style={{ color: 'var(--timberwolf)' }}
            >
              {academyClaim.state === 'ready'
                ? 'Claim your account'
                : 'Create account'}
            </h1>
            <p style={{ color: 'var(--ash-grey)' }}>
              {academyClaim.state === 'ready' ? (
                <>
                  Thanks for subscribing to{' '}
                  <span style={{ color: 'var(--timberwolf)' }}>
                    {academyClaim.data.clubName}
                  </span>
                  . Set a password to access your team&apos;s recordings.
                </>
              ) : academyClaim.state === 'loading' ? (
                'Loading your subscription details…'
              ) : (
                'Join PLAYBACK and unlock your athletic journey'
              )}
            </p>
          </div>

          {academyClaim.state === 'error' && (
            <div className="bg-yellow-900/20 backdrop-blur border border-yellow-700/30 rounded-xl p-4">
              <div className="flex items-center gap-3 text-yellow-300">
                <AlertCircle className="h-5 w-5" />
                <span className="text-sm">{academyClaim.message}</span>
              </div>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-red-900/20 backdrop-blur border border-red-700/30 rounded-xl p-4">
                <div className="flex items-center gap-3 text-red-400">
                  <AlertCircle className="h-5 w-5" />
                  <span className="text-sm">{error}</span>
                </div>
              </div>
            )}

            {/* Full Name */}
            <div className="space-y-3">
              <Label
                htmlFor="fullName"
                className="font-medium"
                style={{ color: 'var(--timberwolf)' }}
              >
                Full name
              </Label>
              <Input
                id="fullName"
                type="text"
                placeholder="Your full name"
                value={fullName}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setFullName(e.target.value)
                }
                className="h-12"
                disabled={loading}
                autoComplete="name"
              />
            </div>

            {/* Username */}
            <div className="space-y-3">
              <Label
                htmlFor="username"
                className="font-medium"
                style={{ color: 'var(--timberwolf)' }}
              >
                Username
              </Label>
              <div className="relative">
                <Input
                  id="username"
                  type="text"
                  placeholder="Choose a username"
                  value={username}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setUsername(e.target.value)
                  }
                  className={`h-12 pr-12 ${
                    usernameStatus === 'taken' || usernameStatus === 'invalid'
                      ? 'ring-2 ring-red-500'
                      : usernameStatus === 'available'
                        ? 'ring-2 ring-green-500'
                        : ''
                  }`}
                  disabled={loading}
                  autoComplete="username"
                />
                {/* Username status indicator */}
                <div className="absolute right-4 top-3.5">
                  {usernameStatus === 'checking' && (
                    <Loader2 className="h-5 w-5 animate-spin text-blue-400" />
                  )}
                  {usernameStatus === 'available' && (
                    <Check className="h-5 w-5 text-green-400" />
                  )}
                  {usernameStatus === 'taken' && (
                    <X className="h-5 w-5 text-red-400" />
                  )}
                  {usernameStatus === 'invalid' && (
                    <X className="h-5 w-5 text-red-400" />
                  )}
                </div>
              </div>
              {/* Username status message */}
              {usernameStatus === 'taken' && (
                <p className="text-sm text-red-400">
                  This username is already taken
                </p>
              )}
              {usernameStatus === 'available' && (
                <p className="text-sm text-green-400">Username is available</p>
              )}
              {usernameStatus === 'invalid' && (
                <p className="text-sm text-red-400">
                  Username must be 3-30 characters, letters, numbers,
                  underscore, and hyphens only
                </p>
              )}
            </div>

            {/* Email */}
            <div className="space-y-3">
              <Label
                htmlFor="email"
                className="font-medium"
                style={{ color: 'var(--timberwolf)' }}
              >
                Email address
              </Label>
              <div className="relative">
                <Input
                  id="email"
                  type="email"
                  placeholder="athlete@example.com"
                  value={email}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setEmail(e.target.value)
                  }
                  className="h-12 pl-12"
                  // Lock the email field in academy-claim mode — it's bound to
                  // the Stripe customer the parent paid as. Letting them
                  // retype it would create a mismatch with the pending sub
                  // and the salted-account gate would block provisioning.
                  disabled={loading || academyClaim.state === 'ready'}
                  readOnly={academyClaim.state === 'ready'}
                  autoComplete="email"
                />
                <Mail
                  className="h-5 w-5 absolute left-4 top-3.5"
                  style={{ color: 'var(--ash-grey)' }}
                />
              </div>
              {academyClaim.state === 'ready' && (
                <p className="text-xs" style={{ color: 'var(--ash-grey)' }}>
                  Locked to the email you used at checkout. To use a different
                  email, contact support.
                </p>
              )}
            </div>

            {/* Password */}
            <div className="space-y-3">
              <Label
                htmlFor="password"
                className="font-medium"
                style={{ color: 'var(--timberwolf)' }}
              >
                Password
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type="password"
                  placeholder="Create a password"
                  value={password}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setPassword(e.target.value)
                  }
                  className="h-12 pl-12"
                  disabled={loading}
                  autoComplete="new-password"
                />
                <Lock
                  className="h-5 w-5 absolute left-4 top-3.5"
                  style={{ color: 'var(--ash-grey)' }}
                />
              </div>
            </div>

            {/* Confirm Password */}
            <div className="space-y-3">
              <Label
                htmlFor="confirmPassword"
                className="font-medium"
                style={{ color: 'var(--timberwolf)' }}
              >
                Confirm password
              </Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="Re-enter password"
                  value={confirmPassword}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setConfirmPassword(e.target.value)
                  }
                  className="h-12 pl-12"
                  disabled={loading}
                  autoComplete="new-password"
                />
                <Lock
                  className="h-5 w-5 absolute left-4 top-3.5"
                  style={{ color: 'var(--ash-grey)' }}
                />
              </div>
            </div>

            {/* Submit */}
            <Button
              type="submit"
              className="w-full h-12 font-semibold rounded-xl shadow-lg transition-all duration-200 transform hover:scale-[1.02] hover:opacity-90"
              style={{
                backgroundColor: 'var(--ash-grey)',
                color: 'var(--night)',
              }}
              disabled={loading}
            >
              {loading ? (
                <>
                  <LoadingSpinner size="sm" className="mr-2" />
                  Creating account…
                </>
              ) : (
                'Sign up'
              )}
            </Button>
          </form>

          {/* Sign-in link */}
          <div className="text-center pt-2">
            <p className="text-sm" style={{ color: 'var(--ash-grey)' }}>
              Already have an account?{' '}
              <Link
                href="/auth/login"
                className="font-semibold transition-colors hover:opacity-80"
                style={{ color: 'var(--timberwolf)' }}
              >
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
