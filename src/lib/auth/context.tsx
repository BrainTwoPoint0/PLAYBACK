'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { User, Session, AuthError } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { checkOnboardingStatus } from '@/lib/onboarding/utils';

interface OnboardingStatus {
  isComplete: boolean;
  loading: boolean;
  error: string | null;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  onboardingStatus: OnboardingStatus;
  signUp: (
    email: string,
    password: string,
    metadata?: Record<string, any>
  ) => Promise<{ data: any; error: AuthError | null }>;
  signIn: (
    email: string,
    password: string
  ) => Promise<{ error: AuthError | null }>;
  signOut: () => Promise<{ error: AuthError | null }>;
  resetPassword: (email: string) => Promise<{ error: AuthError | null }>;
  refreshOnboardingStatus: (sessionUser?: User) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [onboardingStatus, setOnboardingStatus] = useState<OnboardingStatus>({
    isComplete: false,
    loading: true, // Start as loading so we don't show "incomplete" until we actually check
    error: null,
  });
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    // Get initial session
    const getSession = async () => {
      console.log('🔄 Getting initial session...');
      const {
        data: { session },
        error,
      } = await supabase.auth.getSession();
      if (error) {
        console.error('Error getting session:', error);
      } else {
        console.log(
          '✅ Initial session loaded:',
          session?.user ? 'User found' : 'No user'
        );
        setSession(session);
        setUser(session?.user ?? null);

        // Check onboarding status for initial session
        if (session?.user) {
          console.log(
            '🚀 Calling refreshOnboardingStatus from initial session'
          );
          await refreshOnboardingStatus(session.user);
        } else {
          // No user, so set onboarding to not loading
          setOnboardingStatus({
            isComplete: false,
            loading: false,
            error: null,
          });
        }
      }
      setLoading(false);
    };

    getSession();

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log(
        '🔄 Auth state change:',
        event,
        session?.user ? 'User present' : 'No user'
      );
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);

      // Check onboarding status when user changes
      if (session?.user) {
        console.log(
          '🚀 Calling refreshOnboardingStatus from auth state change'
        );
        // Don't await to avoid blocking auth state change
        refreshOnboardingStatus(session.user);
      } else {
        // Clear onboarding status when user signs out
        setOnboardingStatus({
          isComplete: false,
          loading: false,
          error: null,
        });
      }

      // Handle specific auth events
      if (event === 'SIGNED_IN') {
        router.refresh();
      } else if (event === 'SIGNED_OUT') {
        router.push('/');
        router.refresh();
      }
    });

    return () => subscription.unsubscribe();
  }, [supabase.auth, router]);

  const signUp = async (
    email: string,
    password: string,
    metadata?: Record<string, any>
  ) => {
    setLoading(true);
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: metadata,
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    setLoading(false);
    return { data, error };
  };

  const signIn = async (email: string, password: string) => {
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    setLoading(false);
    return { error };
  };

  const signOut = async () => {
    setLoading(true);
    const { error } = await supabase.auth.signOut();
    setLoading(false);
    return { error };
  };

  const resetPassword = async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/reset-password`,
    });
    return { error };
  };

  const refreshOnboardingStatus = async (sessionUser?: User) => {
    const userToCheck = sessionUser || user;

    if (!userToCheck) {
      console.log('⚠️ No user found for onboarding status check');
      setOnboardingStatus({
        isComplete: false,
        loading: false,
        error: null,
      });
      return;
    }

    console.log(
      '🔄 Starting onboarding status refresh for user:',
      userToCheck.id
    );
    setOnboardingStatus((prev) => ({ ...prev, loading: true, error: null }));

    try {
      console.log('🔍 Checking onboarding status for user:', userToCheck.id);
      const result = await checkOnboardingStatus(userToCheck.id);
      console.log('📊 Onboarding status result:', result);

      setOnboardingStatus({
        isComplete: result.isComplete || false,
        loading: false,
        error: result.error
          ? typeof result.error === 'string'
            ? result.error
            : result.error.message
          : null,
      });
    } catch (err) {
      console.error('❌ Error in refreshOnboardingStatus:', err);
      setOnboardingStatus({
        isComplete: false,
        loading: false,
        error:
          err instanceof Error
            ? err.message
            : 'Failed to check onboarding status',
      });
    }
  };

  const value = {
    user,
    session,
    loading,
    onboardingStatus,
    signUp,
    signIn,
    signOut,
    resetPassword,
    refreshOnboardingStatus,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
