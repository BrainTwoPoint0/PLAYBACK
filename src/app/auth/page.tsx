'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { SignInForm } from '../components/auth/SignInForm';
import { SignUpForm } from '../components/auth/SignUpForm';
import { ProfileSetup } from '../components/auth/ProfileSetup';
import { useAuth } from '../components/auth/AuthProvider';

type AuthMode = 'signin' | 'signup' | 'setup';

export default function AuthPage() {
  const { user, profile } = useAuth();
  const [mode, setMode] = useState<AuthMode>('signin');

  // If user is signed in but no profile, show setup
  if (user && !profile) {
    return (
      <div className="min-h-screen bg-[var(--night)] flex items-center justify-center p-4">
        <ProfileSetup onComplete={() => setMode('signin')} />
      </div>
    );
  }

  // If user has profile, redirect to dashboard
  if (user && profile) {
    return (
      <div className="min-h-screen bg-[var(--night)] flex items-center justify-center p-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-[var(--timberwolf)] mb-4">
            Welcome back, {profile.full_name}!
          </h1>
          <p className="text-[var(--ash-grey)]">
            You&apos;re already signed in. Redirecting to dashboard...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--night)] flex items-center justify-center p-4">
      <AnimatePresence mode="wait">
        {mode === 'signin' && (
          <motion.div
            key="signin"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
          >
            <SignInForm
              onSuccess={() => setMode('setup')}
              onSwitchToSignUp={() => setMode('signup')}
            />
          </motion.div>
        )}

        {mode === 'signup' && (
          <motion.div
            key="signup"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
          >
            <SignUpForm
              onSuccess={() => setMode('setup')}
              onSwitchToSignIn={() => setMode('signin')}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
