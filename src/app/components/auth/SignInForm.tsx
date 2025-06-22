'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { signIn } from '@/lib/auth';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';

interface SignInFormProps {
  onSuccess?: () => void;
  onSwitchToSignUp?: () => void;
}

export const SignInForm: React.FC<SignInFormProps> = ({
  onSuccess,
  onSwitchToSignUp,
}) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await signIn(email, password);
      onSuccess?.();
    } catch (err: any) {
      setError(err.message || 'Failed to sign in');
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="w-full max-w-md mx-auto"
    >
      <div className="bg-black border border-[var(--timberwolf)] rounded-2xl p-8">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-[var(--timberwolf)] mb-2">
            Welcome Back
          </h2>
          <p className="text-[var(--ash-grey)]">
            Sign in to your PLAYBACK account
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-red-500/10 border border-red-500/20 rounded-lg p-3"
            >
              <p className="text-red-400 text-sm">{error}</p>
            </motion.div>
          )}

          <div className="space-y-2">
            <Label htmlFor="email" className="text-[var(--timberwolf)]">
              Email
            </Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              required
              className="bg-black border-[var(--ash-grey)] text-[var(--timberwolf)] placeholder:text-[var(--ash-grey)] focus:border-[var(--timberwolf)]"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password" className="text-[var(--timberwolf)]">
              Password
            </Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              required
              className="bg-black border-[var(--ash-grey)] text-[var(--timberwolf)] placeholder:text-[var(--ash-grey)] focus:border-[var(--timberwolf)]"
            />
          </div>

          <motion.button
            type="submit"
            disabled={loading}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="w-full bg-[var(--timberwolf)] text-black font-semibold py-3 px-6 rounded-lg hover:bg-[var(--ash-grey)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Signing In...' : 'Sign In'}
          </motion.button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-[var(--ash-grey)] text-sm">
            Don&apos;t have an account?{' '}
            <button
              onClick={onSwitchToSignUp}
              className="text-[var(--timberwolf)] hover:underline font-medium"
            >
              Sign up
            </button>
          </p>
        </div>

        <div className="mt-6">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-[var(--ash-grey)]" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-black text-[var(--ash-grey)]">
                Or continue with
              </span>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-2 gap-3">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="flex items-center justify-center px-4 py-2 border border-[var(--ash-grey)] rounded-lg text-[var(--timberwolf)] hover:bg-[var(--ash-grey)]/10 transition-colors"
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
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="flex items-center justify-center px-4 py-2 border border-[var(--ash-grey)] rounded-lg text-[var(--timberwolf)] hover:bg-[var(--ash-grey)]/10 transition-colors"
            >
              <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                <path
                  fill="currentColor"
                  d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"
                />
              </svg>
              Apple
            </motion.button>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
