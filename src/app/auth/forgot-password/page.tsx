'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth/context';
import { validateEmail, getAuthErrorMessage } from '@/lib/auth/shared';
import { Button } from '@playback/commons/components/ui/button';
import { Input } from '@playback/commons/components/ui/input';
import { Label } from '@playback/commons/components/ui/label';
import { LoadingSpinner } from '@playback/commons/components/ui/loading';
import { AlertCircle, Mail, CheckCircle, ArrowLeft } from 'lucide-react';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  const { resetPassword } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Basic validation
    if (!email) {
      setError('Please enter your email address');
      return;
    }

    if (!validateEmail(email)) {
      setError('Please enter a valid email address');
      return;
    }

    setLoading(true);

    try {
      const { error } = await resetPassword(email);
      if (error) {
        setError(getAuthErrorMessage(error));
      } else {
        setEmailSent(true);
      }
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (emailSent) {
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
              Check your email
            </h1>

            <div className="space-y-4">
              <p style={{ color: 'var(--ash-grey)' }}>
                We&apos;ve sent a password reset link to{' '}
                <span
                  className="font-semibold"
                  style={{ color: 'var(--timberwolf)' }}
                >
                  {email}
                </span>
              </p>
              <p className="text-sm" style={{ color: 'var(--ash-grey)' }}>
                Click the link in the email to reset your password. If you
                don&apos;t see it, check your spam folder.
              </p>
            </div>

            <div className="pt-4 space-y-3">
              <Button
                onClick={() => {
                  setEmailSent(false);
                  setEmail('');
                }}
                variant="outline"
                className="w-full font-semibold rounded-xl border-neutral-600"
                style={{
                  color: 'var(--timberwolf)',
                  borderColor: 'var(--ash-grey)',
                }}
              >
                Send another email
              </Button>

              <Link href="/auth/login">
                <Button
                  className="w-full font-semibold rounded-xl"
                  style={{
                    backgroundColor: 'var(--ash-grey)',
                    color: 'var(--night)',
                  }}
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to login
                </Button>
              </Link>
            </div>
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
              Forgot password?
            </h1>
            <p style={{ color: 'var(--ash-grey)' }}>
              Enter your email address and we&apos;ll send you a link to reset
              your password
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
                  autoFocus
                />
                <Mail
                  className="h-5 w-5 absolute left-4 top-3.5"
                  style={{ color: 'var(--ash-grey)' }}
                />
              </div>
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
                  Sending email...
                </>
              ) : (
                'Send reset link'
              )}
            </Button>
          </form>

          {/* Back to login link */}
          <div className="text-center pt-2">
            <Link
              href="/auth/login"
              className="inline-flex items-center gap-2 text-sm font-medium transition-colors hover:opacity-80"
              style={{ color: 'var(--ash-grey)' }}
            >
              <ArrowLeft className="h-4 w-4" />
              Back to login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
