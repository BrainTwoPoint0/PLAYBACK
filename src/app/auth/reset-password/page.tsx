'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { validatePassword, getAuthErrorMessage } from '@/lib/auth/shared';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { LoadingSpinner } from '@/components/ui/loading';
import { AlertCircle, Lock, CheckCircle, Eye, EyeOff } from 'lucide-react';

function ResetPasswordForm() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [passwordReset, setPasswordReset] = useState(false);

  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();

  useEffect(() => {
    // Check for error in URL params
    const urlError = searchParams.get('error');
    if (urlError) {
      setError(decodeURIComponent(urlError));
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Basic validation
    if (!password || !confirmPassword) {
      setError('Please fill in all fields');
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
      const { error } = await supabase.auth.updateUser({
        password: password,
      });

      if (error) {
        setError(getAuthErrorMessage(error));
      } else {
        setPasswordReset(true);
        // Redirect to login after 3 seconds
        setTimeout(() => {
          router.push('/auth/login');
        }, 3000);
      }
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (passwordReset) {
    return (
      <div
        className="min-h-screen flex items-center justify-center p-4"
        style={{ backgroundColor: 'var(--night)' }}
      >
        <div className="relative w-full max-w-md">
          <div className="bg-neutral-800/70 backdrop-blur-xl border border-neutral-700/60 rounded-2xl shadow-2xl p-8 space-y-6 text-center">
            {/* Success Icon */}
            <div className="flex justify-center mb-6">
              <div
                className="w-20 h-20 rounded-xl flex items-center justify-center shadow-lg border border-neutral-700"
                style={{ backgroundColor: 'var(--ash-grey)' }}
              >
                <CheckCircle
                  className="h-10 w-10"
                  style={{ color: 'var(--night)' }}
                />
              </div>
            </div>

            <h1
              className="text-2xl font-bold"
              style={{ color: 'var(--timberwolf)' }}
            >
              Password updated!
            </h1>

            <div className="space-y-4">
              <p style={{ color: 'var(--ash-grey)' }}>
                Your password has been successfully updated. You can now sign in
                with your new password.
              </p>
              <p className="text-sm" style={{ color: 'var(--ash-grey)' }}>
                Redirecting to login page in 3 seconds...
              </p>
            </div>

            <Link href="/auth/login">
              <Button
                className="w-full font-semibold rounded-xl"
                style={{
                  backgroundColor: 'var(--ash-grey)',
                  color: 'var(--night)',
                }}
              >
                Continue to login
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

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
              Reset password
            </h1>
            <p style={{ color: 'var(--ash-grey)' }}>
              Enter your new password below
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-red-900/20 backdrop-blur border border-red-700/30 rounded-xl p-4">
                <div className="flex items-center gap-3 text-red-400">
                  <AlertCircle className="h-5 w-5 flex-shrink-0" />
                  <span className="text-sm">{error}</span>
                </div>
              </div>
            )}

            {/* New Password Field */}
            <div className="space-y-3">
              <Label
                htmlFor="password"
                className="font-medium"
                style={{ color: 'var(--timberwolf)' }}
              >
                New password
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter your new password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-12 pl-12 pr-12 bg-neutral-700/50 border-neutral-600 placeholder:text-neutral-400 rounded-xl"
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
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-3.5 transition-colors hover:opacity-80"
                  style={{ color: 'var(--ash-grey)' }}
                  disabled={loading}
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>
            </div>

            {/* Confirm Password Field */}
            <div className="space-y-3">
              <Label
                htmlFor="confirmPassword"
                className="font-medium"
                style={{ color: 'var(--timberwolf)' }}
              >
                Confirm new password
              </Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  placeholder="Re-enter your new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="h-12 pl-12 pr-12 bg-neutral-700/50 border-neutral-600 placeholder:text-neutral-400 rounded-xl"
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
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-4 top-3.5 transition-colors hover:opacity-80"
                  style={{ color: 'var(--ash-grey)' }}
                  disabled={loading}
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>
            </div>

            {/* Password Requirements */}
            <div className="text-xs" style={{ color: 'var(--ash-grey)' }}>
              Password must be at least 8 characters with uppercase, lowercase,
              and number.
            </div>

            {/* Submit Button */}
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
                  Updating password...
                </>
              ) : (
                'Update password'
              )}
            </Button>
          </form>

          {/* Back to login link */}
          <div className="text-center pt-2">
            <Link
              href="/auth/login"
              className="text-sm font-medium transition-colors hover:opacity-80"
              style={{ color: 'var(--ash-grey)' }}
            >
              Back to login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div
          className="min-h-screen flex items-center justify-center"
          style={{ backgroundColor: 'var(--night)' }}
        >
          <LoadingSpinner size="lg" />
        </div>
      }
    >
      <ResetPasswordForm />
    </Suspense>
  );
}
