'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/auth/context';
import { validateEmail, getAuthErrorMessage } from '@/lib/auth/shared';
import { Button } from '@playback/commons/components/ui/button';
import { Input } from '@playback/commons/components/ui/input';
import { Label } from '@playback/commons/components/ui/label';
import { LoadingSpinner } from '@playback/commons/components/ui/loading';
import { AlertCircle, Eye, EyeOff, Mail, Lock } from 'lucide-react';

function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { signIn, user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  // Get error from URL params (from callback)
  useEffect(() => {
    const urlError = searchParams.get('error');
    if (urlError) {
      setError(decodeURIComponent(urlError));
    }
  }, [searchParams]);

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      router.push('/dashboard');
    }
  }, [user, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Basic validation
    if (!email || !password) {
      setError('Please fill in all fields');
      return;
    }

    if (!validateEmail(email)) {
      setError('Please enter a valid email address');
      return;
    }

    setLoading(true);

    try {
      const { error } = await signIn(email, password);

      if (error) {
        setError(getAuthErrorMessage(error));
      } else {
        // Success - redirect will be handled by AuthProvider
        router.push('/dashboard');
      }
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="md:my-36 flex items-center justify-center p-4">
      <div className="relative w-full max-w-md">
        {/* Main card */}
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
              Welcome back
            </h1>
            <p style={{ color: 'var(--ash-grey)' }}>
              Sign in to your PLAYBACK account to continue your journey
            </p>
          </div>

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Error Message */}
            {error && (
              <div className="bg-red-900/20 backdrop-blur border border-red-700/30 rounded-xl p-4">
                <div className="flex items-center gap-3 text-red-400">
                  <AlertCircle className="h-5 w-5 flex-shrink-0" />
                  <span className="text-sm">{error}</span>
                </div>
              </div>
            )}

            {/* Email Field */}
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

            {/* Password Field */}
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
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-12 pl-12 pr-12 bg-neutral-700/50 border-neutral-600 placeholder:text-neutral-400 rounded-xl"
                  style={{
                    color: 'var(--timberwolf)',
                    borderColor: 'var(--ash-grey)',
                  }}
                  disabled={loading}
                  autoComplete="current-password"
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

            {/* Forgot Password Link */}
            <div className="flex justify-end">
              <Link
                href="/auth/forgot-password"
                className="text-sm transition-colors font-medium hover:opacity-80"
                style={{ color: 'var(--ash-grey)' }}
              >
                Forgot your password?
              </Link>
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
                  Signing in...
                </>
              ) : (
                'Sign in'
              )}
            </Button>
          </form>

          {/* Divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-neutral-600" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span
                className="bg-neutral-800 px-4 font-medium"
                style={{ color: 'var(--ash-grey)' }}
              >
                or continue with
              </span>
            </div>
          </div>

          {/* Social Login Buttons */}
          <div className="grid grid-cols-2 gap-4">
            <Button
              variant="outline"
              className="h-12 bg-neutral-700/30 border-neutral-600 transition-all duration-200 rounded-xl hover:bg-neutral-600/50"
              style={{
                color: 'var(--timberwolf)',
                borderColor: 'var(--ash-grey)',
              }}
              disabled={loading}
              onClick={() => {
                // TODO: Implement Google OAuth
                setError('Social login coming soon!');
              }}
            >
              <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                <path
                  fill="currentColor"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="currentColor"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="currentColor"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="currentColor"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              Google
            </Button>

            <Button
              variant="outline"
              className="h-12 bg-neutral-700/30 border-neutral-600 transition-all duration-200 rounded-xl hover:bg-neutral-600/50"
              style={{
                color: 'var(--timberwolf)',
                borderColor: 'var(--ash-grey)',
              }}
              disabled={loading}
              onClick={() => {
                // TODO: Implement Apple OAuth
                setError('Social login coming soon!');
              }}
            >
              <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                <path
                  fill="currentColor"
                  d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"
                />
              </svg>
              Apple
            </Button>
          </div>

          {/* Sign Up Link */}
          <div className="text-center pt-2">
            <p className="text-sm" style={{ color: 'var(--ash-grey)' }}>
              Don&apos;t have an account?{' '}
              <Link
                href="/auth/register"
                className="font-semibold transition-colors hover:opacity-80"
                style={{ color: 'var(--timberwolf)' }}
              >
                Create one now
              </Link>
            </p>
          </div>
        </div>

        {/* Footer decoration */}
        <div className="text-center mt-8">
          <p className="text-xs" style={{ color: 'var(--ash-grey)' }}>
            Secure authentication powered by Supabase
          </p>
        </div>
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
          <LoadingSpinner size="lg" />
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
