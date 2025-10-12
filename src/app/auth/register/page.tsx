'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/auth/context';
import { createClient } from '@playback/commons/lib/supabase/client';
import {
  validateEmail,
  validatePassword,
  validateUsername,
  getAuthErrorMessage,
} from '@/lib/auth/shared';
import { Button } from '@playback/commons/components/ui/button';
import { Input } from '@playback/commons/components/ui/input';
import { Label } from '@playback/commons/components/ui/label';
import { LoadingSpinner } from '@playback/commons/components/ui/loading';
import { AlertCircle, Mail, Lock, Check, X, Loader2 } from 'lucide-react';

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

  const { signUp, user } = useAuth();
  const router = useRouter();

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
              Create account
            </h1>
            <p style={{ color: 'var(--ash-grey)' }}>
              Join PLAYBACK and unlock your athletic journey
            </p>
          </div>

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
                onChange={(e) => setFullName(e.target.value)}
                className="h-12 bg-neutral-700/50 border-neutral-600 placeholder:text-neutral-400 rounded-xl"
                style={{
                  color: 'var(--timberwolf)',
                  borderColor: 'var(--ash-grey)',
                  paddingLeft: '12px',
                }}
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
                  onChange={(e) => setUsername(e.target.value)}
                  className={`h-12 pr-12 bg-neutral-700/50 border-neutral-600 placeholder:text-neutral-400 rounded-xl ${
                    usernameStatus === 'taken'
                      ? 'border-red-500'
                      : usernameStatus === 'available'
                        ? 'border-green-500'
                        : ''
                  }`}
                  style={{
                    color: 'var(--timberwolf)',
                    borderColor:
                      usernameStatus === 'taken'
                        ? '#ef4444'
                        : usernameStatus === 'available'
                          ? '#10b981'
                          : 'var(--ash-grey)',
                    paddingLeft: '12px',
                  }}
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
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-12 pl-12 bg-neutral-700/50 border-neutral-600 placeholder:text-neutral-400 rounded-xl"
                  style={{
                    color: 'var(--timberwolf)',
                    borderColor: 'var(--ash-grey)',
                  }}
                  disabled={loading}
                  autoComplete="email"
                />
                <Mail
                  className="h-5 w-5 absolute left-4 top-3.5"
                  style={{ color: 'var(--ash-grey)' }}
                />
              </div>
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
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-12 pl-12 bg-neutral-700/50 border-neutral-600 placeholder:text-neutral-400 rounded-xl"
                  style={{
                    color: 'var(--timberwolf)',
                    borderColor: 'var(--ash-grey)',
                  }}
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
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="h-12 pl-12 bg-neutral-700/50 border-neutral-600 placeholder:text-neutral-400 rounded-xl"
                  style={{
                    color: 'var(--timberwolf)',
                    borderColor: 'var(--ash-grey)',
                  }}
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
