import { createServerClient } from '@supabase/ssr';
import { NextRequest } from 'next/server';

/**
 * Server-side function to check if user has completed onboarding
 * Used in middleware for redirect logic
 */
export async function checkOnboardingStatusServer(
  userId: string,
  request: NextRequest
) {
  // Create supabase client for server-side operations
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll() {
          // No need to set cookies in this read-only operation
        },
      },
    }
  );

  try {
    // Get profile with user sports to check onboarding completion
    // Use left join to allow profiles without sports (for fans/coaches)
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select(
        `
        id,
        user_sports (
          id,
          role,
          sport_id
        )
      `
      )
      .eq('user_id', userId)
      .single();

    if (profileError) {
      // If profile doesn't exist or error, consider onboarding incomplete
      return { isComplete: false, error: profileError };
    }

    // Check if onboarding is complete based on role
    // Roles are stored in user_sports table, not profiles table
    const hasUserSports = profile.user_sports && profile.user_sports.length > 0;
    const hasRole = profile.user_sports?.some((us: any) => us.role);

    // Role-based completion logic:
    // - Players: need role AND at least one sport (current logic is correct)
    // - Others (fans/coaches/scouts): just need role (any user_sports entry with role)
    const userRole = profile.user_sports?.find((us: any) => us.role)?.role;
    const isComplete =
      hasRole && (userRole === 'player' ? hasUserSports : true);

    return {
      isComplete,
      error: null,
      sportsCount: profile.user_sports?.length || 0,
    };
  } catch (error) {
    return {
      isComplete: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Lightweight check to see if user profile exists
 * Faster check for middleware before doing full onboarding check
 */
export async function hasUserProfile(userId: string, request: NextRequest) {
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll() {
          // No need to set cookies in this read-only operation
        },
      },
    }
  );

  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('id')
      .eq('user_id', userId)
      .single();

    return { exists: !!data && !error, error };
  } catch (error) {
    return { exists: false, error };
  }
}
