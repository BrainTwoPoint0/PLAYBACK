import { createClient } from '@/lib/supabase/server';
import { notFound, redirect } from 'next/navigation';
import { User } from '@supabase/supabase-js';

// Server-side auth utilities (for server components and API routes only)
export async function getUser(): Promise<User | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

export async function requireAuth(): Promise<User> {
  const user = await getUser();
  if (!user) {
    redirect('/auth/login');
  }
  return user;
}

export async function requireNoAuth(): Promise<void> {
  const user = await getUser();
  if (user) {
    redirect('/dashboard');
  }
}

// Admin gate for server components and API routes.
// - Not logged in → redirect to login. The /admin/* middleware
//   (src/middleware.ts protectedPaths) already redirects anonymous users
//   with the actual pathname preserved in ?redirectTo, so this branch is
//   belt-and-braces for routes outside the middleware matcher.
// - Logged in but not admin → 404 (don't leak that /admin exists).
// Relies on the `profiles.is_admin` column added by
// docs/migrations/add_is_admin_to_profiles.sql. RLS must allow the user to
// read their own profile row (already enforced by the existing "Users can
// view own profile" policy).
export async function requireAdmin(): Promise<User> {
  const user = await getUser();
  if (!user) {
    redirect('/auth/login');
  }

  const supabase = await createClient();
  const { data: profile, error } = await supabase
    .from('profiles')
    .select('is_admin')
    .eq('user_id', user.id)
    .single();

  if (error || !profile || !(profile as { is_admin?: boolean }).is_admin) {
    notFound();
  }

  return user;
}

export async function getUserProfile(userId: string) {
  const supabase = await createClient();
  const { data: profile, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('user_id', userId)
    .single();

  return { profile, error };
}
